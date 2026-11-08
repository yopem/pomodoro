#[tokio::main]
async fn main() {
    sea_orm_migration::cli::run_cli(pomodoro_migration::Migrator).await;
}
