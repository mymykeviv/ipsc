import os
import sys
import time
import psycopg2
from alembic.config import main as alembic_main

DB_NAME = os.environ.get("POSTGRES_DB", "profitpath")
DB_USER = os.environ.get("POSTGRES_USER", "postgres")
DB_PASS = os.environ.get("POSTGRES_PASSWORD", "postgres")
DB_HOST = os.environ.get("POSTGRES_HOST", "localhost")
DB_PORT = os.environ.get("POSTGRES_PORT", "5432")
ALEMBIC_CFG = os.path.join(os.path.dirname(__file__), "..", "backend", "alembic.ini")


def ensure_db():
    try:
        psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT).close()
        print(f"Database '{DB_NAME}' already exists.")
    except psycopg2.OperationalError:
        print(f"Database '{DB_NAME}' does not exist. Creating...")
        conn = psycopg2.connect(dbname="postgres", user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(f"CREATE DATABASE {DB_NAME};")
        cur.close()
        conn.close()
        print(f"Database '{DB_NAME}' created.")
        # Wait a moment for DB to be ready
        time.sleep(2)

def run_migrations():
    print("Running Alembic migrations...")
    alembic_main(["-c", ALEMBIC_CFG, "upgrade", "head"])
    print("Migrations complete.")

if __name__ == "__main__":
    ensure_db()
    run_migrations()
