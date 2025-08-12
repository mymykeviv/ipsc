#!/usr/bin/env python3
"""
Database Migration Management Script

This script provides a simple interface for running database migrations
using Alembic. It can be used to upgrade, downgrade, or check the
current migration status.

Usage:
    python migrate.py upgrade    # Apply all pending migrations
    python migrate.py downgrade  # Revert the last migration
    python migrate.py status     # Show current migration status
    python migrate.py history    # Show migration history
"""

import os
import sys
import subprocess
from pathlib import Path

def run_alembic_command(command, *args):
    """Run an alembic command with the given arguments"""
    cmd = ["alembic", command] + list(args)
    print(f"Running: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, cwd=Path(__file__).parent, check=True, capture_output=True, text=True)
        print(result.stdout)
        return result.returncode
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        print(f"Error output: {e.stderr}")
        return e.returncode

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    
    command = sys.argv[1]
    args = sys.argv[2:]
    
    if command == "upgrade":
        return run_alembic_command("upgrade", "head")
    elif command == "downgrade":
        return run_alembic_command("downgrade", "-1")
    elif command == "status":
        return run_alembic_command("current")
    elif command == "history":
        return run_alembic_command("history")
    elif command == "revision":
        if len(args) < 1:
            print("Usage: python migrate.py revision <message>")
            return 1
        return run_alembic_command("revision", "--autogenerate", "-m", args[0])
    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        return 1

if __name__ == "__main__":
    sys.exit(main())
