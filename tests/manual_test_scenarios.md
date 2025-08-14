# Manual Testing Scenarios - IPSC Application

## Version: 1.37.1
**Date:** 2025-01-14  
**Test Environment:** Development/Staging  
**Tester:** QA Team

## Overview
This document contains comprehensive manual testing scenarios for all user stories and business workflows in the IPSC application.

## Test Environment Setup

### Prerequisites
- [ ] Application deployed and accessible
- [ ] Test database with sample data
- [ ] Test user accounts created
- [ ] Browser compatibility verified
- [ ] Network connectivity stable

### Test Data Requirements
- [ ] Sample customers (5+)
- [ ] Sample vendors (5+)
- [ ] Sample products (10+)
- [ ] Sample invoices (10+)
- [ ] Sample purchases (10+)
- [ ] Sample payments (20+)

## 1. Invoice Status Management - Manual Test Scenarios

### 1.1 Invoice Creation Workflow

#### Test Case: INV-STATUS-001
**Scenario:** Create new invoice with Draft status
**Priority:** High
**Preconditions:** Customer and supplier exist, products available

**Steps:**
1. Navigate to Invoices → Create New Invoice
2. Select customer from dropdown
3. Select supplier from dropdown
4. Add invoice items:
   - Product: Test Product
   - Quantity: 10
   - Rate: ₹100.00
   - GST Rate: 18%
5. Verify calculations:
   - Subtotal: ₹1,000.00
   - CGST: ₹90.00
   - SGST: ₹90.00
   - Total: ₹1,180.00
6. Set invoice date: 2025-01-14
7. Set due date: 2025-02-14
8. Save invoice

**Expected Results:**
- [ ] Invoice created successfully
- [ ] Status shows as "Draft"
- [ ] Invoice number generated automatically
- [ ] All calculations accurate
- [ ] Stock reduced by 10 units

**Test Data:**
- Customer: Test Customer
- Supplier: Test Supplier
- Product: Test Product (Stock: 50)

---

#### Test Case: INV-STATUS-002
**Scenario:** Transition invoice from Draft to Sent
**Priority:** High
**Preconditions:** Invoice exists with Draft status

**Steps:**
1. Navigate to Invoices → List
2. Find invoice with Draft status
3. Click "Edit" button
4. Change status from "Draft" to "Sent"
5. Save changes

**Expected Results:**
- [ ] Status updated to "Sent"
- [ ] Invoice remains editable
- [ ] No payment records created
- [ ] Audit trail updated

---

#### Test Case: INV-STATUS-003
**Scenario:** Add partial payment to Sent invoice
**Priority:** High
**Preconditions:** Invoice exists with Sent status

**Steps:**
1. Navigate to Invoices → List
2. Find invoice with Sent status
3. Click "Add Payment" button
4. Enter payment details:
   - Amount: ₹500.00
   - Method: Bank Transfer
   - Reference: PAY-001
   - Notes: Partial payment
5. Save payment

**Expected Results:**
- [ ] Payment recorded successfully
- [ ] Invoice status changes to "Partially Paid"
- [ ] Paid amount: ₹500.00
- [ ] Balance amount: ₹680.00
- [ ] Payment appears in payment history

---

#### Test Case: INV-STATUS-004
**Scenario:** Complete payment for invoice
**Priority:** High
**Preconditions:** Invoice exists with Partially Paid status

**Steps:**
1. Navigate to Invoices → List
2. Find invoice with Partially Paid status
3. Click "Add Payment" button
4. Enter remaining amount: ₹680.00
5. Save payment

**Expected Results:**
- [ ] Payment recorded successfully
- [ ] Invoice status changes to "Paid"
- [ ] Paid amount: ₹1,180.00
- [ ] Balance amount: ₹0.00
- [ ] Invoice marked as completed

---

#### Test Case: INV-STATUS-005
**Scenario:** Overdue invoice detection
**Priority:** Medium
**Preconditions:** Invoice exists with past due date

**Steps:**
1. Create invoice with due date: 2024-12-01
2. Navigate to Invoices → List
3. Check invoice status

**Expected Results:**
- [ ] Invoice shows as "Overdue"
- [ ] Visual indicator (red color) displayed
- [ ] Overdue amount calculated correctly
- [ ] Days overdue shown

---

