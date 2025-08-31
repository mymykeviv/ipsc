# Database Migration Guide

## Overview
This guide documents the database schema fixes applied to resolve the HTTP 500 errors in the ProfitPath application.

## Issues Fixed

### 1. Missing Columns in Payments Table
**Error**: `no such column: payments.payment_amount`

**Root Cause**: The SQLAlchemy model expected a `payment_amount` column that didn't exist in the database.

**Solution**: Added missing columns:
- `payment_amount NUMERIC(12, 2) NOT NULL DEFAULT 0`
- `account_head VARCHAR(50) NOT NULL DEFAULT 'Cash'`
- `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

### 2. Missing Columns in Invoices Table
**Error**: `no such column: invoices.terms`

**Root Cause**: The SQLAlchemy model expected several columns that didn't exist in the database.

**Solution**: Added missing columns:
- `terms VARCHAR(20) NOT NULL DEFAULT 'Due on Receipt'`
- `exchange_rate NUMERIC(10, 4) NOT NULL DEFAULT 1.0`
- `place_of_supply VARCHAR(100) NOT NULL DEFAULT 'Same as billing'`
- `place_of_supply_state_code VARCHAR(10) NOT NULL DEFAULT '00'`
- `reverse_charge BOOLEAN NOT NULL DEFAULT FALSE`
- `export_supply BOOLEAN NOT NULL DEFAULT FALSE`
- `bill_to_address VARCHAR(200) NOT NULL DEFAULT 'Same as billing'`
- `ship_to_address VARCHAR(200) NOT NULL DEFAULT 'Same as billing'`
- `taxable_value NUMERIC(12, 2) NOT NULL DEFAULT 0`
- `total_discount NUMERIC(12, 2) NOT NULL DEFAULT 0`
- `grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0`
- `paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0`
- `balance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0`
- `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

### 3. Missing Columns in Purchases Table
**Solution**: Added missing columns similar to invoices table.

### 4. Missing Columns in Purchase Payments Table
**Solution**: Added missing columns similar to payments table.

## Migration Script

### Features
- **Database Type Detection**: Automatically detects SQLite or PostgreSQL
- **Safe Execution**: Checks if columns exist before adding them
- **Backup Creation**: Creates automatic backups before making changes
- **Error Handling**: Graceful handling of duplicate columns and other errors
- **Cross-Platform Support**: Works with both SQLite and PostgreSQL

### Usage

#### For SQLite:
```bash
python3 fix_database_schema.py
```

#### For PostgreSQL:
```bash
# Install PostgreSQL dependency
pip install psycopg2-binary

# Set environment variable
export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Run migration
python3 fix_database_schema.py
```

## Testing

### Pre-Migration Tests
1. Check for HTTP 500 errors in dashboard
2. Verify API endpoints are failing
3. Confirm database schema mismatches

### Post-Migration Tests
1. Dashboard loads without errors
2. All API endpoints return proper responses
3. Financial summaries show actual data
4. Reports function correctly

### Test Commands
```bash
# Test dashboard API
curl http://localhost:8000/api/dashboard

# Test cashflow reports
curl http://localhost:8000/api/reports/cashflow

# Test GST summary
curl http://localhost:8000/api/reports/gst-summary
```

## Future Migration Guidelines

### 1. Schema Changes
- Always update both SQLAlchemy models and database schema
- Use migration scripts for production deployments
- Test migrations on staging environments first

### 2. Database Compatibility
- Support both SQLite (development) and PostgreSQL (production)
- Use environment variables for database configuration
- Implement proper connection pooling for production

### 3. Error Handling
- Implement graceful fallbacks for missing columns
- Add comprehensive logging for database operations
- Create monitoring for database health

### 4. Backup Strategy
- Always create backups before schema changes
- Implement automated backup scheduling
- Test backup restoration procedures

## Troubleshooting

### Common Issues

#### 1. Column Already Exists
**Error**: `duplicate column name`
**Solution**: Script handles this automatically, skips existing columns

#### 2. PostgreSQL Connection Failed
**Error**: `Failed to connect to PostgreSQL`
**Solution**: 
- Check DATABASE_URL environment variable
- Verify PostgreSQL server is running
- Confirm network connectivity

#### 3. Permission Denied
**Error**: `Permission denied`
**Solution**: 
- Check file permissions for SQLite database
- Verify database user permissions for PostgreSQL

