#!/usr/bin/env python3
"""
Simple script to create the database and tables directly
"""
import os
import sys
from sqlalchemy import create_engine, text
from app.db import legacy_engine
from app.models import Base

def create_database():
    """Create all tables in the database"""
    print("Creating database tables...")
    
    # Create all tables
    Base.metadata.create_all(bind=legacy_engine)
    
    print("Database tables created successfully!")
    
    # Verify tables were created
    with legacy_engine.connect() as conn:
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = [row[0] for row in result]
        print(f"Created tables: {tables}")

if __name__ == "__main__":
    create_database()
