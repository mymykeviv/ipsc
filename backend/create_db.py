#!/usr/bin/env python3
"""
Simple script to create the database and tables directly
"""
import os
import sys
from sqlalchemy import create_engine, text
from app.db import engine
from app.models import Base

def create_database():
    """Create all tables in the database"""
    print("Creating database tables...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print("Database tables created successfully!")
    
    # Verify tables were created
    with engine.connect() as conn:
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [row[0] for row in result]
        print(f"Created tables: {tables}")

if __name__ == "__main__":
    create_database()
