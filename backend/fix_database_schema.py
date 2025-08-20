#!/usr/bin/env python3
"""
Database Schema Fix Script
Fixes missing columns and schema mismatches in the ProfitPath application
Supports both SQLite and PostgreSQL databases
"""

import sqlite3
import os
from datetime import datetime
from urllib.parse import urlparse

# Try to import psycopg2, but don't fail if it's not available
try:
    import psycopg2
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    print("⚠️  psycopg2 not available - PostgreSQL support disabled")

def detect_database_type():
    """Detect database type and connection details"""
    # Check for environment variables first
    database_url = os.getenv('DATABASE_URL')
    
    if database_url:
        parsed = urlparse(database_url)
        if parsed.scheme == 'postgresql':
            return 'postgresql', database_url
        elif parsed.scheme == 'sqlite':
            return 'sqlite', parsed.path
    
    # Check for local database files
    if os.path.exists("cashflow.db"):
        return 'sqlite', "cashflow.db"
    elif os.path.exists("app.db"):
        return 'sqlite', "app.db"
    
    # Default to PostgreSQL if no database found
    return 'postgresql', "postgresql://postgres:postgres@localhost:5432/profitpath"

def connect_db():
    """Connect to the database based on type"""
    db_type, db_path = detect_database_type()
    
    if db_type == 'postgresql':
        if not PSYCOPG2_AVAILABLE:
            print("❌ PostgreSQL support not available - install psycopg2-binary")
            return None, None
        try:
            conn = psycopg2.connect(db_path)
            conn.autocommit = False
            print(f"✅ Connected to PostgreSQL database")
            return conn, 'postgresql'
        except Exception as e:
            print(f"❌ Failed to connect to PostgreSQL: {e}")
            return None, None
    else:
        try:
            conn = sqlite3.connect(db_path)
            print(f"✅ Connected to SQLite database: {db_path}")
            return conn, 'sqlite'
        except Exception as e:
            print(f"❌ Failed to connect to SQLite: {e}")
            return None, None

def execute_sql(conn, sql, description, db_type):
    """Execute SQL with error handling for both database types"""
    try:
        cursor = conn.cursor()
        cursor.execute(sql)
        conn.commit()
        print(f"✅ {description}")
        return True
    except Exception as e:
        error_msg = str(e).lower()
        if db_type == 'sqlite' and "duplicate column name" in error_msg:
            print(f"⚠️  {description} - Column already exists")
            return True
        elif db_type == 'postgresql' and "already exists" in error_msg:
            print(f"⚠️  {description} - Column already exists")
            return True
        else:
            print(f"❌ {description} - Error: {e}")
            return False

def get_column_exists_sql(table_name, column_name, db_type):
    """Get SQL to check if column exists"""
    if db_type == 'sqlite':
        return f"PRAGMA table_info({table_name})"
    else:
        return f"""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '{table_name}' AND column_name = '{column_name}'
        """

def column_exists(conn, table_name, column_name, db_type):
    """Check if column exists in table"""
    try:
        cursor = conn.cursor()
        sql = get_column_exists_sql(table_name, column_name, db_type)
        cursor.execute(sql)
        
        if db_type == 'sqlite':
            columns = cursor.fetchall()
            return any(col[1] == column_name for col in columns)
        else:
            result = cursor.fetchone()
            return result is not None
    except Exception:
        return False

def fix_payments_table(conn, db_type):
    """Fix payments table schema"""
    print("\n🔧 Fixing payments table...")
    
    # Add missing columns to payments table
    columns_to_add = [
        ("payment_amount", "NUMERIC(12, 2) NOT NULL DEFAULT 0"),
        ("account_head", "VARCHAR(50) NOT NULL DEFAULT 'Cash'"),
        ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    ]
    
    for column_name, column_def in columns_to_add:
        if not column_exists(conn, 'payments', column_name, db_type):
            sql = f"ALTER TABLE payments ADD COLUMN {column_name} {column_def}"
            execute_sql(conn, sql, f"Added column {column_name} to payments table", db_type)
        else:
            print(f"⚠️  Column {column_name} already exists in payments table")
    
    # Update existing records to set payment_amount = amount
    if db_type == 'sqlite':
        sql = "UPDATE payments SET payment_amount = amount WHERE payment_amount IS NULL"
    else:
        sql = "UPDATE payments SET payment_amount = amount WHERE payment_amount IS NULL"
    execute_sql(conn, sql, "Updated existing payment records", db_type)

def fix_invoices_table(conn, db_type):
    """Fix invoices table schema"""
    print("\n🔧 Fixing invoices table...")
    
    # Add missing columns to invoices table
    columns_to_add = [
        ("terms", "VARCHAR(20) NOT NULL DEFAULT 'Due on Receipt'"),
        ("exchange_rate", "NUMERIC(10, 4) NOT NULL DEFAULT 1.0"),
        ("place_of_supply", "VARCHAR(100) NOT NULL DEFAULT 'Same as billing'"),
        ("place_of_supply_state_code", "VARCHAR(10) NOT NULL DEFAULT '00'"),
        ("reverse_charge", "BOOLEAN NOT NULL DEFAULT FALSE"),
        ("export_supply", "BOOLEAN NOT NULL DEFAULT FALSE"),
        ("bill_to_address", "VARCHAR(200) NOT NULL DEFAULT 'Same as billing'"),
        ("ship_to_address", "VARCHAR(200) NOT NULL DEFAULT 'Same as billing'"),
        ("taxable_value", "NUMERIC(12, 2) NOT NULL DEFAULT 0"),
        ("total_discount", "NUMERIC(12, 2) NOT NULL DEFAULT 0"),
        ("grand_total", "NUMERIC(12, 2) NOT NULL DEFAULT 0"),
        ("paid_amount", "NUMERIC(12, 2) NOT NULL DEFAULT 0"),
        ("balance_amount", "NUMERIC(12, 2) NOT NULL DEFAULT 0"),
        ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    ]
    
    for column_name, column_def in columns_to_add:
        if not column_exists(conn, 'invoices', column_name, db_type):
            sql = f"ALTER TABLE invoices ADD COLUMN {column_name} {column_def}"
            execute_sql(conn, sql, f"Added column {column_name} to invoices table", db_type)
        else:
            print(f"⚠️  Column {column_name} already exists in invoices table")
    
    # Update existing records to set proper values
    updates = [
        "UPDATE invoices SET taxable_value = subtotal WHERE taxable_value IS NULL",
        "UPDATE invoices SET grand_total = total WHERE grand_total IS NULL",
        "UPDATE invoices SET balance_amount = total WHERE balance_amount IS NULL"
    ]
    
    for sql in updates:
        execute_sql(conn, sql, "Updated existing invoice records", db_type)

