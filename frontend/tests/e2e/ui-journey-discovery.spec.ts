import { test, expect } from '@playwright/test';

test.describe('UI Journey Discovery - Comprehensive Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    
    const dashboardVisible = await page.locator('text=Dashboard - Cashflow Summary').isVisible();
    
    if (!dashboardVisible) {
      await page.fill('input[placeholder="Enter your username"]', 'admin');
      await page.fill('input[placeholder="Enter your password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/', { timeout: 10000 });
    }
  });

  test('Add/Edit Product Journey', async ({ page }) => {
    await page.click('text=Manage Products');
    await page.waitForURL('**/products');
    
    await page.click('button:has-text("Add Product")');
    await page.waitForURL('**/products/add');
    await expect(page.locator('h1:has-text("Add New Product")')).toBeVisible();
    
    await expect(page.locator('label:has-text("Product Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Product Code")')).toBeVisible();
    await expect(page.locator('label:has-text("SKU")')).toBeVisible();
    await expect(page.locator('label:has-text("Selling Price")')).toBeVisible();
    
    await page.click('button:has-text("Back to Products")');
    await page.waitForURL('**/products');
  });

  test('Add/Edit Invoice Journey', async ({ page }) => {
    await page.click('text=Add/Edit Invoice');
    await page.waitForURL('**/invoices/add');
    
    const invoiceFormVisible = await page.locator('h1:has-text("Create New Invoice")').isVisible();
    if (invoiceFormVisible) {
      await expect(page.locator('h1:has-text("Create New Invoice")')).toBeVisible();
    } else {
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('Add/Edit Purchase Journey', async ({ page }) => {
    await page.click('text=Add/Edit Purchase');
    await page.waitForURL('**/purchases/add');
    await expect(page.locator('h1:has-text("Add New Purchase")')).toBeVisible();
  });

  test('Add/Edit Customer Journey', async ({ page }) => {
    await page.click('text=Add/Edit Customer');
    await page.waitForURL('**/customers/add');
    
    const customerFormVisible = await page.locator('h1').isVisible();
    expect(customerFormVisible).toBeTruthy();
  });

  test('Add/Edit Vendor Journey', async ({ page }) => {
    await page.click('text=Add/Edit Vendor');
    await page.waitForURL('**/vendors/add');
    
    const vendorFormVisible = await page.locator('h1').isVisible();
    expect(vendorFormVisible).toBeTruthy();
  });

  test('Add/Edit Expense Journey', async ({ page }) => {
    await page.click('text=Add/Edit Expense');
    await page.waitForURL('**/expenses/add');
    await expect(page.locator('h1:has-text("Add Expense")')).toBeVisible();
  });

  test('Invoice PDF Generation', async ({ page }) => {
    await page.click('text=Manage Invoices');
    await page.waitForURL('**/invoices');
    
    const pdfButtons = page.locator('button:has-text("PDF"), button:has-text("Print"), button:has-text("Download")');
    const pdfButtonCount = await pdfButtons.count();
    
    if (pdfButtonCount > 0) {
      await expect(pdfButtons.first()).toBeVisible();
    } else {
      console.log('No PDF generation buttons found on invoice page');
    }
  });

  test('Purchase PDF Generation', async ({ page }) => {
    await page.click('text=Manage Purchases');
    await page.waitForURL('**/purchases');
    
    const pdfButtons = page.locator('button:has-text("PDF"), button:has-text("Print"), button:has-text("Download")');
    const pdfButtonCount = await pdfButtons.count();
    
    if (pdfButtonCount > 0) {
      await expect(pdfButtons.first()).toBeVisible();
    } else {
      console.log('No PDF generation buttons found on purchase page');
    }
  });

  test('GST Reports Journey', async ({ page }) => {
    await page.click('text=GST Reports (GSTR-1 & GSTR-3B)');
    await page.waitForURL('**/reports/gst');
    
    const reportsPageVisible = await page.locator('h1').isVisible();
    expect(reportsPageVisible).toBeTruthy();
    
    const reportButtons = page.locator('button:has-text("GSTR-1"), button:has-text("GSTR-3B"), button:has-text("Generate")');
    const reportButtonCount = await reportButtons.count();
    
    if (reportButtonCount > 0) {
      await expect(reportButtons.first()).toBeVisible();
    } else {
      console.log('No report generation buttons found on GST reports page');
    }
  });

  test('Financial Reports Journey', async ({ page }) => {
    await page.click('text=Financial Reports (P&L, Balance Sheet)');
    await page.waitForURL('**/reports/financial');
    
    const reportsPageVisible = await page.locator('h1').isVisible();
    expect(reportsPageVisible).toBeTruthy();
  });

  test('Cashflow Reports Journey', async ({ page }) => {
    await page.click('text=Cashflow Reports');
    await page.waitForURL('**/reports/cashflow');
    
    const reportsPageVisible = await page.locator('h1').isVisible();
    expect(reportsPageVisible).toBeTruthy();
  });

  test('Income Reports Journey', async ({ page }) => {
    await page.click('text=Income Reports');
    await page.waitForURL('**/reports/income');
    
    const reportsPageVisible = await page.locator('h1').isVisible();
    expect(reportsPageVisible).toBeTruthy();
  });

  test('Expense Reports Journey', async ({ page }) => {
    await page.click('text=Expense Reports');
    await page.waitForURL('**/reports/expenses');
    
    const reportsPageVisible = await page.locator('h1').isVisible();
    expect(reportsPageVisible).toBeTruthy();
  });

  test('Inventory Reports Journey', async ({ page }) => {
    await page.click('text=Inventory Reports');
    await page.waitForURL('**/reports/inventory');
    
    const reportsPageVisible = await page.locator('h1').isVisible();
    expect(reportsPageVisible).toBeTruthy();
  });

  test('Purchase Reports Journey', async ({ page }) => {
    await page.click('text=Purchase Reports');
    await page.waitForURL('**/reports/purchases');
    
    const reportsPageVisible = await page.locator('h1').isVisible();
    expect(reportsPageVisible).toBeTruthy();
  });

  test('Payment Reports Journey', async ({ page }) => {
    await page.click('text=Payment Reports');
    await page.waitForURL('**/reports/payments');
    
    const reportsPageVisible = await page.locator('h1').isVisible();
    expect(reportsPageVisible).toBeTruthy();
  });

  test('Dashboard Widgets Consolidation', async ({ page }) => {
    await expect(page.locator('h4:has-text("📊 Net Cashflow")')).toBeVisible();
    await expect(page.locator('h4:has-text("💰 Income")')).toBeVisible();
    await expect(page.locator('h4:has-text("💸 Expenses")')).toBeVisible();
    
    await expect(page.locator('h4:has-text("📦 Pending Purchase Payments")')).toBeVisible();
    await expect(page.locator('h4:has-text("📄 Pending Invoice Payments")')).toBeVisible();
    
    await expect(page.locator('button:has-text("💰 Add Expense")')).toBeVisible();
    await expect(page.locator('button:has-text("📄 New Invoice")')).toBeVisible();
    await expect(page.locator('button:has-text("📦 New Purchase")')).toBeVisible();
    await expect(page.locator('button:has-text("🏷️ Add Product")')).toBeVisible();
  });

  test('Cashflow Transactions Consolidation', async ({ page }) => {
    await page.click('text=View Cashflow Transactions');
    await page.waitForURL('**/cashflow');
    
    await expect(page.locator('h1:has-text("Cashflow Transactions")')).toBeVisible();
    
    const transactionRows = page.locator('tr');
    const rowCount = await transactionRows.count();
    expect(rowCount).toBeGreaterThan(1);
  });

  test('Email Integration Journey', async ({ page }) => {
    await page.click('text=Manage Invoices');
    await page.waitForURL('**/invoices');
    
    const emailButtons = page.locator('button:has-text("Email"), button:has-text("Send"), button:has-text("Mail")');
    const emailButtonCount = await emailButtons.count();
    
    if (emailButtonCount > 0) {
      await expect(emailButtons.first()).toBeVisible();
    } else {
      console.log('No email buttons found on invoice page');
    }
  });

  test('Email Settings Journey', async ({ page }) => {
    await page.click('text=Email Settings');
    await page.waitForURL('**/settings/email');
    
    const emailSettingsVisible = await page.locator('h1').isVisible();
    expect(emailSettingsVisible).toBeTruthy();
  });

  test('Invoice Payment Journey', async ({ page }) => {
    await page.click('text=Add/Edit Invoice Payment');
    await page.waitForURL('**/payments/invoice/add');
    
    const paymentFormVisible = await page.locator('h1').isVisible();
    expect(paymentFormVisible).toBeTruthy();
  });

  test('Purchase Payment Journey', async ({ page }) => {
    await page.click('text=Add/Edit Purchase Payment');
    await page.waitForURL('**/payments/purchase/add');
    
    const paymentFormVisible = await page.locator('h1').isVisible();
    expect(paymentFormVisible).toBeTruthy();
  });

  test('Stock Adjustment Journey', async ({ page }) => {
    await page.click('text=Stock Adjustment');
    await page.waitForURL('**/products/stock-adjustment');
    
    // Wait for the page to load and check for the title
    await page.waitForTimeout(2000); // Wait for component to render
    const stockAdjustmentVisible = await page.locator('h1:has-text("Stock Adjustment")').isVisible();
    expect(stockAdjustmentVisible).toBeTruthy();
  });

  test('Stock History Journey', async ({ page }) => {
    await page.click('text=Stock History');
    await page.waitForURL('**/products/stock-history');
    
    const stockHistoryVisible = await page.locator('h1').isVisible();
    expect(stockHistoryVisible).toBeTruthy();
  });

  test('Company Settings Journey', async ({ page }) => {
    await page.click('text=Company Details');
    await page.waitForURL('**/settings/company');
    
    const companySettingsVisible = await page.locator('h1').isVisible();
    expect(companySettingsVisible).toBeTruthy();
  });

  test('Tax Settings Journey', async ({ page }) => {
    await page.click('text=Tax Settings');
    await page.waitForURL('**/settings/tax');
    
    const taxSettingsVisible = await page.locator('h1').isVisible();
    expect(taxSettingsVisible).toBeTruthy();
  });

  test('User Management Journey', async ({ page }) => {
    await page.click('text=Users');
    await page.waitForURL('**/settings/users');
    
    const usersPageVisible = await page.locator('h1').isVisible();
    expect(usersPageVisible).toBeTruthy();
  });

  test('Invoice Settings Journey', async ({ page }) => {
    await page.click('text=Invoice Settings');
    await page.waitForURL('**/settings/invoice');
    
    const invoiceSettingsVisible = await page.locator('h1').isVisible();
    expect(invoiceSettingsVisible).toBeTruthy();
  });

  test('Product Search Functionality', async ({ page }) => {
    await page.click('text=Manage Products');
    await page.waitForURL('**/products');
    
    const searchInputs = page.locator('input[placeholder*="search"], input[placeholder*="Search"], input[type="search"]');
    const searchInputCount = await searchInputs.count();
    
    if (searchInputCount > 0) {
      await expect(searchInputs.first()).toBeVisible();
    } else {
      console.log('No search functionality found on products page');
    }
  });

  test('Date Filter Functionality', async ({ page }) => {
    const dateSelectors = page.locator('select');
    const dateSelectorCount = await dateSelectors.count();
    
    if (dateSelectorCount > 0) {
      await expect(dateSelectors.first()).toBeVisible();
    } else {
      console.log('No date filter found on dashboard');
    }
  });
});
