use std::{
    error::Error,
    fmt,
    sync::Arc,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use axum::{
    Extension, Json, Router,
    extract::State,
    http::{HeaderMap, HeaderValue, StatusCode, Uri, header},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use pomodoro_db::{
    challenges,
    sessions::{self, SessionRecord},
    users::{self, ProvisionUser, User},
};
use reqwest::{Client, redirect::Policy};
use sea_orm::DatabaseConnection;
use serde::{Deserialize, Serialize};
use url::Url;
use uuid::Uuid;

use crate::{
    config::AuthConfig,
    contract::ErrorResponse,
    platform::{
        crypto::{Vault, digest_token, random_token},
        tokens::{TokenVerifier, VerificationError},
    },
};

const ISSUER: &str = "https://auth.yopem.com";
pub const SESSION_COOKIE: &str = "pomodoro_session";
const CHALLENGE_COOKIE: &str = "pomodoro_auth";
const CHALLENGE_MS: i64 = 600_000;
const SESSION_MS: i64 = 30 * 24 * 60 * 60 * 1000;
const MAX_RESPONSE: usize = 64 * 1024;

#[derive(Debug)]
pub enum AuthError {
    BadRequest,
    Forbidden,
    InvalidGrant,
    Unavailable,
}

impl AuthError {
    pub fn status(&self) -> StatusCode {
        match self {
            Self::BadRequest | Self::InvalidGrant => StatusCode::BAD_REQUEST,
            Self::Forbidden => StatusCode::FORBIDDEN,
            Self::Unavailable => StatusCode::SERVICE_UNAVAILABLE,
        }
    }

    pub fn public_message(&self) -> &str {
        match self {
            Self::BadRequest => "The sign-in request is invalid",
            Self::Forbidden => "A same-origin request is required",
            Self::InvalidGrant => "Sign-in could not be completed. Try again.",
            Self::Unavailable => "Account sign-in is unavailable. Retry later.",
        }
    }
}

impl fmt::Display for AuthError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.public_message())
    }
}

impl Error for AuthError {}

pub struct AuthService {
    db: DatabaseConnection,
    config: AuthConfig,
    vault: Vault,
    verifier: TokenVerifier,
    client: Client,
}

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Challenge {
    state: String,
    verifier: String,
    return_target: String,
    expires_at_ms: i64,
}

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Tokens {
    access_token: String,
    refresh_token: String,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
}

#[derive(Deserialize)]
struct TokenError {
    error: String,
}

impl AuthService {
    pub fn new(db: DatabaseConnection, config: AuthConfig) -> Result<Self, AuthError> {
        let vault = Vault::new(&config.session_key).map_err(|_| AuthError::Unavailable)?;
        let verifier = TokenVerifier::new(config.issuer.clone(), config.client_id.clone())
            .map_err(|_| AuthError::Unavailable)?;
        let client = Client::builder()
            .https_only(true)
            .redirect(Policy::none())
            .connect_timeout(Duration::from_secs(3))
            .timeout(Duration::from_secs(10))
            .no_proxy()
            .build()
            .map_err(|_| AuthError::Unavailable)?;
        Ok(Self {
            db,
            config,
            vault,
            verifier,
            client,
        })
    }

