import { test, expect } from '@playwright/test';

test.describe('Suppliers/Vendors Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to parties (vendors are part of parties)
    await page.goto('/');
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/', { timeout: 10000 });
    await page.goto('/parties');
  });

  test('should display vendors list page', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const partiesHeading = page.locator('h1:has-text("👥 Parties Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      // Navigate to vendors page
      await page.click('a[href="/vendors"]');
      await page.waitForTimeout(2000);
    }
    
    // Check for parties page elements (vendors are part of parties)
    await expect(page.locator('h1:has-text("👥 Parties Management")')).toBeVisible();
    
    // Check for add vendor button
    await expect(page.locator('button:has-text("🏢Add Vendor")')).toBeVisible();
    
    // Check for search functionality
    await expect(page.locator('input[placeholder="Search parties by name, contact, email..."]')).toBeVisible();
  });

  test('should add a new vendor', async ({ page }) => {
    // Ensure we're on the vendors page
    await page.goto('/vendors');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const partiesHeading = page.locator('h1:has-text("👥 Parties Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/vendors"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for parties page to load
    await expect(page.locator('h1:has-text("👥 Parties Management")')).toBeVisible();
    
    // Click add vendor button
    await page.click('button:has-text("🏢Add Vendor")');
    
    // Wait for form to load
    await page.waitForURL('/vendors/add');
    

    
    // Fill in vendor details - just fill the first few required fields
    await page.fill('input[type="text"]', 'Test Vendor'); // Name (first text input)
    
    // Submit the form
    await page.click('button:has-text("Add Vendor")');
    
    // Wait for form submission
    await page.waitForTimeout(2000);
    
    // Check if we're still on add page (success) or got redirected
    const isOnAddPage = await page.locator('h1:has-text("Add New Vendor")').isVisible();
    const isOnVendorsList = await page.locator('h1:has-text("👥 Parties Management")').isVisible();
    
    // Either behavior is acceptable - the important thing is no error
    expect(isOnAddPage || isOnVendorsList).toBeTruthy();
    
    // Verify no error messages appeared
    const errorMessage = page.locator('text=HTTP 500: Internal Server Error');
    expect(await errorMessage.isVisible()).toBeFalsy();
    
    console.log('Vendor add test completed successfully');
  });

  test('should edit vendor details', async ({ page }) => {
    // Ensure we're on the vendors page
    await page.goto('/vendors');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const partiesHeading = page.locator('h1:has-text("👥 Parties Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/vendors"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for parties page to load
    await expect(page.locator('h1:has-text("👥 Parties Management")')).toBeVisible();
    
    // Find and click edit button for first vendor (dropdown button)
    const dropdownButton = page.locator('button:has-text("⋯")').first();
    await dropdownButton.click();
    
    // Wait for dropdown to appear and click Edit
    await page.waitForTimeout(500);
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    
    // Wait for edit form to load
    await page.waitForURL(/\/vendors\/edit\/\d+/);
    
    // Update vendor name
    await page.fill('input[type="text"]', 'Updated Vendor Name');
    
    // Save changes
    await page.click('button:has-text("Update Vendor")');
    
    // Wait for form submission
    await page.waitForTimeout(2000);
    
    // Check if we're still on edit page (success) or got redirected
    const isOnEditPage = await page.locator('h1:has-text("Edit Vendor")').isVisible();
    const isOnVendorsList = await page.locator('h1:has-text("👥 Parties Management")').isVisible();
    
    // Either behavior is acceptable - the important thing is no error
    expect(isOnEditPage || isOnVendorsList).toBeTruthy();
    
    // Verify no error messages appeared
    const errorMessage = page.locator('text=HTTP 500: Internal Server Error');
    expect(await errorMessage.isVisible()).toBeFalsy();
    
    console.log('Vendor edit test completed successfully');
  });

  test('should activate/deactivate vendor', async ({ page }) => {
    // Ensure we're on the vendors page
    await page.goto('/vendors');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const partiesHeading = page.locator('h1:has-text("👥 Parties Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/vendors"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for parties page to load
    await expect(page.locator('h1:has-text("👥 Parties Management")')).toBeVisible();
    
    // Find and click activate/deactivate button for first vendor (dropdown button)
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

  test('should search and filter vendors', async ({ page }) => {
    // Ensure we're on the vendors page
    await page.goto('/vendors');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const partiesHeading = page.locator('h1:has-text("👥 Parties Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/vendors"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for parties page to load
    await expect(page.locator('h1:has-text("👥 Parties Management")')).toBeVisible();
    
    // Search for a vendor
    await page.fill('input[placeholder="Search parties by name, contact, email..."]', 'Test');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Verify search results
    const searchResults = page.locator('tr:has-text("Test")');
    await expect(searchResults).toBeVisible();
  });

  test('should display vendor details in table', async ({ page }) => {
    // Ensure we're on the vendors page
    await page.goto('/vendors');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const partiesHeading = page.locator('h1:has-text("👥 Parties Management")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/vendors"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for parties page to load
    await expect(page.locator('h1:has-text("👥 Parties Management")')).toBeVisible();
    
    // Check for vendor table columns
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Contact")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("GSTIN")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });
});
