#!/usr/bin/env python3
"""
Database Schema Fix Script
Fixes missing columns in company_settings table
"""

import os
import sys
import subprocess
from pathlib import Path

def run_migration():
    """Run the database migration to fix schema issues"""
    print("🔧 Running database migration to fix schema issues...")
    
    try:
        # Change to backend directory
        backend_dir = Path(__file__).parent.parent / "backend"
        os.chdir(backend_dir)
        
        # Run alembic migration
        cmd = ["alembic", "upgrade", "head"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Database migration completed successfully")
            print(result.stdout)
        else:
            print("❌ Database migration failed")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Error running migration: {e}")
        return False
    
    return True

def verify_schema():
    """Verify that the schema fix was applied correctly"""
    print("🔍 Verifying database schema...")
    
    try:
        # Import and test the model
        sys.path.append(str(Path(__file__).parent.parent / "backend"))
        from app.models import CompanySettings
        from app.db import get_db
        
        db = next(get_db())
        # Try to query the table to ensure it exists with the new columns
        result = db.query(CompanySettings).first()
        print("✅ Schema verification successful")
        return True
        
    except Exception as e:
        print(f"❌ Schema verification failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Database Schema Fix")
    print("=" * 50)
    
    success = run_migration()
    if success:
        success = verify_schema()
    
    if success:
        print("✅ Database schema fix completed successfully")
        sys.exit(0)
    else:
        print("❌ Database schema fix failed")
        sys.exit(1)