def fix_purchases_table(conn, db_type):
    """Fix purchases table schema"""
    print("\n🔧 Fixing purchases table...")
    
    # Check if purchases table exists
    cursor = conn.cursor()
    if db_type == 'sqlite':
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='purchases'")
    else:
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_name = 'purchases'")
    
    if not cursor.fetchone():
        print("⚠️  Purchases table does not exist, skipping...")
        return
    
    # Add missing columns to purchases table
    columns_to_add = [
        ("terms", "VARCHAR(20) NOT NULL DEFAULT 'Due on Receipt'"),
        ("place_of_supply", "VARCHAR(100) NOT NULL DEFAULT 'Same as billing'"),
        ("place_of_supply_state_code", "VARCHAR(10) NOT NULL DEFAULT '00'"),
        ("reverse_charge", "BOOLEAN NOT NULL DEFAULT FALSE"),
        ("export_supply", "BOOLEAN NOT NULL DEFAULT FALSE"),
        ("bill_from_address", "VARCHAR(200) NOT NULL DEFAULT 'Same as billing'"),
        ("ship_from_address", "VARCHAR(200) NOT NULL DEFAULT 'Same as billing'"),
        ("taxable_value", "NUMERIC(12, 2) NOT NULL DEFAULT 0"),
        ("total_discount", "NUMERIC(12, 2) NOT NULL DEFAULT 0"),
        ("grand_total", "NUMERIC(12, 2) NOT NULL DEFAULT 0"),
        ("paid_amount", "NUMERIC(12, 2) NOT NULL DEFAULT 0"),
        ("balance_amount", "NUMERIC(12, 2) NOT NULL DEFAULT 0"),
        ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    ]
    
    for column_name, column_def in columns_to_add:
        if not column_exists(conn, 'purchases', column_name, db_type):
            sql = f"ALTER TABLE purchases ADD COLUMN {column_name} {column_def}"
            execute_sql(conn, sql, f"Added column {column_name} to purchases table", db_type)
        else:
            print(f"⚠️  Column {column_name} already exists in purchases table")

def fix_purchase_payments_table(conn, db_type):
    """Fix purchase_payments table schema"""
    print("\n🔧 Fixing purchase_payments table...")
    
    # Check if purchase_payments table exists
    cursor = conn.cursor()
    if db_type == 'sqlite':
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='purchase_payments'")
    else:
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_name = 'purchase_payments'")
    
    if not cursor.fetchone():
        print("⚠️  Purchase_payments table does not exist, skipping...")
        return
    
    # Add missing columns to purchase_payments table
    columns_to_add = [
        ("payment_amount", "NUMERIC(12, 2) NOT NULL DEFAULT 0"),
        ("account_head", "VARCHAR(50) NOT NULL DEFAULT 'Cash'"),
        ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    ]
    
    for column_name, column_def in columns_to_add:
        if not column_exists(conn, 'purchase_payments', column_name, db_type):
            sql = f"ALTER TABLE purchase_payments ADD COLUMN {column_name} {column_def}"
            execute_sql(conn, sql, f"Added column {column_name} to purchase_payments table", db_type)
        else:
            print(f"⚠️  Column {column_name} already exists in purchase_payments table")

def create_backup():
    """Create a backup of the database"""
    import shutil
    from datetime import datetime
    
    db_type, db_path = detect_database_type()
    
    if db_type == 'postgresql':
        print("⚠️  PostgreSQL backup not implemented - please backup manually")
        return True
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"cashflow_backup_{timestamp}.db"
    
    try:
        shutil.copy2(db_path, backup_name)
        print(f"✅ Database backup created: {backup_name}")
        return True
    except Exception as e:
        print(f"❌ Failed to create backup: {e}")
        return False

def main():
    """Main function to fix database schema"""
    print("🔧 ProfitPath Database Schema Fix")
    print("=" * 50)
    
    # Create backup first
    if not create_backup():
        print("❌ Cannot proceed without backup!")
        return
    
    # Connect to database
    conn, db_type = connect_db()
    if not conn:
        return
    
    try:
        # Fix all tables
        fix_payments_table(conn, db_type)
        fix_invoices_table(conn, db_type)
        fix_purchases_table(conn, db_type)
        fix_purchase_payments_table(conn, db_type)
        
        print("\n✅ Database schema fix completed!")
        print(f"\n📋 Summary of changes for {db_type.upper()} database:")
        print("- Added missing columns to payments table")
        print("- Added missing columns to invoices table")
        print("- Added missing columns to purchases table")
        print("- Added missing columns to purchase_payments table")
        print("- Updated existing records with proper default values")
        
    except Exception as e:
        print(f"❌ Error during schema fix: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
