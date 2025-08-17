# Test Running Guide - IPSC Application

## Overview

This guide provides comprehensive instructions for running all types of tests in the IPSC application, including backend unit tests, frontend component tests, and E2E tests with Playwright.

## Quick Start Commands

### Backend Tests
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source .venv/bin/activate

# Run all backend tests
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/backend/test_advanced_invoice_features.py -v

# Run tests with coverage
python -m pytest tests/ --cov=app --cov-report=html
```

### Frontend Tests
```bash
# Navigate to frontend directory
cd frontend

# Run all frontend tests
npm test

# Run specific test file
npm test -- --run src/components/__tests__/EnhancedFilterBar.test.tsx

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests (Playwright)
```bash
# Navigate to frontend directory
cd frontend

# Run all E2E tests
npx playwright test

# Run specific E2E test file
npx playwright test tests/e2e/filter-system-e2e.spec.ts

# Run E2E tests in headed mode (with browser visible)
npx playwright test tests/e2e/filter-system-e2e.spec.ts --headed

# Run E2E tests with specific browser
npx playwright test --project=chromium

# Run E2E tests with debugging
npx playwright test --debug
```

## Test Setup Requirements

### Backend Setup
```bash
cd backend

# Create virtual environment (if not exists)
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # On macOS/Linux
# or
.venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt

# Create test database
python create_db.py
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Set up test environment
npm run test:setup
```

## Test Categories and Commands

### 1. Unit Tests
```bash
# Backend Unit Tests
cd backend && source .venv/bin/activate
python -m pytest tests/backend/ -v

# Frontend Unit Tests
cd frontend
npm test -- --run src/components/__tests__/
```

### 2. Integration Tests
```bash
# Backend Integration Tests
cd backend && source .venv/bin/activate
python -m pytest tests/backend/test_cashflow_integration.py -v

# Frontend Integration Tests
cd frontend
npm test -- --run src/pages/
```

### 3. E2E Tests
```bash
# Run all E2E tests
cd frontend
npx playwright test

# Run specific E2E test suites
npx playwright test tests/e2e/filter-system-e2e.spec.ts
npx playwright test tests/e2e/ui-journey-discovery.spec.ts
```

## Advanced Test Commands

### Parallel Test Execution
```bash
# Backend parallel tests
python -m pytest tests/ -n auto

# Frontend parallel tests
npm test -- --run --threads
```

### Test Filtering
```bash
# Run tests matching pattern
python -m pytest tests/ -k "filter" -v

# Run tests by marker
python -m pytest tests/ -m "slow" -v

# Run tests excluding pattern
python -m pytest tests/ -k "not slow" -v
```

### Performance Testing
```bash
# Run tests with performance monitoring
npm test -- --run --reporter=verbose

# Run E2E tests with performance tracking
npx playwright test --reporter=html
```

## Debugging Tests

### Backend Test Debugging
```bash
# Run tests with debugger
python -m pytest tests/ --pdb

# Run tests with verbose output
python -m pytest tests/ -v -s

# Run tests with coverage and show missing lines
python -m pytest tests/ --cov=app --cov-report=term-missing
```

### Frontend Test Debugging
```bash
# Run tests in debug mode
npm test -- --run --debug

# Run tests with console output
npm test -- --run --reporter=verbose

# Run specific test with debugging
npm test -- --run src/components/__tests__/EnhancedFilterBar.test.tsx --debug
```

### E2E Test Debugging
```bash
# Run E2E tests in debug mode
npx playwright test --debug

# Run specific test in debug mode
npx playwright test tests/e2e/filter-system-e2e.spec.ts --debug

# Run tests with trace
npx playwright test --trace on
```

## Test Reports and Coverage

### Generate Test Reports
```bash
# Backend coverage report
cd backend && source .venv/bin/activate
python -m pytest tests/ --cov=app --cov-report=html --cov-report=term

# Frontend coverage report
cd frontend
npm run test:coverage

# E2E test report
npx playwright test --reporter=html
```

### View Reports
```bash
# Backend coverage report
open backend/htmlcov/index.html

# Frontend coverage report
open frontend/coverage/lcov-report/index.html

# E2E test report
open frontend/playwright-report/index.html
```

## Quick Test Scripts

Create these scripts in your `package.json` for easy access:

```json
{
  "scripts": {
    "test:backend": "cd backend && source .venv/bin/activate && python -m pytest tests/ -v",
    "test:frontend": "npm test -- --run",
    "test:e2e": "npx playwright test",
    "test:all": "npm run test:backend && npm run test:frontend && npm run test:e2e",
    "test:filter": "npx playwright test tests/e2e/filter-system-e2e.spec.ts --headed",
    "test:coverage": "npm run test:coverage && cd backend && source .venv/bin/activate && python -m pytest tests/ --cov=app --cov-report=html"
  }
}
```

## Recommended Test Workflow

1. **Development Phase**:
   ```bash
   # Run unit tests frequently
   npm test -- --watch
   ```

2. **Before Commit**:
   ```bash
   # Run all tests
   npm run test:all
   ```

3. **CI/CD Pipeline**:
   ```bash
   # Run tests with coverage
   npm run test:coverage
   ```

## Troubleshooting Common Issues

### Backend Test Issues

#### Missing Dependencies
```bash
# Install missing dependencies
pip install -r requirements.txt

# If specific module is missing
pip install requests pytest pytest-asyncio httpx
```

