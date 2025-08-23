# Seed Data Management Guide

## Overview

This document outlines the new seed data architecture for the ProfitPath application, which separates development and testing data to prevent contamination and ensure proper environment isolation.

## Architecture Changes

### Before (Problematic)
- Seed data was automatically executed in the main application startup
- Same seed data used for both development and testing
- Risk of data corruption in production environments
- No environment isolation

### After (Improved)
- **No automatic seeding** in main application
- **Separate seed modules** for development and testing
- **Environment-specific validation** to prevent misuse
- **Manual control** over when seed data is created

## Seed Data Modules

### 1. Development Seed (`backend/app/dev_seed.py`)

**Purpose**: Creates realistic development data for feature testing and development work.

**Usage**:
```bash
# Run development seed script
./scripts/seed-dev.sh

# Or manually
cd backend
python -c "from app.dev_seed import run_dev_seed; run_dev_seed()"
```

**Features**:
- Creates realistic business data (products, parties, company settings)
- Includes admin user with credentials: `admin` / `admin123`
- Creates opening stock entries
- Validates environment (only runs in development)

**Data Created**:
- Company: "ProfitPath Development Company"
- Products: Mild Steel Bracket, Hex Bolt M10, Cutting Oil
- Parties: Acme Industries (customer), Retail Walk-in (customer), Fabrication Vendor (vendor)
- Admin user with full permissions

### 2. Test Seed (`backend/app/test_seed.py`)

**Purpose**: Creates minimal, consistent test data for automated testing.

**Usage**:
```bash
# Run test seed script
./scripts/seed-test.sh

# Or manually
cd backend
python -c "from app.test_seed import run_test_seed; run_test_seed()"
```

**Features**:
- Creates minimal test data for consistent test execution
- Includes test admin user with credentials: `testadmin` / `test123`
- Validates environment (only runs in testing)
- Provides data clearing functions

**Data Created**:
- Company: "Test Company Pvt Ltd"
- Products: Test Product 1, Test Product 2
- Parties: Test Customer, Test Vendor
- Test admin user with full permissions

## Scripts

### Development Seed Script (`scripts/seed-dev.sh`)

**Purpose**: Automated development environment setup.

**Features**:
- Checks PostgreSQL connection
- Creates database if it doesn't exist
- Runs development seed data
- Provides clear success/error messages

**Usage**:
```bash
./scripts/seed-dev.sh
```

### Test Seed Script (`scripts/seed-test.sh`)

**Purpose**: Automated test environment setup.

**Features**:
- Checks PostgreSQL connection
- Creates test database if it doesn't exist
- Runs test seed data
- Provides clear success/error messages

**Usage**:
```bash
./scripts/seed-test.sh
```

## Environment Validation

Both seed modules include environment validation to prevent misuse:

```python
# Development seed validation
if os.getenv("ENVIRONMENT") not in ["development", "dev"]:
    raise RuntimeError("Development seed data should only be run in development environment")

# Test seed validation
if os.getenv("ENVIRONMENT") != "testing":
    raise RuntimeError("Test seed data should only be run in testing environment")
```

## Database Configuration

### Development Database
- **Database**: `profitpath`
- **URL**: `postgresql+psycopg://postgres:postgres@localhost:5432/profitpath`
- **Purpose**: Development and feature testing

### Test Database
- **Database**: `profitpath_test`
- **URL**: `postgresql+psycopg://postgres:postgres@localhost:5432/profitpath_test`
- **Purpose**: Automated testing

## Migration Guide

### For Developers

1. **Remove old seed data calls**:
   ```python
   # OLD (removed)
   from .seed import run_seed
   run_seed()
   ```

2. **Use new development seed**:
   ```bash
   ./scripts/seed-dev.sh
   ```

3. **Update test files**:
   ```python
   # OLD
   from backend.app.seed import run_seed
   
   # NEW
   from backend.app.test_seed import run_test_seed
   ```

### For Test Writers

1. **Use test-specific seed data**:
   ```python
   from backend.app.test_seed import run_test_seed, clear_test_data
   
   # Setup
   run_test_seed()
   
   # Cleanup
   clear_test_data()
   ```

2. **Use test database**:
   ```python
   # Test database URL
   TEST_DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/profitpath_test"
   ```

## Best Practices

### Development
- ✅ Use `./scripts/seed-dev.sh` for development setup
- ✅ Run seed data manually when needed
- ✅ Use realistic business data for feature testing
- ❌ Never run development seed in production
- ❌ Never run development seed in test environment

### Testing
- ✅ Use `./scripts/seed-test.sh` for test setup
- ✅ Use minimal, consistent test data
- ✅ Clear test data between test runs
- ✅ Use test-specific database
- ❌ Never use development seed data in tests
- ❌ Never use production data in tests

### Production
- ✅ No seed data execution in production
- ✅ Manual data entry only
- ✅ Use proper data migration scripts
- ❌ Never run any seed scripts in production
- ❌ Never use test or development data

## Troubleshooting

### Common Issues

1. **Environment Validation Error**:
   ```
   RuntimeError: Development seed data should only be run in development environment
   ```
   **Solution**: Set `ENVIRONMENT=development` before running seed script

2. **Database Connection Error**:
   ```
   psycopg.OperationalError: connection failed
   ```
   **Solution**: Ensure PostgreSQL is running and accessible

3. **Permission Error**:
   ```
   Permission denied: ./scripts/seed-dev.sh
   ```
   **Solution**: Make script executable: `chmod +x scripts/seed-dev.sh`

### Database Setup

1. **Create Development Database**:
   ```bash
   createdb -h localhost -U postgres profitpath
   ```

2. **Create Test Database**:
   ```bash
   createdb -h localhost -U postgres profitpath_test
   ```

3. **Verify Connection**:
   ```bash
   pg_isready -h localhost -p 5432
   ```

## Security Considerations

1. **Default Credentials**: Both seed modules create users with default credentials
   - Development: `admin` / `admin123`
   - Test: `testadmin` / `test123`
   
2. **Environment Isolation**: Seed data is environment-specific and validated

3. **No Production Impact**: Seed data cannot run in production environments

## Future Enhancements

1. **Data Migration Scripts**: Create proper database migration scripts for production
2. **Seed Data Validation**: Add schema validation for seed data
3. **Custom Seed Data**: Allow developers to create custom seed data sets
4. **Seed Data Versioning**: Version control for seed data changes

## Support

For issues with seed data setup or usage:
1. Check this documentation
2. Verify environment variables
3. Check database connectivity
4. Review error logs
5. Contact the development team

