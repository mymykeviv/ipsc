import { test, expect } from '@playwright/test';

test.describe('Customers Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to customers
    await page.goto('/');
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/', { timeout: 10000 });
    await page.goto('/customers');
  });

  test('should display customers list page', async ({ page }) => {
    // Verify customers page heading
    await expect(page.locator('h1:has-text("Customers")')).toBeVisible();
    
    // Check for add customer button
    await expect(page.locator('button:has-text("Add Customer")')).toBeVisible();
    
    // Check for search functionality
    await expect(page.locator('input[placeholder*="search"]')).toBeVisible();
  });

  test('should add a new customer', async ({ page }) => {
    // Click add customer button
    await page.click('button:has-text("Add Customer")');
    
    // Wait for form to load
    await page.waitForURL('/customers/add');
    
    // Fill in customer details
    await page.fill('input[name="name"]', 'Test Customer');
    await page.fill('input[name="email"]', 'customer@test.com');
    await page.fill('input[name="phone"]', '1234567890');
    await page.fill('textarea[name="address"]', 'Test customer address');
    await page.fill('input[name="gst_number"]', 'GST987654321');
    
    // Submit the form
    await page.click('button:has-text("Save Customer")');
    
    // Wait for redirect to customers list
    await page.waitForURL('/customers');
    
    // Verify customer was added
    await expect(page.locator('text=Test Customer')).toBeVisible();
  });

  test('should edit customer details', async ({ page }) => {
    // Find and click edit button for first customer
    await page.click('button:has-text("Edit")').first();
    
    // Wait for edit form to load
    await page.waitForURL(/\/customers\/edit\/\d+/);
    
    // Update customer name
    await page.fill('input[name="name"]', 'Updated Customer Name');
    
    // Save changes
    await page.click('button:has-text("Update Customer")');
    
    // Wait for redirect to customers list
    await page.waitForURL('/customers');
    
    // Verify customer was updated
    await expect(page.locator('text=Updated Customer Name')).toBeVisible();
  });

  test('should activate/deactivate customer', async ({ page }) => {
    // Find and click activate/deactivate button for first customer
    const toggleButton = page.locator('button:has-text("Activate"), button:has-text("Deactivate")').first();
    const currentState = await toggleButton.textContent();
    
    await toggleButton.click();
    
    // Wait for state change
    await page.waitForTimeout(1000);
    
    // Verify state changed
    const newState = await toggleButton.textContent();
    expect(newState).not.toBe(currentState);
  });

  test('should search and filter customers', async ({ page }) => {
    // Search for a customer
    await page.fill('input[placeholder*="search"]', 'Test');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Verify search results
    const searchResults = page.locator('tr:has-text("Test")');
    await expect(searchResults).toBeVisible();
  });

  test('should display customer details in table', async ({ page }) => {
    // Check for customer table columns
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Phone")')).toBeVisible();
    await expect(page.locator('th:has-text("GST Number")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });
});
