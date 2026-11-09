use std::collections::HashMap;

use pomodoro_focus::{ValidatedWorkspace, Workspace};
use sea_orm::{
    ActiveModelTrait, DatabaseConnection, DatabaseTransaction, EntityTrait, QuerySelect, Set,
    TransactionTrait,
};
use serde_json::Value as Json;
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::DbError;

const MAX_REVISION: i64 = 9_007_199_254_740_991;
const MAX_SAVE_ENVELOPE_BYTES: usize = 51;
const MAX_BROWSER_TIMER_NUMBER_BYTES: usize = 32;

pub const MAX_WORKSPACE_REQUEST_BYTES: usize = 20_000_000;

pub struct StoredWorkspace {
    pub workspace: ValidatedWorkspace,
    pub revision: i64,
}

mod workspace_entity {
    use sea_orm::entity::prelude::*;

    #[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
    #[sea_orm(table_name = "focus_workspaces")]
    pub struct Model {
        #[sea_orm(primary_key, auto_increment = false)]
        pub user_id: Uuid,
        pub revision: i64,
        #[sea_orm(column_type = "JsonBinary")]
        pub workspace: Json,
    }

    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {}

    impl ActiveModelBehavior for ActiveModel {}
}

mod receipt_entity {
    use sea_orm::entity::prelude::*;

    #[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
    #[sea_orm(table_name = "workspace_imports")]
    pub struct Model {
        #[sea_orm(primary_key, auto_increment = false)]
        pub user_id: Uuid,
        #[sea_orm(primary_key, auto_increment = false)]
        pub import_id: Uuid,
        pub expected_revision: i64,
        pub workspace_digest: String,
    }

    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {}

    impl ActiveModelBehavior for ActiveModel {}
}

fn encode(workspace: &ValidatedWorkspace) -> Result<Json, DbError> {
    serde_json::to_value(workspace).map_err(|_| DbError::InvalidData)
}

fn compact_save_size_bound(workspace: &ValidatedWorkspace) -> Result<usize, DbError> {
    let serialized = serde_json::to_vec(workspace).map_err(|_| DbError::InvalidData)?;
    let timer_number = serde_json::to_vec(&workspace.as_workspace().timer.remaining_seconds)
        .map_err(|_| DbError::InvalidData)?;
    let structural_bytes = serialized
        .len()
        .checked_sub(timer_number.len())
        .ok_or(DbError::InvalidData)?;
    Ok(structural_bytes.saturating_add(MAX_SAVE_ENVELOPE_BYTES + MAX_BROWSER_TIMER_NUMBER_BYTES))
}

fn decode(value: Json) -> Result<ValidatedWorkspace, DbError> {
    let workspace: Workspace = serde_json::from_value(value).map_err(|_| DbError::Database)?;
    ValidatedWorkspace::try_from(workspace).map_err(|_| DbError::Database)
}

fn stored(row: workspace_entity::Model) -> Result<StoredWorkspace, DbError> {
    let revision = row.revision;
    if !(0..=MAX_REVISION).contains(&revision) {
        return Err(DbError::Database);
    }
    Ok(StoredWorkspace {
        workspace: decode(row.workspace)?,
        revision,
    })
}

async fn lock_workspace(
    tx: &DatabaseTransaction,
    user_id: Uuid,
) -> Result<StoredWorkspace, DbError> {
    let default =
        ValidatedWorkspace::try_from(Workspace::default()).map_err(|_| DbError::InvalidData)?;
    workspace_entity::Entity::insert(workspace_entity::ActiveModel {
        user_id: Set(user_id),
        revision: Set(0),
        workspace: Set(encode(&default)?),
    })
    .on_conflict_do_nothing()
    .exec(tx)
    .await?;
    let row = workspace_entity::Entity::find_by_id(user_id)
        .lock_exclusive()
        .one(tx)
        .await?
        .ok_or(DbError::NotFound)?;
    stored(row)
}

fn next_revision(current: i64, expected: i64) -> Result<i64, DbError> {
    if !(0..=MAX_REVISION).contains(&expected) {
        return Err(DbError::InvalidData);
    }
    if current != expected {
        return Err(DbError::Conflict);
    }
    if current == MAX_REVISION {
        return Err(DbError::RevisionExhausted);
    }
    Ok(current + 1)
}

async fn write_workspace(
    tx: &DatabaseTransaction,
    user_id: Uuid,
    revision: i64,
    workspace: &ValidatedWorkspace,
) -> Result<(), DbError> {
    workspace_entity::ActiveModel {
        user_id: Set(user_id),
        revision: Set(revision),
        workspace: Set(encode(workspace)?),
    }
    .update(tx)
    .await?;
    Ok(())
}

