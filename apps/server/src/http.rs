use std::{
    collections::HashMap,
    net::{IpAddr, SocketAddr},
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

use axum::{
    Extension, Json, Router,
    extract::{
        ConnectInfo, DefaultBodyLimit, MatchedPath, Request, State, rejection::JsonRejection,
    },
    http::{HeaderMap, HeaderValue, Method, StatusCode, header},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use pomodoro_db::{DbError, users::User, workspaces::StoredWorkspace};
use pomodoro_focus::ValidatedWorkspace;
use sea_orm::DatabaseConnection;
use serde::Serialize;
use tokio::sync::Semaphore;
use tracing::Instrument;
use url::Url;
use utoipa::{OpenApi, ToSchema};
use uuid::Uuid;

use crate::{
    ApiDoc,
    contract::{
        ErrorResponse, ImportWorkspaceRequest, SaveWorkspaceRequest, SessionResponse, UserDto,
        WorkspaceResponse,
    },
    platform::auth::AuthService,
};

#[derive(Clone)]
pub struct AppState {
    db: DatabaseConnection,
    auth: Option<Arc<AuthService>>,
    origin: String,
    secure: bool,
    environment: String,
    trusted_proxy_ips: Vec<IpAddr>,
    requests: Arc<Semaphore>,
    rates: Arc<Mutex<HashMap<RateKey, RateWindow>>>,
}

#[derive(Hash, Eq, PartialEq)]
enum RateKey {
    Address(IpAddr, bool),
    User(Uuid),
}

struct RateWindow {
    started: Instant,
    count: u32,
}

#[derive(Serialize, ToSchema)]
pub struct HealthResponse {
    status: String,
}

pub fn router(
    db: DatabaseConnection,
    auth: Option<Arc<AuthService>>,
    origin: &Url,
    environment: &str,
    trusted_proxy_ips: Vec<IpAddr>,
) -> Router {
    let state = AppState {
        db,
        auth: auth.clone(),
        origin: origin.origin().ascii_serialization(),
        secure: origin.scheme() == "https",
        environment: environment.to_owned(),
        trusted_proxy_ips,
        requests: Arc::new(Semaphore::new(16)),
        rates: Arc::new(Mutex::new(HashMap::new())),
    };
    let routes = Router::new()
        .route("/api/session", get(session))
        .route("/api/workspace", get(load_workspace).put(save_workspace))
        .route("/api/workspace/import", post(import_workspace))
        .route("/health", get(health))
        .route("/ready", get(ready))
        .route("/openapi.json", get(openapi))
        .with_state(state.clone());
    let routes = match auth {
        Some(auth) => routes.merge(crate::platform::auth::router(auth)),
        None => routes
            .route("/auth/login", get(auth_unavailable))
            .route("/auth/callback", get(auth_unavailable))
            .route("/auth/logout", post(auth_unavailable)),
    };
    routes
        .fallback(not_found)
        .method_not_allowed_fallback(method_not_allowed)
        .layer(DefaultBodyLimit::max(20_000_000))
        .layer(middleware::from_fn_with_state(state, boundary))
}

fn failure(status: StatusCode, message: &str, request_id: Uuid) -> Response {
    (
        status,
        Json(ErrorResponse {
            error: message.to_owned(),
            request_id: Some(request_id),
        }),
    )
        .into_response()
}

fn limited(state: &AppState, key: RateKey, limit: u32) -> bool {
    let Ok(mut rates) = state.rates.lock() else {
        return true;
    };
    let now = Instant::now();
    if rates.len() >= 10_000 {
        rates.retain(|_, window| now.duration_since(window.started) < Duration::from_secs(60));
        if rates.len() >= 10_000 && !rates.contains_key(&key) {
            return true;
        }
    }
    let window = rates.entry(key).or_insert(RateWindow {
        started: now,
        count: 0,
    });
    if now.duration_since(window.started) >= Duration::from_secs(60) {
        window.started = now;
        window.count = 0;
    }
    if window.count >= limit {
        return true;
    }
    window.count += 1;
    false
}

async fn boundary(State(state): State<AppState>, mut request: Request, next: Next) -> Response {
    let started = Instant::now();
    let request_id = Uuid::new_v4();
    request.extensions_mut().insert(request_id);
    request.headers_mut().insert(
        "x-request-id",
        HeaderValue::from_str(&request_id.to_string())
            .unwrap_or(HeaderValue::from_static("unavailable")),
    );
    let liveness = request.uri().path() == "/health" && *request.method() == Method::GET;
    let auth_callback = request.uri().path() == "/auth/callback";
    let client_ip = request
        .extensions()
        .get::<ConnectInfo<SocketAddr>>()
        .and_then(|peer| {
            let ip = peer.0.ip();
            if state.trusted_proxy_ips.contains(&ip) {
                single_header(request.headers(), "x-forwarded-for")?
                    .parse()
                    .ok()
            } else {
                Some(ip)
            }
        });
    let route = request
        .extensions()
        .get::<MatchedPath>()
        .map_or("unmatched", MatchedPath::as_str)
        .to_owned();
    let method = match *request.method() {
        Method::GET => "GET",
        Method::POST => "POST",
        Method::PUT => "PUT",
        Method::DELETE => "DELETE",
        Method::PATCH => "PATCH",
        Method::HEAD => "HEAD",
        Method::OPTIONS => "OPTIONS",
        _ => "OTHER",
    };
    let response = async {
        let Some(ip) = client_ip else {
            return failure(StatusCode::BAD_REQUEST, "Invalid client address", request_id);
        };
        if liveness {
            return next.run(request).await;
        }
        match state.requests.clone().try_acquire_owned() {
            Ok(_permit) => tokio::time::timeout(Duration::from_secs(30), authorized_request(&state, request, next, request_id, ip))
                .await.unwrap_or_else(|_| failure(StatusCode::GATEWAY_TIMEOUT, "The request timed out", request_id)),
            Err(_) => failure(StatusCode::SERVICE_UNAVAILABLE, "The server is busy. Retry shortly.", request_id),
        }
    }
    .instrument(tracing::info_span!("http.request", service = "pomodoro-api", environment = state.environment.as_str(), release = env!("CARGO_PKG_VERSION"), %request_id, method, route))
    .await;
    let mut response = response;
    let headers = response.headers_mut();
    if auth_callback && client_ip.is_some() {
        let clear = crate::platform::auth::clear_challenge_cookie(state.secure);
        if !headers
            .get_all(header::SET_COOKIE)
            .iter()
            .any(|value| value == clear)
        {
            headers.append(header::SET_COOKIE, clear);
        }
    }
    headers.insert(
        "x-request-id",
        HeaderValue::from_str(&request_id.to_string())
            .unwrap_or(HeaderValue::from_static("unavailable")),
    );
    headers.insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("no-store, private"),
    );
    headers.insert(
        "x-content-type-options",
        HeaderValue::from_static("nosniff"),
    );
    headers.insert("x-frame-options", HeaderValue::from_static("DENY"));
    headers.insert(
        "referrer-policy",
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );
    headers.insert(
        "permissions-policy",
        HeaderValue::from_static("camera=(), microphone=(), geolocation=()"),
    );
    headers.insert(
        "content-security-policy",
        HeaderValue::from_static("default-src 'none'; frame-ancestors 'none'; base-uri 'none'"),
    );
    if state.secure {
        headers.insert(
            "strict-transport-security",
            HeaderValue::from_static("max-age=31536000"),
        );
    }
    tracing::info!(service = "pomodoro-api", environment = state.environment, release = env!("CARGO_PKG_VERSION"), %request_id, method, route, duration_ms = started.elapsed().as_secs_f64() * 1000.0, status = response.status().as_u16(), outcome = if response.status().is_server_error() { "failed" } else if response.status().is_client_error() { "denied" } else { "success" });
    response
}

fn single_header<'a>(headers: &'a HeaderMap, name: &str) -> Option<&'a str> {
    let mut values = headers.get_all(name).iter();
    let value = values.next()?.to_str().ok()?;
    if values.next().is_some() {
        return None;
    }
    Some(value)
}

