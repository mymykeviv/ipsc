#!/usr/bin/env python3
"""
ProfitPath Database Migration Script
Migrates from SQLite to PostgreSQL
"""

import os
import sys
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database configurations
SQLITE_DB_PATH = "cashflow.db"  # Legacy reference - no longer used
POSTGRES_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'profitpath',
    'user': 'postgres',
    'password': 'postgres'
}

def test_postgres_connection():
    """Test PostgreSQL connection"""
    try:
        conn = psycopg2.connect(**POSTGRES_CONFIG)
        conn.close()
        logger.info("✅ PostgreSQL connection successful")
        return True
    except Exception as e:
        logger.error(f"❌ PostgreSQL connection failed: {e}")
        return False

def get_sqlite_tables():
    """Get all tables from SQLite database"""
    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        conn.close()
        logger.info(f"📋 Found {len(tables)} tables in SQLite: {tables}")
        return tables
    except Exception as e:
        logger.error(f"❌ Error reading SQLite tables: {e}")
        return []

def get_table_schema(table_name):
    """Get table schema from SQLite"""
    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        conn.close()
        return columns
    except Exception as e:
        logger.error(f"❌ Error reading schema for {table_name}: {e}")
        return []

def convert_sqlite_type_to_postgres(sqlite_type):
    """Convert SQLite data types to PostgreSQL"""
    type_mapping = {
        'INTEGER': 'INTEGER',
        'REAL': 'DOUBLE PRECISION',
        'TEXT': 'TEXT',
        'BLOB': 'BYTEA',
        'NUMERIC': 'NUMERIC',
        'VARCHAR': 'VARCHAR',
        'DATE': 'DATE',
        'DATETIME': 'TIMESTAMP',
        'BOOLEAN': 'BOOLEAN'
    }
    
    for sqlite_pattern, postgres_type in type_mapping.items():
        if sqlite_pattern in sqlite_type.upper():
            return postgres_type
    
    return 'TEXT'  # Default fallback


def _sanitize_default_value(default_val: str, postgres_type: str) -> str:
    """Return a safe DEFAULT clause snippet for PostgreSQL.

    - Preserves known SQL functions like CURRENT_TIMESTAMP.
    - Normalizes booleans (0/1/true/false) to TRUE/FALSE.
    - Quotes string-like defaults (including JSON-looking []/{}) for TEXT/VARCHAR.
    - Strips quotes around numerics for numeric types.
    """
    if default_val is None:
        return ""

    raw = str(default_val).strip()
    if not raw or raw.upper() == "NULL":
        return ""

    # Remove surrounding parentheses SQLite may add, e.g. (0)
    if raw.startswith("(") and raw.endswith(")"):
        raw = raw[1:-1].strip()

    # Allow common SQL functions
    sql_funcs = {"CURRENT_TIMESTAMP", "NOW()", "CURRENT_DATE", "CURRENT_TIME"}
    if raw.upper() in sql_funcs:
        return f" DEFAULT {raw}"

    pt = postgres_type.upper()

    # Normalize booleans
    if pt == "BOOLEAN":
        if raw.strip("'\"").lower() in {"1", "true", "t", "yes"}:
            return " DEFAULT TRUE"
        if raw.strip("'\"").lower() in {"0", "false", "f", "no"}:
            return " DEFAULT FALSE"
        # Fallthrough: try quoting

    # Numeric types: remove quotes if it's a quoted number
    if any(t in pt for t in ["INT", "NUMERIC", "DECIMAL", "DOUBLE", "REAL"]):
        unquoted = raw.strip("'\"")
        # If still looks like a number, use unquoted
        try:
            float(unquoted)
            return f" DEFAULT {unquoted}"
        except ValueError:
            # Not a clean number; quote it
            pass

    # Textual types: ensure quoted defaults
    if any(t in pt for t in ["CHAR", "TEXT", "UUID", "JSON", "JSONB", "VARCHAR"]):
        # If already quoted, keep as is
        if (raw.startswith("'") and raw.endswith("'")) or (raw.startswith('"') and raw.endswith('"')):
            return f" DEFAULT {raw}"
        # Quote JSON-ish literals like [] or {}
        if raw in {"[]", "{}"}:
            return f" DEFAULT '{raw}'"
        # Otherwise, single-quote and escape single quotes
        escaped = raw.replace("'", "''")
        return f" DEFAULT '{escaped}'"

    # Fallback: return as-is
    return f" DEFAULT {raw}"

