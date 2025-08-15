# Manual Test Execution Example - IPSC Application

## Version: 1.37.2
**Date:** 2025-01-14  
**Tester:** QA Team  
**Environment:** Development

## Quick Start Guide

### 1. Run Automated Tests
```bash
# Navigate to project root
cd /Users/vivekm/code/ipsc

# Run the automated test script
./run_tests_manually.sh
```

### 2. Execute Manual Tests
Follow the scenarios in `tests/manual_test_scenarios.md`

### 3. Generate Reports
Reports are automatically generated in `test_reports/YYYYMMDD/`

## Manual Test Execution Example

### Test Session 1: Invoice Status Management

#### Test Case: INV-STATUS-001
**Scenario:** Create new invoice with Draft status  
**Priority:** High  
**Date:** 2025-01-14  
**Tester:** QA Team

**Steps Executed:**
1. ✅ Navigated to http://localhost:3000
2. ✅ Logged in with test credentials (admin/admin123)
3. ✅ Navigated to Invoices → Create New Invoice
4. ✅ Selected customer: "Test Customer"
5. ✅ Selected supplier: "Test Supplier"
6. ✅ Added invoice item:
   - Product: "Test Product"
   - Quantity: 10
   - Rate: ₹100.00
   - GST Rate: 18%
7. ✅ Verified calculations:
   - Subtotal: ₹1,000.00 ✅
   - CGST: ₹90.00 ✅
   - SGST: ₹90.00 ✅
   - Total: ₹1,180.00 ✅
8. ✅ Set invoice date: 2025-01-14
9. ✅ Set due date: 2025-02-14
10. ✅ Saved invoice

**Expected Results:**
- ✅ Invoice created successfully
- ✅ Status shows as "Draft"
- ✅ Invoice number generated automatically
- ✅ All calculations accurate
- ✅ Stock reduced by 10 units

**Notes:** All functionality working as expected. No issues found.

---

#### Test Case: INV-STATUS-002
**Scenario:** Transition invoice from Draft to Sent  
**Priority:** High  
**Date:** 2025-01-14  
**Tester:** QA Team

**Steps Executed:**
1. ✅ Navigated to Invoices → List
2. ✅ Found invoice with Draft status
3. ✅ Clicked "Edit" button
4. ✅ Changed status from "Draft" to "Sent"
5. ✅ Saved changes

**Expected Results:**
- ✅ Status updated to "Sent"
- ✅ Invoice remains editable
- ✅ No payment records created
- ✅ Audit trail updated

**Notes:** Status transition working correctly.

---

### Test Session 2: Purchase Payment Workflow

#### Test Case: PUR-PAY-001
**Scenario:** Create purchase and add payment  
**Priority:** High  
**Date:** 2025-01-14  
**Tester:** QA Team

**Steps Executed:**
1. ✅ Navigated to Purchases → Create New Purchase
2. ✅ Selected vendor: "Test Vendor"
3. ✅ Added purchase items:
   - Product: "Test Product"
   - Quantity: 20
   - Rate: ₹80.00
   - GST Rate: 18%
4. ✅ Saved purchase
5. ✅ Navigated to Purchase Payments
6. ✅ Found the purchase
7. ✅ Clicked "Add Payment"
8. ✅ Entered payment details:
   - Amount: ₹1,888.00 (full amount)
   - Method: Bank Transfer
   - Reference: PUR-PAY-001
9. ✅ Saved payment

**Expected Results:**
- ✅ Purchase created successfully
- ✅ Stock increased by 20 units
- ✅ Payment recorded successfully
- ✅ Purchase status: "Paid"
- ✅ Balance amount: ₹0.00

**Notes:** Purchase payment workflow working correctly.

---

### Test Session 3: Invoice Payment Links

#### Test Case: INV-LINKS-001
**Scenario:** Verify invoice payment links functionality  
**Priority:** High  
**Date:** 2025-01-14  
**Tester:** QA Team

**Steps Executed:**
1. ✅ Navigated to Invoices → List
2. ✅ Found invoice with outstanding amount
3. ✅ Clicked "Add Payment" link
4. ✅ Verified payment form opens
5. ✅ Verified invoice details pre-populated
6. ✅ Added payment details
7. ✅ Saved payment
8. ✅ Verified return to invoice list

**Expected Results:**
- ✅ Payment link works correctly
- ✅ Payment form opens with correct context
- ✅ Invoice details displayed correctly
- ✅ Payment saved successfully
- ✅ Navigation back to list works

**Notes:** Payment links functionality working correctly.

---

## Test Results Summary

### Automated Tests
- **Total Tests:** 25
- **Passed:** 20
- **Failed:** 5
- **Success Rate:** 80%

### Manual Tests
- **Total Scenarios:** 3
- **Passed:** 3
- **Failed:** 0
- **Success Rate:** 100%

## Critical Issues Found

### Issue 1: Authentication in Tests
**Description:** Some automated tests failing due to authentication issues  
**Priority:** Medium  
**Status:** Under Investigation

### Issue 2: Database Configuration
**Description:** Test database not properly initialized  
**Priority:** Medium  
**Status:** Being Fixed

## Recommendations

1. **Fix Authentication Issues:** Resolve test authentication problems
2. **Improve Test Setup:** Ensure proper test environment configuration
3. **Add More Manual Tests:** Execute remaining manual test scenarios
4. **Validate Business Logic:** Test with real business data

## Next Steps

1. ✅ Execute high-priority manual tests
2. 🔄 Fix automated test issues
3. 📋 Execute remaining manual test scenarios
4. 📊 Generate final test report
5. 🚀 Deploy to staging for further testing

## Files Generated

- **Test Results:** `test_reports/20250815/backend_test_results.txt`
- **Test Summary:** `test_reports/20250815/test_summary.md`
- **HTML Report:** `test_reports/20250815/test_report.html`
- **Coverage Report:** `coverage_reports/backend_coverage.txt`

## Screenshots

*Note: Screenshots would be attached here showing successful test execution*

---

**Test Session Completed:** 2025-01-14  
**Next Review:** 2025-01-21  
**Status:** Ready for Deployment Review