### Rollback Procedure
1. Stop the application
2. Restore from backup: `cp cashflow_backup_YYYYMMDD_HHMMSS.db cashflow.db`
3. Restart the application
4. Verify functionality

## Monitoring

### Key Metrics to Monitor
- Database connection success rate
- API response times
- Error rates by endpoint
- Database query performance

### Alerts to Set Up
- HTTP 500 error rate > 1%
- Database connection failures
- Migration script execution failures
- Backup creation failures

## Security Considerations

### Database Security
- Use environment variables for sensitive connection strings
- Implement proper authentication for PostgreSQL
- Regular security updates for database software
- Encrypt database files in transit and at rest

### Migration Security
- Validate all SQL statements before execution
- Use parameterized queries to prevent SQL injection
- Implement proper access controls for migration scripts
- Log all schema changes for audit purposes

## Version History

### v1.0.0 (2025-08-20)
- Initial migration script
- Fixed missing columns in payments, invoices, purchases, and purchase_payments tables
- Added support for both SQLite and PostgreSQL
- Implemented automatic backup creation
- Added comprehensive error handling

## PostgreSQL to SQLite Migration Guide

This guide provides comprehensive instructions for migrating from PostgreSQL to SQLite, including backup procedures, rollback strategies, and troubleshooting.

> **📖 For a complete overview of the migration implementation, see [README_MIGRATION.md](./README_MIGRATION.md)**

### Overview

This migration involves:
- Converting from PostgreSQL to SQLite database
- Adding `is_active` column for soft delete functionality
- Updating API endpoints to support soft delete filtering
- Maintaining data integrity throughout the process

### Pre-Migration Checklist

#### 1. Environment Preparation
- [ ] Backup current PostgreSQL database
- [ ] Ensure SQLite is installed and accessible
- [ ] Stop all running application services
- [ ] Verify disk space for backup files
- [ ] Test database connectivity

#### 2. Code Preparation
- [ ] Review all database configuration files
- [ ] Update connection strings in `config.py`
- [ ] Verify Alembic migration scripts
- [ ] Test API endpoints with new filtering

### Migration Process

#### Step 1: Create PostgreSQL Backup

```bash
# Create PostgreSQL dump
pg_dump -h localhost -U your_username -d your_database > backup_postgresql_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
psql -h localhost -U your_username -d test_restore_db < backup_postgresql_*.sql
```

#### Step 2: Export Data from PostgreSQL

```bash
# Export data in CSV format for each table
psql -h localhost -U your_username -d your_database -c "\copy parties TO 'parties_export.csv' CSV HEADER"
psql -h localhost -U your_username -d your_database -c "\copy users TO 'users_export.csv' CSV HEADER"
# Add other tables as needed
```

#### Step 3: Initialize SQLite Database

```bash
# Navigate to backend directory
cd backend

# Run Alembic migrations to create SQLite schema
alembic upgrade head

# Verify database creation
sqlite3 app.db ".schema"
```

#### Step 4: Import Data to SQLite

```python
# Use the data import script
python scripts/import_postgresql_data.py --csv-dir ./exported_data
```

#### Step 5: Verify Migration

```bash
# Run comprehensive tests
pytest tests/test_party_soft_delete.py -v

# Check data integrity
python scripts/verify_migration.py

# Test API endpoints
curl http://localhost:8000/api/parties
curl http://localhost:8000/api/parties?type=customer
curl http://localhost:8000/api/parties?include_inactive=true
```

### Rollback Procedures

#### Automatic Rollback Script

Use the provided rollback manager for safe operations:

```bash
# Create backup before migration
python scripts/migration_rollback.py backup --db-path ./app.db

# List available backups
python scripts/migration_rollback.py list

# Restore from backup if needed
python scripts/migration_rollback.py restore --backup-path ./migration_backups/backup_20240101_120000_app.db --db-path ./app.db

# Verify restored database
python scripts/migration_rollback.py verify --backup-path ./app.db
```

#### Manual Rollback Steps

1. **Stop Application Services**
   ```bash
   # Stop FastAPI server
   pkill -f "uvicorn"
   
   # Stop any background processes
   pkill -f "python.*app"
   ```

2. **Restore PostgreSQL Configuration**
   ```bash
   # Revert config.py changes
   git checkout HEAD -- app/config.py
   
   # Restore original database URL
   export DATABASE_URL="postgresql://user:password@localhost/dbname"
   ```

