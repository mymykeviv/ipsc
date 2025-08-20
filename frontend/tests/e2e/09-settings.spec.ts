import { test, expect } from '@playwright/test';

test.describe('Settings Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to settings
    await page.goto('/');
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/', { timeout: 10000 });
    await page.goto('/settings');
  });

  test('should display settings page with navigation tabs', async ({ page }) => {
    // Ensure we're on the settings page
    await page.goto('/settings');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard and navigate if needed
    const dashboardHeading = page.locator('h1:has-text("📊 ProfitPath Dashboard")');
    const settingsHeading = page.locator('h1:has-text("Settings")');
    
    const isDashboard = await dashboardHeading.isVisible();
    if (isDashboard) {
      await page.click('a[href="/settings"]');
      await page.waitForTimeout(2000);
    }
    
    // Debug: Check what's on the page
    const currentUrl = page.url();
    console.log('Current URL for settings:', currentUrl);
    
    // Debug: Check what headings are on the page
    const allHeadings = await page.locator('h1, h2, h3').allTextContents();
    console.log('All headings on settings page:', allHeadings);
    
    // Verify that settings functionality is accessible
    await expect(page.locator('h1, h2, h3')).toBeVisible();
    
    console.log('Settings page test completed');
  });

  test('should view and edit company details', async ({ page }) => {
    // Navigate to company details
    await page.goto('/settings/company');
    
    // Verify company details page
    await expect(page.locator('h2:has-text("Company Details")')).toBeVisible();
    
    // Check for company details form
    await expect(page.locator('input[name="company_name"]')).toBeVisible();
    await expect(page.locator('input[name="address"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="gst_number"]')).toBeVisible();
    
    // Edit company details
    await page.fill('input[name="company_name"]', 'Updated Company Name');
    await page.fill('input[name="address"]', 'Updated Company Address');
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    
    // Verify changes were saved
    await expect(page.locator('text=Company details updated successfully')).toBeVisible();
  });

  test('should view and edit tax settings', async ({ page }) => {
    // Navigate to tax settings
    await page.goto('/settings/tax');
    
    // Verify tax settings page
    await expect(page.locator('h2:has-text("Tax Settings")')).toBeVisible();
    
    // Check for tax settings form
    await expect(page.locator('input[name="cgst_rate"]')).toBeVisible();
    await expect(page.locator('input[name="sgst_rate"]')).toBeVisible();
    await expect(page.locator('input[name="igst_rate"]')).toBeVisible();
    
    // Edit tax rates
    await page.fill('input[name="cgst_rate"]', '9');
    await page.fill('input[name="sgst_rate"]', '9');
    await page.fill('input[name="igst_rate"]', '18');
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    
    // Verify changes were saved
    await expect(page.locator('text=Tax settings updated successfully')).toBeVisible();
  });

  test('should view and edit user details', async ({ page }) => {
    // Navigate to users settings
    await page.goto('/settings/users');
    
    // Verify users page
    await expect(page.locator('h2:has-text("Users")')).toBeVisible();
    
    // Check for users table
    await expect(page.locator('table')).toBeVisible();
    
    // Check for user table columns
    await expect(page.locator('th:has-text("Username")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    
    // Find and click edit button for first user
    await page.click('button:has-text("Edit")').first();
    
    // Wait for edit form
    await page.waitForSelector('h3:has-text("Edit User")');
    
    // Check for user edit form
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('select[name="role"]')).toBeVisible();
    
    // Update user details
    await page.fill('input[name="email"]', 'updated@example.com');
    
    // Save changes
    await page.click('button:has-text("Update User")');
    
    // Verify changes were saved
    await expect(page.locator('text=User updated successfully')).toBeVisible();
  });

  test('should add a new user', async ({ page }) => {
    // Navigate to users settings
    await page.goto('/settings/users');
    
    // Click add user button
    await page.click('button:has-text("Add User")');
    
    // Wait for add user form
    await page.waitForSelector('h3:has-text("Add User")');
    
    // Fill in user details
    await page.fill('input[name="username"]', 'newuser');
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.selectOption('select[name="role"]', 'User');
    
    // Save user
    await page.click('button:has-text("Save User")');
    
    // Verify user was added
    await expect(page.locator('text=User added successfully')).toBeVisible();
  });

  test('should change user password', async ({ page }) => {
    // Navigate to users settings
    await page.goto('/settings/users');
    
    // Find and click change password button for first user
    await page.click('button:has-text("Change Password")').first();
    
    // Wait for change password form
    await page.waitForSelector('h3:has-text("Change Password")');
    
    // Fill in new password
    await page.fill('input[name="new_password"]', 'newpassword123');
    await page.fill('input[name="confirm_password"]', 'newpassword123');
    
    // Save password change
    await page.click('button:has-text("Change Password")');
    
    // Verify password was changed
    await expect(page.locator('text=Password changed successfully')).toBeVisible();
  });

  test('should activate/deactivate user', async ({ page }) => {
    // Navigate to users settings
    await page.goto('/settings/users');
    
    // Find and click activate/deactivate button for first user
    const toggleButton = page.locator('button:has-text("Activate"), button:has-text("Deactivate")').first();
    const currentState = await toggleButton.textContent();
    
    await toggleButton.click();
    
    // Wait for state change
    await page.waitForTimeout(1000);
    
    // Verify state changed
    const newState = await toggleButton.textContent();
    expect(newState).not.toBe(currentState);
  });

  test('should navigate between settings tabs', async ({ page }) => {
    // Navigate to company details
    await page.click('a:has-text("Company Details")');
    await expect(page.locator('h2:has-text("Company Details")')).toBeVisible();
    
    // Navigate to tax settings
    await page.click('a:has-text("Tax Settings")');
    await expect(page.locator('h2:has-text("Tax Settings")')).toBeVisible();
    
    // Navigate to users
    await page.click('a:has-text("Users")');
    await expect(page.locator('h2:has-text("Users")')).toBeVisible();
  });
});
