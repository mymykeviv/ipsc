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
    // Wait for page to load and check what's actually there
    await page.waitForTimeout(2000);
    
    // Check if we're still on dashboard or if products page loaded
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const productsHeading = page.locator('h1:has-text("Manage Products")');
    
    const isDashboard = await dashboardHeading.isVisible();
    const isProducts = await productsHeading.isVisible();
    
    console.log('Dashboard visible:', isDashboard);
    console.log('Products visible:', isProducts);
    
    if (isDashboard) {
      console.log('Still on dashboard - navigation issue');
      // Try clicking the products link in navigation
      await page.click('a[href="/products"]');
      await page.waitForTimeout(2000);
      
      // Check again after clicking
      const isDashboardAfter = await dashboardHeading.isVisible();
      const isProductsAfter = await productsHeading.isVisible();
      
      console.log('After clicking - Dashboard visible:', isDashboardAfter);
      console.log('After clicking - Products visible:', isProductsAfter);
      
      // Check the current URL
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // Check for any error messages
      const errorElements = page.locator('.error, [role="alert"], .alert');
      const errorCount = await errorElements.count();
      console.log('Error elements found:', errorCount);
      
      if (errorCount > 0) {
        for (let i = 0; i < errorCount; i++) {
          const errorText = await errorElements.nth(i).textContent();
          console.log('Error text:', errorText);
        }
      }
    }
    
    // Now check for products page elements
    await expect(page.locator('h1:has-text("Manage Products")')).toBeVisible();
    
    // Wait for loading to complete (check for either loading text or actual content)
    const loadingText = page.locator('text=Loading products...');
    const productsTable = page.locator('table');
    
    // Wait for either loading to disappear or table to appear
    await Promise.race([
      loadingText.waitFor({ state: 'hidden', timeout: 10000 }),
      productsTable.waitFor({ state: 'visible', timeout: 10000 })
    ]);
    
    // Check for add product button
    await expect(page.locator('button:has-text("Add Product")')).toBeVisible();
    
    // Check for search functionality - try different selectors
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });

  test('should add a new product', async ({ page }) => {
    // Ensure we're on the products page
    await page.goto('/products');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const productsHeading = page.locator('h1:has-text("Manage Products")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/products"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for products page to load (either heading or loading state)
    const loadingText = page.locator('text=Loading products...');
    const productsTable = page.locator('table');
    
    // Wait for either loading to disappear or table to appear
    await Promise.race([
      loadingText.waitFor({ state: 'hidden', timeout: 10000 }),
      productsTable.waitFor({ state: 'visible', timeout: 10000 })
    ]);
    
    // Now check for products page elements
    await expect(page.locator('h1:has-text("Manage Products")')).toBeVisible();
    
    // Click add product button
    await page.click('button:has-text("Add Product")');
    
    // Wait for form to load
    await page.waitForURL('/products/add');
    
    // Fill in product details - use nth-of-type selectors since fields don't have placeholders
    await page.fill('input[type="text"]:nth-of-type(1)', 'Test Product'); // Product Name
    await page.fill('input[type="text"]:nth-of-type(2)', 'TEST001'); // Product Code
    await page.fill('input[type="text"]:nth-of-type(3)', 'TEST-SKU-001'); // SKU
    await page.selectOption('select:nth-of-type(1)', 'Pieces'); // Unit of Measure
    await page.selectOption('select:nth-of-type(2)', 'Fabrication Vendor'); // Supplier
    await page.selectOption('select:nth-of-type(3)', 'Goods'); // Product Type
    await page.fill('input[type="text"]:nth-of-type(4)', 'Test Category'); // Product Category
    await page.fill('textarea', 'Test product description'); // Product Description
    await page.fill('input[type="number"]:nth-of-type(1)', '100'); // Purchase Price
    await page.fill('input[type="number"]:nth-of-type(2)', '150'); // Selling Price
    await page.fill('input[type="text"]:nth-of-type(5)', 'TEST123'); // HSN Code
    await page.selectOption('select:nth-of-type(4)', '18%'); // GST Rate
    await page.fill('input[type="number"]:nth-of-type(3)', '50'); // Opening Stock
    await page.fill('input[type="number"]:nth-of-type(4)', '50'); // Closing Stock
    await page.fill('textarea:nth-of-type(2)', 'Test notes'); // Notes
    
    // Submit the form
    await page.click('button:has-text("Add Product")');
    
    // Wait for redirect to products list
    await page.waitForURL('/products');
    
    // Verify product was added
    await expect(page.locator('text=Test Product')).toBeVisible();
  });

  test('should edit product details', async ({ page }) => {
    // Find and click edit button for first product
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    
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
    const stockButton = page.locator('button:has-text("Stock Adjustment")').first();
    await stockButton.click();
    
    // Wait for stock adjustment form
    await page.waitForSelector('h1:has-text("Stock Adjustment")');
    
    // Fill in adjustment details
    await page.fill('input[name="quantity"]', '10');
    await page.selectOption('select[name="adjustmentType"]', 'add');
    await page.fill('textarea[name="notes"]', 'Test stock adjustment');
    
    // Submit adjustment
    await page.click('button:has-text("Apply Adjustment")');
    
    // Wait for redirect to products list
    await page.waitForURL('/products');
    
    // Verify adjustment was applied
    await expect(page.locator('text=Stock adjustment applied successfully')).toBeVisible();
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
    await expect(page.locator('select[name="adjustmentType"]')).toBeVisible();
  });

  test('should view stock history for a product', async ({ page }) => {
    // Find and click stock history button for first product
    const historyButton = page.locator('button:has-text("Stock History")').first();
    await historyButton.click();
    
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