    #[tracing::instrument(skip_all, fields(operation = "auth.authenticate"))]
    pub async fn authenticate(&self, headers: &HeaderMap) -> Result<Option<User>, AuthError> {
        let Some(value) = cookie(headers, SESSION_COOKIE)? else {
            return Ok(None);
        };
        if !valid_capability(value) {
            return Ok(None);
        }
        let hash = digest_token(value);
        let Some(mut lease) = sessions::lock(&self.db, &hash)
            .await
            .map_err(|_| AuthError::Unavailable)?
        else {
            return Ok(None);
        };
        let user_id = lease.record().user_id;
        if lease.record().expires_at_ms <= now_ms()? {
            lease.delete().await.map_err(|_| AuthError::Unavailable)?;
            return Ok(None);
        }
        let purpose = session_purpose(&hash, user_id);
        let mut tokens: Tokens = match self.vault.open(&lease.record().sealed_tokens, &purpose) {
            Ok(tokens) => tokens,
            Err(_) => {
                lease.delete().await.map_err(|_| AuthError::Unavailable)?;
                return Ok(None);
            }
        };
        let verified = match self.verifier.verify(&tokens.access_token).await {
            Ok(user) => user,
            Err(VerificationError::Unavailable) => return Err(AuthError::Unavailable),
            Err(VerificationError::Invalid) => {
                lease.delete().await.map_err(|_| AuthError::Unavailable)?;
                return Ok(None);
            }
            Err(VerificationError::Expired) => {
                let response = match self
                    .exchange(
                        &[
                            ("grant_type", "refresh_token"),
                            ("refresh_token", &tokens.refresh_token),
                        ],
                        headers.get("x-request-id"),
                    )
                    .await
                {
                    Ok(response) => response,
                    Err(AuthError::InvalidGrant) => {
                        lease.delete().await.map_err(|_| AuthError::Unavailable)?;
                        return Ok(None);
                    }
                    Err(error) => return Err(error),
                };
                let verified = match self.verifier.verify(&response.access_token).await {
                    Ok(user) => user,
                    Err(VerificationError::Unavailable) => return Err(AuthError::Unavailable),
                    Err(VerificationError::Expired | VerificationError::Invalid) => {
                        lease.delete().await.map_err(|_| AuthError::Unavailable)?;
                        return Ok(None);
                    }
                };
                tokens.access_token = response.access_token;
                if let Some(refresh) = response.refresh_token {
                    if refresh.is_empty() {
                        return Err(AuthError::Unavailable);
                    }
                    tokens.refresh_token = refresh;
                }
                let sealed = self
                    .vault
                    .seal(&tokens, &purpose)
                    .map_err(|_| AuthError::Unavailable)?;
                lease
                    .update_tokens(sealed)
                    .await
                    .map_err(|_| AuthError::Unavailable)?;
                verified
            }
        };
        if lease.record().expires_at_ms <= now_ms()? {
            lease.delete().await.map_err(|_| AuthError::Unavailable)?;
            return Ok(None);
        }
        lease.commit().await.map_err(|_| AuthError::Unavailable)?;
        let user = users::find(&self.db, user_id)
            .await
            .map_err(|_| AuthError::Unavailable)?;
        match user {
            Some(user) if user.issuer == ISSUER && user.subject == verified.id => Ok(Some(user)),
            _ => {
                sessions::delete(&self.db, &hash)
                    .await
                    .map_err(|_| AuthError::Unavailable)?;
                Ok(None)
            }
        }
    }

    #[tracing::instrument(skip_all, fields(operation = "auth.exchange"))]
    async fn exchange(
        &self,
        fields: &[(&str, &str)],
        request_id: Option<&HeaderValue>,
    ) -> Result<TokenResponse, AuthError> {
        let request = self
            .client
            .post("https://auth.yopem.com/token")
            .form(fields);
        let request = match request_id {
            Some(id) => request.header("x-request-id", id),
            None => request,
        };
        let mut response = request.send().await.map_err(|_| AuthError::Unavailable)?;
        let status = response.status();
        let mut body = Vec::new();
        while let Some(chunk) = response.chunk().await.map_err(|_| AuthError::Unavailable)? {
            if chunk.len() > MAX_RESPONSE - body.len() {
                return Err(AuthError::Unavailable);
            }
            body.extend_from_slice(&chunk);
        }
        if status == StatusCode::BAD_REQUEST {
            if serde_json::from_slice::<TokenError>(&body)
                .is_ok_and(|error| error.error == "invalid_grant")
            {
                return Err(AuthError::InvalidGrant);
            }
            return Err(AuthError::Unavailable);
        }
        if !status.is_success() {
            return Err(AuthError::Unavailable);
        }
        let tokens: TokenResponse =
            serde_json::from_slice(&body).map_err(|_| AuthError::Unavailable)?;
        if tokens.access_token.is_empty()
            || tokens.access_token.len() > 16 * 1024
            || tokens
                .refresh_token
                .as_ref()
                .is_some_and(|value| value.is_empty() || value.len() > 16 * 1024)
        {
            return Err(AuthError::Unavailable);
        }
        Ok(tokens)
    }

