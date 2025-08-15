# Manual Test Execution Guide - IPSC Application

## Version: 1.37.2
**Date:** 2025-01-14  
**Environment:** Development/Staging

## Overview
This guide provides step-by-step instructions for manually running tests and generating comprehensive reports for the IPSC application.

## Prerequisites

### 1. Environment Setup
```bash
# Navigate to project root
cd /Users/vivekm/code/ipsc

# Activate virtual environment
source .venv/bin/activate

# Verify Python version
python --version  # Should be 3.13.x

# Install dependencies (if needed)
pip install -r requirements.txt
```

### 2. Database Setup
```bash
# Ensure database is accessible
ls -la *.db

# Check if test database exists
ls -la test_reports/
ls -la coverage_reports/
```

## Part 1: Running Automated Tests

### 1.1 Backend Tests

#### Step 1: Run Individual Test Files
```bash
# Navigate to backend directory
cd backend

# Set testing environment
export TESTING=1

# Run invoice status management tests
python -m pytest ../tests/backend/test_invoice_status_management.py -v

# Run business logic tests
python -m pytest ../tests/backend/test_business_logic_comprehensive.py -v

# Run E2E workflow tests
python -m pytest ../tests/backend/test_e2e_workflows.py -v

# Run existing tests
python -m pytest ../tests/backend/test_purchase_payments.py -v
python -m pytest ../tests/backend/test_invoice_payments.py -v
```

#### Step 2: Run All Backend Tests with Coverage
```bash
# Install coverage if not installed
pip install coverage

# Run tests with coverage
coverage run -m pytest ../tests/backend/ -v

# Generate coverage report
coverage report
coverage html -d ../coverage_reports/backend
```

#### Step 3: Run Tests with JUnit XML Output
```bash
# Install pytest-xml if not installed
pip install pytest-xml

# Run tests with XML output
python -m pytest ../tests/backend/ -v --junitxml=../test_reports/backend_tests.xml
```

### 1.2 Frontend Tests

#### Step 1: Navigate to Frontend Directory
```bash
cd ../frontend

# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### 1.3 Integration Tests

#### Step 1: Run Integration Tests
```bash
cd ../backend

# Run integration tests
python -m pytest ../tests/backend/test_login_e2e.py -v
```

## Part 2: Manual Testing Execution

### 2.1 Application Setup

#### Step 1: Start the Application
```bash
# Start backend server
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# In another terminal, start frontend
cd frontend
npm start
```

#### Step 2: Access Application
- Backend API: http://localhost:8000
- Frontend: http://localhost:3000
- API Documentation: http://localhost:8000/docs

### 2.2 Manual Test Execution

#### Test Case 1: Invoice Status Management
**File:** `tests/manual_test_scenarios.md` - Section 1.1

**Steps:**
1. Open browser and navigate to http://localhost:3000
2. Login with test credentials
3. Navigate to Invoices → Create New Invoice
4. Follow test case INV-STATUS-001 steps
5. Document results in test execution log

**Expected Results:**
- [ ] Invoice created successfully
- [ ] Status shows as "Draft"
- [ ] All calculations accurate

#### Test Case 2: Purchase Payment Workflow
**File:** `tests/manual_test_scenarios.md` - Section 2.1

**Steps:**
1. Navigate to Purchases → Create New Purchase
2. Follow test case PUR-PAY-001 steps
3. Navigate to Purchase Payments
4. Add payment and verify status changes

**Expected Results:**
- [ ] Purchase created successfully
- [ ] Payment recorded correctly
- [ ] Status updated to "Paid"

#### Test Case 3: Invoice Payment Links
**File:** `tests/manual_test_scenarios.md` - Section 3.1

**Steps:**
1. Navigate to Invoices → List
2. Find invoice with outstanding amount
3. Click "Add Payment" link
4. Verify payment form opens correctly

**Expected Results:**
- [ ] Payment link works correctly
- [ ] Payment form opens with correct context
- [ ] Payment saved successfully

### 2.3 Test Execution Log Template

Create a file: `manual_test_execution_log.md`

```markdown
# Manual Test Execution Log

## Date: 2025-01-14
## Tester: [Your Name]
## Environment: Development

### Test Session 1: Invoice Status Management
- **Test Case:** INV-STATUS-001
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** [Any observations or issues]

### Test Session 2: Purchase Payment Workflow
- **Test Case:** PUR-PAY-001
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** [Any observations or issues]

### Test Session 3: Invoice Payment Links
- **Test Case:** INV-LINKS-001
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** [Any observations or issues]
```

## Part 3: Report Generation

### 3.1 Automated Report Generation

#### Step 1: Run Comprehensive Test Runner
```bash
cd /Users/vivekm/code/ipsc

# Run the comprehensive test runner
python run_comprehensive_tests.py
```

#### Step 2: Generate Custom Reports
```bash
# Create test results directory
mkdir -p test_reports/$(date +%Y%m%d)

# Run tests and capture output
cd backend
TESTING=1 python -m pytest ../tests/backend/ -v > ../test_reports/$(date +%Y%m%d)/backend_tests.log 2>&1

