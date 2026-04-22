"""SQLite persistence layer.

All tables live in a single SQLite file (configurable via PIPELINE_DB_PATH).
Schema is idempotent; `init_db()` is safe to call on every run.

Design notes:
    - We store raw audit-trail copies of each upstream response in `raw_*`
      tables so that we can re-derive trigger events without re-hitting APIs.
    - `trigger_events` is the normalized canonical list of $4M+ transactions.
    - `prospects` is the primary product — one row per resolved buyer.
    - `buyer_resolutions` is append-only: one row per tier attempt per trigger
      event, with the evidence JSON so we can audit why a tier won.
"""
from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterable, Iterator

from .config import CONFIG

SCHEMA = """
CREATE TABLE IF NOT EXISTS trigger_events (
    event_id           TEXT PRIMARY KEY,
    source             TEXT NOT NULL,               -- acris | rptt_only | urbandigs
    dedup_key          TEXT NOT NULL,
    bbl                TEXT,
    address            TEXT,
    apartment          TEXT,
    borough            INTEGER,
    sale_price         INTEGER,
    sale_date          TEXT,
    contract_date      TEXT,
    asset_type         TEXT,                         -- condo | coop | townhouse | commercial | unknown
    document_id        TEXT,
    raw_buyer_names    TEXT,                         -- JSON list
    raw_seller_names   TEXT,                         -- JSON list
    listing_agent      TEXT,
    selling_agent      TEXT,
    first_seen         TEXT NOT NULL,
    ingested_at        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_trigger_events_dedup ON trigger_events(dedup_key);
CREATE INDEX IF NOT EXISTS ix_trigger_events_source ON trigger_events(source);
CREATE INDEX IF NOT EXISTS ix_trigger_events_bbl ON trigger_events(bbl);
CREATE INDEX IF NOT EXISTS ix_trigger_events_sale_date ON trigger_events(sale_date);

CREATE TABLE IF NOT EXISTS raw_acris (
    document_id        TEXT PRIMARY KEY,
    payload            TEXT NOT NULL,
    fetched_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS raw_rptt (
    row_hash           TEXT PRIMARY KEY,
    payload            TEXT NOT NULL,
    fetched_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS raw_urbandigs (
    contract_id        TEXT PRIMARY KEY,
    payload            TEXT NOT NULL,
    fetched_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prospects (
    prospect_id             TEXT PRIMARY KEY,
    legal_name              TEXT,
    resolved_principal      TEXT,
    confidence              TEXT,
    resolution_path         TEXT,
    buyer_type              TEXT,
    primary_firm            TEXT,
    title                   TEXT,
    estimated_net_worth_band TEXT,
    known_affiliations      TEXT,                    -- JSON
    geography_signal        TEXT,
    other_nyc_holdings      TEXT,                    -- JSON list of addresses
    holdings_count          INTEGER DEFAULT 0,
    work_email              TEXT,
    work_phone              TEXT,
    linkedin_url            TEXT,
    assistant_contact       TEXT,
    attorney_firm           TEXT,
    managing_agent          TEXT,
    broker_to_contact       TEXT,
    recommended_channel     TEXT,
    outreach_angle          TEXT,
    sensitivity_flags       TEXT,                    -- JSON list
    last_trigger_event_id   TEXT,
    first_seen_date         TEXT,
    last_contacted_date     TEXT,
    outreach_status         TEXT DEFAULT 'open',     -- open | contacted | responded | closed | do-not-contact
    FOREIGN KEY (last_trigger_event_id) REFERENCES trigger_events(event_id)
);
CREATE INDEX IF NOT EXISTS ix_prospects_legal_name ON prospects(legal_name);
CREATE INDEX IF NOT EXISTS ix_prospects_outreach_status ON prospects(outreach_status);
CREATE INDEX IF NOT EXISTS ix_prospects_confidence ON prospects(confidence);

CREATE TABLE IF NOT EXISTS buyer_resolutions (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id           TEXT NOT NULL,
    tier               INTEGER NOT NULL,
    tier_name          TEXT NOT NULL,
    source             TEXT,
    resolved_name      TEXT,
    confidence         TEXT,                          -- high | medium | low | null
    evidence           TEXT,                          -- JSON
    ran_at             TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES trigger_events(event_id)
);
CREATE INDEX IF NOT EXISTS ix_buyer_resolutions_event ON buyer_resolutions(event_id);

CREATE TABLE IF NOT EXISTS contact_enrichment_log (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    prospect_id        TEXT,
    provider           TEXT NOT NULL,
    input_name         TEXT,
    input_firm         TEXT,
    result             TEXT,                          -- JSON
    credits_consumed   REAL DEFAULT 0,
    ran_at             TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS llc_registry (
    llc_name           TEXT PRIMARY KEY,
    service_address    TEXT,
    registered_agent   TEXT,
    filing_date        TEXT,
    matched_law_firm   TEXT,
    dos_id             TEXT,
    raw                TEXT,                          -- JSON
    fetched_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS press_index (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    publication        TEXT,
    url                TEXT UNIQUE,
    title              TEXT,
    published_at       TEXT,
    addresses          TEXT,                          -- JSON list
    price_mentions     TEXT,                          -- JSON list
    named_buyers       TEXT,                          -- JSON list
    excerpt            TEXT,
    ingested_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS managing_agents (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    name               TEXT UNIQUE,
    aka                TEXT,                          -- JSON list
    phone              TEXT,
    email              TEXT,
    website            TEXT,
    buildings          TEXT,                          -- JSON list of addresses
    source             TEXT,                          -- yaml | scraped
    updated_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outreach_status (
    prospect_id        TEXT PRIMARY KEY,
    status             TEXT NOT NULL,
    last_contacted_date TEXT,
    notes              TEXT,
    updated_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS run_log (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at         TEXT NOT NULL,
    finished_at        TEXT,
    mode               TEXT,                          -- weekly | backfill | one-off
    dry_run            INTEGER DEFAULT 0,
    lookback_days      INTEGER,
    trigger_events_ingested INTEGER DEFAULT 0,
    prospects_resolved INTEGER DEFAULT 0,
    api_calls          TEXT,                          -- JSON {provider: count}
    credits_consumed   TEXT,                          -- JSON {provider: float}
    errors             TEXT,                          -- JSON list
    notes              TEXT
);
"""


