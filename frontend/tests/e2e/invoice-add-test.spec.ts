import { test, expect } from '@playwright/test';

test.describe('Invoice Add UI Debug', () => {
  test('should display invoice add form', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', 'admin');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/');
    
    // Navigate to invoice add page
    await page.goto('/invoices/add');
    
    // Check if the page loads
    await expect(page.locator('h1:has-text("Create New Invoice")')).toBeVisible();
    
    // Check if form elements are present
    await expect(page.locator('form')).toBeVisible();
    
    // Check for basic form fields
    await expect(page.locator('label:has-text("Invoice Number")')).toBeVisible();
    await expect(page.locator('label:has-text("Invoice Date")')).toBeVisible();
    await expect(page.locator('label:has-text("Customer")')).toBeVisible();
    
    // Check if form inputs are present
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    
    // Check if submit button is present
    await expect(page.locator('button:has-text("Create Invoice")')).toBeVisible();
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/invoice-add-form.png' });
  });

  test('should load data for invoice form', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', 'admin');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/');
    
    // Navigate to invoice add page
    await page.goto('/invoices/add');
    
    // Wait for the form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Check if customer dropdown is populated
    const customerSelect = page.locator('select[name="customer_id"]');
    await expect(customerSelect).toBeVisible();
    
    // Wait a bit for data to load
    await page.waitForTimeout(2000);
    
    // Check if there are options in the customer dropdown
    const customerOptions = page.locator('select[name="customer_id"] option');
    const optionCount = await customerOptions.count();
    console.log(`Customer options count: ${optionCount}`);
    
    // Check if product dropdown is populated
    const productSelect = page.locator('select[name="product_id"]');
    await expect(productSelect).toBeVisible();
    
    // Check if there are options in the product dropdown
    const productOptions = page.locator('select[name="product_id"] option');
    const productOptionCount = await productOptions.count();
    console.log(`Product options count: ${productOptionCount}`);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/invoice-add-form-with-data.png' });
  });

  test('should handle form submission', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', 'admin');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/');
    
    // Navigate to invoice add page
    await page.goto('/invoices/add');
    
    // Wait for the form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Fill basic form data
    await page.fill('input[placeholder*="Invoice Number"]', 'INV-001');
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    
    // Try to submit the form
    await page.click('button:has-text("Create Invoice")');
    
    // Check for any error messages
    const errorMessage = page.locator('[data-testid="error-message"]');
    if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent();
      console.log(`Form submission error: ${errorText}`);
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/invoice-add-form-submission.png' });
  });
});
