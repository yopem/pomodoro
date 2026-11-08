use std::{
    error::Error,
    fmt,
    io::{self, Write},
};

use aes_gcm::{
    Aes256Gcm, KeyInit, Nonce,
    aead::{Aead, Payload},
};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use rand_core::{OsRng, RngCore};
use serde::{Serialize, de::DeserializeOwned};
use sha2::{Digest, Sha256};

const MAX_PLAINTEXT: usize = 32 * 1024;
const MAX_PURPOSE: usize = 4096;
const MAX_SEALED: usize = 44_000;
const VERSION: u8 = 1;

#[derive(Debug)]
pub struct CryptoError;

impl fmt::Display for CryptoError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("Cryptographic operation failed")
    }
}

impl Error for CryptoError {}

pub struct Vault {
    cipher: Aes256Gcm,
}

impl Vault {
    pub fn new(key: &[u8; 32]) -> Result<Self, CryptoError> {
        let cipher = Aes256Gcm::new_from_slice(key).map_err(|_| CryptoError)?;
        Ok(Self { cipher })
    }

    pub fn seal<T: Serialize>(&self, value: &T, purpose: &str) -> Result<String, CryptoError> {
        if purpose.is_empty() || purpose.len() > MAX_PURPOSE {
            return Err(CryptoError);
        }
        let mut plaintext = LimitedBuffer(Vec::new());
        serde_json::to_writer(&mut plaintext, value).map_err(|_| CryptoError)?;
        let mut nonce = [0; 12];
        OsRng.try_fill_bytes(&mut nonce).map_err(|_| CryptoError)?;
        let ciphertext = self
            .cipher
            .encrypt(
                Nonce::from_slice(&nonce),
                Payload {
                    msg: &plaintext.0,
                    aad: purpose.as_bytes(),
                },
            )
            .map_err(|_| CryptoError)?;
        let mut framed = Vec::with_capacity(1 + nonce.len() + ciphertext.len());
        framed.push(VERSION);
        framed.extend_from_slice(&nonce);
        framed.extend_from_slice(&ciphertext);
        Ok(URL_SAFE_NO_PAD.encode(framed))
    }

    pub fn open<T: DeserializeOwned>(&self, sealed: &str, purpose: &str) -> Result<T, CryptoError> {
        if sealed.len() > MAX_SEALED || purpose.is_empty() || purpose.len() > MAX_PURPOSE {
            return Err(CryptoError);
        }
        let framed = URL_SAFE_NO_PAD.decode(sealed).map_err(|_| CryptoError)?;
        if framed.len() < 29 || framed.len() > 1 + 12 + MAX_PLAINTEXT + 16 || framed[0] != VERSION {
            return Err(CryptoError);
        }
        let plaintext = self
            .cipher
            .decrypt(
                Nonce::from_slice(&framed[1..13]),
                Payload {
                    msg: &framed[13..],
                    aad: purpose.as_bytes(),
                },
            )
            .map_err(|_| CryptoError)?;
        serde_json::from_slice(&plaintext).map_err(|_| CryptoError)
    }
}

struct LimitedBuffer(Vec<u8>);

impl Write for LimitedBuffer {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        if bytes.len() > MAX_PLAINTEXT - self.0.len() {
            return Err(io::Error::other("Serialization limit exceeded"));
        }
        self.0.extend_from_slice(bytes);
        Ok(bytes.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

pub fn random_token() -> Result<String, CryptoError> {
    let mut bytes = [0; 32];
    OsRng.try_fill_bytes(&mut bytes).map_err(|_| CryptoError)?;
    Ok(URL_SAFE_NO_PAD.encode(bytes))
}

pub fn digest_token(value: &str) -> String {
    URL_SAFE_NO_PAD.encode(Sha256::digest(value.as_bytes()))
}