async fn authorized_request(
    state: &AppState,
    mut request: Request,
    next: Next,
    id: Uuid,
    ip: IpAddr,
) -> Response {
    let path = request.uri().path();
    let unsafe_method = !matches!(
        *request.method(),
        Method::GET | Method::HEAD | Method::OPTIONS
    );
    if unsafe_method && single_header(request.headers(), "origin") != Some(state.origin.as_str()) {
        return failure(
            StatusCode::FORBIDDEN,
            "A same-origin request is required",
            id,
        );
    }
    let authentication = matches!(path, "/auth/login" | "/auth/callback");
    if limited(
        state,
        RateKey::Address(ip, authentication),
        if authentication { 10 } else { 240 },
    ) {
        let mut response = failure(
            StatusCode::TOO_MANY_REQUESTS,
            "Too many requests. Retry later.",
            id,
        );
        response
            .headers_mut()
            .insert(header::RETRY_AFTER, HeaderValue::from_static("60"));
        return response;
    }
    if matches!(path, "/api/workspace" | "/api/workspace/import")
        || (path == "/auth/logout" && *request.method() == Method::POST)
    {
        let Some(auth) = &state.auth else {
            return failure(
                StatusCode::SERVICE_UNAVAILABLE,
                "Account sign-in is not configured",
                id,
            );
        };
        let expected = single_header(request.headers(), "x-pomodoro-user")
            .and_then(|value| pomodoro_focus::parse_uuid::<serde::de::value::Error>(value).ok());
        let Some(expected) = expected else {
            return failure(
                StatusCode::BAD_REQUEST,
                "X-Pomodoro-User must identify the expected account",
                id,
            );
        };
        let user = match auth.authenticate(request.headers()).await {
            Ok(Some(user)) => user,
            Ok(None) => {
                return failure(StatusCode::UNAUTHORIZED, "Sign in to use account data", id);
            }
            Err(error) => return failure(error.status(), error.public_message(), id),
        };
        if user.id != expected {
            return failure(
                StatusCode::CONFLICT,
                "The signed-in account changed. Reload before retrying.",
                id,
            );
        }
        if unsafe_method && limited(state, RateKey::User(user.id), 120) {
            let mut response = failure(
                StatusCode::TOO_MANY_REQUESTS,
                "Too many account changes. Retry later.",
                id,
            );
            response
                .headers_mut()
                .insert(header::RETRY_AFTER, HeaderValue::from_static("60"));
            return response;
        }
        request.extensions_mut().insert(user);
    }
    next.run(request).await
}

