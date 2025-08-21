import { test, expect } from './auth.setup';

// Critical User Flows - These must pass for the app to be considered functional
test.describe('Critical User Flows', () => {
  
  test('User can login and access dashboard', async ({ authenticatedPage }) => {
    // Verify dashboard loads
    await expect(authenticatedPage.locator('h1, h2, h3')).toContainText(/dashboard|overview|summary/i);
    
    // Verify navigation menu is present
    await expect(authenticatedPage.locator('nav, [role="navigation"]')).toBeVisible();
  });

  test('User can navigate to invoices page', async ({ authenticatedPage }) => {
    // Navigate to invoices
    await authenticatedPage.click('a[href*="invoice"], button:has-text("Invoice")');
    await authenticatedPage.waitForURL(/\/invoices/);
    
    // Verify invoices page loads
    await expect(authenticatedPage.locator('h1, h2, h3')).toContainText(/invoice/i);
  });

  test('User can create a new invoice', async ({ authenticatedPage, testData }) => {
    // Navigate to create invoice
    await authenticatedPage.goto('/invoices/add');
    
    // Wait for form to load
    await authenticatedPage.waitForSelector('form', { timeout: 10000 });
    
    // Fill required fields
    await authenticatedPage.fill('input[name*="invoice_no"], input[placeholder*="invoice number"]', testData.invoice.number);
    await authenticatedPage.fill('input[name*="date"], input[type="date"]', testData.invoice.date);
    await authenticatedPage.fill('textarea[name*="bill_to_address"], textarea[placeholder*="bill to"]', 'Test Bill Address');
    await authenticatedPage.fill('textarea[name*="ship_to_address"], textarea[placeholder*="ship to"]', 'Test Ship Address');
    
    // Select customer (if dropdown exists)
    const customerSelect = authenticatedPage.locator('select[name*="customer"], [data-testid*="customer"]');
    if (await customerSelect.count() > 0) {
      await customerSelect.selectOption({ index: 0 });
    }
    
    // Add at least one item
    await authenticatedPage.fill('input[name*="description"], input[placeholder*="description"]', 'Test Item');
    await authenticatedPage.fill('input[name*="quantity"], input[type="number"]', '1');
    await authenticatedPage.fill('input[name*="rate"], input[name*="price"]', '100.00');
    
    // Submit form
    await authenticatedPage.click('button[type="submit"], input[type="submit"]');
    
    // Verify success (redirect or success message)
    await expect(authenticatedPage.locator('.success, .alert-success, [data-testid="success"]')).toBeVisible({ timeout: 10000 });
  });

  test('Invoice validation prevents invalid data', async ({ authenticatedPage }) => {
    // Navigate to create invoice
    await authenticatedPage.goto('/invoices/add');
    
    // Try to submit empty form
    await authenticatedPage.click('button[type="submit"], input[type="submit"]');
    
    // Verify validation errors appear
    await expect(authenticatedPage.locator('.error, .alert-danger, [data-testid="error"]')).toBeVisible();
  });

  test('Invoice grid displays data correctly', async ({ authenticatedPage }) => {
    // Navigate to invoices list
    await authenticatedPage.goto('/invoices');
    
    // Wait for data to load
    await authenticatedPage.waitForSelector('table, [data-testid="invoice-table"]', { timeout: 10000 });
    
    // Verify table structure
    const table = authenticatedPage.locator('table, [data-testid="invoice-table"]');
    await expect(table).toBeVisible();
    
    // Check if data is present (either has rows or shows empty state)
    const rows = authenticatedPage.locator('table tbody tr, [data-testid="invoice-row"]');
    const emptyMessage = authenticatedPage.locator('.empty-state, .no-data, [data-testid="empty"]');
    
    // Either we have data rows or an empty state message
    await expect(rows.first().or(emptyMessage)).toBeVisible();
  });

  test('User can logout successfully', async ({ authenticatedPage }) => {
    // Find and click logout
    await authenticatedPage.click('button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout"]');
    
    // Verify redirect to login
    await expect(authenticatedPage).toHaveURL(/\/login/);
  });

  test('API endpoints respond correctly', async ({ authenticatedPage }) => {
    // Test API health
    const response = await authenticatedPage.request.get('/health');
    expect(response.status()).toBe(200);
    
    // Test authenticated endpoint
    const invoicesResponse = await authenticatedPage.request.get('/api/invoices');
    expect([200, 401, 403]).toContain(invoicesResponse.status());
  });
});

// Regression Tests - These catch common breaking changes
test.describe('Regression Prevention', () => {
  
  test('Form components render without errors', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/invoices/add');
    
    // Check for console errors
    const errors: string[] = [];
    authenticatedPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Verify no critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('analytics') &&
      !error.includes('adblock')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('Navigation works across all pages', async ({ authenticatedPage }) => {
    const pages = ['/dashboard', '/invoices', '/customers', '/products'];
    
    for (const page of pages) {
      await authenticatedPage.goto(page);
      await expect(authenticatedPage).toHaveURL(new RegExp(page.replace('/', '\\/')));
      
      // Verify page loads without 404
      await expect(authenticatedPage.locator('body')).not.toContainText('404');
    }
  });
});
