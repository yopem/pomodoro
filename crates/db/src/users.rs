use sea_orm::{DatabaseConnection, EntityTrait, Set, sea_query::OnConflict};
use uuid::Uuid;

use crate::DbError;

mod entity {
    use sea_orm::entity::prelude::*;

    #[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
    #[sea_orm(table_name = "users")]
    pub struct Model {
        #[sea_orm(primary_key, auto_increment = false)]
        pub id: Uuid,
        pub issuer: String,
        pub subject: String,
        pub name: Option<String>,
    }

    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {}

    impl ActiveModelBehavior for ActiveModel {}
}

#[derive(Clone)]
pub struct User {
    pub id: Uuid,
    pub name: Option<String>,
    pub issuer: String,
    pub subject: String,
}

pub struct ProvisionUser {
    pub issuer: String,
    pub subject: String,
    pub name: Option<String>,
}

impl From<entity::Model> for User {
    fn from(model: entity::Model) -> Self {
        Self {
            id: model.id,
            name: model.name,
            issuer: model.issuer,
            subject: model.subject,
        }
    }
}

#[tracing::instrument(skip_all, fields(operation = "users.provision"))]

pub async fn provision(db: &DatabaseConnection, input: ProvisionUser) -> Result<User, DbError> {
    if input.issuer.trim().is_empty()
        || input.issuer.len() > 1024
        || input.subject.trim().is_empty()
        || input.subject.encode_utf16().count() > 512
        || input
            .name
            .as_ref()
            .is_some_and(|name| name.encode_utf16().count() > 500)
        || input.issuer.contains('\0')
        || input.subject.contains('\0')
        || input.name.as_ref().is_some_and(|name| name.contains('\0'))
    {
        return Err(DbError::InvalidData);
    }
    let user = entity::Entity::insert(entity::ActiveModel {
        id: Set(Uuid::new_v4()),
        issuer: Set(input.issuer),
        subject: Set(input.subject),
        name: Set(input.name),
    })
    .on_conflict(
        OnConflict::columns([entity::Column::Issuer, entity::Column::Subject])
            .update_column(entity::Column::Name)
            .to_owned(),
    )
    .exec_with_returning(db)
    .await?;
    Ok(user.into())
}

#[tracing::instrument(skip_all, fields(operation = "users.find"))]

pub async fn find(db: &DatabaseConnection, user_id: Uuid) -> Result<Option<User>, DbError> {
    Ok(entity::Entity::find_by_id(user_id)
        .one(db)
        .await?
        .map(User::from))
}
