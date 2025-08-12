#!/usr/bin/env python3
"""
Migration script to add item_type column to products table
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text, inspect
from app.config import settings

def run_migration():
    engine = create_engine(settings.database_url)
    inspector = inspect(engine)
    
    # Check if products table exists
    tables = inspector.get_table_names()
    if 'products' not in tables:
        print("Products table does not exist. Please run the application first to create the database.")
        return
    
    # Check if item_type column already exists
    columns = [col['name'] for col in inspector.get_columns('products')]
    if 'item_type' in columns:
        print("item_type column already exists in products table")
        return
    
    # Add item_type column
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE products ADD COLUMN item_type VARCHAR(20) NOT NULL DEFAULT 'tradable'"))
            conn.commit()
            print("Added item_type column to products table")
        except Exception as e:
            print(f"Error adding item_type column: {e}")
            return
    
    print("Product item_type migration completed successfully!")

if __name__ == "__main__":
    run_migration()