3. **Restore PostgreSQL Database**
   ```bash
   # Drop and recreate database
   dropdb your_database
   createdb your_database
   
   # Restore from backup
   psql -h localhost -U your_username -d your_database < backup_postgresql_*.sql
   ```

4. **Verify Rollback**
   ```bash
   # Test database connectivity
   psql -h localhost -U your_username -d your_database -c "SELECT COUNT(*) FROM parties;"
   
   # Start application
   uvicorn app.main:app --reload
   
   # Test API endpoints
   curl http://localhost:8000/api/parties
   ```

### Configuration Changes

#### Database Configuration (`app/config.py`)

```python
# Before (PostgreSQL)
DATABASE_URL = "postgresql://user:password@localhost/dbname"

# After (SQLite)
DATABASE_URL = "sqlite:///./app.db"
```

#### Alembic Configuration (`alembic.ini`)

```ini
# Update SQLite URL
sqlalchemy.url = sqlite:///./app.db
```

### New Features

#### Soft Delete Functionality

The migration adds soft delete capabilities:

- **is_active column**: Boolean field added to parties table
- **Default filtering**: API endpoints filter out inactive records by default
- **Include inactive**: Use `?include_inactive=true` to show all records
- **Type filtering**: Use `?type=customer` or `?type=vendor` for specific types

#### API Endpoint Changes

```bash
# List active parties only (default)
GET /api/parties

# List all parties including inactive
GET /api/parties?include_inactive=true

# List active customers only
GET /api/parties?type=customer

# List all customers including inactive
GET /api/parties?type=customer&include_inactive=true

# Search with soft delete support
GET /api/parties?search=company&include_inactive=false
```

### Migration Troubleshooting

#### Common Migration Issues

1. **Database Lock Errors**
   ```bash
   # Solution: Ensure no processes are using the database
   lsof app.db
   pkill -f "python.*app"
   ```

2. **Migration Script Failures**
   ```bash
   # Check Alembic status
   alembic current
   alembic history
   
   # Reset to specific revision if needed
   alembic downgrade <revision_id>
   alembic upgrade head
   ```

3. **Data Import Errors**
   ```bash
   # Check CSV file format
   head -5 parties_export.csv
   
   # Verify column mappings
   sqlite3 app.db ".schema parties"
   ```

4. **API Endpoint Issues**
   ```bash
   # Check application logs
   tail -f app.log
   
   # Test database queries directly
   sqlite3 app.db "SELECT COUNT(*) FROM parties WHERE is_active = 1;"
   ```

#### Performance Considerations

1. **SQLite Optimizations**
   ```sql
   -- Enable WAL mode for better concurrency
   PRAGMA journal_mode=WAL;
   
   -- Optimize for performance
   PRAGMA synchronous=NORMAL;
   PRAGMA cache_size=10000;
   PRAGMA temp_store=memory;
   ```

2. **Index Creation**
   ```sql
   -- Add indexes for common queries
   CREATE INDEX idx_parties_is_active ON parties(is_active);
   CREATE INDEX idx_parties_type ON parties(type);
   CREATE INDEX idx_parties_name ON parties(name);
   ```

### Verification Checklist

After migration, verify:

- [ ] All tables exist with correct schema
- [ ] Data counts match between PostgreSQL and SQLite
- [ ] API endpoints return expected results
- [ ] Soft delete filtering works correctly
- [ ] Type filtering (customer/vendor) works
- [ ] Search functionality operates properly
- [ ] Application starts without errors
- [ ] Database backups are created and verified

### Maintenance

#### Regular Backup Schedule

```bash
# Add to crontab for daily backups
0 2 * * * /path/to/scripts/migration_rollback.py backup --db-path /path/to/app.db

# Weekly cleanup of old backups
0 3 * * 0 /path/to/scripts/migration_rollback.py cleanup --keep-count 7
```

#### Monitoring

- Monitor database file size growth
- Check for locked database issues
- Verify backup integrity regularly
- Monitor API response times

### Migration Timeline

Estimated time for migration:

- Small database (<1GB): 30-60 minutes
- Medium database (1-10GB): 1-3 hours
- Large database (>10GB): 3+ hours

Plan for additional time for testing and verification.

## Support

For issues with migrations:
1. Check the troubleshooting section above
2. Review application logs for detailed error messages
3. Verify database connectivity and permissions
4. Contact the development team with specific error details