#### Test Case: INV-STATUS-006
**Scenario:** Invalid status transitions
**Priority:** Medium
**Preconditions:** Invoice exists with Draft status

**Steps:**
1. Navigate to Invoices → List
2. Find invoice with Draft status
3. Try to change status directly to "Paid"
4. Try to change status to invalid value

**Expected Results:**
- [ ] Error message displayed for invalid transitions
- [ ] Status remains unchanged
- [ ] Validation prevents invalid status values

---

### 1.2 Bulk Operations

#### Test Case: INV-STATUS-007
**Scenario:** Bulk status update for multiple invoices
**Priority:** Medium
**Preconditions:** Multiple invoices exist with Draft status

**Steps:**
1. Navigate to Invoices → List
2. Select multiple invoices using checkboxes
3. Click "Bulk Actions" → "Mark as Sent"
4. Confirm action

**Expected Results:**
- [ ] All selected invoices status updated to "Sent"
- [ ] Success message displayed
- [ ] Audit trail updated for all invoices

---

### 1.3 Edge Cases

#### Test Case: INV-STATUS-008
**Scenario:** Zero amount invoice
**Priority:** Low
**Preconditions:** Product with zero price exists

**Steps:**
1. Create invoice with zero-priced items
2. Save invoice
3. Check status

**Expected Results:**
- [ ] Invoice created successfully
- [ ] Status automatically set to "Paid"
- [ ] No payment required

---

#### Test Case: INV-STATUS-009
**Scenario:** Large amount invoice
**Priority:** Low
**Preconditions:** Product with high price exists

**Steps:**
1. Create invoice with large amounts (₹999,999.99)
2. Save invoice
3. Verify calculations

**Expected Results:**
- [ ] Invoice created successfully
- [ ] All calculations accurate
- [ ] No overflow errors

---

## 2. Purchase Payment Workflow - Manual Test Scenarios

### 2.1 Purchase Creation and Payment

#### Test Case: PUR-PAY-001
**Scenario:** Create purchase and add payment
**Priority:** High
**Preconditions:** Vendor exists, products available

**Steps:**
1. Navigate to Purchases → Create New Purchase
2. Select vendor from dropdown
3. Add purchase items:
   - Product: Test Product
   - Quantity: 20
   - Rate: ₹80.00
   - GST Rate: 18%
4. Save purchase
5. Navigate to Purchase Payments
6. Find the purchase
7. Click "Add Payment"
8. Enter payment details:
   - Amount: ₹1,888.00 (full amount)
   - Method: Bank Transfer
   - Reference: PUR-PAY-001
9. Save payment

**Expected Results:**
- [ ] Purchase created successfully
- [ ] Stock increased by 20 units
- [ ] Payment recorded successfully
- [ ] Purchase status: "Paid"
- [ ] Balance amount: ₹0.00

---

#### Test Case: PUR-PAY-002
**Scenario:** Partial payment for purchase
**Priority:** High
**Preconditions:** Purchase exists with outstanding amount

**Steps:**
1. Navigate to Purchase Payments
2. Find purchase with outstanding amount
3. Click "Add Payment"
4. Enter partial amount (50% of total)
5. Save payment

**Expected Results:**
- [ ] Payment recorded successfully
- [ ] Purchase status: "Partially Paid"
- [ ] Outstanding amount updated correctly
- [ ] Payment history updated

---

### 2.2 Payment Validation

#### Test Case: PUR-PAY-003
**Scenario:** Payment amount validation
**Priority:** High
**Preconditions:** Purchase exists

**Steps:**
1. Navigate to Purchase Payments
2. Find purchase
3. Try to add payment exceeding total amount
4. Try to add negative payment amount
5. Try to add zero payment amount

**Expected Results:**
- [ ] Error message for excessive amount
- [ ] Error message for negative amount
- [ ] Error message for zero amount
- [ ] Payment not recorded

---

## 3. Invoice Payment Links - Manual Test Scenarios

### 3.1 Navigation and Links

#### Test Case: INV-LINKS-001
**Scenario:** Verify invoice payment links functionality
**Priority:** High
**Preconditions:** Invoice exists

**Steps:**
1. Navigate to Invoices → List
2. Find invoice with outstanding amount
3. Click "Add Payment" link
4. Verify payment form opens
5. Verify invoice details pre-populated
6. Add payment details
7. Save payment
8. Verify return to invoice list

