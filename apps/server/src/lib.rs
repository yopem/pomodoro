pub mod config;
pub mod contract;
pub mod http;
pub mod platform;

use utoipa::{
    Modify, OpenApi,
    openapi::security::{ApiKey, ApiKeyValue, SecurityScheme},
};

struct HttpContract;

impl Modify for HttpContract {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        openapi
            .components
            .get_or_insert_with(Default::default)
            .add_security_scheme(
                "account_cookie",
                SecurityScheme::ApiKey(ApiKey::Cookie(ApiKeyValue::new(
                    platform::auth::SESSION_COOKIE,
                ))),
            );
        let request_id = utoipa::openapi::header::HeaderBuilder::new()
            .schema(
                utoipa::openapi::schema::ObjectBuilder::new()
                    .schema_type(utoipa::openapi::schema::Type::String)
                    .format(Some(utoipa::openapi::schema::SchemaFormat::KnownFormat(
                        utoipa::openapi::schema::KnownFormat::Uuid,
                    ))),
            )
            .description(Some("Request correlation ID"))
            .build();
        let retry_after = utoipa::openapi::header::HeaderBuilder::new()
            .schema(<u32 as utoipa::PartialSchema>::schema())
            .description(Some("Seconds before a retry"))
            .build();
        for path in openapi.paths.paths.values_mut() {
            for operation in [
                path.get.as_mut(),
                path.put.as_mut(),
                path.post.as_mut(),
                path.delete.as_mut(),
                path.options.as_mut(),
                path.head.as_mut(),
                path.patch.as_mut(),
                path.trace.as_mut(),
            ]
            .into_iter()
            .flatten()
            {
                for (status, response) in &mut operation.responses.responses {
                    if let utoipa::openapi::RefOr::T(response) = response {
                        response
                            .headers
                            .insert("X-Request-ID".to_owned(), request_id.clone());
                        if status == "429" {
                            response
                                .headers
                                .insert("Retry-After".to_owned(), retry_after.clone());
                        }
                    }
                }
            }
        }
    }
}

#[derive(OpenApi)]
#[openapi(modifiers(&HttpContract), paths(
    http::session,
    http::load_workspace,
    http::save_workspace,
    http::import_workspace,
    http::health,
    http::ready,
    http::openapi,
    platform::auth::login,
    platform::auth::callback,
    platform::auth::logout
), components(schemas(
    http::HealthResponse,
    pomodoro_focus::Workspace,
    pomodoro_focus::Task,
    pomodoro_focus::Project,
    pomodoro_focus::ProjectColor,
    pomodoro_focus::Template,
    pomodoro_focus::TemplateTask,
    pomodoro_focus::Session,
    pomodoro_focus::Settings,
    pomodoro_focus::Alarm,
    pomodoro_focus::FocusSound,
    pomodoro_focus::WeekStart,
    pomodoro_focus::HourFormat,
    pomodoro_focus::Theme,
    pomodoro_focus::Timer,
    pomodoro_focus::TimerPhase,
    contract::UserDto,
    contract::SessionResponse,
    contract::WorkspaceResponse,
    contract::SaveWorkspaceRequest,
    contract::ImportWorkspaceRequest,
    contract::ErrorResponse
)))]
pub struct ApiDoc;
