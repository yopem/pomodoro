use std::{
    error::Error,
    fmt,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use jsonwebtoken::{
    Algorithm, DecodingKey, Validation, decode, decode_header,
    jwk::{
        AlgorithmParameters, EllipticCurve, Jwk, JwkSet, KeyAlgorithm, KeyOperations, PublicKeyUse,
    },
};
use regex::Regex;
use reqwest::{Client, redirect::Policy};
use serde::{Deserialize, Deserializer};
use tokio::sync::Mutex;
use url::Url;

const ISSUER: &str = "https://auth.yopem.com";
const JWKS_URL: &str = "https://auth.yopem.com/.well-known/jwks.json";
const MAX_TOKEN: usize = 16 * 1024;
const MAX_JWKS: usize = 128 * 1024;
const CACHE_TTL: Duration = Duration::from_secs(300);
const REFRESH_INTERVAL: Duration = Duration::from_secs(30);

#[derive(Debug)]
pub enum VerificationError {
    Expired,
    Invalid,
    Unavailable,
}

impl fmt::Display for VerificationError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(match self {
            Self::Expired => "Access token expired",
            Self::Invalid => "Access token invalid",
            Self::Unavailable => "Token verification unavailable",
        })
    }
}

impl Error for VerificationError {}

pub struct VerifiedUser {
    pub id: String,
    pub name: Option<String>,
}

pub struct TokenVerifier {
    client: Client,
    client_id: String,
    email_pattern: Regex,
    cache: Mutex<KeyCache>,
}

#[derive(Default)]
struct KeyCache {
    keys: Option<JwkSet>,
    fetched_at: Option<Instant>,
    attempted_at: Option<Instant>,
}

#[derive(Deserialize)]
struct Claims {
    iss: String,
    aud: String,
    exp: u64,
    sub: String,
    mode: String,
    #[serde(rename = "type")]
    subject_type: String,
    properties: Properties,
    nbf: Option<u64>,
}

#[derive(Deserialize)]
struct Properties {
    id: String,
    email: String,
    #[serde(deserialize_with = "required_nullable_name")]
    name: Option<String>,
}

fn required_nullable_name<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<Option<String>, D::Error> {
    Option::<String>::deserialize(deserializer)
}

impl TokenVerifier {
    pub fn new(issuer: Url, client_id: String) -> Result<Self, VerificationError> {
        if issuer.as_str() != "https://auth.yopem.com/"
            || client_id.trim().is_empty()
            || client_id.len() > 512
        {
            return Err(VerificationError::Invalid);
        }
        let client = Client::builder()
            .https_only(true)
            .redirect(Policy::none())
            .connect_timeout(Duration::from_secs(3))
            .timeout(Duration::from_secs(8))
            .pool_max_idle_per_host(1)
            .no_proxy()
            .build()
            .map_err(|_| VerificationError::Unavailable)?;
        let email_pattern = Regex::new(r"\A(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+\-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}\z")
            .map_err(|_| VerificationError::Unavailable)?;
        Ok(Self {
            client,
            client_id,
            email_pattern,
            cache: Mutex::new(KeyCache::default()),
        })
    }