#### Database Issues
```bash
# Recreate test database
python create_db.py

# Reset database
rm cashflow.db
python create_db.py
```

#### Virtual Environment Issues
```bash
# Create new virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

#### Fixture Issues
```bash
# Check available fixtures
python -m pytest --fixtures

# Run tests with specific fixture
python -m pytest tests/ --setup-show
```

### Frontend Test Issues

#### Missing Dependencies
```bash
# Install dependencies
npm install

# Install specific testing packages
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

#### DOM Environment Issues
```bash
# Run tests with jsdom environment
npm test -- --environment=jsdom

# Update vitest config for DOM support
```

#### Jest/Vitest Compatibility Issues
```bash
# Replace jest.fn() with vi.fn() in test files
# Update test imports to use vitest
import { describe, test, expect, beforeEach, vi } from 'vitest'
```

#### Test Configuration Issues
```bash
# Check vitest configuration
cat vitest.config.ts

# Run tests with verbose output
npm test -- --run --reporter=verbose
```

### E2E Test Issues

#### Playwright Configuration Issues

**Error: "Playwright Test did not expect test.describe() to be called here"**

This error occurs when:
1. You're calling `test.describe()` in a configuration file
2. You have two different versions of `@playwright/test`
3. The test file is being imported by the configuration file

**Solutions:**
```bash
# Check for duplicate Playwright installations
npm ls @playwright/test

# Remove duplicate installations
npm uninstall @playwright/test
npm install @playwright/test

# Check playwright.config.ts for proper configuration
cat playwright.config.ts

# Ensure test files are not imported in config
```

#### Browser Issues
```bash
# Install Playwright browsers
npx playwright install

# Install specific browser
npx playwright install chromium

# Update browsers
npx playwright install --force
```

#### Test Timeout Issues
```bash
# Increase timeout
npx playwright test --timeout=60000

# Run tests with longer timeout
npx playwright test tests/e2e/filter-system-e2e.spec.ts --timeout=120000
```

#### Test File Not Found
```bash
# Check if test file exists
ls -la tests/e2e/

# Run tests with pattern matching
npx playwright test "**/*filter*.spec.ts"

# Check Playwright configuration
npx playwright test --list
```

#### Authentication Issues in E2E Tests
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check if frontend is running
curl http://localhost:5174

# Run tests with specific base URL
npx playwright test --base-url=http://localhost:5174
```

### Common Error Solutions

#### "document is not defined" Error
```bash
# For frontend tests, ensure jsdom environment
npm test -- --environment=jsdom

# Update vitest config
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-utils.tsx']
  }
})
```

#### "Module not found" Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check import paths
npm run build
```

#### "No tests found" Error
```bash
# Check test file patterns
npx playwright test --list

# Run tests with specific pattern
npx playwright test "**/*.spec.ts"

# Check test file naming convention
# Files should end with .spec.ts or .test.ts
```

#### "Timeout" Errors
```bash
# Increase timeout for all tests
npx playwright test --timeout=60000

# Increase timeout for specific test
test('my test', async ({ page }) => {
  // Test code
}, { timeout: 60000 });
```

## Environment-Specific Issues

### macOS Issues
```bash
# Python path issues
which python3
export PATH="/usr/local/bin:$PATH"

# Permission issues
sudo chown -R $(whoami) node_modules
```

### Windows Issues
```bash
# Path issues
set PATH=%PATH%;C:\Python39\

# Virtual environment activation
.venv\Scripts\activate

# Line ending issues
git config --global core.autocrlf true
```

### Linux Issues
```bash
# Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Permission issues
sudo chown -R $USER:$USER .
```

## Performance Optimization

### Test Execution Speed
```bash
# Run tests in parallel
npx playwright test --workers=4

# Use specific browsers only
npx playwright test --project=chromium

# Skip slow tests
npx playwright test --grep-invert="slow"
```

### Memory Optimization
```bash
# Run tests with memory limits
node --max-old-space-size=4096 node_modules/.bin/playwright test

# Clear cache
npx playwright install --force
```

## Best Practices

### Test Organization
1. **Unit Tests**: Test individual components and functions
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test complete user workflows

### Test Naming
```typescript
// Good test names
test('should display filter options when expanded')
test('should apply filters correctly')
test('should handle empty results gracefully')

// Avoid generic names
test('test 1')
test('works')
```

### Test Data Management
```typescript
// Use test fixtures
const testData = {
  products: [
    { id: 1, name: 'Test Product', category: 'Electronics' }
  ]
}

// Clean up after tests
afterEach(async () => {
  await cleanup()
})
```

### Continuous Integration
```yaml
# Example GitHub Actions workflow
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm run test:all
```

## Support and Resources

### Documentation
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Pytest Documentation](https://docs.pytest.org/)

### Community Resources
- [Playwright GitHub Issues](https://github.com/microsoft/playwright/issues)
- [Vitest GitHub Issues](https://github.com/vitest-dev/vitest/issues)
- [Pytest GitHub Issues](https://github.com/pytest-dev/pytest/issues)

### Debugging Tools
- [Playwright Inspector](https://playwright.dev/docs/debug)
- [Vitest UI](https://vitest.dev/guide/ui.html)
- [Pytest Debugging](https://docs.pytest.org/en/stable/how-to/failures.html)

This comprehensive guide should help you resolve most testing issues and run tests efficiently in the IPSC application.