fn database_failure(error: DbError, id: Uuid) -> Response {
    let (status, message) = match error {
        DbError::Conflict => (
            StatusCode::CONFLICT,
            "Account data changed. Review the server version before retrying.",
        ),
        DbError::InvalidData => (StatusCode::BAD_REQUEST, "The workspace is invalid"),
        DbError::NotFound => (
            StatusCode::NOT_FOUND,
            "The requested account data was not found",
        ),
        DbError::RevisionExhausted => (
            StatusCode::CONFLICT,
            "The account revision limit was reached",
        ),
        DbError::Database => (
            StatusCode::SERVICE_UNAVAILABLE,
            "Account storage is unavailable. Retry later.",
        ),
    };
    failure(status, message, id)
}

fn workspace_response(stored: StoredWorkspace, user_id: Uuid) -> Response {
    Json(WorkspaceResponse {
        user_id,
        workspace: stored.workspace.into_workspace(),
        revision: stored.revision,
    })
    .into_response()
}

fn json_failure(error: JsonRejection, id: Uuid) -> Response {
    if error.status() == StatusCode::PAYLOAD_TOO_LARGE {
        failure(
            StatusCode::PAYLOAD_TOO_LARGE,
            "The workspace exceeds the request size limit",
            id,
        )
    } else if error.status() == StatusCode::UNSUPPORTED_MEDIA_TYPE {
        failure(
            StatusCode::UNSUPPORTED_MEDIA_TYPE,
            "Use application/json",
            id,
        )
    } else {
        failure(
            StatusCode::BAD_REQUEST,
            "A valid JSON request is required",
            id,
        )
    }
}

#[utoipa::path(get, path = "/api/session", responses((status = 200, body = SessionResponse), (status = 503, body = ErrorResponse), (status = 400, body = ErrorResponse), (status = 429, body = ErrorResponse), (status = 504, body = ErrorResponse)))]
pub async fn session(
    State(state): State<AppState>,
    Extension(id): Extension<Uuid>,
    headers: axum::http::HeaderMap,
) -> Response {
    let Some(auth) = state.auth else {
        return failure(
            StatusCode::SERVICE_UNAVAILABLE,
            "Account sign-in is not configured",
            id,
        );
    };
    match auth.authenticate(&headers).await {
        Ok(user) => Json(SessionResponse {
            user: user.map(|user| UserDto {
                id: user.id,
                name: user.name,
            }),
        })
        .into_response(),
        Err(error) => failure(error.status(), error.public_message(), id),
    }
}

#[utoipa::path(get, path = "/api/workspace", params(("X-Pomodoro-User" = Uuid, Header)), security(("account_cookie" = [])), responses((status = 200, body = WorkspaceResponse), (status = 400, body = ErrorResponse), (status = 401, body = ErrorResponse), (status = 409, body = ErrorResponse), (status = 503, body = ErrorResponse), (status = 404, body = ErrorResponse), (status = 429, body = ErrorResponse), (status = 504, body = ErrorResponse)))]
pub async fn load_workspace(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Extension(id): Extension<Uuid>,
) -> Response {
    match pomodoro_db::workspaces::load(&state.db, user.id).await {
        Ok(stored) => workspace_response(stored, user.id),
        Err(error) => database_failure(error, id),
    }
}