    pub async fn verify(&self, access_token: &str) -> Result<VerifiedUser, VerificationError> {
        if access_token.is_empty() || access_token.len() > MAX_TOKEN {
            return Err(VerificationError::Invalid);
        }
        let header = decode_header(access_token).map_err(|_| VerificationError::Invalid)?;
        if header.alg != Algorithm::ES256 {
            return Err(VerificationError::Invalid);
        }
        let kid = header
            .kid
            .filter(|kid| !kid.is_empty() && kid.len() <= 512)
            .ok_or(VerificationError::Invalid)?;
        let key = self.key(&kid).await?;
        let mut validation = Validation::new(Algorithm::ES256);
        validation.validate_exp = false;
        validation.set_required_spec_claims(&["iss", "aud", "exp", "sub"]);
        validation.set_issuer(&[ISSUER]);
        validation.set_audience(&[&self.client_id]);
        let claims = decode::<Claims>(access_token, &key, &validation)
            .map_err(|_| VerificationError::Invalid)?
            .claims;
        if claims.iss != ISSUER
            || claims.aud != self.client_id
            || claims.sub.trim().is_empty()
            || claims.mode != "access"
            || claims.subject_type != "user"
            || claims.properties.id.trim().is_empty()
            || claims.properties.id.contains('\0')
            || claims.properties.id.encode_utf16().count() > 512
            || !self.email_pattern.is_match(&claims.properties.email)
            || claims
                .properties
                .name
                .as_ref()
                .is_some_and(|name| name.contains('\0') || name.encode_utf16().count() > 500)
        {
            return Err(VerificationError::Invalid);
        }
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| VerificationError::Unavailable)?
            .as_secs();
        if claims.nbf.is_some_and(|nbf| nbf > now) {
            return Err(VerificationError::Invalid);
        }
        if claims.exp <= now {
            return Err(VerificationError::Expired);
        }
        Ok(VerifiedUser {
            id: claims.properties.id,
            name: claims.properties.name,
        })
    }

    async fn key(&self, kid: &str) -> Result<DecodingKey, VerificationError> {
        let mut cache = self.cache.lock().await;
        let fresh = cache
            .fetched_at
            .is_some_and(|time| time.elapsed() < CACHE_TTL);
        if fresh && let Some(key) = cache.keys.as_ref().and_then(|keys| find_key(keys, kid)) {
            return DecodingKey::from_jwk(key).map_err(|_| VerificationError::Unavailable);
        }
        if cache
            .attempted_at
            .is_some_and(|time| time.elapsed() < REFRESH_INTERVAL)
        {
            return Err(VerificationError::Unavailable);
        }
        cache.attempted_at = Some(Instant::now());
        let keys = self.fetch_keys().await?;
        cache.keys = Some(keys);
        cache.fetched_at = Some(Instant::now());
        let key = cache
            .keys
            .as_ref()
            .and_then(|keys| find_key(keys, kid))
            .ok_or(VerificationError::Invalid)?;
        DecodingKey::from_jwk(key).map_err(|_| VerificationError::Unavailable)
    }

    async fn fetch_keys(&self) -> Result<JwkSet, VerificationError> {
        let mut response = self
            .client
            .get(JWKS_URL)
            .send()
            .await
            .map_err(|_| VerificationError::Unavailable)?;
        if !response.status().is_success() {
            return Err(VerificationError::Unavailable);
        }
        let mut body = Vec::new();
        while let Some(chunk) = response
            .chunk()
            .await
            .map_err(|_| VerificationError::Unavailable)?
        {
            if chunk.len() > MAX_JWKS - body.len() {
                return Err(VerificationError::Unavailable);
            }
            body.extend_from_slice(&chunk);
        }
        serde_json::from_slice(&body).map_err(|_| VerificationError::Unavailable)
    }
}

fn find_key<'a>(keys: &'a JwkSet, kid: &str) -> Option<&'a Jwk> {
    let mut matching = keys
        .keys
        .iter()
        .filter(|key| key.common.key_id.as_deref() == Some(kid));
    let key = matching.next()?;
    if matching.next().is_some()
        || !matches!(&key.algorithm, AlgorithmParameters::EllipticCurve(parameters) if parameters.curve == EllipticCurve::P256)
        || key
            .common
            .key_algorithm
            .is_some_and(|algorithm| algorithm != KeyAlgorithm::ES256)
        || key
            .common
            .public_key_use
            .as_ref()
            .is_some_and(|usage| *usage != PublicKeyUse::Signature)
        || key
            .common
            .key_operations
            .as_ref()
            .is_some_and(|operations| !operations.contains(&KeyOperations::Verify))
    {
        return None;
    }
    Some(key)
}