**Expected Results:**
- [ ] Payment link works correctly
- [ ] Payment form opens with correct context
- [ ] Invoice details displayed correctly
- [ ] Payment saved successfully
- [ ] Navigation back to list works

---

#### Test Case: INV-LINKS-002
**Scenario:** Payment link for paid invoices
**Priority:** Medium
**Preconditions:** Fully paid invoice exists

**Steps:**
1. Navigate to Invoices → List
2. Find fully paid invoice
3. Check for "Add Payment" link
4. Click if available

**Expected Results:**
- [ ] "Add Payment" link not visible or disabled
- [ ] Or link available but shows "No outstanding amount" message

---

## 4. Invoice List Functionality - Manual Test Scenarios

### 4.1 List Display and Filtering

#### Test Case: INV-LIST-001
**Scenario:** Invoice list displays correctly
**Priority:** High
**Preconditions:** Multiple invoices exist

**Steps:**
1. Navigate to Invoices → List
2. Verify all invoices displayed
3. Check pagination if more than 10 invoices
4. Verify sort functionality
5. Test search functionality

**Expected Results:**
- [ ] All invoices displayed correctly
- [ ] Pagination works
- [ ] Sorting works (by date, amount, status)
- [ ] Search works (by invoice number, customer)

---

#### Test Case: INV-LIST-002
**Scenario:** Filter invoices by status
**Priority:** Medium
**Preconditions:** Invoices with different statuses exist

**Steps:**
1. Navigate to Invoices → List
2. Use status filter dropdown
3. Select "Draft" status
4. Verify only draft invoices shown
5. Select "Paid" status
6. Verify only paid invoices shown

**Expected Results:**
- [ ] Filter works correctly
- [ ] Only matching invoices displayed
- [ ] Clear filter option available

---

### 4.2 Invoice Actions

#### Test Case: INV-LIST-003
**Scenario:** Edit invoice from list
**Priority:** High
**Preconditions:** Invoice exists

**Steps:**
1. Navigate to Invoices → List
2. Find invoice
3. Click "Edit" button
4. Modify invoice details
5. Save changes
6. Verify changes reflected in list

**Expected Results:**
- [ ] Edit form opens correctly
- [ ] Changes saved successfully
- [ ] List updated with changes
- [ ] Audit trail updated

---

#### Test Case: INV-LIST-004
**Scenario:** Delete invoice from list
**Priority:** Medium
**Preconditions:** Invoice exists

**Steps:**
1. Navigate to Invoices → List
2. Find invoice
3. Click "Delete" button
4. Confirm deletion
5. Verify invoice removed from list

**Expected Results:**
- [ ] Confirmation dialog appears
- [ ] Invoice deleted successfully
- [ ] List updated
- [ ] Stock restored if applicable

---

## 5. Business Logic Validation - Manual Test Scenarios

### 5.1 GST Calculations

#### Test Case: GST-001
**Scenario:** Verify GST calculations accuracy
**Priority:** High
**Preconditions:** Products with different GST rates exist

**Steps:**
1. Create invoice with multiple items:
   - Item 1: 5 units @ ₹100 (18% GST)
   - Item 2: 3 units @ ₹200 (12% GST)
   - Item 3: 2 units @ ₹50 (0% GST)
2. Verify calculations manually
3. Compare with system calculations

**Expected Results:**
- [ ] Item 1: ₹500 + ₹90 CGST + ₹90 SGST = ₹680
- [ ] Item 2: ₹600 + ₹36 CGST + ₹36 SGST = ₹672
- [ ] Item 3: ₹100 + ₹0 CGST + ₹0 SGST = ₹100
- [ ] Total: ₹1,452

---

### 5.2 Stock Management

#### Test Case: STOCK-001
**Scenario:** Stock updates with transactions
**Priority:** High
**Preconditions:** Product with known stock exists

**Steps:**
1. Note initial stock level
2. Create purchase for 10 units
3. Verify stock increased by 10
4. Create invoice for 5 units
5. Verify stock decreased by 5
6. Check final stock level

**Expected Results:**
- [ ] Stock updates correctly with each transaction
- [ ] No negative stock allowed
- [ ] Stock history maintained

---

### 5.3 Financial Calculations

#### Test Case: FIN-001
**Scenario:** Discount calculations
**Priority:** Medium
**Preconditions:** Product exists

