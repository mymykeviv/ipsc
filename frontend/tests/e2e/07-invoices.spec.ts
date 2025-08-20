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
    await expect(page.locator('h1:has-text("Manage Invoices")')).toBeVisible();
    
    // Check for add invoice button
    await expect(page.locator('button:has-text("📄 Add Invoice")')).toBeVisible();
    
    // Check for search functionality
    await expect(page.locator('input[placeholder="Search invoices by number, customer..."]')).toBeVisible();
  });

  test('should add a new invoice', async ({ page }) => {
    // Click add invoice button
    await page.click('button:has-text("Add Invoice")');
    
    // Wait for form to load
    await page.waitForURL('/invoices/add');
    
    // Fill in invoice details
    await page.selectOption('select[name="customer_id"]', '1'); // Select first customer
    await page.fill('input[name="invoice_no"]', 'INV-001');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="due_date"]', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    
    // Add invoice item
    await page.selectOption('select[name="product_id"]', '1'); // Select first product
    await page.fill('input[name="quantity"]', '5');
    await page.fill('input[name="rate"]', '200');
    
    // Submit the form
    await page.click('button:has-text("Save Invoice")');
    
    // Wait for redirect to invoices list
    await page.waitForURL('/invoices');
    
    // Verify invoice was added
    await expect(page.locator('text=INV-001')).toBeVisible();
  });

  test('should edit invoice details', async ({ page }) => {
    // Find and click edit button for first invoice
    await page.click('button:has-text("Edit")').first();
    
    // Wait for edit form to load
    await page.waitForURL(/\/invoices\/edit\/\d+/);
    
    // Update invoice number
    await page.fill('input[name="invoice_no"]', 'INV-UPDATED');
    
    // Save changes
    await page.click('button:has-text("Update Invoice")');
    
    // Wait for redirect to invoices list
    await page.waitForURL('/invoices');
    
    // Verify invoice was updated
    await expect(page.locator('text=INV-UPDATED')).toBeVisible();
  });

  test('should print PDF invoice with preview', async ({ page }) => {
    // Find and click print button for first invoice
    await page.click('button:has-text("Print")').first();
    
    // Wait for PDF preview modal
    await page.waitForSelector('div[role="dialog"]');
    
    // Verify PDF preview is displayed
    await expect(page.locator('iframe')).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Close")');
  });

  test('should email invoice to customer', async ({ page }) => {
    // Find and click email button for first invoice
    await page.click('button:has-text("Email")').first();
    
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
    // Find and click payment button for first invoice
    await page.click('button:has-text("Payment")').first();
    
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
    // Search for an invoice
    await page.fill('input[placeholder*="search"]', 'INV');
    
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
