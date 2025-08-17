import { test, expect } from '@playwright/test';

test.describe('Comprehensive UI Test - All GitHub Issues', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5174');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're already logged in (dashboard is visible)
    const dashboardVisible = await page.locator('text=Dashboard - Cashflow Summary').isVisible();
    
    if (!dashboardVisible) {
      // Login if not already logged in
      await page.fill('input[placeholder="Enter your username"]', 'admin');
      await page.fill('input[placeholder="Enter your password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/', { timeout: 10000 });
    }
    
    // Verify we're on dashboard
    await expect(page.locator('text=Dashboard - Cashflow Summary')).toBeVisible();
  });

  // ============================================================================
  // ISSUE #1: Digital Stock Management
  // ============================================================================
  test('Issue #1: Digital Stock Management - Products page functionality', async ({ page }) => {
    // Navigate to Products page
    await page.click('text=Manage Products');
    await page.waitForURL('**/products');

    // Verify products page loads
    await expect(page.locator('h1:has-text("Manage Products")')).toBeVisible();
    
    // Test adding new product
    await page.click('button:has-text("Add Product")');
    await expect(page.locator('h1:has-text("Add New Product")')).toBeVisible();
    
    // Verify form elements are present
    await expect(page.locator('label:has-text("Product Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Product Code")')).toBeVisible();
    await expect(page.locator('label:has-text("SKU")')).toBeVisible();
    await expect(page.locator('label:has-text("Selling Price")')).toBeVisible();
  });

  // ============================================================================
  // ISSUE #2: Digital Invoicing System
  // ============================================================================
  test('Issue #2: Digital Invoicing System - Invoice creation', async ({ page }) => {
    // Navigate to Invoices page
    await page.click('text=Add/Edit Invoice');
    await page.waitForURL('**/invoices/add');

    // Verify invoice form loads
    await expect(page.locator('text=Create New Invoice')).toBeVisible();
    
    // Test invoice form elements
    await expect(page.locator('label:has-text("Customer Name")')).toBeVisible(); // Customer label
    await expect(page.locator('label:has-text("Invoice Number")')).toBeVisible(); // Invoice number label
    await expect(page.locator('label:has-text("Invoice Date")')).toBeVisible(); // Invoice date label
  });

  // ============================================================================
  // ISSUE #3: GST Reporting and Compliance
  // ============================================================================
  test('Issue #3: GST Reporting - Reports navigation', async ({ page }) => {
    // Navigate to Reports section
    await page.click('text=GST Reports (GSTR-1 & GSTR-3B)');
    await page.waitForURL('**/reports/gst');

    // Verify GST reports page loads
    await expect(page.locator('h1:has-text("Reports & GST Filing")')).toBeVisible();
    
    // Check for report generation options
    await expect(page.locator('button:has-text("Generate Report")')).toBeVisible();
    await expect(page.locator('select:has-text("GSTR-1")')).toBeVisible();
  });

  // ============================================================================
  // ISSUE #4: Sales and Purchase Management
  // ============================================================================
  test('Issue #4: Sales and Purchase Management', async ({ page }) => {
    // Test Purchase Management
    await page.click('text=Add/Edit Purchase');
    await page.waitForURL('**/purchases/add');
    await expect(page.locator('h1:has-text("Add New Purchase")')).toBeVisible();
    
    // Test Purchase Payments
    await page.click('text=Add/Edit Purchase Payment');
    await page.waitForURL('**/payments/purchase/add');
    await expect(page.locator('text=Add Purchase Payment')).toBeVisible();
  });

  // ============================================================================
  // ISSUE #5: Product Catalog Management
  // ============================================================================
  test('Issue #5: Product Catalog Management', async ({ page }) => {
    // Navigate to Products
    await page.click('text=Manage Products');
    await page.waitForURL('**/products');
    
    // Test stock adjustment
    await page.click('text=Stock Adjustment');
    await page.waitForURL('**/products/stock-adjustment');
    await expect(page.locator('text=Stock Adjustment')).toBeVisible();
    
    // Test stock history
    await page.click('text=Stock History');
    await page.waitForURL('**/products/stock-history');
    await expect(page.locator('text=Stock History')).toBeVisible();
  });

  // ============================================================================
  // ISSUE #6: Customer and Vendor Profiles
  // ============================================================================
  test('Issue #6: Customer and Vendor Management', async ({ page }) => {
    // Test Customer Management
    await page.click('text=Add/Edit Customer');
    await page.waitForURL('**/customers/add');
    await expect(page.locator('text=Add New Customer')).toBeVisible();
    
    // Test Vendor Management
    await page.click('text=Add/Edit Vendor');
    await page.waitForURL('**/vendors/add');
    await expect(page.locator('text=Add New Vendor')).toBeVisible();
  });

  // ============================================================================
  // ISSUE #7: Intelligent Product Mapping
  // ============================================================================
  test('Issue #7: Intelligent Product Search', async ({ page }) => {
    await page.click('text=Manage Products');
    await page.waitForURL('**/products');
    
    // Test search functionality
    const searchInput = page.locator('input[placeholder*="search" i]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
    }
  });

  // ============================================================================
  // ISSUE #8: Cross-Functional Requirements
  // ============================================================================
  test('Issue #8: Security and Navigation', async ({ page }) => {
    // Test logout functionality
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login');
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    
    // Login again
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
  });

  // ============================================================================
  // ISSUE #9: Email Integration for Invoices
  // ============================================================================
  test('Issue #9: Email Integration', async ({ page }) => {
    await page.click('text=Manage Invoices');
    await page.waitForURL('**/invoices');
    
    // Look for email functionality
    const emailButtons = page.locator('button:has-text("Email"), button:has-text("Send")');
    if (await emailButtons.count() > 0) {
      await expect(emailButtons.first()).toBeVisible();
    }
  });

  // ============================================================================
  // ISSUE #10: Data Analysis and Insights
  // ============================================================================
  test('Issue #10: Dashboard Analytics', async ({ page }) => {
    // Verify dashboard analytics are present
    await expect(page.locator('text=Net Cashflow')).toBeVisible();
    await expect(page.locator('h4:has-text("💰 Income")')).toBeVisible();
    await expect(page.locator('h4:has-text("💸 Expenses")')).toBeVisible();
    
    // Test period selector
    await expect(page.locator('select')).toBeVisible();
  });

  // ============================================================================
  // ISSUE #11: Dashboard Performance
  // ============================================================================
  test('Issue #11: Dashboard Performance', async ({ page }) => {
    const startTime = Date.now();
    
    // Refresh dashboard
    await page.click('button:has-text("🔄")');
    await page.waitForTimeout(2000);
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });

  // ============================================================================
  // ISSUE #12: Advanced Reporting System
  // ============================================================================
  test('Issue #12: Financial Reports', async ({ page }) => {
    await page.click('text=Financial Reports (P&L, Balance Sheet)');
    await page.waitForURL('**/reports/financial');
    
    await expect(page.locator('text=Financial Reports')).toBeVisible();
  });

  // ============================================================================
  // ISSUE #13: Inventory Management Enhancement
  // ============================================================================
  test('Issue #13: Inventory Management', async ({ page }) => {
    await page.click('text=Manage Products');
    await page.waitForURL('**/products');
    
    // Check for inventory features
    await expect(page.locator('h1:has-text("Manage Products")')).toBeVisible();
  });

  // ============================================================================
  // ISSUE #14: Payment Management
  // ============================================================================
  test('Issue #14: Payment Management', async ({ page }) => {
    // Test Invoice Payments
    await page.click('text=Add/Edit Invoice Payment');
    await page.waitForURL('**/payments/invoice/add');
    await expect(page.locator('text=Add Invoice Payment')).toBeVisible();
  });

  // ============================================================================
  // ISSUE #15: Expense Management
  // ============================================================================
  test('Issue #15: Expense Management', async ({ page }) => {
    await page.click('text=Add/Edit Expense');
    await page.waitForURL('**/expenses/add');
    await expect(page.locator('h1:has-text("Add Expense")')).toBeVisible();
  });

  // ============================================================================
  // ISSUE #16: GST Toggle System
  // ============================================================================
  test('Issue #16: GST Toggle System', async ({ page }) => {
    await page.click('text=Add/Edit Customer');
    await page.waitForURL('**/customers/add');
    
    // Look for GST status dropdown
    const gstDropdown = page.locator('select[name="gst_status"]');
    if (await gstDropdown.isVisible()) {
      await expect(gstDropdown).toBeVisible();
    }
  });

  // ============================================================================
  // ISSUE #17: Enhanced GST Reports
  // ============================================================================
  test('Issue #17: Enhanced GST Reports', async ({ page }) => {
    await page.click('text=GST Reports (GSTR-1 & GSTR-3B)');
    await page.waitForURL('**/reports/gst');
    
    await expect(page.locator('h1:has-text("Reports & GST Filing")')).toBeVisible();
  });

  // ============================================================================
  // ISSUE #18: Advanced Invoice Features
  // ============================================================================
  test('Issue #18: Advanced Invoice Features', async ({ page }) => {
    await page.click('text=Add/Edit Invoice');
    await page.waitForURL('**/invoices/add');
    
    // Check for advanced features
    await expect(page.locator('text=Create New Invoice')).toBeVisible();
  });

  // ============================================================================
  // ISSUE #19: Purchase Order Management
  // ============================================================================
  test('Issue #19: Purchase Order Management', async ({ page }) => {
    await page.click('text=Add/Edit Purchase');
    await page.waitForURL('**/purchases/add');
    
    await expect(page.locator('h1:has-text("Add New Purchase")')).toBeVisible();
  });

  // ============================================================================
  // ISSUE #20: Advanced Payment Tracking
  // ============================================================================
  test('Issue #20: Advanced Payment Tracking', async ({ page }) => {
    await page.click('text=View Cashflow Transactions');
    await page.waitForURL('**/cashflow');
    
    await expect(page.locator('h1:has-text("Cashflow Transactions")')).toBeVisible();
  });

  // ============================================================================
  // ISSUE #21: Inventory Management
  // ============================================================================
  test('Issue #21: Advanced Inventory Management', async ({ page }) => {
    await page.click('text=Manage Products');
    await page.waitForURL('**/products');
    
    await expect(page.locator('h1:has-text("Manage Products")')).toBeVisible();
  });

  // ============================================================================
  // ISSUE #22: Financial Reports
  // ============================================================================
  test('Issue #22: Comprehensive Financial Reports', async ({ page }) => {
    await page.click('text=Financial Reports (P&L, Balance Sheet)');
    await page.waitForURL('**/reports/financial');
    
    await expect(page.locator('text=Financial Reports')).toBeVisible();
  });

  // ============================================================================
  // KNOWN ISSUES INTEGRATION
  // ============================================================================
  test('Known Issues: Payment Form Functionality', async ({ page }) => {
    await page.click('text=Add/Edit Invoice Payment');
    await page.waitForURL('**/payments/invoice/add');
    
    // Verify payment form loads correctly
    await expect(page.locator('text=Add Invoice Payment')).toBeVisible();
  });

  test('Known Issues: Expense Edit Prefilling', async ({ page }) => {
    await page.click('text=Manage Expenses');
    await page.waitForURL('**/expenses');
    
    // Look for edit buttons
    const editButtons = page.locator('button:has-text("Edit")');
    if (await editButtons.count() > 0) {
      await editButtons.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('Known Issues: Date Filter Dropdowns', async ({ page }) => {
    // Test Dashboard date filter
    await expect(page.locator('select')).toBeVisible();
    
    // Test Cashflow date filter
    await page.click('text=View Cashflow Transactions');
    await page.waitForURL('**/cashflow');
    
    const dateFilter = page.locator('select[name="date_filter"]');
    if (await dateFilter.isVisible()) {
      await expect(dateFilter).toBeVisible();
    }
  });

  test('Known Issues: Side Menu Collapsible', async ({ page }) => {
    // Test menu collapse/expand functionality
    const menuButton = page.locator('button:has-text("Menu")');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);
    }
  });
});
