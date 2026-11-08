use pomodoro_focus::{Workspace, parse_uuid};
use serde::{Deserialize, Deserializer, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

fn required_option<'de, D, T>(deserializer: D) -> Result<Option<T>, D::Error>
where
    D: Deserializer<'de>,
    T: Deserialize<'de>,
{
    Option::deserialize(deserializer)
}

fn deserialize_uuid<'de, D: Deserializer<'de>>(deserializer: D) -> Result<Uuid, D::Error> {
    let value = String::deserialize(deserializer)?;
    parse_uuid(&value)
}

fn deserialize_optional_uuid<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<Option<Uuid>, D::Error> {
    let value = Option::<String>::deserialize(deserializer)?;
    value.map(|value| parse_uuid(&value)).transpose()
}

#[derive(Clone, Debug, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct UserDto {
    #[serde(deserialize_with = "deserialize_uuid")]
    pub id: Uuid,
    #[serde(deserialize_with = "required_option")]
    #[schema(required)]
    pub name: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct SessionResponse {
    #[serde(deserialize_with = "required_option")]
    #[schema(required)]
    pub user: Option<UserDto>,
}

#[derive(Clone, Debug, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct WorkspaceResponse {
    pub workspace: Workspace,
    pub revision: i64,
}

#[derive(Clone, Debug, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct SaveWorkspaceRequest {
    pub workspace: Workspace,
    pub expected_revision: i64,
}

#[derive(Clone, Debug, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct ImportWorkspaceRequest {
    pub workspace: Workspace,
    pub expected_revision: i64,
    #[serde(deserialize_with = "deserialize_uuid")]
    pub import_id: Uuid,
}

#[derive(Clone, Debug, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct ErrorResponse {
    pub error: String,
    #[serde(deserialize_with = "deserialize_optional_uuid")]
    #[schema(required)]
    pub request_id: Option<Uuid>,
}