    #[tracing::instrument(skip_all, fields(operation = "auth.login"))]
    async fn login(&self, uri: &Uri) -> Result<Response, AuthError> {
        let target = query_value(uri, "return_to")?.unwrap_or_else(|| "/".to_owned());
        safe_target(&self.config.public_origin, &target)?;
        let return_target = target;
        let state = random_token().map_err(|_| AuthError::Unavailable)?;
        let verifier = random_token().map_err(|_| AuthError::Unavailable)?;
        let state_hash = digest_token(&state);
        let expires_at_ms = now_ms()?
            .checked_add(CHALLENGE_MS)
            .ok_or(AuthError::Unavailable)?;
        let challenge = Challenge {
            state: state.clone(),
            verifier: verifier.clone(),
            return_target,
            expires_at_ms,
        };
        let sealed = self
            .vault
            .seal(&challenge, &challenge_purpose(&state_hash))
            .map_err(|_| AuthError::Unavailable)?;
        if sealed.len() > 3800 {
            return Err(AuthError::BadRequest);
        }
        challenges::create(&self.db, &state_hash, expires_at_ms)
            .await
            .map_err(|_| AuthError::Unavailable)?;
        let mut url =
            Url::parse("https://auth.yopem.com/authorize").map_err(|_| AuthError::Unavailable)?;
        url.query_pairs_mut()
            .append_pair("client_id", &self.config.client_id)
            .append_pair("response_type", "code")
            .append_pair("redirect_uri", self.config.callback_url.as_str())
            .append_pair("state", &state)
            .append_pair("provider", "google")
            .append_pair("code_challenge_method", "S256")
            .append_pair("code_challenge", &digest_token(&verifier));
        let mut response = redirect(url.as_str())?;
        response.headers_mut().append(
            header::SET_COOKIE,
            challenge_cookie(&sealed, self.secure())?,
        );
        Ok(response)
    }

    #[tracing::instrument(skip_all, fields(operation = "auth.callback"))]
    async fn callback(&self, headers: &HeaderMap, uri: &Uri) -> Result<Response, AuthError> {
        let state = query_value(uri, "state")?.ok_or(AuthError::BadRequest)?;
        if !valid_capability(&state) {
            return Err(AuthError::BadRequest);
        }
        let sealed = cookie(headers, CHALLENGE_COOKIE)?.ok_or(AuthError::BadRequest)?;
        let hash = digest_token(&state);
        let challenge: Challenge = self
            .vault
            .open(sealed, &challenge_purpose(&hash))
            .map_err(|_| AuthError::BadRequest)?;
        let now = now_ms()?;
        if challenge.state != state
            || challenge.expires_at_ms <= now
            || !valid_capability(&challenge.verifier)
        {
            return Err(AuthError::BadRequest);
        }
        let destination = safe_target(&self.config.public_origin, &challenge.return_target)?;
        if !challenges::consume(&self.db, &hash, now)
            .await
            .map_err(|_| AuthError::Unavailable)?
        {
            return Err(AuthError::BadRequest);
        }
        if query_value(uri, "error")?.is_some() {
            return Err(AuthError::InvalidGrant);
        }
        let code = query_value(uri, "code")?
            .filter(|code| !code.is_empty() && code.len() <= 8192)
            .ok_or(AuthError::BadRequest)?;
        let result = self
            .exchange(
                &[
                    ("grant_type", "authorization_code"),
                    ("code", &code),
                    ("client_id", &self.config.client_id),
                    ("redirect_uri", self.config.callback_url.as_str()),
                    ("code_verifier", &challenge.verifier),
                ],
                headers.get("x-request-id"),
            )
            .await?;
        let verified = self
            .verifier
            .verify(&result.access_token)
            .await
            .map_err(verification_failure)?;
        let refresh_token = result.refresh_token.ok_or(AuthError::Unavailable)?;
        let user = users::provision(
            &self.db,
            ProvisionUser {
                issuer: ISSUER.to_owned(),
                subject: verified.id,
                name: verified.name,
            },
        )
        .await
        .map_err(|_| AuthError::Unavailable)?;
        let session = random_token().map_err(|_| AuthError::Unavailable)?;
        let session_hash = digest_token(&session);
        let tokens = Tokens {
            access_token: result.access_token,
            refresh_token,
        };
        let sealed_tokens = self
            .vault
            .seal(&tokens, &session_purpose(&session_hash, user.id))
            .map_err(|_| AuthError::Unavailable)?;
        let created_at_ms = now_ms()?;
        let expires_at_ms = created_at_ms
            .checked_add(SESSION_MS)
            .ok_or(AuthError::Unavailable)?;
        sessions::create(
            &self.db,
            SessionRecord {
                id_hash: session_hash,
                user_id: user.id,
                sealed_tokens,
                expires_at_ms,
            },
            created_at_ms,
        )
        .await
        .map_err(|_| AuthError::Unavailable)?;
        let mut response = redirect(&destination)?;
        response
            .headers_mut()
            .append(header::SET_COOKIE, session_cookie(&session, self.secure())?);
        Ok(response)
    }

    fn secure(&self) -> bool {
        self.config.public_origin.scheme() == "https"
    }
}

fn verification_failure(error: VerificationError) -> AuthError {
    match error {
        VerificationError::Unavailable => AuthError::Unavailable,
        VerificationError::Expired | VerificationError::Invalid => AuthError::InvalidGrant,
    }
}

fn now_ms() -> Result<i64, AuthError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| AuthError::Unavailable)?
        .as_millis();
    i64::try_from(now).map_err(|_| AuthError::Unavailable)
}