def create_postgres_table(table_name, columns):
    """Create table in PostgreSQL"""
    try:
        conn = psycopg2.connect(**POSTGRES_CONFIG)
        cursor = conn.cursor()
        
        # Build CREATE TABLE statement
        column_definitions = []
        for col in columns:
            cid, name, sqlite_type, not_null, default_val, pk = col
            postgres_type = convert_sqlite_type_to_postgres(sqlite_type)
            
            definition = f"{name} {postgres_type}"
            if not_null:
                definition += " NOT NULL"
            if pk:
                definition += " PRIMARY KEY"
            # Sanitize default values to avoid malformed SQL
            if default_val and str(default_val).upper() != "NULL":
                definition += _sanitize_default_value(default_val, postgres_type)
            
            column_definitions.append(definition)
        
        create_sql = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            {', '.join(column_definitions)}
        );
        """
        
        cursor.execute(create_sql)
        conn.commit()
        conn.close()
        logger.info(f"✅ Created table: {table_name}")
        return True
    except Exception as e:
        logger.error(f"❌ Error creating table {table_name}: {e}")
        return False

def migrate_table_data(table_name):
    """Migrate data from SQLite to PostgreSQL"""
    try:
        # Connect to both databases
        sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
        sqlite_cursor = sqlite_conn.cursor()
        
        postgres_conn = psycopg2.connect(**POSTGRES_CONFIG)
        postgres_cursor = postgres_conn.cursor()
        
        # Get data from SQLite
        sqlite_cursor.execute(f"SELECT * FROM {table_name}")
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            logger.info(f"📭 Table {table_name} is empty, skipping data migration")
            return True
        
        # Get column names
        sqlite_cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [col[1] for col in sqlite_cursor.fetchall()]
        
        # Prepare INSERT statement
        placeholders = ', '.join(['%s'] * len(columns))
        insert_sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
        
        # Insert data
        postgres_cursor.executemany(insert_sql, rows)
        postgres_conn.commit()
        
        sqlite_conn.close()
        postgres_conn.close()
        
        logger.info(f"✅ Migrated {len(rows)} rows from {table_name}")
        return True
    except Exception as e:
        logger.error(f"❌ Error migrating data from {table_name}: {e}")
        return False

def create_indexes():
    """Create common indexes for better performance"""
    try:
        conn = psycopg2.connect(**POSTGRES_CONFIG)
        cursor = conn.cursor()
        
        # Common indexes for better performance
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);",
            "CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);",
            "CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);",
            "CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);",
            "CREATE INDEX IF NOT EXISTS idx_stock_ledger_product_id ON stock_ledger(product_id);",
            "CREATE INDEX IF NOT EXISTS idx_stock_ledger_created_at ON stock_ledger(created_at);",
            "CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);",
            "CREATE INDEX IF NOT EXISTS idx_parties_name ON parties(name);"
        ]
        
        for index_sql in indexes:
            try:
                cursor.execute(index_sql)
                logger.info(f"✅ Created index: {index_sql.split('ON')[1].strip()}")
            except Exception as e:
                logger.warning(f"⚠️  Index creation failed: {e}")
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"❌ Error creating indexes: {e}")
        return False

def main():
    """Main migration function"""
    logger.info("🚀 Starting ProfitPath SQLite to PostgreSQL Migration")
    logger.info("=" * 60)
    
    # Check if SQLite database exists
    if not os.path.exists(SQLITE_DB_PATH):
        logger.error(f"❌ SQLite database not found: {SQLITE_DB_PATH}")
        return False
    
    # Test PostgreSQL connection
    if not test_postgres_connection():
        logger.error("❌ Cannot proceed without PostgreSQL connection")
        return False
    
    # Get tables from SQLite
    tables = get_sqlite_tables()
    if not tables:
        logger.error("❌ No tables found in SQLite database")
        return False
    
    # Migrate each table
    success_count = 0
    for table_name in tables:
        logger.info(f"🔄 Migrating table: {table_name}")
        
        # Get table schema
        columns = get_table_schema(table_name)
        if not columns:
            continue
        
        # Create table in PostgreSQL
        if create_postgres_table(table_name, columns):
            # Migrate data
            if migrate_table_data(table_name):
                success_count += 1
    
    # Create indexes
    logger.info("🔧 Creating indexes for better performance...")
    create_indexes()
    
    logger.info("=" * 60)
    logger.info(f"✅ Migration completed! {success_count}/{len(tables)} tables migrated successfully")
    logger.info("🎉 ProfitPath is now running on PostgreSQL!")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.info("⏹️  Migration interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"💥 Unexpected error: {e}")
        sys.exit(1)
