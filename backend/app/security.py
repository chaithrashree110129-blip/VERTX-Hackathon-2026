import hashlib
import os
import secrets
import sqlite3


def hash_passphrase(passphrase: str, salt: bytes | None = None) -> str:
    salt = salt or os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", passphrase.encode("utf-8"), salt, 200_000)
    return f"{salt.hex()}:{digest.hex()}"


def verify_passphrase(passphrase: str, stored: str) -> bool:
    salt_hex, digest_hex = stored.split(":", 1)
    digest = hashlib.pbkdf2_hmac("sha256", passphrase.encode("utf-8"), bytes.fromhex(salt_hex), 200_000)
    return secrets.compare_digest(digest.hex(), digest_hex)


def new_token() -> str:
    return secrets.token_urlsafe(32)


def sha256_file(path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def investigator_from_token(conn: sqlite3.Connection, token: str | None):
    if not token:
        return None
    row = conn.execute(
        """
        SELECT i.id, i.name, i.created_at
        FROM sessions s
        JOIN investigators i ON i.id = s.investigator_id
        WHERE s.token = ?
        """,
        (token,),
    ).fetchone()
    return dict(row) if row else None
