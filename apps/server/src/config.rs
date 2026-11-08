use std::{env, error::Error, fmt, net::SocketAddr};

use base64::{Engine as _, engine::general_purpose::STANDARD};
use url::Url;

pub struct AppConfig {
    pub database_url: String,
    pub environment: String,
    pub bind_addr: SocketAddr,
    pub public_origin: Url,
    pub auth: Option<AuthConfig>,
}

pub struct AuthConfig {
    pub issuer: Url,
    pub client_id: String,
    pub callback_url: Url,
    pub public_origin: Url,
    pub(crate) session_key: [u8; 32],
}

#[derive(Debug)]
pub struct ConfigError(&'static str);

impl fmt::Display for ConfigError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.0)
    }
}

impl Error for ConfigError {}

impl AppConfig {
    pub fn load() -> Result<Self, ConfigError> {
        let environment = value("NODE_ENV")?.unwrap_or_else(|| "development".to_owned());
        let production = match environment.as_str() {
            "development" | "test" => false,
            "production" => true,
            _ => return Err(ConfigError("Invalid NODE_ENV")),
        };
        let database_url = value("DATABASE_URL")?
            .filter(|value| !value.is_empty())
            .ok_or(ConfigError("DATABASE_URL is required"))?;
        let database =
            Url::parse(&database_url).map_err(|_| ConfigError("Invalid DATABASE_URL"))?;
        if !matches!(database.scheme(), "postgres" | "postgresql") || database.host_str().is_none()
        {
            return Err(ConfigError("Invalid DATABASE_URL"));
        }
        let bind_addr = value("BIND_ADDR")?
            .unwrap_or_else(|| "127.0.0.1:18001".to_owned())
            .parse()
            .map_err(|_| ConfigError("Invalid BIND_ADDR"))?;
        let origin = value("PUBLIC_ORIGIN")?;
        if production && origin.is_none() {
            return Err(ConfigError("PUBLIC_ORIGIN is required in production"));
        }
        let public_origin = Url::parse(origin.as_deref().unwrap_or("http://127.0.0.1:13001"))
            .map_err(|_| ConfigError("Invalid PUBLIC_ORIGIN"))?;
        if !matches!(public_origin.scheme(), "http" | "https")
            || (production && public_origin.scheme() != "https")
            || public_origin.host_str().is_none()
            || !public_origin.username().is_empty()
            || public_origin.password().is_some()
            || public_origin.path() != "/"
            || public_origin.query().is_some()
            || public_origin.fragment().is_some()
        {
            return Err(ConfigError("Invalid PUBLIC_ORIGIN"));
        }
        let issuer = value("AUTH_ISSUER")?.unwrap_or_else(|| "https://auth.yopem.com".to_owned());
        if issuer != "https://auth.yopem.com" {
            return Err(ConfigError("Invalid AUTH_ISSUER"));
        }
        let client_id = value("AUTH_CLIENT_ID")?.unwrap_or_else(|| "yopem".to_owned());
        if client_id.trim().is_empty() || client_id.len() > 512 {
            return Err(ConfigError("Invalid AUTH_CLIENT_ID"));
        }
        let auth = match value("AUTH_SESSION_KEY")?.filter(|value| !value.is_empty()) {
            None => None,
            Some(key) => {
                let key = STANDARD
                    .decode(key)
                    .map_err(|_| ConfigError("Invalid AUTH_SESSION_KEY"))?;
                let session_key: [u8; 32] = key
                    .try_into()
                    .map_err(|_| ConfigError("Invalid AUTH_SESSION_KEY"))?;
                if session_key.iter().all(|byte| *byte == session_key[0]) {
                    return Err(ConfigError("Invalid AUTH_SESSION_KEY"));
                }
                Some(AuthConfig {
                    issuer: Url::parse(&issuer).map_err(|_| ConfigError("Invalid AUTH_ISSUER"))?,
                    client_id,
                    callback_url: public_origin
                        .join("/auth/callback")
                        .map_err(|_| ConfigError("Invalid PUBLIC_ORIGIN"))?,
                    public_origin: public_origin.clone(),
                    session_key,
                })
            }
        };
        Ok(Self {
            database_url,
            environment,
            bind_addr,
            public_origin,
            auth,
        })
    }
}

fn value(name: &'static str) -> Result<Option<String>, ConfigError> {
    match env::var(name) {
        Ok(value) => Ok(Some(value)),
        Err(env::VarError::NotPresent) => Ok(None),
        Err(env::VarError::NotUnicode(_)) => Err(ConfigError(name)),
    }
}