fn valid_capability(value: &str) -> bool {
    value.len() == 43
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-' || byte == b'_')
}

fn challenge_purpose(hash: &str) -> String {
    format!("challenge:{hash}")
}
fn session_purpose(hash: &str, id: Uuid) -> String {
    format!("session:{hash}:{id}")
}

fn cookie<'a>(headers: &'a HeaderMap, name: &str) -> Result<Option<&'a str>, AuthError> {
    let mut found = None;
    for header in headers.get_all(header::COOKIE) {
        let value = header.to_str().map_err(|_| AuthError::BadRequest)?;
        for part in value.split(';') {
            let part = part.trim();
            let Some((key, value)) = part.split_once('=') else {
                return Err(AuthError::BadRequest);
            };
            if key.trim() == name {
                if found.is_some() || key != name || value.is_empty() {
                    return Err(AuthError::BadRequest);
                }
                found = Some(value);
            }
        }
    }
    Ok(found)
}

fn query_value(uri: &Uri, name: &str) -> Result<Option<String>, AuthError> {
    let mut value = None;
    if let Some(query) = uri.query() {
        if query.len() > 16 * 1024 {
            return Err(AuthError::BadRequest);
        }
        for (key, item) in url::form_urlencoded::parse(query.as_bytes()) {
            if key == name {
                if value.is_some() {
                    return Err(AuthError::BadRequest);
                }
                value = Some(item.into_owned());
            }
        }
    }
    Ok(value)
}

fn safe_target(origin: &Url, target: &str) -> Result<String, AuthError> {
    if target.len() > 1500
        || !target.starts_with('/')
        || target.starts_with("//")
        || target.contains('\\')
        || target.chars().any(char::is_control)
        || target.contains('#')
    {
        return Err(AuthError::BadRequest);
    }
    let url = origin.join(target).map_err(|_| AuthError::BadRequest)?;
    if url.origin() != origin.origin()
        || !matches!(
            url.path(),
            "/" | "/projects" | "/templates" | "/reports" | "/settings" | "/focus"
        )
        || url.path() != target.split('?').next().unwrap_or("")
    {
        return Err(AuthError::BadRequest);
    }
    validate_target_query(&url)?;
    Ok(url.into())
}

fn validate_target_query(url: &Url) -> Result<(), AuthError> {
    let Some(query) = url.query() else {
        return Ok(());
    };
    if query.is_empty() || url.path() != "/reports" {
        return Err(AuthError::BadRequest);
    }
    let mut seen = Vec::new();
    for (key, value) in url::form_urlencoded::parse(query.as_bytes()) {
        if seen.contains(&key.to_string()) {
            return Err(AuthError::BadRequest);
        }
        seen.push(key.to_string());
        let valid = match key.as_ref() {
            "period" => matches!(value.as_ref(), "day" | "week" | "month" | "year"),
            "project" => {
                value == "none"
                    || pomodoro_focus::parse_uuid::<serde::de::value::Error>(&value).is_ok()
            }
            "page" => {
                !value.is_empty()
                    && value.bytes().all(|byte| byte.is_ascii_digit())
                    && value
                        .parse::<u32>()
                        .is_ok_and(|page| (1..=100_000).contains(&page))
            }
            "date" => valid_date(&value),
            _ => false,
        };
        if !valid {
            return Err(AuthError::BadRequest);
        }
    }
    Ok(())
}

fn valid_date(value: &str) -> bool {
    let bytes = value.as_bytes();
    if bytes.len() != 10
        || bytes[4] != b'-'
        || bytes[7] != b'-'
        || !bytes
            .iter()
            .enumerate()
            .all(|(index, byte)| index == 4 || index == 7 || byte.is_ascii_digit())
    {
        return false;
    }
    let Ok(year) = value[0..4].parse::<u32>() else {
        return false;
    };
    let Ok(month) = value[5..7].parse::<u32>() else {
        return false;
    };
    let Ok(day) = value[8..10].parse::<u32>() else {
        return false;
    };
    let days = match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 if year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) => 29,
        2 => 28,
        _ => return false,
    };
    day >= 1 && day <= days
}

fn redirect(destination: &str) -> Result<Response, AuthError> {
    let location = HeaderValue::from_str(destination).map_err(|_| AuthError::BadRequest)?;
    let mut response = StatusCode::SEE_OTHER.into_response();
    response.headers_mut().insert(header::LOCATION, location);
    Ok(response)
}

