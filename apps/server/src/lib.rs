pub mod contract;

use utoipa::OpenApi;

#[derive(OpenApi)]
#[openapi(components(schemas(
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
