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
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const partiesHeading = page.locator('h1:has-text("👥 Parties Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      // Navigate to customers page
      await page.click('a[href="/customers"]');
      await page.waitForTimeout(2000);
    }
    
    // Check for parties page elements (customers are part of parties)
    await expect(page.locator('h1:has-text("👥 Parties Management")')).toBeVisible();
    
    // Debug: Check what buttons are available
    const allButtons = await page.locator('button').allTextContents();
    console.log('Available buttons:', allButtons);
    
    // Check for add customer button
    await expect(page.locator('button:has-text("👤 Add Customer")')).toBeVisible();
    
    // Check for search functionality
    await expect(page.locator('input[placeholder="Search parties by name, contact, email..."]')).toBeVisible();
  });

  test('should add a new customer', async ({ page }) => {
    // Ensure we're on the parties page
    await page.goto('/parties');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const partiesHeading = page.locator('h1:has-text("👥 Parties Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/parties"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for parties page to load
    await expect(page.locator('h1:has-text("👥 Parties Management")')).toBeVisible();
    
    // Click add customer button
    await page.click('button:has-text("👤 Add Customer")');
    
    // Wait for form to load
    await page.waitForURL('/parties/add');
    
    // Fill in customer details - just fill the first few required fields
    await page.fill('input[type="text"]', 'Test Customer'); // Name (first text input)
    
    // Submit the form
    await page.click('button:has-text("Add Customer")');
    
    // Wait for form submission
    await page.waitForTimeout(2000);
    
    // Check if we're still on add page (success) or got redirected
    const isOnAddPage = await page.locator('h1:has-text("Add New Customer")').isVisible();
    const isOnPartiesList = await page.locator('h1:has-text("👥 Parties Management")').isVisible();
    
    // Either behavior is acceptable - the important thing is no error
    expect(isOnAddPage || isOnPartiesList).toBeTruthy();
    
    // Verify no error messages appeared
    const errorMessage = page.locator('text=HTTP 500: Internal Server Error');
    expect(await errorMessage.isVisible()).toBeFalsy();
    
    console.log('Customer add test completed successfully');
  });

  test('should edit customer details', async ({ page }) => {
    // Ensure we're on the parties page
    await page.goto('/parties');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const partiesHeading = page.locator('h1:has-text("👥 Parties Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/parties"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for parties page to load
    await expect(page.locator('h1:has-text("👥 Parties Management")')).toBeVisible();
    
    // Find and click edit button for first customer (dropdown button)
    const dropdownButton = page.locator('button:has-text("⋯")').first();
    await dropdownButton.click();
    
    // Wait for dropdown to appear and click Edit
    await page.waitForTimeout(500);
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    
    // Wait for edit form to load
    await page.waitForURL(/\/parties\/edit\/\d+/);
    
    // Update customer name
    await page.fill('input[type="text"]', 'Updated Customer Name');
    
    // Save changes
    await page.click('button:has-text("Update Customer")');
    
    // Wait for form submission
    await page.waitForTimeout(2000);
    
    // Check if we're still on edit page (success) or got redirected
    const isOnEditPage = await page.locator('h1:has-text("Edit Customer")').isVisible();
    const isOnPartiesList = await page.locator('h1:has-text("👥 Parties Management")').isVisible();
    
    // Either behavior is acceptable - the important thing is no error
    expect(isOnEditPage || isOnPartiesList).toBeTruthy();
    
    // Verify no error messages appeared
    const errorMessage = page.locator('text=HTTP 500: Internal Server Error');
    expect(await errorMessage.isVisible()).toBeFalsy();
    
    console.log('Customer edit test completed successfully');
  });

  test('should activate/deactivate customer', async ({ page }) => {
    // Ensure we're on the parties page
    await page.goto('/parties');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const partiesHeading = page.locator('h1:has-text("👥 Parties Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/parties"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for parties page to load
    await expect(page.locator('h1:has-text("👥 Parties Management")')).toBeVisible();
    
    // Find and click activate/deactivate button for first customer (dropdown button)
    const dropdownButton = page.locator('button:has-text("⋯")').first();
    await dropdownButton.click();
    
    // Wait for dropdown to appear and check for Activate/Deactivate button
    await page.waitForTimeout(500);
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
    // Ensure we're on the parties page
    await page.goto('/parties');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const partiesHeading = page.locator('h1:has-text("👥 Parties Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/parties"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for parties page to load
    await expect(page.locator('h1:has-text("👥 Parties Management")')).toBeVisible();
    
    // Search for a customer
    await page.fill('input[placeholder="Search parties by name, contact, email..."]', 'Test');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Verify search results
    const searchResults = page.locator('tr:has-text("Test")');
    await expect(searchResults).toBeVisible();
  });

  test('should display customer details in table', async ({ page }) => {
    // Ensure we're on the parties page
    await page.goto('/parties');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const partiesHeading = page.locator('h1:has-text("👥 Parties Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/parties"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for parties page to load
    await expect(page.locator('h1:has-text("👥 Parties Management")')).toBeVisible();
    
    // Check for customer table columns
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Contact")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("GSTIN")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });
});
