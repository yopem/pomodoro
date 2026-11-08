use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        for sql in [
            "CREATE TABLE users (id UUID PRIMARY KEY, issuer TEXT NOT NULL, subject TEXT NOT NULL, name TEXT, CONSTRAINT users_identity_unique UNIQUE (issuer, subject))",
            "CREATE TABLE focus_workspaces (user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, revision BIGINT NOT NULL CHECK (revision BETWEEN 0 AND 9007199254740991), workspace JSONB NOT NULL)",
            "CREATE TABLE workspace_imports (user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, import_id UUID NOT NULL, expected_revision BIGINT NOT NULL CHECK (expected_revision BETWEEN 0 AND 9007199254740991), workspace_digest TEXT NOT NULL CHECK (workspace_digest ~ '^[0-9a-f]{64}$'), PRIMARY KEY (user_id, import_id))",
            "CREATE TABLE auth_sessions (id_hash TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, sealed_tokens TEXT NOT NULL, expires_at_ms BIGINT NOT NULL)",
            "CREATE INDEX auth_sessions_user_id_idx ON auth_sessions (user_id)",
            "CREATE INDEX auth_sessions_expires_at_ms_idx ON auth_sessions (expires_at_ms)",
            "CREATE TABLE oauth_challenges (state_hash TEXT PRIMARY KEY, expires_at_ms BIGINT NOT NULL)",
            "CREATE INDEX oauth_challenges_expires_at_ms_idx ON oauth_challenges (expires_at_ms)",
        ] {
            db.execute_unprepared(sql).await?;
        }
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        for sql in [
            "DROP TABLE oauth_challenges",
            "DROP TABLE auth_sessions",
            "DROP TABLE workspace_imports",
            "DROP TABLE focus_workspaces",
            "DROP TABLE users",
        ] {
            db.execute_unprepared(sql).await?;
        }
        Ok(())
    }
}
