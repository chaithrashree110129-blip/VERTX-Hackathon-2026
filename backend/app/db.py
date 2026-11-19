import json
import sqlite3
import uuid
from datetime import datetime, timezone

from app.config import data_dir


def utcnow() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(data_dir() / "truthlens.sqlite")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS investigators (
              id TEXT PRIMARY KEY,
              name TEXT UNIQUE NOT NULL,
              passphrase_hash TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
              token TEXT PRIMARY KEY,
              investigator_id TEXT NOT NULL REFERENCES investigators(id),
              created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS investigations (
              id TEXT PRIMARY KEY,
              investigator_id TEXT NOT NULL REFERENCES investigators(id),
              title TEXT NOT NULL,
              modules_json TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS evidence (
              id TEXT PRIMARY KEY,
              investigation_id TEXT NOT NULL REFERENCES investigations(id),
              kind TEXT NOT NULL,
              filename TEXT NOT NULL,
              stored_name TEXT NOT NULL,
              sha256 TEXT NOT NULL,
              size_bytes INTEGER NOT NULL,
              mime TEXT,
              created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS analyses (
              evidence_id TEXT PRIMARY KEY REFERENCES evidence(id),
              payload_json TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS correlations (
              investigation_id TEXT PRIMARY KEY REFERENCES investigations(id),
              payload_json TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );
            """
        )


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def dumps(value) -> str:
    return json.dumps(value, ensure_ascii=False)


def loads(value: str | None):
    if not value:
        return None
    return json.loads(value)
