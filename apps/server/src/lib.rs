pub mod contract;

use utoipa::OpenApi;

#[derive(OpenApi)]
#[openapi(components(schemas(
    contract::Workspace,
    contract::Task,
    contract::Project,
    contract::ProjectColor,
    contract::Template,
    contract::TemplateTask,
    contract::Session,
    contract::Settings,
    contract::Alarm,
    contract::FocusSound,
    contract::WeekStart,
    contract::HourFormat,
    contract::Theme,
    contract::Timer,
    contract::TimerPhase,
    contract::UserDto,
    contract::SessionResponse,
    contract::WorkspaceResponse,
    contract::SaveWorkspaceRequest,
    contract::ImportWorkspaceRequest,
    contract::ErrorResponse
)))]
pub struct ApiDoc;
