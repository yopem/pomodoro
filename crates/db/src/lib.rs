use std::{fmt, time::Duration};

use sea_orm::{ConnectOptions, Database, DatabaseConnection, SqlErr};
use url::Url;

pub mod challenges;
pub mod sessions;
pub mod users;
pub mod workspaces;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum DbError {
    Conflict,
    InvalidData,
    WorkspaceTooLarge,
    NotFound,
    RevisionExhausted,
    Database,
}

impl fmt::Display for DbError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(match self {
            Self::Conflict => "conflict",
            Self::InvalidData => "invalid data",
            Self::WorkspaceTooLarge => "workspace too large",
            Self::NotFound => "not found",
            Self::RevisionExhausted => "revision exhausted",
            Self::Database => "database error",
        })
    }
}

impl std::error::Error for DbError {}

impl From<sea_orm::DbErr> for DbError {
    fn from(error: sea_orm::DbErr) -> Self {
        match error.sql_err() {
            Some(SqlErr::UniqueConstraintViolation(_)) => Self::Conflict,
            _ => Self::Database,
        }
    }
}

#[tracing::instrument(skip_all, fields(operation = "database.connect"))]

pub async fn connect(database_url: &str) -> Result<DatabaseConnection, DbError> {
    let mut database_url = Url::parse(database_url).map_err(|_| DbError::InvalidData)?;
    if !matches!(database_url.scheme(), "postgres" | "postgresql") {
        return Err(DbError::InvalidData);
    }
    database_url.query_pairs_mut().append_pair(
        "options",
        "-c statement_timeout=10000 -c lock_timeout=5000 -c idle_in_transaction_session_timeout=25000",
    );
    let mut options = ConnectOptions::new(database_url.to_string());
    options
        .max_connections(10)
        .min_connections(0)
        .connect_timeout(Duration::from_secs(5))
        .acquire_timeout(Duration::from_secs(5))
        .idle_timeout(Duration::from_secs(300))
        .max_lifetime(Duration::from_secs(1800))
        .sqlx_logging(false);
    Ok(Database::connect(options).await?)
}

#[tracing::instrument(skip_all, fields(operation = "database.ready"))]

pub async fn ready(db: &DatabaseConnection) -> bool {
    db.ping().await.is_ok()
}
