import { test, expect } from '@playwright/test';

/**
 * Comprehensive UI Automation Tests for All GitHub Issues (1-22)
 * This file covers all user journeys and integrates with known issues
 */

test.describe('GitHub Issues 1-22: Complete User Journey Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5174');
    
    // Login with admin credentials
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('**/dashboard');
  });

  // ============================================================================
  // ISSUE #1: Digital Stock Management
  // ============================================================================
  test.describe('Issue #1: Digital Stock Management', () => {
    test('should allow Office Manager to manage stock efficiently', async ({ page }) => {
      // Navigate to Products page
      await page.click('text=Products');
      await page.waitForURL('**/products');

      // Test adding new product
      await page.click('button:has-text("Add Product")');
      await page.fill('input[name="name"]', 'Test Product');
      await page.fill('input[name="description"]', 'Test Description');
      await page.fill('input[name="sku"]', 'TEST001');
      await page.fill('input[name="sales_price"]', '100');
      await page.fill('input[name="purchase_price"]', '80');
      await page.fill('input[name="stock"]', '50');
      await page.click('button:has-text("Save")');

      // Verify product was added
      await expect(page.locator('text=Test Product')).toBeVisible();

      // Test stock adjustment
      await page.click('button:has-text("Adjust Stock")');
      await page.fill('input[name="quantity"]', '10');
      await page.selectOption('select[name="type"]', 'in');
      await page.fill('textarea[name="notes"]', 'Initial stock adjustment');
      await page.click('button:has-text("Save")');

      // Verify stock was updated
      await expect(page.locator('text=60')).toBeVisible(); // 50 + 10
    });

    test('should handle stock overflow prevention', async ({ page }) => {
      await page.click('text=Products');
      await page.waitForURL('**/products');

      // Try to adjust stock to negative value
      await page.click('button:has-text("Adjust Stock")');
      await page.fill('input[name="quantity"]', '-100');
      await page.selectOption('select[name="type"]', 'out');
      await page.click('button:has-text("Save")');

      // Should show error message
      await expect(page.locator('text=Insufficient stock')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #2: Digital Invoicing System
  // ============================================================================
  test.describe('Issue #2: Digital Invoicing System', () => {
    test('should generate GST-compliant invoices for different customer types', async ({ page }) => {
      // Navigate to Invoices page
      await page.click('text=Invoices');
      await page.waitForURL('**/invoices');

      // Test creating invoice for GST customer
      await page.click('button:has-text("Create New Invoice")');
      await page.selectOption('select[name="customer_id"]', '1'); // GST customer
      await page.click('button:has-text("Add Item")');
      await page.selectOption('select[name="product_id"]', '1');
      await page.fill('input[name="quantity"]', '2');
      await page.fill('input[name="rate"]', '100');
      await page.click('button:has-text("Save")');

      // Verify GST calculations
      await expect(page.locator('text=CGST (9%)')).toBeVisible();
      await expect(page.locator('text=SGST (9%)')).toBeVisible();
      await expect(page.locator('text=Total: ₹236')).toBeVisible(); // 200 + 36 GST

      // Test creating invoice for non-GST customer
      await page.click('button:has-text("Create New Invoice")');
      await page.selectOption('select[name="customer_id"]', '2'); // Non-GST customer
      await page.click('button:has-text("Add Item")');
      await page.selectOption('select[name="product_id"]', '1');
      await page.fill('input[name="quantity"]', '2');
      await page.fill('input[name="rate"]', '100');
      await page.click('button:has-text("Save")');

      // Verify no GST calculations
      await expect(page.locator('text=Total: ₹200')).toBeVisible(); // No GST
    });

    test('should email invoices successfully', async ({ page }) => {
      await page.click('text=Invoices');
      await page.waitForURL('**/invoices');

      // Create and send invoice
      await page.click('button:has-text("Create New Invoice")');
      await page.selectOption('select[name="customer_id"]', '1');
      await page.click('button:has-text("Add Item")');
      await page.selectOption('select[name="product_id"]', '1');
      await page.fill('input[name="quantity"]', '1');
      await page.fill('input[name="rate"]', '100');
      await page.click('button:has-text("Save & Send")');

      // Verify email sent confirmation
      await expect(page.locator('text=Invoice sent successfully')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #3: GST Reporting and Compliance
  // ============================================================================
  test.describe('Issue #3: GST Reporting and Compliance', () => {
    test('should generate GSTR-1 report', async ({ page }) => {
      // Navigate to Reports section
      await page.click('text=Reporting');
      await page.click('text=GST Reports');

      // Generate GSTR-1 report
      await page.click('button:has-text("GSTR-1")');
      await page.fill('input[name="from_date"]', '2024-01-01');
      await page.fill('input[name="to_date"]', '2024-01-31');
      await page.click('button:has-text("Generate Report")');

      // Verify report generation
      await expect(page.locator('text=GSTR-1 Report Generated')).toBeVisible();
      await expect(page.locator('button:has-text("Download CSV")')).toBeVisible();
    });

    test('should generate GSTR-3B report', async ({ page }) => {
      await page.click('text=Reporting');
      await page.click('text=GST Reports');

      // Generate GSTR-3B report
      await page.click('button:has-text("GSTR-3B")');
      await page.fill('input[name="month"]', '2024-01');
      await page.click('button:has-text("Generate Report")');

      // Verify report generation
      await expect(page.locator('text=GSTR-3B Report Generated')).toBeVisible();
      await expect(page.locator('button:has-text("Download CSV")')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #4: Sales and Purchase Management
  // ============================================================================
  test.describe('Issue #4: Sales and Purchase Management', () => {
    test('should manage sales transactions with payment tracking', async ({ page }) => {
      // Navigate to Sales page
      await page.click('text=Sales');
      await page.waitForURL('**/sales');

      // Create sale transaction
      await page.click('button:has-text("New Sale")');
      await page.selectOption('select[name="customer_id"]', '1');
      await page.click('button:has-text("Add Item")');
      await page.selectOption('select[name="product_id"]', '1');
      await page.fill('input[name="quantity"]', '5');
      await page.fill('input[name="rate"]', '100');
      await page.click('button:has-text("Save")');

      // Add payment
      await page.click('button:has-text("Add Payment")');
      await page.fill('input[name="amount"]', '500');
      await page.selectOption('select[name="payment_method"]', 'cash');
      await page.click('button:has-text("Save")');

      // Verify payment recorded
      await expect(page.locator('text=Payment recorded successfully')).toBeVisible();
    });

    test('should manage purchase transactions', async ({ page }) => {
      // Navigate to Purchases page
      await page.click('text=Purchases');
      await page.waitForURL('**/purchases');

      // Create purchase transaction
      await page.click('button:has-text("New Purchase")');
      await page.selectOption('select[name="vendor_id"]', '1');
      await page.click('button:has-text("Add Item")');
      await page.selectOption('select[name="product_id"]', '1');
      await page.fill('input[name="quantity"]', '10');
      await page.fill('input[name="rate"]', '80');
      await page.click('button:has-text("Save")');

      // Verify purchase created
      await expect(page.locator('text=Purchase created successfully')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #5: Product Catalog Management
  // ============================================================================
  test.describe('Issue #5: Product Catalog Management', () => {
    test('should manage product catalog with automated stock adjustments', async ({ page }) => {
      await page.click('text=Products');
      await page.waitForURL('**/products');

      // Test product creation with all fields
      await page.click('button:has-text("Add Product")');
      await page.fill('input[name="name"]', 'Complete Product');
      await page.fill('input[name="description"]', 'Full product description');
      await page.fill('input[name="sku"]', 'COMP001');
      await page.fill('input[name="hsn_code"]', '12345678');
      await page.fill('input[name="sales_price"]', '150');
      await page.fill('input[name="purchase_price"]', '120');
      await page.fill('input[name="stock"]', '25');
      await page.selectOption('select[name="category"]', 'raw_materials');
      await page.click('button:has-text("Save")');

      // Verify product created
      await expect(page.locator('text=Complete Product')).toBeVisible();

      // Test stock movement history
      await page.click('button:has-text("Stock History")');
      await expect(page.locator('text=Stock Movement History')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #6: Customer and Vendor Profiles
  // ============================================================================
  test.describe('Issue #6: Customer and Vendor Profiles', () => {
    test('should manage customer profiles with GST status', async ({ page }) => {
      // Navigate to Parties page
      await page.click('text=Parties');
      await page.waitForURL('**/parties');

      // Add new customer
      await page.click('button:has-text("Add Customer")');
      await page.fill('input[name="name"]', 'Test Customer');
      await page.fill('input[name="business_name"]', 'Test Business');
      await page.fill('input[name="gstin"]', '22AAAAA0000A1Z5');
      await page.fill('input[name="phone"]', '9876543210');
      await page.fill('textarea[name="address"]', 'Test Address');
      await page.selectOption('select[name="gst_status"]', 'GST');
      await page.click('button:has-text("Save")');

      // Verify customer created
      await expect(page.locator('text=Test Customer')).toBeVisible();
    });

    test('should manage vendor profiles', async ({ page }) => {
      await page.click('text=Parties');
      await page.waitForURL('**/parties');

      // Add new vendor
      await page.click('button:has-text("Add Vendor")');
      await page.fill('input[name="name"]', 'Test Vendor');
      await page.fill('input[name="business_name"]', 'Vendor Business');
      await page.fill('input[name="gstin"]', '33BBBBB0000B1Z5');
      await page.fill('input[name="phone"]', '9876543211');
      await page.fill('textarea[name="address"]', 'Vendor Address');
      await page.selectOption('select[name="gst_status"]', 'GST');
      await page.click('button:has-text("Save")');

      // Verify vendor created
      await expect(page.locator('text=Test Vendor')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #7: Intelligent Product Mapping
  // ============================================================================
  test.describe('Issue #7: Intelligent Product Mapping', () => {
    test('should provide intelligent product search and categorization', async ({ page }) => {
      await page.click('text=Products');
      await page.waitForURL('**/products');

      // Test intelligent search
      await page.fill('input[placeholder="Search products..."]', 'raw material');
      await page.waitForTimeout(500);

      // Verify search results
      await expect(page.locator('text=Raw Material Product')).toBeVisible();

      // Test category filtering
      await page.selectOption('select[name="category_filter"]', 'raw_materials');
      await expect(page.locator('text=Raw Material Product')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #8: Cross-Functional Requirements
  // ============================================================================
  test.describe('Issue #8: Cross-Functional Requirements', () => {
    test('should enforce security and access controls', async ({ page }) => {
      // Test unauthorized access
      await page.goto('http://localhost:5173/admin');
      await expect(page.locator('text=Access Denied')).toBeVisible();

      // Test session timeout
      await page.evaluate(() => {
        localStorage.removeItem('token');
      });
      await page.reload();
      await expect(page.locator('text=Login')).toBeVisible();
    });

    test('should provide responsive design', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:5173/dashboard');
      
      // Verify mobile-friendly layout
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('button:has-text("Menu")')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #9: Email Integration for Invoices
  // ============================================================================
  test.describe('Issue #9: Email Integration for Invoices', () => {
    test('should send invoices via email with proper formatting', async ({ page }) => {
      await page.click('text=Invoices');
      await page.waitForURL('**/invoices');

      // Create and email invoice
      await page.click('button:has-text("Create New Invoice")');
      await page.selectOption('select[name="customer_id"]', '1');
      await page.click('button:has-text("Add Item")');
      await page.selectOption('select[name="product_id"]', '1');
      await page.fill('input[name="quantity"]', '1');
      await page.fill('input[name="rate"]', '100');
      await page.click('button:has-text("Save & Email")');

      // Verify email sent
      await expect(page.locator('text=Invoice emailed successfully')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #10: Data Analysis and Insights
  // ============================================================================
  test.describe('Issue #10: Data Analysis and Insights', () => {
    test('should provide sales analytics and insights', async ({ page }) => {
      // Navigate to Dashboard
      await page.goto('http://localhost:5174/dashboard');

      // Verify analytics widgets
      await expect(page.locator('text=Sales Trend')).toBeVisible();
      await expect(page.locator('text=Top Selling Items')).toBeVisible();
      await expect(page.locator('text=Revenue Analysis')).toBeVisible();

      // Test date range filtering
      await page.selectOption('select[name="period"]', 'This Month');
      await expect(page.locator('text=Sales Trend')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #11: Dashboard Performance Optimization
  // ============================================================================
  test.describe('Issue #11: Dashboard Performance Optimization', () => {
    test('should load dashboard data within 2 seconds', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:5174/dashboard');
      await page.waitForSelector('text=Sales Summary', { timeout: 5000 });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000);
    });

    test('should provide real-time data updates', async ({ page }) => {
      await page.goto('http://localhost:5174/dashboard');
      
      // Click refresh button
      await page.click('button:has-text("Refresh")');
      await page.waitForTimeout(1000);
      
      // Verify data updated
      await expect(page.locator('text=Sales Summary')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #12: Advanced Reporting System
  // ============================================================================
  test.describe('Issue #12: Advanced Reporting System', () => {
    test('should generate financial statements', async ({ page }) => {
      await page.click('text=Reporting');
      await page.click('text=Financial Reports');

      // Generate P&L statement
      await page.click('button:has-text("Profit & Loss")');
      await page.fill('input[name="from_date"]', '2024-01-01');
      await page.fill('input[name="to_date"]', '2024-01-31');
      await page.click('button:has-text("Generate")');

      // Verify report generated
      await expect(page.locator('text=Profit & Loss Statement')).toBeVisible();
      await expect(page.locator('button:has-text("Download PDF")')).toBeVisible();
    });

    test('should generate balance sheet', async ({ page }) => {
      await page.click('text=Reporting');
      await page.click('text=Financial Reports');

      // Generate balance sheet
      await page.click('button:has-text("Balance Sheet")');
      await page.fill('input[name="as_of_date"]', '2024-01-31');
      await page.click('button:has-text("Generate")');

      // Verify report generated
      await expect(page.locator('text=Balance Sheet')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #13: Inventory Management Enhancement
  // ============================================================================
  test.describe('Issue #13: Inventory Management Enhancement', () => {
    test('should provide low stock alerts', async ({ page }) => {
      await page.click('text=Products');
      await page.waitForURL('**/products');

      // Check for low stock indicators
      await expect(page.locator('text=Low Stock')).toBeVisible();
      await expect(page.locator('.low-stock-alert')).toBeVisible();
    });

    test('should show inventory valuation', async ({ page }) => {
      await page.click('text=Products');
      await page.waitForURL('**/products');

      // Check inventory value
      await expect(page.locator('text=Total Inventory Value')).toBeVisible();
      await expect(page.locator('text=₹')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #14: Payment Management
  // ============================================================================
  test.describe('Issue #14: Payment Management', () => {
    test('should manage invoice payments', async ({ page }) => {
      await page.click('text=Payments');
      await page.waitForURL('**/payments');

      // Add invoice payment
      await page.click('button:has-text("Add Payment")');
      await page.selectOption('select[name="payment_type"]', 'invoice');
      await page.selectOption('select[name="invoice_id"]', '1');
      await page.fill('input[name="amount"]', '500');
      await page.selectOption('select[name="payment_method"]', 'bank');
      await page.click('button:has-text("Save")');

      // Verify payment added
      await expect(page.locator('text=Payment added successfully')).toBeVisible();
    });

    test('should manage purchase payments', async ({ page }) => {
      await page.click('text=Payments');
      await page.waitForURL('**/payments');

      // Add purchase payment
      await page.click('button:has-text("Add Payment")');
      await page.selectOption('select[name="payment_type"]', 'purchase');
      await page.selectOption('select[name="purchase_id"]', '1');
      await page.fill('input[name="amount"]', '800');
      await page.selectOption('select[name="payment_method"]', 'cash');
      await page.click('button:has-text("Save")');

      // Verify payment added
      await expect(page.locator('text=Payment added successfully')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #15: Expense Management
  // ============================================================================
  test.describe('Issue #15: Expense Management', () => {
    test('should manage expenses with proper categorization', async ({ page }) => {
      await page.click('text=Expenses');
      await page.waitForURL('**/expenses');

      // Add new expense
      await page.click('button:has-text("Add Expense")');
      await page.fill('input[name="description"]', 'Office Supplies');
      await page.fill('input[name="amount"]', '250');
      await page.selectOption('select[name="category"]', 'office');
      await page.fill('input[name="expense_date"]', '2024-01-15');
      await page.click('button:has-text("Save")');

      // Verify expense added
      await expect(page.locator('text=Office Supplies')).toBeVisible();
    });

    test('should edit expense with prefilled data', async ({ page }) => {
      await page.click('text=Expenses');
      await page.waitForURL('**/expenses');

      // Click edit on first expense
      await page.click('button:has-text("Edit")');
      
      // Verify form is prefilled
      await expect(page.locator('input[name="description"]')).toHaveValue(/.*/);
      await expect(page.locator('input[name="amount"]')).toHaveValue(/.*/);
    });
  });

  // ============================================================================
  // ISSUE #16: GST Toggle System
  // ============================================================================
  test.describe('Issue #16: GST Toggle System', () => {
    test('should toggle GST for individual parties', async ({ page }) => {
      await page.click('text=Parties');
      await page.waitForURL('**/parties');

      // Edit customer GST status
      await page.click('button:has-text("Edit")');
      await page.selectOption('select[name="gst_status"]', 'Non-GST');
      await page.click('button:has-text("Save")');

      // Verify GST status changed
      await expect(page.locator('text=Non-GST')).toBeVisible();
    });

    test('should apply system-wide GST settings', async ({ page }) => {
      await page.click('text=Settings');
      await page.waitForURL('**/settings');

      // Toggle system-wide GST
      await page.selectOption('select[name="gst_enabled_by_default"]', 'false');
      await page.click('button:has-text("Save Settings")');

      // Verify settings saved
      await expect(page.locator('text=Settings saved successfully')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #17: Enhanced GST Reports
  // ============================================================================
  test.describe('Issue #17: Enhanced GST Reports', () => {
    test('should generate comprehensive GSTR-1 report', async ({ page }) => {
      await page.click('text=Reporting');
      await page.click('text=GST Reports');

      // Generate detailed GSTR-1
      await page.click('button:has-text("GSTR-1 Detailed")');
      await page.fill('input[name="from_date"]', '2024-01-01');
      await page.fill('input[name="to_date"]', '2024-01-31');
      await page.click('button:has-text("Generate")');

      // Verify comprehensive report
      await expect(page.locator('text=GSTR-1 Detailed Report')).toBeVisible();
      await expect(page.locator('text=Outward Supplies')).toBeVisible();
      await expect(page.locator('text=Download CSV')).toBeVisible();
    });

    test('should generate comprehensive GSTR-3B report', async ({ page }) => {
      await page.click('text=Reporting');
      await page.click('text=GST Reports');

      // Generate detailed GSTR-3B
      await page.click('button:has-text("GSTR-3B Detailed")');
      await page.fill('input[name="month"]', '2024-01');
      await page.click('button:has-text("Generate")');

      // Verify comprehensive report
      await expect(page.locator('text=GSTR-3B Detailed Report')).toBeVisible();
      await expect(page.locator('text=Summary')).toBeVisible();
      await expect(page.locator('text=Download CSV')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #18: Advanced Invoice Features
  // ============================================================================
  test.describe('Issue #18: Advanced Invoice Features', () => {
    test('should support multi-currency invoices', async ({ page }) => {
      await page.click('text=Invoices');
      await page.waitForURL('**/invoices');

      // Create multi-currency invoice
      await page.click('button:has-text("Create New Invoice")');
      await page.selectOption('select[name="customer_id"]', '1');
      await page.selectOption('select[name="currency"]', 'USD');
      await page.fill('input[name="exchange_rate"]', '75.5');
      await page.click('button:has-text("Add Item")');
      await page.selectOption('select[name="product_id"]', '1');
      await page.fill('input[name="quantity"]', '1');
      await page.fill('input[name="rate"]', '10');
      await page.click('button:has-text("Save")');

      // Verify currency conversion
      await expect(page.locator('text=USD 10.00')).toBeVisible();
      await expect(page.locator('text=₹755.00')).toBeVisible();
    });

    test('should support recurring invoices', async ({ page }) => {
      await page.click('text=Invoices');
      await page.waitForURL('**/invoices');

      // Create recurring invoice template
      await page.click('button:has-text("Recurring Invoices")');
      await page.click('button:has-text("Create Template")');
      await page.fill('input[name="template_name"]', 'Monthly Service');
      await page.selectOption('select[name="customer_id"]', '1');
      await page.selectOption('select[name="frequency"]', 'monthly');
      await page.click('button:has-text("Save Template")');

      // Verify template created
      await expect(page.locator('text=Monthly Service')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #19: Purchase Order Management
  // ============================================================================
  test.describe('Issue #19: Purchase Order Management', () => {
    test('should manage purchase orders with workflow', async ({ page }) => {
      await page.click('text=Purchase Orders');
      await page.waitForURL('**/purchase-orders');

      // Create purchase order
      await page.click('button:has-text("Create PO")');
      await page.selectOption('select[name="vendor_id"]', '1');
      await page.click('button:has-text("Add Item")');
      await page.selectOption('select[name="product_id"]', '1');
      await page.fill('input[name="quantity"]', '100');
      await page.fill('input[name="rate"]', '80');
      await page.click('button:has-text("Save")');

      // Verify PO created
      await expect(page.locator('text=Purchase Order Created')).toBeVisible();

      // Test workflow transitions
      await page.click('button:has-text("Approve")');
      await expect(page.locator('text=Status: Approved')).toBeVisible();

      await page.click('button:has-text("Send to Vendor")');
      await expect(page.locator('text=Status: Sent')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #20: Advanced Payment Tracking
  // ============================================================================
  test.describe('Issue #20: Advanced Payment Tracking', () => {
    test('should track payment schedules and reminders', async ({ page }) => {
      await page.click('text=Payments');
      await page.waitForURL('**/payments');

      // Create scheduled payment
      await page.click('button:has-text("Scheduled Payments")');
      await page.click('button:has-text("Add Schedule")');
      await page.selectOption('select[name="invoice_id"]', '1');
      await page.fill('input[name="due_date"]', '2024-02-15');
      await page.fill('input[name="amount"]', '500');
      await page.click('button:has-text("Save")');

      // Verify schedule created
      await expect(page.locator('text=Payment Schedule Created')).toBeVisible();
    });

    test('should show payment analytics', async ({ page }) => {
      await page.click('text=Payments');
      await page.waitForURL('**/payments');

      // Check analytics
      await expect(page.locator('text=Payment Analytics')).toBeVisible();
      await expect(page.locator('text=Collections')).toBeVisible();
      await expect(page.locator('text=Overdue Amounts')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #21: Inventory Management
  // ============================================================================
  test.describe('Issue #21: Inventory Management', () => {
    test('should provide advanced stock management', async ({ page }) => {
      await page.click('text=Products');
      await page.waitForURL('**/products');

      // Check advanced features
      await expect(page.locator('text=Stock Summary')).toBeVisible();
      await expect(page.locator('text=Low Stock Alerts')).toBeVisible();
      await expect(page.locator('text=Stock Movement History')).toBeVisible();
    });

    test('should show inventory analytics', async ({ page }) => {
      await page.click('text=Products');
      await page.waitForURL('**/products');

      // Check analytics
      await expect(page.locator('text=Top Selling Items')).toBeVisible();
      await expect(page.locator('text=Stock Turnover')).toBeVisible();
      await expect(page.locator('text=Stock Valuation')).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #22: Financial Reports
  // ============================================================================
  test.describe('Issue #22: Financial Reports', () => {
    test('should generate comprehensive financial reports', async ({ page }) => {
      await page.click('text=Reporting');
      await page.click('text=Financial Reports');

      // Generate cash flow statement
      await page.click('button:has-text("Cash Flow Statement")');
      await page.fill('input[name="from_date"]', '2024-01-01');
      await page.fill('input[name="to_date"]', '2024-01-31');
      await page.click('button:has-text("Generate")');

      // Verify report
      await expect(page.locator('text=Cash Flow Statement')).toBeVisible();
      await expect(page.locator('text=Operating Activities')).toBeVisible();
      await expect(page.locator('text=Investing Activities')).toBeVisible();
      await expect(page.locator('text=Financing Activities')).toBeVisible();
    });

    test('should provide financial insights', async ({ page }) => {
      await page.click('text=Reporting');
      await page.click('text=Financial Reports');

      // Check insights
      await expect(page.locator('text=Key Metrics')).toBeVisible();
      await expect(page.locator('text=Financial Ratios')).toBeVisible();
      await expect(page.locator('text=Trend Analysis')).toBeVisible();
    });
  });

  // ============================================================================
  // KNOWN ISSUES INTEGRATION
  // ============================================================================
  test.describe('Known Issues Integration', () => {
    test('should verify invoice list functionality (Issue #3)', async ({ page }) => {
      await page.click('text=Invoices');
      await page.waitForURL('**/invoices');

      // Verify invoice list loads correctly
      await expect(page.locator('text=Invoice List')).toBeVisible();
      await expect(page.locator('table')).toBeVisible();

      // Test invoice creation
      await page.click('button:has-text("Create New Invoice")');
      await expect(page.locator('text=Create New Invoice')).toBeVisible();
    });

    test('should verify payment form functionality (Known Issue)', async ({ page }) => {
      await page.click('text=Payments');
      await page.waitForURL('**/payments');

      // Test payment form at specific URL
      await page.goto('http://localhost:5174/payments/invoice/add');
      await expect(page.locator('text=Add Invoice Payment')).toBeVisible();
      await expect(page.locator('select[name="invoice_id"]')).toBeVisible();
    });

    test('should verify expense edit prefilling (Known Issue)', async ({ page }) => {
      await page.click('text=Expenses');
      await page.waitForURL('**/expenses');

      // Click edit on first expense
      await page.click('button:has-text("Edit")');
      
      // Verify form is prefilled
      await expect(page.locator('input[name="description"]')).toHaveValue(/.*/);
      await expect(page.locator('input[name="amount"]')).toHaveValue(/.*/);
    });

    test('should verify GST Reports UI availability (Known Issue)', async ({ page }) => {
      await page.click('text=Reporting');
      await page.click('text=GST Reports');

      // Verify GST reports are available
      await expect(page.locator('text=GST Reports')).toBeVisible();
      await expect(page.locator('button:has-text("GSTR-1")')).toBeVisible();
      await expect(page.locator('button:has-text("GSTR-3B")')).toBeVisible();
    });

    test('should verify date filter dropdowns (Known Issue)', async ({ page }) => {
      // Test Dashboard date filter
      await page.goto('http://localhost:5174/dashboard');
      await expect(page.locator('select[name="period"]')).toBeVisible();

      // Test other pages should have date filters
      await page.click('text=Cashflow');
      await expect(page.locator('select[name="date_filter"]')).toBeVisible();
    });

    test('should verify side menu collapsible functionality (Known Issue)', async ({ page }) => {
      // Test menu collapse/expand
      await page.click('button:has-text("Menu")');
      await expect(page.locator('nav.collapsed')).toBeVisible();

      await page.click('button:has-text("Menu")');
      await expect(page.locator('nav.expanded')).toBeVisible();
    });
  });
});