def db_path() -> Path:
    """Resolve the SQLite path. Absolute path passes through; relative paths
    are anchored at the project root so `cd`-ing doesn't shift the DB."""
    p = Path(CONFIG.db_path)
    if not p.is_absolute():
        from .config import project_root
        p = project_root() / p
    return p


def connect() -> sqlite3.Connection:
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn


@contextmanager
def tx() -> Iterator[sqlite3.Connection]:
    conn = connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    with tx() as conn:
        conn.executescript(SCHEMA)


def as_json(v: Any) -> str:
    return json.dumps(v, default=str, ensure_ascii=False)


def from_json(v: str | None) -> Any:
    if not v:
        return None
    try:
        return json.loads(v)
    except json.JSONDecodeError:
        return None


def upsert(conn: sqlite3.Connection, table: str, row: dict, pk: str) -> None:
    cols = list(row.keys())
    placeholders = ",".join("?" for _ in cols)
    col_list = ",".join(cols)
    updates = ",".join(f"{c}=excluded.{c}" for c in cols if c != pk)
    sql = (
        f"INSERT INTO {table} ({col_list}) VALUES ({placeholders}) "
        f"ON CONFLICT({pk}) DO UPDATE SET {updates}"
    )
    conn.execute(sql, [row[c] for c in cols])


def insert_many(conn: sqlite3.Connection, table: str, rows: Iterable[dict]) -> int:
    rows = list(rows)
    if not rows:
        return 0
    cols = list(rows[0].keys())
    placeholders = ",".join("?" for _ in cols)
    col_list = ",".join(cols)
    sql = f"INSERT OR IGNORE INTO {table} ({col_list}) VALUES ({placeholders})"
    conn.executemany(sql, [[r[c] for c in cols] for r in rows])
    return conn.total_changes