#[tracing::instrument(skip_all, fields(operation = "workspace.load"))]

pub async fn load(db: &DatabaseConnection, user_id: Uuid) -> Result<StoredWorkspace, DbError> {
    let tx = db.begin().await?;
    let result = lock_workspace(&tx, user_id).await?;
    tx.commit().await?;
    Ok(result)
}

#[tracing::instrument(skip_all, fields(operation = "workspace.save"))]

pub async fn save(
    db: &DatabaseConnection,
    user_id: Uuid,
    expected_revision: i64,
    workspace: ValidatedWorkspace,
) -> Result<StoredWorkspace, DbError> {
    let tx = db.begin().await?;
    let current = lock_workspace(&tx, user_id).await?;
    let revision = next_revision(current.revision, expected_revision)?;
    let size_bound = compact_save_size_bound(&workspace)?;
    if size_bound > MAX_WORKSPACE_REQUEST_BYTES
        && size_bound >= compact_save_size_bound(&current.workspace)?
    {
        return Err(DbError::WorkspaceTooLarge);
    }
    write_workspace(&tx, user_id, revision, &workspace).await?;
    tx.commit().await?;
    Ok(StoredWorkspace {
        workspace,
        revision,
    })
}

fn merge_items<T: Clone + PartialEq>(
    account: &mut Vec<T>,
    guest: &[T],
    id: impl Fn(&T) -> &str,
) -> Result<(), DbError> {
    let mut existing: HashMap<String, usize> = account
        .iter()
        .enumerate()
        .map(|(index, item)| (id(item).to_owned(), index))
        .collect();
    for item in guest {
        match existing.get(id(item)) {
            Some(&index) if account[index] != *item => return Err(DbError::Conflict),
            Some(_) => {}
            None => {
                existing.insert(id(item).to_owned(), account.len());
                account.push(item.clone());
            }
        }
    }
    Ok(())
}

fn merge(
    account: ValidatedWorkspace,
    guest: &ValidatedWorkspace,
) -> Result<ValidatedWorkspace, DbError> {
    let mut result = account.into_workspace();
    let guest = guest.as_workspace();
    if result == Workspace::default() {
        return ValidatedWorkspace::try_from(guest.clone()).map_err(|_| DbError::InvalidData);
    }
    if guest
        .timer
        .run_id
        .as_ref()
        .is_some_and(|id| result.sessions.iter().any(|session| &session.id == id))
        || result
            .timer
            .run_id
            .as_ref()
            .is_some_and(|id| guest.sessions.iter().any(|session| &session.id == id))
    {
        return Err(DbError::Conflict);
    }
    merge_items(&mut result.projects, &guest.projects, |item| &item.id)?;
    merge_items(&mut result.tasks, &guest.tasks, |item| &item.id)?;
    merge_items(&mut result.templates, &guest.templates, |item| &item.id)?;
    merge_items(&mut result.sessions, &guest.sessions, |item| &item.id)?;
    ValidatedWorkspace::try_from(result).map_err(|_| DbError::Conflict)
}

#[tracing::instrument(skip_all, fields(operation = "workspace.import"))]

pub async fn r#import(
    db: &DatabaseConnection,
    user_id: Uuid,
    expected_revision: i64,
    import_id: Uuid,
    workspace: ValidatedWorkspace,
) -> Result<StoredWorkspace, DbError> {
    let tx = db.begin().await?;
    let current = lock_workspace(&tx, user_id).await?;
    let digest = format!(
        "{:x}",
        Sha256::digest(serde_json::to_vec(&workspace).map_err(|_| DbError::InvalidData)?)
    );
    let receipt = receipt_entity::Entity::find_by_id((user_id, import_id))
        .one(&tx)
        .await?;
    if let Some(receipt) = receipt {
        let previous_revision = receipt.expected_revision;
        if previous_revision != expected_revision || receipt.workspace_digest != digest {
            return Err(DbError::Conflict);
        }
        tx.commit().await?;
        return Ok(current);
    }
    let revision = next_revision(current.revision, expected_revision)?;
    let merged = merge(current.workspace, &workspace)?;
    if compact_save_size_bound(&merged)? > MAX_WORKSPACE_REQUEST_BYTES {
        return Err(DbError::WorkspaceTooLarge);
    }
    write_workspace(&tx, user_id, revision, &merged).await?;
    receipt_entity::Entity::insert(receipt_entity::ActiveModel {
        user_id: Set(user_id),
        import_id: Set(import_id),
        expected_revision: Set(expected_revision),
        workspace_digest: Set(digest),
    })
    .exec(&tx)
    .await?;
    tx.commit().await?;
    Ok(StoredWorkspace {
        workspace: merged,
        revision,
    })
}
