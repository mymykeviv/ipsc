import { test, expect } from '@playwright/test';

test.describe('Suppliers/Vendors Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to vendors
    await page.goto('/');
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/', { timeout: 10000 });
    await page.goto('/vendors');
  });

  test('should display vendors list page', async ({ page }) => {
    // Verify vendors page heading
    await expect(page.locator('h1:has-text("Vendors")')).toBeVisible();
    
    // Check for add vendor button
    await expect(page.locator('button:has-text("Add Vendor")')).toBeVisible();
    
    // Check for search functionality
    await expect(page.locator('input[placeholder*="search"]')).toBeVisible();
  });

  test('should add a new vendor', async ({ page }) => {
    // Click add vendor button
    await page.click('button:has-text("Add Vendor")');
    
    // Wait for form to load
    await page.waitForURL('/vendors/add');
    
    // Fill in vendor details
    await page.fill('input[name="name"]', 'Test Vendor');
    await page.fill('input[name="email"]', 'vendor@test.com');
    await page.fill('input[name="phone"]', '1234567890');
    await page.fill('textarea[name="address"]', 'Test vendor address');
    await page.fill('input[name="gst_number"]', 'GST123456789');
    
    // Submit the form
    await page.click('button:has-text("Save Vendor")');
    
    // Wait for redirect to vendors list
    await page.waitForURL('/vendors');
    
    // Verify vendor was added
    await expect(page.locator('text=Test Vendor')).toBeVisible();
  });

  test('should edit vendor details', async ({ page }) => {
    // Find and click edit button for first vendor
    await page.click('button:has-text("Edit")').first();
    
    // Wait for edit form to load
    await page.waitForURL(/\/vendors\/edit\/\d+/);
    
    // Update vendor name
    await page.fill('input[name="name"]', 'Updated Vendor Name');
    
    // Save changes
    await page.click('button:has-text("Update Vendor")');
    
    // Wait for redirect to vendors list
    await page.waitForURL('/vendors');
    
    // Verify vendor was updated
    await expect(page.locator('text=Updated Vendor Name')).toBeVisible();
  });

  test('should activate/deactivate vendor', async ({ page }) => {
    // Find and click activate/deactivate button for first vendor
    const toggleButton = page.locator('button:has-text("Activate"), button:has-text("Deactivate")').first();
    const currentState = await toggleButton.textContent();
    
    await toggleButton.click();
    
    // Wait for state change
    await page.waitForTimeout(1000);
    
    // Verify state changed
    const newState = await toggleButton.textContent();
    expect(newState).not.toBe(currentState);
  });

  test('should search and filter vendors', async ({ page }) => {
    // Search for a vendor
    await page.fill('input[placeholder*="search"]', 'Test');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Verify search results
    const searchResults = page.locator('tr:has-text("Test")');
    await expect(searchResults).toBeVisible();
  });

  test('should display vendor details in table', async ({ page }) => {
    // Check for vendor table columns
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Phone")')).toBeVisible();
    await expect(page.locator('th:has-text("GST Number")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });
});