**Steps:**
1. Create invoice with discounts:
   - Item: 10 units @ ₹100
   - Discount: 10% on total
   - GST: 18%
2. Verify calculations:
   - Subtotal: ₹1,000
   - Discount: ₹100
   - Taxable: ₹900
   - GST: ₹162
   - Total: ₹1,062

**Expected Results:**
- [ ] All calculations accurate
- [ ] Discount applied correctly
- [ ] GST calculated on discounted amount

---

## 6. User Interface and Experience - Manual Test Scenarios

### 6.1 Responsive Design

#### Test Case: UI-001
**Scenario:** Mobile responsiveness
**Priority:** Medium
**Preconditions:** Application accessible

**Steps:**
1. Access application on mobile device
2. Navigate through all major screens
3. Test form inputs
4. Test table displays
5. Test navigation menu

**Expected Results:**
- [ ] All screens display correctly
- [ ] Forms usable on mobile
- [ ] Tables scroll horizontally if needed
- [ ] Navigation works on mobile

---

### 6.2 Accessibility

#### Test Case: UI-002
**Scenario:** Keyboard navigation
**Priority:** Medium
**Preconditions:** Application accessible

**Steps:**
1. Use only keyboard to navigate
2. Tab through all form fields
3. Use Enter/Space for buttons
4. Test dropdown selections

**Expected Results:**
- [ ] All elements accessible via keyboard
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Screen reader compatible

---

## 7. Error Handling - Manual Test Scenarios

### 7.1 Network Errors

#### Test Case: ERROR-001
**Scenario:** Network connectivity issues
**Priority:** Medium
**Preconditions:** Application running

**Steps:**
1. Disconnect network
2. Try to save invoice
3. Reconnect network
4. Try to save again

**Expected Results:**
- [ ] Appropriate error message displayed
- [ ] Data not lost
- [ ] Retry mechanism available
- [ ] Success after reconnection

---

### 7.2 Data Validation

#### Test Case: ERROR-002
**Scenario:** Invalid data entry
**Priority:** High
**Preconditions:** Forms accessible

**Steps:**
1. Enter invalid email addresses
2. Enter negative quantities
3. Enter future dates for past invoices
4. Leave required fields empty

**Expected Results:**
- [ ] Validation errors displayed
- [ ] Form submission prevented
- [ ] Clear error messages
- [ ] Focus moved to error field

---

## 8. Performance Testing - Manual Test Scenarios

### 8.1 Load Testing

#### Test Case: PERF-001
**Scenario:** Large dataset handling
**Priority:** Low
**Preconditions:** Large number of records exist

**Steps:**
1. Create 1000+ invoices
2. Navigate to invoice list
3. Test search functionality
4. Test pagination
5. Monitor response times

**Expected Results:**
- [ ] List loads within 3 seconds
- [ ] Search responds within 1 second
- [ ] Pagination works smoothly
- [ ] No timeout errors

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Test environment ready
- [ ] Test data prepared
- [ ] Test accounts created
- [ ] Browser cache cleared
- [ ] Network stable

### Test Execution
- [ ] Execute all high priority tests
- [ ] Execute medium priority tests
- [ ] Execute low priority tests
- [ ] Document all issues found
- [ ] Capture screenshots of issues

### Post-Test Activities
- [ ] Compile test results
- [ ] Create bug reports
- [ ] Update test documentation
- [ ] Generate test summary report

## Issue Reporting Template

### Bug Report Format
```
Bug ID: BUG-001
Title: [Brief description]
Priority: High/Medium/Low
Severity: Critical/Major/Minor
Environment: [Browser/OS/Version]
Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Result: [What should happen]
Actual Result: [What actually happened]
Screenshots: [If applicable]
Additional Notes: [Any other relevant information]
```

## Test Completion Criteria

### Definition of Done
- [ ] All high priority test cases executed
- [ ] All critical bugs fixed and retested
- [ ] All major bugs documented
- [ ] Test results documented
- [ ] Stakeholder approval received

### Exit Criteria
- [ ] Zero critical bugs open
- [ ] All high priority features working
- [ ] Performance criteria met
- [ ] Security requirements satisfied
- [ ] User acceptance criteria met

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-14  
**Next Review:** 2025-01-21  
**Approved By:** QA Lead
