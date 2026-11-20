use pomodoro_focus::{Workspace, id_schema, is_valid_id};
use serde::{Deserialize, Deserializer, Serialize};
use utoipa::ToSchema;

fn required_option<'de, D, T>(deserializer: D) -> Result<Option<T>, D::Error>
where
    D: Deserializer<'de>,
    T: Deserialize<'de>,
{
    Option::deserialize(deserializer)
}

fn deserialize_id<'de, D: Deserializer<'de>>(deserializer: D) -> Result<String, D::Error> {
    let id = String::deserialize(deserializer)?;
    if !is_valid_id(&id) {
        return Err(serde::de::Error::custom("invalid ID"));
    }
    Ok(id)
}

fn deserialize_revision<'de, D: Deserializer<'de>>(deserializer: D) -> Result<i64, D::Error> {
    let value = i64::deserialize(deserializer)?;
    if !(0..=9_007_199_254_740_991).contains(&value) {
        return Err(serde::de::Error::custom("invalid revision"));
    }
    Ok(value)
}

#[derive(Clone, Debug, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct UserDto {
    #[serde(deserialize_with = "deserialize_id")]
    #[schema(schema_with = id_schema)]
    pub id: String,
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
    #[serde(deserialize_with = "deserialize_id")]
    #[schema(schema_with = id_schema)]
    pub user_id: String,
    pub workspace: Workspace,
    pub revision: i64,
}

#[derive(Clone, Debug, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct SaveWorkspaceRequest {
    pub workspace: Workspace,
    #[schema(minimum = 0, maximum = 9007199254740991_i64)]
    #[serde(deserialize_with = "deserialize_revision")]
    pub expected_revision: i64,
}

#[derive(Clone, Debug, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct ImportWorkspaceRequest {
    pub workspace: Workspace,
    #[schema(minimum = 0, maximum = 9007199254740991_i64)]
    #[serde(deserialize_with = "deserialize_revision")]
    pub expected_revision: i64,
    #[serde(deserialize_with = "deserialize_id")]
    #[schema(schema_with = id_schema)]
    pub import_id: String,
}

fn deserialize_request_id<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<Option<String>, D::Error> {
    let id = Option::<String>::deserialize(deserializer)?;
    if id.as_deref().is_some_and(|value| !is_valid_id(value)) {
        return Err(serde::de::Error::custom("invalid request ID"));
    }
    Ok(id)
}

#[derive(Clone, Debug, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct ErrorResponse {
    pub error: String,
    #[serde(deserialize_with = "deserialize_request_id")]
    #[schema(required, pattern = "^[A-Za-z0-9_-]{21}$")]
    pub request_id: Option<String>,
}