fn challenge_cookie(value: &str, secure: bool) -> Result<HeaderValue, AuthError> {
    HeaderValue::from_str(&format!(
        "{CHALLENGE_COOKIE}={value}; Path=/auth; HttpOnly; SameSite=Lax; Max-Age=600{}",
        if secure { "; Secure" } else { "" }
    ))
    .map_err(|_| AuthError::Unavailable)
}

fn session_cookie(value: &str, secure: bool) -> Result<HeaderValue, AuthError> {
    HeaderValue::from_str(&format!(
        "{SESSION_COOKIE}={value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000{}",
        if secure { "; Secure" } else { "" }
    ))
    .map_err(|_| AuthError::Unavailable)
}

pub fn clear_challenge_cookie(secure: bool) -> HeaderValue {
    if secure {
        HeaderValue::from_static(
            "pomodoro_auth=; Path=/auth; HttpOnly; SameSite=Lax; Max-Age=0; Secure",
        )
    } else {
        HeaderValue::from_static("pomodoro_auth=; Path=/auth; HttpOnly; SameSite=Lax; Max-Age=0")
    }
}

pub fn clear_session_cookie(secure: bool) -> HeaderValue {
    if secure {
        HeaderValue::from_static(
            "pomodoro_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure",
        )
    } else {
        HeaderValue::from_static("pomodoro_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0")
    }
}

fn failure(error: AuthError, id: Uuid) -> Response {
    (
        error.status(),
        Json(ErrorResponse {
            error: error.public_message().to_owned(),
            request_id: Some(id),
        }),
    )
        .into_response()
}

pub fn router(service: Arc<AuthService>) -> Router<()> {
    Router::new()
        .route("/auth/authorize", get(login))
        .route("/auth/callback", get(callback))
        .route("/auth/logout", post(logout))
        .with_state(service)
}

#[utoipa::path(get, path = "/auth/authorize", params(("return_to" = Option<String>, Query)), responses((status = 303), (status = 400, body = ErrorResponse), (status = 503, body = ErrorResponse), (status = 429, body = ErrorResponse), (status = 504, body = ErrorResponse)))]
pub async fn login(
    State(service): State<Arc<AuthService>>,
    Extension(id): Extension<Uuid>,
    uri: Uri,
) -> Response {
    match service.login(&uri).await {
        Ok(response) => response,
        Err(error) => failure(error, id),
    }
}

#[utoipa::path(get, path = "/auth/callback", responses((status = 303), (status = 400, body = ErrorResponse), (status = 503, body = ErrorResponse), (status = 429, body = ErrorResponse), (status = 504, body = ErrorResponse)))]
pub async fn callback(
    State(service): State<Arc<AuthService>>,
    Extension(id): Extension<Uuid>,
    headers: HeaderMap,
    uri: Uri,
) -> Response {
    let mut response = match service.callback(&headers, &uri).await {
        Ok(response) => response,
        Err(error) => failure(error, id),
    };
    response
        .headers_mut()
        .append(header::SET_COOKIE, clear_challenge_cookie(service.secure()));
    response
}

#[utoipa::path(post, path = "/auth/logout", params(("X-Pomodoro-User" = Uuid, Header)), security(("account_cookie" = [])), responses((status = 204), (status = 400, body = ErrorResponse), (status = 401, body = ErrorResponse), (status = 403, body = ErrorResponse), (status = 409, body = ErrorResponse), (status = 503, body = ErrorResponse), (status = 429, body = ErrorResponse), (status = 504, body = ErrorResponse)))]
#[tracing::instrument(skip_all, fields(operation = "auth.logout"))]
pub async fn logout(
    State(service): State<Arc<AuthService>>,
    Extension(id): Extension<Uuid>,
    headers: HeaderMap,
) -> Response {
    let origin = service.config.public_origin.origin().ascii_serialization();
    let origins = headers.get_all(header::ORIGIN);
    let mut values = origins.iter();
    if values.next().and_then(|value| value.to_str().ok()) != Some(origin.as_str())
        || values.next().is_some()
    {
        return failure(AuthError::Forbidden, id);
    }
    let value = match cookie(&headers, SESSION_COOKIE) {
        Ok(Some(value)) if valid_capability(value) => value,
        Ok(_) => return failure(AuthError::BadRequest, id),
        Err(error) => return failure(error, id),
    };
    if sessions::delete(&service.db, &digest_token(value))
        .await
        .is_err()
    {
        return failure(AuthError::Unavailable, id);
    }
    let mut response = StatusCode::NO_CONTENT.into_response();
    response
        .headers_mut()
        .append(header::SET_COOKIE, clear_session_cookie(service.secure()));
    response
        .headers_mut()
        .append(header::SET_COOKIE, clear_challenge_cookie(service.secure()));
    response
}
