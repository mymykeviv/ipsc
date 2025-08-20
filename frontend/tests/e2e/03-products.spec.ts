import { test, expect } from '@playwright/test';

test.describe('Products Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to products
    await page.goto('/');
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/', { timeout: 10000 });
    await page.goto('/products');
  });

  test('should display products list page', async ({ page }) => {
    // Verify products page heading
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();
    
    // Check for add product button
    await expect(page.locator('button:has-text("Add Product")')).toBeVisible();
    
    // Check for search functionality
    await expect(page.locator('input[placeholder*="search"]')).toBeVisible();
  });

  test('should add a new product', async ({ page }) => {
    // Click add product button
    await page.click('button:has-text("Add Product")');
    
    // Wait for form to load
    await page.waitForURL('/products/add');
    
    // Fill in product details
    await page.fill('input[name="name"]', 'Test Product');
    await page.fill('input[name="description"]', 'Test product description');
    await page.fill('input[name="purchase_price"]', '100');
    await page.fill('input[name="sales_price"]', '150');
    await page.fill('input[name="stock"]', '50');
    
    // Submit the form
    await page.click('button:has-text("Save Product")');
    
    // Wait for redirect to products list
    await page.waitForURL('/products');
    
    // Verify product was added
    await expect(page.locator('text=Test Product')).toBeVisible();
  });

  test('should edit product details', async ({ page }) => {
    // Find and click edit button for first product
    await page.click('button:has-text("Edit")').first();
    
    // Wait for edit form to load
    await page.waitForURL(/\/products\/edit\/\d+/);
    
    // Update product name
    await page.fill('input[name="name"]', 'Updated Product Name');
    
    // Save changes
    await page.click('button:has-text("Update Product")');
    
    // Wait for redirect to products list
    await page.waitForURL('/products');
    
    // Verify product was updated
    await expect(page.locator('text=Updated Product Name')).toBeVisible();
  });

  test('should activate/deactivate product', async ({ page }) => {
    // Find and click activate/deactivate button for first product
    const toggleButton = page.locator('button:has-text("Activate"), button:has-text("Deactivate")').first();
    const currentState = await toggleButton.textContent();
    
    await toggleButton.click();
    
    // Wait for state change
    await page.waitForTimeout(1000);
    
    // Verify state changed
    const newState = await toggleButton.textContent();
    expect(newState).not.toBe(currentState);
  });

  test('should perform stock adjustment from products list', async ({ page }) => {
    // Find and click stock adjustment button for first product
    await page.click('button:has-text("Stock Adjustment")').first();
    
    // Wait for stock adjustment form
    await page.waitForSelector('h1:has-text("Stock Adjustment")');
    
    // Fill in adjustment details
    await page.fill('input[name="quantity"]', '10');
    await page.selectOption('select[name="entry_type"]', 'in');
    await page.fill('textarea[name="notes"]', 'Test stock adjustment');
    
    // Submit adjustment
    await page.click('button:has-text("Save Adjustment")');
    
    // Wait for redirect to products list
    await page.waitForURL('/products');
    
    // Verify adjustment was applied
    await expect(page.locator('text=Stock adjustment saved successfully')).toBeVisible();
  });

  test('should navigate to stock adjustment from side menu', async ({ page }) => {
    // Navigate to stock adjustment from side menu
    await page.goto('/products/stock-adjustment');
    
    // Verify stock adjustment page
    await expect(page.locator('h1:has-text("Stock Adjustment")')).toBeVisible();
    
    // Check for product selection dropdown
    await expect(page.locator('select[name="product_id"]')).toBeVisible();
    
    // Check for adjustment form
    await expect(page.locator('input[name="quantity"]')).toBeVisible();
    await expect(page.locator('select[name="entry_type"]')).toBeVisible();
  });

  test('should view stock history for a product', async ({ page }) => {
    // Find and click stock history button for first product
    await page.click('button:has-text("Stock History")').first();
    
    // Wait for stock history page
    await page.waitForSelector('h1:has-text("Stock History")');
    
    // Verify stock history table
    await expect(page.locator('table')).toBeVisible();
    
    // Check for history entries
    await expect(page.locator('th:has-text("Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
    await expect(page.locator('th:has-text("Quantity")')).toBeVisible();
  });

  test('should search and filter products', async ({ page }) => {
    // Search for a product
    await page.fill('input[placeholder*="search"]', 'Test');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Verify search results
    const searchResults = page.locator('tr:has-text("Test")');
    await expect(searchResults).toBeVisible();
  });
});
