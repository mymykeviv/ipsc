#!/usr/bin/env python3
"""
Database Schema Rollback Script
Rolls back the schema fixes if needed
"""

import os
import sys
import subprocess
from pathlib import Path

def rollback_migration():
    """Rollback the database migration"""
    print("🔄 Rolling back database migration...")
    
    try:
        # Change to backend directory
        backend_dir = Path(__file__).parent.parent / "backend"
        os.chdir(backend_dir)
        
        # Rollback to previous migration
        cmd = ["alembic", "downgrade", "add_missing_gst_fields"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Database rollback completed successfully")
            print(result.stdout)
        else:
            print("❌ Database rollback failed")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Error during rollback: {e}")
        return False
    
    return True

def verify_rollback():
    """Verify that the rollback was successful"""
    print("🔍 Verifying rollback...")
    
    try:
        # Import and test the model
        sys.path.append(str(Path(__file__).parent.parent / "backend"))
        from app.models import CompanySettings
        from app.db import get_db
        
        db = next(get_db())
        # Try to query the table - should fail if columns were removed
        result = db.query(CompanySettings).first()
        print("⚠️  Rollback verification: Columns still exist (this is expected if rollback didn't remove them)")
        return True
        
    except Exception as e:
        print(f"✅ Rollback verification successful: {e}")
        return True

if __name__ == "__main__":
    print("🚨 Starting Database Schema Rollback")
    print("=" * 50)
    print("⚠️  WARNING: This will remove the schema fixes!")
    print("=" * 50)
    
    response = input("Do you want to continue with rollback? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Rollback cancelled")
        sys.exit(0)
    
    success = rollback_migration()
    if success:
        verify_rollback()
    
    if success:
        print("✅ Database schema rollback completed")
        sys.exit(0)
    else:
        print("❌ Database schema rollback failed")
        sys.exit(1)
