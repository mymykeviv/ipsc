# IPSC Testing Framework

## Overview

The IPSC application uses a **unified testing framework** that consolidates all testing functionality into a single, maintainable approach. This framework supports backend unit/integration tests, frontend unit tests, E2E tests with Playwright, and comprehensive health checks.

## Quick Start

### Run All Tests
```bash
./scripts/test-runner.sh
```

### Run Specific Test Types
```bash
# Backend tests only
./scripts/test-runner.sh backend

# Frontend tests only
./scripts/test-runner.sh frontend

# E2E tests only
./scripts/test-runner.sh e2e

# Health checks only
./scripts/test-runner.sh health
```

### Notes
- All legacy test scripts have been removed. Use `./scripts/test-runner.sh` exclusively.

## Test Architecture

### Test Categories

| Category | Description | Location | Framework |
|----------|-------------|----------|-----------|
| **Backend** | Unit & Integration Tests | `tests/backend/` | pytest |
| **Frontend** | Unit Tests | `frontend/src/` | Vitest |
| **E2E** | End-to-End Tests | `frontend/tests/e2e/` | Playwright |
| **Health** | System Health Checks | `test_suite.py` | Python |

### Directory Structure

```
ipsc/
├── scripts/
│   ├── test-runner.sh          # Unified test runner
│   ├── build-and-push-docker.sh
│   ├── clean.sh
│   └── stop-stack.sh
├── test_reports/               # Test results and reports
│   ├── backend/
│   ├── frontend/
│   ├── e2e/
│   └── test_summary_*.md
├── backend/
│   ├── coverage/               # Coverage reports
│   └── tests/backend/          # Backend test files
├── frontend/
│   ├── tests/e2e/              # E2E test files
│   └── src/__tests__/          # Frontend unit tests
└── temp_files/                 # Temporary test files (excluded from git)
```

## Test Execution Flow

### 1. Prerequisites Check
- Virtual environment setup
- Frontend dependencies installation
- Playwright browser installation
- Services health verification

### 2. Test Environment Setup
- Create test result directories
- Setup coverage reporting
- Initialize test databases

### 3. Test Execution
- Run selected test categories
- Generate coverage reports
- Collect test results

### 4. Results Processing
- Generate unified test summary
- Clean up temporary files
- Display final statistics

## Backend Testing

### Test Structure
```
tests/backend/
├── test_*.py                   # Unit tests
├── test_*_integration.py       # Integration tests
├── test_*_api.py              # API tests
└── conftest.py                # Test configuration
```

## Deployment Testing

### Pre-Deployment Checklist

Before deploying to any environment, ensure all tests pass:

```bash
# 1. Run complete test suite
./scripts/test-runner.sh

# 2. Verify all services are healthy
./scripts/test-runner.sh health

# 3. Check test coverage (should be >30%)
# Coverage reports are in backend/coverage/
```

### Automated Pipeline

CI runs the unified test runner in workflows and deploys images built via `scripts/build-and-push-docker.sh`. For local pre-deploy checks:

```bash
./scripts/test-runner.sh all
```

### Environment-Specific Testing

Use compose stacks to bring environments up, then run tests as needed:

```bash
# Start dev services then run tests
docker compose -f deployment/docker/docker-compose.dev.yml up -d
./scripts/test-runner.sh backend
./scripts/test-runner.sh frontend
./scripts/test-runner.sh e2e
```

### Test Database Management

The testing framework automatically manages test databases:

```bash
# Setup test database (automated)
./scripts/setup_test_db.sh

# Cleanup test database
./scripts/cleanup_test_db.sh

# Cleanup test files only
./scripts/cleanup_test_db.sh --files-only
```

### Running Backend Tests
```bash
# Run all backend tests
./scripts/test-runner.sh backend

# Run with coverage
cd backend
python -m pytest tests/backend/ --cov=app --cov-report=html
```

### Coverage Reports
- **HTML Report**: `backend/coverage/backend_report_*.html`
- **XML Report**: `backend/coverage/backend_coverage_*.xml`
- **Terminal**: Coverage summary with missing lines

## Frontend Testing

### Test Structure
```
frontend/src/
├── components/__tests__/        # Component tests
├── pages/__tests__/            # Page tests
└── utils/__tests__/            # Utility tests
```

### Running Frontend Tests
```bash
# Run all frontend tests
./scripts/test-runner.sh frontend

# Run with watch mode
cd frontend
npm test -- --watch
```

### Test Framework
- **Framework**: Vitest
- **Testing Library**: React Testing Library
- **Assertions**: Jest DOM matchers

## E2E Testing

### Test Structure
```
frontend/tests/e2e/
├── 01-authentication.spec.ts
├── 02-dashboard.spec.ts
├── 03-products.spec.ts
├── 04-suppliers.spec.ts
├── 05-purchases.spec.ts
├── 06-customers.spec.ts
├── 07-invoices.spec.ts
├── 08-cashflow-expenses.spec.ts
├── 09-settings.spec.ts
├── 10-reporting.spec.ts
├── critical-flows.spec.ts
├── auth.setup.ts
└── helpers/
```

