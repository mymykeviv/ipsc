#!/usr/bin/env python3
"""
Migration Rollback Strategy and Data Backup Procedures

This script provides comprehensive backup and rollback capabilities for the
PostgreSQL to SQLite migration process.
"""

import os
import sys
import shutil
import sqlite3
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
import json
import logging

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'app'))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration_rollback.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MigrationRollbackManager:
    """Manages backup and rollback operations for database migration"""
    
    def __init__(self, backup_dir: str = "migration_backups"):
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(exist_ok=True)
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
    def create_backup(self, db_path: str) -> str:
        """Create a backup of the current database"""
        try:
            db_path = Path(db_path)
            if not db_path.exists():
                raise FileNotFoundError(f"Database file not found: {db_path}")
            
            backup_name = f"backup_{self.timestamp}_{db_path.name}"
            backup_path = self.backup_dir / backup_name
            
            logger.info(f"Creating backup: {backup_path}")
            shutil.copy2(db_path, backup_path)
            
            # Also backup WAL and SHM files if they exist
            for suffix in ['-wal', '-shm']:
                wal_file = Path(str(db_path) + suffix)
                if wal_file.exists():
                    backup_wal = Path(str(backup_path) + suffix)
                    shutil.copy2(wal_file, backup_wal)
                    logger.info(f"Backed up WAL file: {backup_wal}")
            
            # Create backup metadata
            metadata = {
                "timestamp": self.timestamp,
                "original_path": str(db_path),
                "backup_path": str(backup_path),
                "file_size": backup_path.stat().st_size,
                "created_at": datetime.now().isoformat()
            }
            
            metadata_path = backup_path.with_suffix('.json')
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Backup created successfully: {backup_path}")
            return str(backup_path)
            
        except Exception as e:
            logger.error(f"Failed to create backup: {e}")
            raise
    
    def verify_backup(self, backup_path: str) -> bool:
        """Verify the integrity of a backup file"""
        try:
            backup_path = Path(backup_path)
            if not backup_path.exists():
                logger.error(f"Backup file not found: {backup_path}")
                return False
            
            # Test SQLite database integrity
            conn = sqlite3.connect(backup_path)
            cursor = conn.cursor()
            cursor.execute("PRAGMA integrity_check")
            result = cursor.fetchone()
            conn.close()
            
            if result[0] == "ok":
                logger.info(f"Backup verification successful: {backup_path}")
                return True
            else:
                logger.error(f"Backup integrity check failed: {result[0]}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to verify backup: {e}")
            return False
    
    def restore_backup(self, backup_path: str, target_path: str) -> bool:
        """Restore a database from backup"""
        try:
            backup_path = Path(backup_path)
            target_path = Path(target_path)
            
            if not backup_path.exists():
                raise FileNotFoundError(f"Backup file not found: {backup_path}")
            
            # Verify backup before restoring
            if not self.verify_backup(backup_path):
                raise ValueError("Backup verification failed")
            
            logger.info(f"Restoring backup from {backup_path} to {target_path}")
            
            # Create target directory if it doesn't exist
            target_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Stop any running processes that might be using the database
            self._stop_database_connections(target_path)
            
            # Remove existing database files
            for suffix in ['', '-wal', '-shm']:
                existing_file = Path(str(target_path) + suffix)
                if existing_file.exists():
                    existing_file.unlink()
                    logger.info(f"Removed existing file: {existing_file}")
            
            # Copy backup to target location
            shutil.copy2(backup_path, target_path)
            
            # Restore WAL and SHM files if they exist
            for suffix in ['-wal', '-shm']:
                backup_wal = Path(str(backup_path) + suffix)
                if backup_wal.exists():
                    target_wal = Path(str(target_path) + suffix)
                    shutil.copy2(backup_wal, target_wal)
                    logger.info(f"Restored WAL file: {target_wal}")
            
            # Verify restored database
            if self.verify_backup(target_path):
                logger.info(f"Database restored successfully: {target_path}")
                return True
            else:
                logger.error("Restored database failed verification")
                return False
                
        except Exception as e:
            logger.error(f"Failed to restore backup: {e}")
            return False
    
    def _stop_database_connections(self, db_path: Path):
        """Attempt to stop any processes using the database"""
        try:
            # This is a placeholder - in a real scenario, you might need to
            # stop web servers, background processes, etc.
            logger.info(f"Checking for active connections to {db_path}")
            
            # For SQLite, we can try to connect and immediately close
            # to ensure no locks are held
            if db_path.exists():
                conn = sqlite3.connect(db_path, timeout=1.0)
                conn.close()
                
        except Exception as e:
            logger.warning(f"Could not verify database connections: {e}")
    
    def list_backups(self) -> list:
        """List all available backups"""
        backups = []
        for backup_file in self.backup_dir.glob("backup_*.db"):
            metadata_file = backup_file.with_suffix('.json')
            if metadata_file.exists():
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                backups.append({
                    "file": str(backup_file),
                    "metadata": metadata
                })
        
        # Sort by creation time (newest first)
        backups.sort(key=lambda x: x["metadata"]["created_at"], reverse=True)
        return backups
    
    def cleanup_old_backups(self, keep_count: int = 5):
        """Remove old backups, keeping only the most recent ones"""
        backups = self.list_backups()
        
        if len(backups) <= keep_count:
            logger.info(f"Only {len(backups)} backups found, no cleanup needed")
            return
        
        backups_to_remove = backups[keep_count:]
        
        for backup in backups_to_remove:
            try:
                backup_path = Path(backup["file"])
                metadata_path = backup_path.with_suffix('.json')
                
                backup_path.unlink()
                if metadata_path.exists():
                    metadata_path.unlink()
                
                # Remove WAL and SHM files if they exist
                for suffix in ['-wal', '-shm']:
                    wal_file = Path(str(backup_path) + suffix)
                    if wal_file.exists():
                        wal_file.unlink()
                
                logger.info(f"Removed old backup: {backup_path}")
                
            except Exception as e:
                logger.error(f"Failed to remove backup {backup['file']}: {e}")