#[utoipa::path(put, path = "/api/workspace", params(("X-Pomodoro-User" = Uuid, Header)), request_body = SaveWorkspaceRequest, security(("account_cookie" = [])), responses((status = 200, body = WorkspaceResponse), (status = 400, body = ErrorResponse), (status = 401, body = ErrorResponse), (status = 403, body = ErrorResponse), (status = 409, body = ErrorResponse), (status = 413, body = ErrorResponse), (status = 503, body = ErrorResponse), (status = 404, body = ErrorResponse), (status = 415, body = ErrorResponse), (status = 429, body = ErrorResponse), (status = 504, body = ErrorResponse)))]
pub async fn save_workspace(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Extension(id): Extension<Uuid>,
    body: Result<Json<SaveWorkspaceRequest>, JsonRejection>,
) -> Response {
    let input = match body {
        Ok(Json(input)) => input,
        Err(error) => return json_failure(error, id),
    };
    let workspace = match ValidatedWorkspace::try_from(input.workspace) {
        Ok(workspace) => workspace,
        Err(_) => return failure(StatusCode::BAD_REQUEST, "The workspace is invalid", id),
    };
    match pomodoro_db::workspaces::save(&state.db, user.id, input.expected_revision, workspace)
        .await
    {
        Ok(stored) => workspace_response(stored, user.id),
        Err(error) => database_failure(error, id),
    }
}

#[utoipa::path(post, path = "/api/workspace/import", params(("X-Pomodoro-User" = Uuid, Header)), request_body = ImportWorkspaceRequest, security(("account_cookie" = [])), responses((status = 200, body = WorkspaceResponse), (status = 400, body = ErrorResponse), (status = 401, body = ErrorResponse), (status = 403, body = ErrorResponse), (status = 409, body = ErrorResponse), (status = 413, body = ErrorResponse), (status = 503, body = ErrorResponse), (status = 404, body = ErrorResponse), (status = 415, body = ErrorResponse), (status = 429, body = ErrorResponse), (status = 504, body = ErrorResponse)))]
pub async fn import_workspace(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Extension(id): Extension<Uuid>,
    body: Result<Json<ImportWorkspaceRequest>, JsonRejection>,
) -> Response {
    let input = match body {
        Ok(Json(input)) => input,
        Err(error) => return json_failure(error, id),
    };
    let workspace = match ValidatedWorkspace::try_from(input.workspace) {
        Ok(workspace) => workspace,
        Err(_) => return failure(StatusCode::BAD_REQUEST, "The workspace is invalid", id),
    };
    match pomodoro_db::workspaces::r#import(
        &state.db,
        user.id,
        input.expected_revision,
        input.import_id,
        workspace,
    )
    .await
    {
        Ok(stored) => workspace_response(stored, user.id),
        Err(error) => database_failure(error, id),
    }
}

#[utoipa::path(get, path = "/health", responses((status = 200, body = HealthResponse), (status = 400, body = ErrorResponse)))]
pub async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_owned(),
    })
}

#[utoipa::path(get, path = "/ready", responses((status = 200, body = HealthResponse), (status = 400, body = ErrorResponse), (status = 503, body = ErrorResponse), (status = 429, body = ErrorResponse), (status = 504, body = ErrorResponse)))]
pub async fn ready(State(state): State<AppState>, Extension(id): Extension<Uuid>) -> Response {
    if pomodoro_db::ready(&state.db).await {
        Json(HealthResponse {
            status: "ready".to_owned(),
        })
        .into_response()
    } else {
        failure(
            StatusCode::SERVICE_UNAVAILABLE,
            "Account storage is unavailable",
            id,
        )
    }
}

#[utoipa::path(get, path = "/openapi.json", responses((status = 200, description = "Generated OpenAPI specification", content_type = "application/json"), (status = 400, body = ErrorResponse), (status = 429, body = ErrorResponse), (status = 503, body = ErrorResponse), (status = 504, body = ErrorResponse)))]
pub async fn openapi() -> Json<utoipa::openapi::OpenApi> {
    Json(ApiDoc::openapi())
}

async fn auth_unavailable(Extension(id): Extension<Uuid>) -> Response {
    failure(
        StatusCode::SERVICE_UNAVAILABLE,
        "Account sign-in is not configured",
        id,
    )
}
async fn not_found(Extension(id): Extension<Uuid>) -> Response {
    failure(StatusCode::NOT_FOUND, "The endpoint was not found", id)
}
async fn method_not_allowed(Extension(id): Extension<Uuid>) -> Response {
    failure(
        StatusCode::METHOD_NOT_ALLOWED,
        "The method is not supported for this endpoint",
        id,
    )
}