### Running E2E Tests
```bash
# Run all E2E tests
./scripts/test-runner.sh e2e

# Run specific test file
cd frontend
npx playwright test tests/e2e/01-authentication.spec.ts

# Run with headed browser
npx playwright test --headed

# Run with debugging
npx playwright test --debug
```

### Browser Support
- **MVP**: Chrome and Firefox (Desktop)
- **Mobile**: Not included in MVP
- **Responsive**: Not included in MVP

## Health Checks

### System Health Verification
```bash
# Run comprehensive health checks
./scripts/test-runner.sh health

# Run with specific environment
python test_suite.py --env dev --save
```

### Health Check Categories
- **Service Availability**: Backend and frontend endpoints
- **Database Connectivity**: PostgreSQL connection
- **Authentication**: Login/logout flows
- **Core Functionality**: Invoice creation, payment processing
- **API Endpoints**: All major API endpoints

## Test Results and Reporting

### Unified Test Summary
The test runner generates a comprehensive summary report at:
```
test_reports/test_summary_YYYYMMDD_HHMMSS.md
```

### Report Contents
- **Test Statistics**: Total, passed, failed, success rate
- **Category Breakdown**: Backend, frontend, E2E, health
- **Coverage Information**: Backend code coverage
- **File Locations**: All test result files
- **Timestamp**: Execution timestamp for traceability

### Result Files
- **Backend**: `test_reports/backend/backend_tests_*.json`
- **Frontend**: `test_reports/frontend/frontend_tests_*.json`
- **E2E**: `test_reports/e2e/e2e_tests_*.json`
- **Health**: `test_reports/health_checks_*.json`

## CI/CD Integration

### Automated Deployment
The test runner integrates with the automated deployment pipeline:

```bash
# Start dev stack and run full tests locally
docker compose -f deployment/docker/docker-compose.dev.yml up -d
./scripts/test-runner.sh all
```

### Pre-deployment Tests
- Backend unit and integration tests
- Frontend unit tests
- E2E critical flows
- System health checks

### Post-deployment Verification
- Service health verification
- Core functionality validation
- Performance baseline checks

## Troubleshooting

### Common Issues

### Local Test Data Seeding (optional)
If you want realistic sample data in your local dev stack:

```bash
# Start dev stack (if not already running)
docker compose -f deployment/docker/docker-compose.dev.yml up -d

# Seed comprehensive test data into the dev DB
./scripts/seed-test-data.sh
```

This seeds sample users, parties, products, invoices, purchases, payments, and expenses.

#### Database Connection Errors
```bash
# Ensure services are running
docker compose -f deployment/docker/docker-compose.dev.yml up -d

# Check database health
curl http://localhost:8000/health
```

#### Frontend Test Failures
```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### E2E Test Failures
```bash
# Reinstall Playwright browsers
cd frontend
npx playwright install --with-deps chromium firefox
```

#### Coverage Report Issues
```bash
# Clear coverage cache
cd backend
rm -rf .coverage coverage/
python -m pytest tests/backend/ --cov=app --cov-report=html
```

### Debug Mode
```bash
# Run tests with verbose output
./scripts/test-runner.sh --verbose

# Run specific test with debugging
cd frontend
npx playwright test --debug tests/e2e/01-authentication.spec.ts
```

## Best Practices

### Test Development
1. **Write tests first** (TDD approach)
2. **Keep tests focused** on single functionality
3. **Use descriptive test names**
4. **Mock external dependencies**
5. **Test both success and failure scenarios**

### Test Maintenance
1. **Run tests before committing**
2. **Update tests when changing functionality**
3. **Keep test data clean and isolated**
4. **Monitor test execution time**
5. **Review coverage reports regularly**

### Performance Considerations
1. **Use test databases** for integration tests
2. **Mock heavy operations** in unit tests
3. **Run E2E tests in parallel** when possible
4. **Clean up test data** after execution
5. **Monitor memory usage** during test runs

## Migration from Legacy Scripts

### Deprecated Scripts
The following scripts are deprecated and replaced by the unified test runner:

- `scripts/run_tests.sh` → `scripts/test-runner.sh`
- `scripts/run-github-issues-tests.sh` → `scripts/test-runner.sh e2e`
- `scripts/run-ui-ux-tests.sh` → `scripts/test-runner.sh e2e`
- `scripts/test.sh` → `scripts/test-runner.sh`

### Migration Steps
1. **Update CI/CD pipelines** to use `test-runner.sh`
2. **Update documentation** to reference new commands
3. **Remove deprecated scripts** after migration
4. **Update team workflows** to use unified approach

## Future Enhancements

### Planned Improvements
1. **Parallel test execution** for faster feedback
2. **Test result caching** for incremental runs
3. **Performance benchmarking** integration
4. **Mobile testing** support
5. **Visual regression testing**

### Monitoring and Analytics
1. **Test execution metrics** collection
2. **Failure pattern analysis**
3. **Performance trend tracking**
4. **Coverage trend analysis**
5. **Test maintenance metrics**

---

**Note**: This unified testing framework replaces all previous testing approaches and provides a single, consistent interface for all testing needs in the IPSC application.