def main():
    """Main function for command-line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Database Migration Rollback Manager")
    parser.add_argument("action", choices=["backup", "restore", "verify", "list", "cleanup"],
                       help="Action to perform")
    parser.add_argument("--db-path", help="Database file path")
    parser.add_argument("--backup-path", help="Backup file path")
    parser.add_argument("--backup-dir", default="migration_backups", help="Backup directory")
    parser.add_argument("--keep-count", type=int, default=5, help="Number of backups to keep during cleanup")
    
    args = parser.parse_args()
    
    manager = MigrationRollbackManager(args.backup_dir)
    
    try:
        if args.action == "backup":
            if not args.db_path:
                print("Error: --db-path is required for backup action")
                sys.exit(1)
            backup_path = manager.create_backup(args.db_path)
            print(f"Backup created: {backup_path}")
            
        elif args.action == "restore":
            if not args.backup_path or not args.db_path:
                print("Error: --backup-path and --db-path are required for restore action")
                sys.exit(1)
            success = manager.restore_backup(args.backup_path, args.db_path)
            if success:
                print("Restore completed successfully")
            else:
                print("Restore failed")
                sys.exit(1)
                
        elif args.action == "verify":
            if not args.backup_path:
                print("Error: --backup-path is required for verify action")
                sys.exit(1)
            success = manager.verify_backup(args.backup_path)
            if success:
                print("Backup verification successful")
            else:
                print("Backup verification failed")
                sys.exit(1)
                
        elif args.action == "list":
            backups = manager.list_backups()
            if not backups:
                print("No backups found")
            else:
                print(f"Found {len(backups)} backups:")
                for backup in backups:
                    metadata = backup["metadata"]
                    print(f"  {backup['file']}")
                    print(f"    Created: {metadata['created_at']}")
                    print(f"    Size: {metadata['file_size']} bytes")
                    print(f"    Original: {metadata['original_path']}")
                    print()
                    
        elif args.action == "cleanup":
            manager.cleanup_old_backups(args.keep_count)
            print(f"Cleanup completed, kept {args.keep_count} most recent backups")
            
    except Exception as e:
        logger.error(f"Operation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()