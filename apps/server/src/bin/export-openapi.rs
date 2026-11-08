use pomodoro_server::ApiDoc;
use utoipa::OpenApi;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let stdout = std::io::stdout();
    serde_json::to_writer_pretty(stdout.lock(), &ApiDoc::openapi())?;
    Ok(())
}
