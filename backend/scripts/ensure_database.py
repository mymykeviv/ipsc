#!/usr/bin/env python3
"""
Ensure the target PostgreSQL database (from DATABASE_URL) exists.
This does NOT create any tables; Alembic will handle schema creation.

Safe to run multiple times.
"""
from __future__ import annotations

import os
import sys
from contextlib import closing
from typing import Optional

import time
from sqlalchemy import text
from urllib.parse import urlparse
import psycopg


def get_database_url() -> str:
    raw = os.getenv("DATABASE_URL")
    if not raw:
        print("[ensure_database] DATABASE_URL not set; nothing to ensure.", file=sys.stderr)
        sys.exit(0)
    return raw


def parse_db_conninfo(raw_url: str) -> dict:
    """Parse DATABASE_URL and return components.
    Falls back to POSTGRES_* envs when parts are missing.
    """
    u = urlparse(raw_url)
    # scheme like 'postgresql+psycopg' or 'postgresql'
    username = u.username or os.getenv("POSTGRES_USER")
    password = u.password or os.getenv("POSTGRES_PASSWORD")
    host = u.hostname or os.getenv("POSTGRES_HOST", "db")
    port = u.port or int(os.getenv("POSTGRES_PORT", "5432"))
    # path starts with '/dbname' or empty
    dbname = (u.path[1:] if u.path and len(u.path) > 1 else None) or os.getenv("POSTGRES_DB")
    return {
        "user": username,
        "password": password,
        "host": host,
        "port": port,
        "dbname": dbname,
    }


def database_exists(conninfo: dict, target_db: str) -> bool:
    # Connect to maintenance DB 'postgres'
    info = conninfo.copy()
    info["dbname"] = "postgres"
    with psycopg.connect(**{k: v for k, v in info.items() if v is not None}) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (target_db,))
            return cur.fetchone() is not None


def create_database(conninfo: dict, target_db: str, owner: Optional[str]) -> None:
    info = conninfo.copy()
    info["dbname"] = "postgres"
    # autocommit required for CREATE DATABASE
    with psycopg.connect(**{k: v for k, v in info.items() if v is not None}, autocommit=True) as conn:
        with conn.cursor() as cur:
            if owner:
                cur.execute(f"CREATE DATABASE \"{target_db}\" OWNER \"{owner}\"")
            else:
                cur.execute(f"CREATE DATABASE \"{target_db}\"")
    print(f"[ensure_database] Created database '{target_db}'.")


def main() -> int:
    raw_url = get_database_url()
    conninfo = parse_db_conninfo(raw_url)
    target_db = conninfo.get("dbname")
    if not target_db:
        print("[ensure_database] No database name resolved from DATABASE_URL or POSTGRES_DB; skipping.", file=sys.stderr)
        return 0

    owner = conninfo.get("user")
    print(
        f"[ensure_database] Starting. Host='{conninfo.get('host')}' Port='{conninfo.get('port')}' target_db='{target_db}' owner='{owner}'."
    )

    # Retry a few times to tolerate brief races
    for attempt in range(1, 8):
        try:
            if database_exists(conninfo, target_db):
                print(f"[ensure_database] Database '{target_db}' already exists.")
                return 0
            create_database(conninfo, target_db, owner)
            return 0
        except Exception as e:
            print(
                f"[ensure_database] Attempt {attempt} failed: {e}. Retrying...",
                file=sys.stderr,
            )
            time.sleep(1)

    print(
        "[ensure_database] Failed to ensure database after retries.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
