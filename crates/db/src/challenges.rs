use std::time::{SystemTime, UNIX_EPOCH};

use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set,
    TransactionTrait,
};

use crate::DbError;

mod challenge {
    use sea_orm::entity::prelude::*;
    use std::fmt;

    #[derive(Clone, PartialEq, DeriveEntityModel)]
    #[sea_orm(table_name = "oauth_challenges")]
    pub struct Model {
        #[sea_orm(primary_key, auto_increment = false)]
        pub state_hash: String,
        pub expires_at_ms: i64,
    }

    impl fmt::Debug for Model {
        fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
            formatter.write_str("ChallengeModel([REDACTED])")
        }
    }

    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {}

    impl ActiveModelBehavior for ActiveModel {}
}

fn valid_hash(value: &str) -> bool {
    !value.trim().is_empty() && value.len() <= 512 && !value.contains('\0')
}

#[tracing::instrument(skip_all, fields(operation = "challenge.create"))]

pub async fn create(
    db: &DatabaseConnection,
    state_hash: &str,
    expires_at_ms: i64,
) -> Result<(), DbError> {
    if !valid_hash(state_hash) || expires_at_ms <= 0 {
        return Err(DbError::InvalidData);
    }
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| DbError::InvalidData)?
        .as_millis();
    let now_ms = i64::try_from(now_ms).map_err(|_| DbError::InvalidData)?;
    let transaction = db.begin().await?;
    challenge::Entity::delete_many()
        .filter(challenge::Column::ExpiresAtMs.lte(now_ms))
        .exec(&transaction)
        .await?;
    challenge::ActiveModel {
        state_hash: Set(state_hash.to_owned()),
        expires_at_ms: Set(expires_at_ms),
    }
    .insert(&transaction)
    .await?;
    transaction.commit().await?;
    Ok(())
}

#[tracing::instrument(skip_all, fields(operation = "challenge.consume"))]

pub async fn consume(
    db: &DatabaseConnection,
    state_hash: &str,
    now_ms: i64,
) -> Result<bool, DbError> {
    if !valid_hash(state_hash) || now_ms < 0 {
        return Err(DbError::InvalidData);
    }
    let result = challenge::Entity::delete_many()
        .filter(challenge::Column::StateHash.eq(state_hash))
        .filter(challenge::Column::ExpiresAtMs.gt(now_ms))
        .exec(db)
        .await?;
    Ok(result.rows_affected == 1)
}
