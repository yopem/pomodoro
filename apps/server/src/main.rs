use std::{future::IntoFuture, process::ExitCode, sync::Arc, time::Duration};

use pomodoro_server::{config::AppConfig, http, platform::auth::AuthService};
use tokio::{net::TcpListener, sync::oneshot};
use tracing_subscriber::fmt::format::FmtSpan;

#[tokio::main]
async fn main() -> ExitCode {
    if tracing_subscriber::fmt()
        .json()
        .with_target(false)
        .with_span_events(FmtSpan::CLOSE)
        .try_init()
        .is_err()
    {
        eprintln!("Could not initialize server logging");
        return ExitCode::FAILURE;
    }
    match run().await {
        Ok(()) => ExitCode::SUCCESS,
        Err(message) => {
            tracing::error!(
                service = "pomodoro-api",
                release = env!("CARGO_PKG_VERSION"),
                outcome = "process_failed",
                message
            );
            ExitCode::FAILURE
        }
    }
}

async fn run() -> Result<(), String> {
    let config = AppConfig::load().map_err(|error| error.to_string())?;
    let db = pomodoro_db::connect(&config.database_url)
        .await
        .map_err(|_| "Could not connect to account storage".to_owned())?;
    let auth = config
        .auth
        .map(|auth| AuthService::new(db.clone(), auth).map(Arc::new))
        .transpose()
        .map_err(|_| "Could not configure account authentication".to_owned())?;
    let app = http::router(db.clone(), auth, &config.public_origin, &config.environment);
    let listener = TcpListener::bind(config.bind_addr)
        .await
        .map_err(|_| "Could not bind the API listener".to_owned())?;
    let (stop, stopped) = oneshot::channel();
    let mut server = Box::pin(
        axum::serve(
            listener,
            app.into_make_service_with_connect_info::<std::net::SocketAddr>(),
        )
        .with_graceful_shutdown(async {
            let _ = stopped.await;
        })
        .into_future(),
    );
    tracing::info!(
        service = "pomodoro-api",
        environment = config.environment,
        release = env!("CARGO_PKG_VERSION"),
        outcome = "listening"
    );
    let outcome = tokio::select! {
        result = &mut server => result.map_err(|_| "The API listener failed".to_owned()),
        () = shutdown_signal() => {
            let _ = stop.send(());
            match tokio::time::timeout(Duration::from_secs(35), &mut server).await {
                Ok(result) => result.map_err(|_| "The API listener failed during shutdown".to_owned()),
                Err(_) => Err("The API shutdown deadline was reached".to_owned()),
            }
        }
    };
    drop(server);
    tokio::time::timeout(Duration::from_secs(10), db.close())
        .await
        .map_err(|_| "Account storage close deadline was reached".to_owned())?
        .map_err(|_| "Account storage did not close cleanly".to_owned())?;
    outcome
}

async fn shutdown_signal() {
    let interrupt = async {
        if tokio::signal::ctrl_c().await.is_err() {
            tracing::warn!(
                service = "pomodoro-api",
                outcome = "interrupt_handler_unavailable"
            );
            std::future::pending::<()>().await;
        }
    };
    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut signal) => {
                signal.recv().await;
            }
            Err(_) => {
                tracing::warn!(
                    service = "pomodoro-api",
                    outcome = "terminate_handler_unavailable"
                );
                std::future::pending::<()>().await;
            }
        }
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! { () = interrupt => {}, () = terminate => {} }
}