# Generate summary
echo "Test Execution Summary" > ../test_reports/$(date +%Y%m%d)/summary.md
echo "Date: $(date)" >> ../test_reports/$(date +%Y%m%d)/summary.md
echo "Total Tests: $(grep -c '::' ../test_reports/$(date +%Y%m%d)/backend_tests.log)" >> ../test_reports/$(date +%Y%m%d)/summary.md
echo "Passed: $(grep -c 'PASSED' ../test_reports/$(date +%Y%m%d)/backend_tests.log)" >> ../test_reports/$(date +%Y%m%d)/summary.md
echo "Failed: $(grep -c 'FAILED' ../test_reports/$(date +%Y%m%d)/backend_tests.log)" >> ../test_reports/$(date +%Y%m%d)/summary.md
```

### 3.2 Manual Report Generation

#### Step 1: Create Test Execution Report
```bash
# Create report template
cat > test_reports/$(date +%Y%m%d)/manual_test_report.md << 'EOF'
# Manual Test Execution Report

## Test Session Information
- **Date:** $(date)
- **Tester:** [Your Name]
- **Environment:** Development
- **Application Version:** 1.37.2

## Test Results Summary

### Automated Tests
- **Total Tests:** [Count]
- **Passed:** [Count]
- **Failed:** [Count]
- **Success Rate:** [Percentage]

### Manual Tests
- **Total Scenarios:** [Count]
- **Passed:** [Count]
- **Failed:** [Count]
- **Success Rate:** [Percentage]

## Detailed Results

### Critical Issues Found
1. [Issue 1]
2. [Issue 2]

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

## Attachments
- Backend test logs: backend_tests.log
- Coverage reports: coverage_reports/
- Screenshots: screenshots/
EOF
```

#### Step 2: Generate HTML Report
```bash
# Install markdown converter
pip install markdown

# Convert to HTML
python -c "
import markdown
with open('test_reports/$(date +%Y%m%d)/manual_test_report.md', 'r') as f:
    md_content = f.read()
html_content = markdown.markdown(md_content)
with open('test_reports/$(date +%Y%m%d)/manual_test_report.html', 'w') as f:
    f.write(f'<html><head><title>Test Report</title></head><body>{html_content}</body></html>')
"
```

## Part 4: Troubleshooting

### 4.1 Common Issues

#### Issue 1: Database Connection Errors
```bash
# Check database file permissions
ls -la *.db

# Recreate test database
rm -f test.db
python -c "from backend.app.db import Base, engine; Base.metadata.create_all(bind=engine)"
```

#### Issue 2: Authentication Errors
```bash
# Check if test user exists
python -c "
from backend.app.models import User
from backend.app.db import SessionLocal
db = SessionLocal()
user = db.query(User).filter(User.username == 'admin').first()
print(f'User exists: {user is not None}')
db.close()
"
```

#### Issue 3: Import Errors
```bash
# Check Python path
python -c "import sys; print('\n'.join(sys.path))"

# Install missing dependencies
pip install -r requirements.txt
```

### 4.2 Test Environment Reset
```bash
# Clean up test artifacts
rm -rf test_reports/*
rm -rf coverage_reports/*
rm -rf .pytest_cache/

# Reset database
rm -f *.db
python -c "from backend.app.db import Base, engine; Base.metadata.create_all(bind=engine)"
```

## Part 5: Report Templates

### 5.1 Test Execution Summary Template
```markdown
# Test Execution Summary

## Session Information
- **Date:** [Date]
- **Duration:** [Duration]
- **Environment:** [Environment]
- **Version:** [Version]

## Results Overview
- **Total Tests:** [Count]
- **Passed:** [Count]
- **Failed:** [Count]
- **Skipped:** [Count]
- **Success Rate:** [Percentage]%

## Critical Issues
1. [Issue description]
2. [Issue description]

## Recommendations
1. [Recommendation]
2. [Recommendation]

## Next Steps
1. [Action item]
2. [Action item]
```

### 5.2 Bug Report Template
```markdown
# Bug Report

## Bug Information
- **ID:** BUG-[Number]
- **Title:** [Brief description]
- **Priority:** High/Medium/Low
- **Severity:** Critical/Major/Minor
- **Environment:** [Browser/OS/Version]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Result
[What should happen]

## Actual Result
[What actually happened]

## Screenshots
[If applicable]

## Additional Notes
[Any other relevant information]
```

## Part 6: Continuous Testing Setup

### 6.1 Automated Test Execution Script
```bash
#!/bin/bash
# test_execution.sh

echo "Starting automated test execution..."
echo "Date: $(date)"
echo "Environment: $ENVIRONMENT"

# Run backend tests
cd backend
TESTING=1 python -m pytest ../tests/backend/ -v --junitxml=../test_reports/backend_tests.xml

# Run frontend tests
cd ../frontend
npm test -- --coverage --watchAll=false

# Generate reports
cd ..
python run_comprehensive_tests.py

echo "Test execution completed."
echo "Reports available in test_reports/ and coverage_reports/"
```

### 6.2 Schedule Regular Testing
```bash
# Add to crontab for daily testing
# 0 9 * * * /path/to/ipsc/test_execution.sh
```

## Conclusion

This guide provides comprehensive instructions for manually running tests and generating reports. Follow the steps systematically to ensure thorough testing coverage and accurate reporting.

For additional support or questions, refer to the test documentation in the `tests/` directory or contact the development team.

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-14  
**Next Review:** 2025-01-21
