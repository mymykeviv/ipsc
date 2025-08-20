import { test, expect } from '@playwright/test';

test.describe('Purchases Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to purchases
    await page.goto('/');
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/', { timeout: 10000 });
    await page.goto('/purchases');
  });

  test('should display purchases list page', async ({ page }) => {
    // Verify purchases page heading
    await expect(page.locator('h1:has-text("Purchases")')).toBeVisible();
    
    // Check for add purchase button
    await expect(page.locator('button:has-text("Add Purchase")')).toBeVisible();
    
    // Check for search functionality
    await expect(page.locator('input[placeholder*="search"]')).toBeVisible();
  });

  test('should add a new purchase order', async ({ page }) => {
    // Click add purchase button
    await page.click('button:has-text("Add Purchase")');
    
    // Wait for form to load
    await page.waitForURL('/purchases/add');
    
    // Fill in purchase details
    await page.selectOption('select[name="vendor_id"]', '1'); // Select first vendor
    await page.fill('input[name="purchase_no"]', 'PO-001');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="due_date"]', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    
    // Add purchase item
    await page.selectOption('select[name="product_id"]', '1'); // Select first product
    await page.fill('input[name="quantity"]', '10');
    await page.fill('input[name="rate"]', '100');
    
    // Submit the form
    await page.click('button:has-text("Save Purchase")');
    
    // Wait for redirect to purchases list
    await page.waitForURL('/purchases');
    
    // Verify purchase was added
    await expect(page.locator('text=PO-001')).toBeVisible();
  });

  test('should edit purchase order details', async ({ page }) => {
    // Find and click edit button for first purchase
    await page.click('button:has-text("Edit")').first();
    
    // Wait for edit form to load
    await page.waitForURL(/\/purchases\/edit\/\d+/);
    
    // Update purchase number
    await page.fill('input[name="purchase_no"]', 'PO-UPDATED');
    
    // Save changes
    await page.click('button:has-text("Update Purchase")');
    
    // Wait for redirect to purchases list
    await page.waitForURL('/purchases');
    
    // Verify purchase was updated
    await expect(page.locator('text=PO-UPDATED')).toBeVisible();
  });

  test('should cancel purchase order', async ({ page }) => {
    // Find and click cancel button for first purchase
    await page.click('button:has-text("Cancel")').first();
    
    // Confirm cancellation
    await page.click('button:has-text("Confirm")');
    
    // Wait for cancellation
    await page.waitForTimeout(1000);
    
    // Verify purchase was cancelled
    await expect(page.locator('text=Cancelled')).toBeVisible();
  });

  test('should add payment for purchase order from list', async ({ page }) => {
    // Find and click payment button for first purchase
    await page.click('button:has-text("Payment")').first();
    
    // Wait for payment form
    await page.waitForSelector('h1:has-text("Add Purchase Payment")');
    
    // Fill in payment details
    await page.fill('input[name="payment_amount"]', '500');
    await page.selectOption('select[name="payment_method"]', 'Cash');
    await page.fill('input[name="payment_date"]', new Date().toISOString().split('T')[0]);
    
    // Submit payment
    await page.click('button:has-text("Add Payment")');
    
    // Wait for redirect to purchases list
    await page.waitForURL('/purchases');
    
    // Verify payment was added
    await expect(page.locator('text=Payment added successfully')).toBeVisible();
  });

  test('should add payment for purchase order from side menu', async ({ page }) => {
    // Navigate to purchase payments from side menu
    await page.goto('/payments/purchase/add');
    
    // Verify payment form
    await expect(page.locator('h1:has-text("Add Purchase Payment")')).toBeVisible();
    
    // Check for purchase selection dropdown
    await expect(page.locator('select[name="purchase_id"]')).toBeVisible();
    
    // Fill in payment details
    await page.selectOption('select[name="purchase_id"]', '1'); // Select first purchase
    await page.fill('input[name="payment_amount"]', '500');
    await page.selectOption('select[name="payment_method"]', 'Cash');
    await page.fill('input[name="payment_date"]', new Date().toISOString().split('T')[0]);
    
    // Submit payment
    await page.click('button:has-text("Add Payment")');
    
    // Verify payment was added
    await expect(page.locator('text=Payment added successfully')).toBeVisible();
  });

  test('should view payment history for purchase order', async ({ page }) => {
    // Find and click payment history button for first purchase
    await page.click('button:has-text("Payment History")').first();
    
    // Wait for payment history page
    await page.waitForSelector('h1:has-text("Payment History")');
    
    // Verify payment history table
    await expect(page.locator('table')).toBeVisible();
    
    // Check for payment history columns
    await expect(page.locator('th:has-text("Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Amount")')).toBeVisible();
    await expect(page.locator('th:has-text("Method")')).toBeVisible();
  });

  test('should search and filter purchases', async ({ page }) => {
    // Search for a purchase
    await page.fill('input[placeholder*="search"]', 'PO');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Verify search results
    const searchResults = page.locator('tr:has-text("PO")');
    await expect(searchResults).toBeVisible();
  });

  test('should display purchase details in table', async ({ page }) => {
    // Check for purchase table columns
    await expect(page.locator('th:has-text("Purchase No")')).toBeVisible();
    await expect(page.locator('th:has-text("Vendor")')).toBeVisible();
    await expect(page.locator('th:has-text("Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Due Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Total")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });
});
