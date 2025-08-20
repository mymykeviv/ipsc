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

## Support

For issues with migrations:
1. Check the troubleshooting section above
2. Review application logs for detailed error messages
3. Verify database connectivity and permissions
4. Contact the development team with specific error details
