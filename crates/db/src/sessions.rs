use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    QueryFilter, QuerySelect, Set, TransactionTrait, sea_query::Expr,
};
use uuid::Uuid;

use crate::DbError;

mod session {
    use sea_orm::entity::prelude::*;
    use std::fmt;

    #[derive(Clone, PartialEq, DeriveEntityModel)]
    #[sea_orm(table_name = "auth_sessions")]
    pub struct Model {
        #[sea_orm(primary_key, auto_increment = false)]
        pub id_hash: String,
        pub user_id: Uuid,
        pub sealed_tokens: String,
        pub expires_at_ms: i64,
    }

    impl fmt::Debug for Model {
        fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
            formatter.write_str("SessionModel([REDACTED])")
        }
    }

    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {}

    impl ActiveModelBehavior for ActiveModel {}
}

pub struct SessionRecord {
    pub id_hash: String,
    pub user_id: Uuid,
    pub sealed_tokens: String,
    pub expires_at_ms: i64,
}

pub struct LockedSession {
    transaction: DatabaseTransaction,
    record: SessionRecord,
}

fn valid_hash(value: &str) -> bool {
    !value.trim().is_empty() && value.len() <= 512 && !value.contains('\0')
}

fn valid_tokens(value: &str) -> bool {
    !value.trim().is_empty() && value.len() <= 65_536 && !value.contains('\0')
}

#[tracing::instrument(skip_all, fields(operation = "session.create"))]

pub async fn create(
    db: &DatabaseConnection,
    record: SessionRecord,
    now_ms: i64,
) -> Result<(), DbError> {
    if now_ms < 0
        || !valid_hash(&record.id_hash)
        || !valid_tokens(&record.sealed_tokens)
        || record.expires_at_ms <= now_ms
    {
        return Err(DbError::InvalidData);
    }
    session::Entity::delete_many()
        .filter(session::Column::ExpiresAtMs.lte(now_ms))
        .exec(db)
        .await?;
    session::ActiveModel {
        id_hash: Set(record.id_hash),
        user_id: Set(record.user_id),
        sealed_tokens: Set(record.sealed_tokens),
        expires_at_ms: Set(record.expires_at_ms),
    }
    .insert(db)
    .await?;
    Ok(())
}

#[tracing::instrument(skip_all, fields(operation = "session.lock"))]

pub async fn lock(
    db: &DatabaseConnection,
    id_hash: &str,
) -> Result<Option<LockedSession>, DbError> {
    if !valid_hash(id_hash) {
        return Err(DbError::InvalidData);
    }
    let transaction = db.begin().await?;
    let model = session::Entity::find_by_id(id_hash.to_owned())
        .lock_exclusive()
        .one(&transaction)
        .await?;
    let Some(model) = model else {
        transaction.rollback().await?;
        return Ok(None);
    };
    Ok(Some(LockedSession {
        transaction,
        record: SessionRecord {
            id_hash: model.id_hash,
            user_id: model.user_id,
            sealed_tokens: model.sealed_tokens,
            expires_at_ms: model.expires_at_ms,
        },
    }))
}

impl LockedSession {
    pub fn record(&self) -> &SessionRecord {
        &self.record
    }

    #[tracing::instrument(skip_all, fields(operation = "session.update_tokens"))]

    pub async fn update_tokens(&mut self, sealed_tokens: String) -> Result<(), DbError> {
        if !valid_tokens(&sealed_tokens) {
            return Err(DbError::InvalidData);
        }
        let result = session::Entity::update_many()
            .col_expr(
                session::Column::SealedTokens,
                Expr::value(sealed_tokens.clone()),
            )
            .filter(session::Column::IdHash.eq(self.record.id_hash.clone()))
            .exec(&self.transaction)
            .await?;
        if result.rows_affected != 1 {
            return Err(DbError::NotFound);
        }
        self.record.sealed_tokens = sealed_tokens;
        Ok(())
    }

    #[tracing::instrument(skip_all, fields(operation = "session.commit"))]

    pub async fn commit(self) -> Result<(), DbError> {
        self.transaction.commit().await?;
        Ok(())
    }

    #[tracing::instrument(skip_all, fields(operation = "session.delete"))]

    pub async fn delete(self) -> Result<(), DbError> {
        let result = session::Entity::delete_by_id(self.record.id_hash)
            .exec(&self.transaction)
            .await?;
        if result.rows_affected != 1 {
            return Err(DbError::NotFound);
        }
        self.transaction.commit().await?;
        Ok(())
    }
}

#[tracing::instrument(skip_all, fields(operation = "session.delete"))]

pub async fn delete(db: &DatabaseConnection, id_hash: &str) -> Result<(), DbError> {
    if !valid_hash(id_hash) {
        return Err(DbError::InvalidData);
    }
    session::Entity::delete_by_id(id_hash.to_owned())
        .exec(db)
        .await?;
    Ok(())
}
