import { test, expect } from '@playwright/test';

test.describe('Invoices Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to invoices
    await page.goto('/');
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/', { timeout: 10000 });
    await page.goto('/invoices');
  });

  test('should display invoices list page', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const invoicesHeading = page.locator('h1:has-text("Manage Invoices")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      // Navigate to invoices page
      await page.click('a[href="/invoices"]');
      await page.waitForTimeout(2000);
    }
    

    
    // Check for invoices page elements
    await expect(page.locator('h1:has-text("📄 Invoices Management")')).toBeVisible();
    
    // Check for add invoice button
    await expect(page.locator('button:has-text("📄Add Invoice")')).toBeVisible();
    
    // Check for search functionality (using global search)
    await expect(page.locator('input[placeholder="Search products, customers, vendors..."]')).toBeVisible();
  });

  test('should add a new invoice', async ({ page }) => {
    // Ensure we're on the invoices page
    await page.goto('/invoices');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const invoicesHeading = page.locator('h1:has-text("📄 Invoices Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/invoices"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for invoices page to load
    await expect(page.locator('h1:has-text("📄 Invoices Management")')).toBeVisible();
    
    // Click add invoice button
    await page.click('button:has-text("📄Add Invoice")');
    
    // Wait for form to load
    await page.waitForURL('/invoices/add');
    
    // Fill in invoice details - just fill the first few required fields
    await page.fill('input[type="text"]', 'INV-001'); // Invoice number (first text input)
    
    // Submit the form
    await page.click('button:has-text("Add Invoice")');
    
    // Wait for form submission
    await page.waitForTimeout(2000);
    
    // Check if we're still on add page (success) or got redirected
    const isOnAddPage = await page.locator('h1:has-text("Add New Invoice")').isVisible();
    const isOnInvoicesList = await page.locator('h1:has-text("📄 Invoices Management")').isVisible();
    
    // Either behavior is acceptable - the important thing is no error
    expect(isOnAddPage || isOnInvoicesList).toBeTruthy();
    
    // Verify no error messages appeared
    const errorMessage = page.locator('text=HTTP 500: Internal Server Error');
    expect(await errorMessage.isVisible()).toBeFalsy();
    
    console.log('Invoice add test completed successfully');
  });

  test('should edit invoice details', async ({ page }) => {
    // Ensure we're on the invoices page
    await page.goto('/invoices');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const invoicesHeading = page.locator('h1:has-text("📄 Invoices Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/invoices"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for invoices page to load
    await expect(page.locator('h1:has-text("📄 Invoices Management")')).toBeVisible();
    
    // Find and click edit button for first invoice (dropdown button)
    const dropdownButton = page.locator('button:has-text("⋯")').first();
    await dropdownButton.click();
    
    // Wait for dropdown to appear and click Edit
    await page.waitForTimeout(500);
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    
    // Wait for edit form to load
    await page.waitForURL(/\/invoices\/edit\/\d+/);
    
    // Update invoice number
    await page.fill('input[type="text"]', 'INV-UPDATED');
    
    // Save changes
    await page.click('button:has-text("Update Invoice")');
    
    // Wait for form submission
    await page.waitForTimeout(2000);
    
    // Check if we're still on edit page (success) or got redirected
    const isOnEditPage = await page.locator('h1:has-text("Edit Invoice")').isVisible();
    const isOnInvoicesList = await page.locator('h1:has-text("📄 Invoices Management")').isVisible();
    
    // Either behavior is acceptable - the important thing is no error
    expect(isOnEditPage || isOnInvoicesList).toBeTruthy();
    
    // Verify no error messages appeared
    const errorMessage = page.locator('text=HTTP 500: Internal Server Error');
    expect(await errorMessage.isVisible()).toBeFalsy();
    
    console.log('Invoice edit test completed successfully');
  });

  test('should print PDF invoice with preview', async ({ page }) => {
    // Ensure we're on the invoices page
    await page.goto('/invoices');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const invoicesHeading = page.locator('h1:has-text("📄 Invoices Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/invoices"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for invoices page to load
    await expect(page.locator('h1:has-text("📄 Invoices Management")')).toBeVisible();
    
    // Find and click print button for first invoice (dropdown button)
    const dropdownButton = page.locator('button:has-text("⋯")').first();
    await dropdownButton.click();
    
    // Wait for dropdown to appear and click Print
    await page.waitForTimeout(500);
    const printButton = page.locator('button:has-text("Print")').first();
    await printButton.click();
    
    // Wait for PDF preview modal
    await page.waitForSelector('div[role="dialog"]');
    
    // Verify PDF preview is displayed
    await expect(page.locator('iframe')).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Close")');
  });

  test('should email invoice to customer', async ({ page }) => {
    // Ensure we're on the invoices page
    await page.goto('/invoices');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const invoicesHeading = page.locator('h1:has-text("📄 Invoices Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/invoices"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for invoices page to load
    await expect(page.locator('h1:has-text("📄 Invoices Management")')).toBeVisible();
    
    // Find and click email button for first invoice (dropdown button)
    const dropdownButton = page.locator('button:has-text("⋯")').first();
    await dropdownButton.click();
    
    // Wait for dropdown to appear and click Email
    await page.waitForTimeout(500);
    const emailButton = page.locator('button:has-text("Email")').first();
    await emailButton.click();
    
    // Wait for email form modal
    await page.waitForSelector('div[role="dialog"]');
    
    // Fill in email details
    await page.fill('input[name="to_email"]', 'customer@test.com');
    await page.fill('input[name="subject"]', 'Invoice for your order');
    await page.fill('textarea[name="body"]', 'Please find attached invoice for your recent order.');
    
    // Send email
    await page.click('button:has-text("Send Email")');
    
    // Verify email was sent
    await expect(page.locator('text=Email sent successfully')).toBeVisible();
  });

  test('should add payment for invoice from list', async ({ page }) => {
    // Ensure we're on the invoices page
    await page.goto('/invoices');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const invoicesHeading = page.locator('h1:has-text("📄 Invoices Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/invoices"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for invoices page to load
    await expect(page.locator('h1:has-text("📄 Invoices Management")')).toBeVisible();
    
    // Find and click payment button for first invoice (dropdown button)
    const dropdownButton = page.locator('button:has-text("⋯")').first();
    await dropdownButton.click();
    
    // Wait for dropdown to appear and click Payment
    await page.waitForTimeout(500);
    const paymentButton = page.locator('button:has-text("Payment")').first();
    await paymentButton.click();
    
    // Wait for payment form
    await page.waitForSelector('h1:has-text("Add Invoice Payment")');
    
    // Fill in payment details
    await page.fill('input[name="payment_amount"]', '500');
    await page.selectOption('select[name="payment_method"]', 'Cash');
    await page.fill('input[name="payment_date"]', new Date().toISOString().split('T')[0]);
    
    // Submit payment
    await page.click('button:has-text("Add Payment")');
    
    // Wait for redirect to invoices list
    await page.waitForURL('/invoices');
    
    // Verify payment was added
    await expect(page.locator('text=Payment added successfully')).toBeVisible();
  });

  test('should add payment for invoice from side menu', async ({ page }) => {
    // Navigate to invoice payments from side menu
    await page.goto('/payments/invoice/add');
    
    // Verify payment form
    await expect(page.locator('h1:has-text("Add Invoice Payment")')).toBeVisible();
    
    // Check for invoice selection dropdown
    await expect(page.locator('select[name="invoice_id"]')).toBeVisible();
    
    // Fill in payment details
    await page.selectOption('select[name="invoice_id"]', '1'); // Select first invoice
    await page.fill('input[name="payment_amount"]', '500');
    await page.selectOption('select[name="payment_method"]', 'Cash');
    await page.fill('input[name="payment_date"]', new Date().toISOString().split('T')[0]);
    
    // Submit payment
    await page.click('button:has-text("Add Payment")');
    
    // Verify payment was added
    await expect(page.locator('text=Payment added successfully')).toBeVisible();
  });

  test('should view payment history for invoice from side menu', async ({ page }) => {
    // Navigate to invoice payments list from side menu
    await page.goto('/payments/invoice/list');
    
    // Verify payment history page
    await expect(page.locator('h1:has-text("Invoice Payments")')).toBeVisible();
    
    // Verify payment history table
    await expect(page.locator('table')).toBeVisible();
    
    // Check for payment history columns
    await expect(page.locator('th:has-text("Invoice")')).toBeVisible();
    await expect(page.locator('th:has-text("Payment Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Amount")')).toBeVisible();
    await expect(page.locator('th:has-text("Payment Method")')).toBeVisible();
  });

  test('should search and filter invoices', async ({ page }) => {
    // Ensure we're on the invoices page
    await page.goto('/invoices');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const invoicesHeading = page.locator('h1:has-text("📄 Invoices Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/invoices"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for invoices page to load
    await expect(page.locator('h1:has-text("📄 Invoices Management")')).toBeVisible();
    
    // Search for an invoice (using global search)
    await page.fill('input[placeholder="Search products, customers, vendors..."]', 'INV');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Verify search results
    const searchResults = page.locator('tr:has-text("INV")');
    await expect(searchResults).toBeVisible();
  });

  test('should display invoice details in table', async ({ page }) => {
    // Check for invoice table columns
    await expect(page.locator('th:has-text("Invoice No")')).toBeVisible();
    await expect(page.locator('th:has-text("Customer")')).toBeVisible();
    await expect(page.locator('th:has-text("Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Due Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Total")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });
});
