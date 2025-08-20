import { test, expect } from '@playwright/test';

test.describe('Reporting Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to reports
    await page.goto('/');
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/', { timeout: 10000 });
    await page.goto('/reports');
  });

  test('should display reports page with navigation tabs', async ({ page }) => {
    // Verify reports page heading
    await expect(page.locator('h1:has-text("Reports")')).toBeVisible();
    
    // Check for reports navigation tabs
    await expect(page.locator('a:has-text("GST Reports")')).toBeVisible();
    await expect(page.locator('a:has-text("Financial Reports")')).toBeVisible();
    await expect(page.locator('a:has-text("Inventory Reports")')).toBeVisible();
  });

  // GST Reports Tests
  test.describe('GST Reports', () => {
    test('should display GST Summary', async ({ page }) => {
      // Navigate to GST reports
      await page.goto('/reports/gst');
      
      // Verify GST reports page
      await expect(page.locator('h2:has-text("GST Reports")')).toBeVisible();
      
      // Check for GST Summary section
      await expect(page.locator('h3:has-text("GST Summary")')).toBeVisible();
      
      // Check for GST summary data
      await expect(page.locator('text=Total Taxable Value')).toBeVisible();
      await expect(page.locator('text=Total CGST')).toBeVisible();
      await expect(page.locator('text=Total SGST')).toBeVisible();
      await expect(page.locator('text=Total IGST')).toBeVisible();
    });

    test('should generate GSTR-1 report', async ({ page }) => {
      // Navigate to GST reports
      await page.goto('/reports/gst');
      
      // Select GSTR-1 report type
      await page.selectOption('select[name="report_type"]', 'GSTR-1');
      
      // Set period
      await page.selectOption('select[name="period_type"]', 'month');
      await page.fill('input[name="period"]', '2024-01');
      
      // Generate report
      await page.click('button:has-text("Generate Report")');
      
      // Wait for report generation
      await page.waitForTimeout(2000);
      
      // Verify report is generated
      await expect(page.locator('text=GSTR-1 Report')).toBeVisible();
      await expect(page.locator('table')).toBeVisible();
    });

    test('should generate GSTR-3B report', async ({ page }) => {
      // Navigate to GST reports
      await page.goto('/reports/gst');
      
      // Select GSTR-3B report type
      await page.selectOption('select[name="report_type"]', 'GSTR-3B');
      
      // Set period
      await page.selectOption('select[name="period_type"]', 'month');
      await page.fill('input[name="period"]', '2024-01');
      
      // Generate report
      await page.click('button:has-text("Generate Report")');
      
      // Wait for report generation
      await page.waitForTimeout(2000);
      
      // Verify report is generated
      await expect(page.locator('text=GSTR-3B Report')).toBeVisible();
      await expect(page.locator('table')).toBeVisible();
    });

    test('should export GST report to Excel', async ({ page }) => {
      // Navigate to GST reports
      await page.goto('/reports/gst');
      
      // Select report type and period
      await page.selectOption('select[name="report_type"]', 'GSTR-1');
      await page.selectOption('select[name="period_type"]', 'month');
      await page.fill('input[name="period"]', '2024-01');
      
      // Generate report first
      await page.click('button:has-text("Generate Report")');
      await page.waitForTimeout(2000);
      
      // Export to Excel
      await page.click('button:has-text("Export to Excel")');
      
      // Verify export success
      await expect(page.locator('text=Report exported successfully')).toBeVisible();
    });

    test('should filter GST reports by date range', async ({ page }) => {
      // Navigate to GST reports
      await page.goto('/reports/gst');
      
      // Set custom date range
      await page.selectOption('select[name="period_type"]', 'custom');
      await page.fill('input[name="date_from"]', '2024-01-01');
      await page.fill('input[name="date_to"]', '2024-01-31');
      
      // Generate report
      await page.click('button:has-text("Generate Report")');
      
      // Wait for report generation
      await page.waitForTimeout(2000);
      
      // Verify report is generated with custom date range
      await expect(page.locator('text=Custom Period')).toBeVisible();
    });
  });

  // Financial Reports Tests
  test.describe('Financial Reports', () => {
    test('should generate Profit & Loss statement', async ({ page }) => {
      // Navigate to financial reports
      await page.goto('/reports/financial');
      
      // Verify financial reports page
      await expect(page.locator('h2:has-text("Financial Reports")')).toBeVisible();
      
      // Select Profit & Loss report
      await page.selectOption('select[name="report_type"]', 'profit_loss');
      
      // Set period
      await page.selectOption('select[name="period_type"]', 'quarter');
      await page.fill('input[name="period"]', 'Q1 2024');
      
      // Generate report
      await page.click('button:has-text("Generate Report")');
      
      // Wait for report generation
      await page.waitForTimeout(2000);
      
      // Verify P&L report
      await expect(page.locator('text=Profit & Loss Statement')).toBeVisible();
      await expect(page.locator('text=Revenue')).toBeVisible();
      await expect(page.locator('text=Expenses')).toBeVisible();
      await expect(page.locator('text=Net Profit')).toBeVisible();
    });

    test('should generate Balance Sheet', async ({ page }) => {
      // Navigate to financial reports
      await page.goto('/reports/financial');
      
      // Select Balance Sheet report
      await page.selectOption('select[name="report_type"]', 'balance_sheet');
      
      // Set period
      await page.selectOption('select[name="period_type"]', 'year');
      await page.fill('input[name="period"]', '2024');
      
      // Generate report
      await page.click('button:has-text("Generate Report")');
      
      // Wait for report generation
      await page.waitForTimeout(2000);
      
      // Verify Balance Sheet report
      await expect(page.locator('text=Balance Sheet')).toBeVisible();
      await expect(page.locator('text=Assets')).toBeVisible();
      await expect(page.locator('text=Liabilities')).toBeVisible();
      await expect(page.locator('text=Equity')).toBeVisible();
    });

    test('should generate Cash Flow statement', async ({ page }) => {
      // Navigate to financial reports
      await page.goto('/reports/financial');
      
      // Select Cash Flow report
      await page.selectOption('select[name="report_type"]', 'cash_flow');
      
      // Set period
      await page.selectOption('select[name="period_type"]', 'month');
      await page.fill('input[name="period"]', '2024-01');
      
      // Generate report
      await page.click('button:has-text("Generate Report")');
      
      // Wait for report generation
      await page.waitForTimeout(2000);
      
      // Verify Cash Flow report
      await expect(page.locator('text=Cash Flow Statement')).toBeVisible();
      await expect(page.locator('text=Operating Activities')).toBeVisible();
      await expect(page.locator('text=Investing Activities')).toBeVisible();
      await expect(page.locator('text=Financing Activities')).toBeVisible();
    });

    test('should export financial report to PDF', async ({ page }) => {
      // Navigate to financial reports
      await page.goto('/reports/financial');
      
      // Select report type and period
      await page.selectOption('select[name="report_type"]', 'profit_loss');
      await page.selectOption('select[name="period_type"]', 'quarter');
      await page.fill('input[name="period"]', 'Q1 2024');
      
      // Generate report first
      await page.click('button:has-text("Generate Report")');
      await page.waitForTimeout(2000);
      
      // Export to PDF
      await page.click('button:has-text("Export to PDF")');
      
      // Verify export success
      await expect(page.locator('text=Report exported successfully')).toBeVisible();
    });
  });

  // Inventory Reports Tests
  test.describe('Inventory Reports', () => {
    test('should display Inventory Valuation Report', async ({ page }) => {
      // Navigate to inventory reports
      await page.goto('/reports/inventory');
      
      // Verify inventory reports page
      await expect(page.locator('h2:has-text("Inventory Reports")')).toBeVisible();
      
      // Check for Inventory Valuation section
      await expect(page.locator('h3:has-text("Inventory Valuation Report")')).toBeVisible();
      
      // Check for valuation data
      await expect(page.locator('text=Total Stock Value')).toBeVisible();
      await expect(page.locator('text=Average Cost')).toBeVisible();
      await expect(page.locator('text=Stock Items')).toBeVisible();
    });

    test('should filter Inventory Valuation by category', async ({ page }) => {
      // Navigate to inventory reports
      await page.goto('/reports/inventory');
      
      // Select category filter
      await page.selectOption('select[name="category_filter"]', 'Electronics');
      
      // Apply filter
      await page.click('button:has-text("Apply Filter")');
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Verify filtered results
      await expect(page.locator('text=Electronics')).toBeVisible();
    });

    test('should filter Inventory Valuation by zero stock status', async ({ page }) => {
      // Navigate to inventory reports
      await page.goto('/reports/inventory');
      
      // Select zero stock filter
      await page.check('input[name="zero_stock_only"]');
      
      // Apply filter
      await page.click('button:has-text("Apply Filter")');
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Verify filtered results show zero stock items
      await expect(page.locator('text=Stock: 0')).toBeVisible();
    });

    test('should generate Stock Ledger Report', async ({ page }) => {
      // Navigate to inventory reports
      await page.goto('/reports/inventory');
      
      // Select Stock Ledger report
      await page.selectOption('select[name="report_type"]', 'stock_ledger');
      
      // Select product
      await page.selectOption('select[name="product_id"]', '1');
      
      // Set date period
      await page.fill('input[name="date_from"]', '2024-01-01');
      await page.fill('input[name="date_to"]', '2024-01-31');
      
      // Generate report
      await page.click('button:has-text("Generate Report")');
      
      // Wait for report generation
      await page.waitForTimeout(2000);
      
      // Verify Stock Ledger report
      await expect(page.locator('text=Stock Ledger Report')).toBeVisible();
      await expect(page.locator('th:has-text("Date")')).toBeVisible();
      await expect(page.locator('th:has-text("Type")')).toBeVisible();
      await expect(page.locator('th:has-text("Quantity")')).toBeVisible();
      await expect(page.locator('th:has-text("Balance")')).toBeVisible();
    });

    test('should filter Stock Ledger by multiple products', async ({ page }) => {
      // Navigate to inventory reports
      await page.goto('/reports/inventory');
      
      // Select Stock Ledger report
      await page.selectOption('select[name="report_type"]', 'stock_ledger');
      
      // Select multiple products
      await page.selectOption('select[name="product_id"]', 'all');
      
      // Set date period
      await page.fill('input[name="date_from"]', '2024-01-01');
      await page.fill('input[name="date_to"]', '2024-01-31');
      
      // Generate report
      await page.click('button:has-text("Generate Report")');
      
      // Wait for report generation
      await page.waitForTimeout(2000);
      
      // Verify report shows multiple products
      await expect(page.locator('text=Stock Ledger Report')).toBeVisible();
      await expect(page.locator('table')).toBeVisible();
    });

    test('should export inventory report to Excel', async ({ page }) => {
      // Navigate to inventory reports
      await page.goto('/reports/inventory');
      
      // Select report type and filters
      await page.selectOption('select[name="report_type"]', 'inventory_valuation');
      await page.selectOption('select[name="category_filter"]', 'all');
      
      // Generate report first
      await page.click('button:has-text("Generate Report")');
      await page.waitForTimeout(2000);
      
      // Export to Excel
      await page.click('button:has-text("Export to Excel")');
      
      // Verify export success
      await expect(page.locator('text=Report exported successfully')).toBeVisible();
    });
  });

  // General Reporting Tests
  test('should navigate between report types', async ({ page }) => {
    // Navigate to GST reports
    await page.goto('/reports/gst');
    await expect(page.locator('h2:has-text("GST Reports")')).toBeVisible();
    
    // Navigate to financial reports
    await page.goto('/reports/financial');
    await expect(page.locator('h2:has-text("Financial Reports")')).toBeVisible();
    
    // Navigate to inventory reports
    await page.goto('/reports/inventory');
    await expect(page.locator('h2:has-text("Inventory Reports")')).toBeVisible();
  });

  test('should handle report generation errors gracefully', async ({ page }) => {
    // Navigate to GST reports
    await page.goto('/reports/gst');
    
    // Try to generate report without selecting period
    await page.click('button:has-text("Generate Report")');
    
    // Verify error message
    await expect(page.locator('text=Please select a valid period')).toBeVisible();
  });

  test('should display report loading states', async ({ page }) => {
    // Navigate to financial reports
    await page.goto('/reports/financial');
    
    // Select report type and period
    await page.selectOption('select[name="report_type"]', 'profit_loss');
    await page.selectOption('select[name="period_type"]', 'month');
    await page.fill('input[name="period"]', '2024-01');
    
    // Generate report
    await page.click('button:has-text("Generate Report")');
    
    // Verify loading state
    await expect(page.locator('text=Generating Report...')).toBeVisible();
    
    // Wait for completion
    await page.waitForTimeout(2000);
    
    // Verify report is displayed
    await expect(page.locator('text=Profit & Loss Statement')).toBeVisible();
  });
});
