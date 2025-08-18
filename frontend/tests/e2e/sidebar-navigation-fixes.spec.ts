import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login
    await page.goto('/');
    await page.fill('[data-testid="username"]', 'admin');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should not show Add New Party link in sidebar', async ({ page }) => {
    // Navigate to any page to ensure sidebar is visible
    await page.goto('/dashboard');
    
    // Should NOT show "Add New Party" link in sidebar (removed as per feedback)
    await expect(page.locator('a:has-text("Add New Party")')).not.toBeVisible();
    await expect(page.locator('a[href="/parties/add"]')).not.toBeVisible();
    
    // Should still show other party-related links
    await expect(page.locator('a:has-text("Customers")')).toBeVisible();
    await expect(page.locator('a:has-text("Vendors")')).toBeVisible();
  });

  test('should show contextual party management links', async ({ page }) => {
    // Navigate to customers page
    await page.goto('/customers');
    
    // Should show contextual "Add Customer" button in header
    await expect(page.locator('button:has-text("Add Customer")')).toBeVisible();
    
    // Navigate to vendors page
    await page.goto('/vendors');
    
    // Should show contextual "Add Vendor" button in header
    await expect(page.locator('button:has-text("Add Vendor")')).toBeVisible();
  });

  test('should have proper navigation structure', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that main navigation items are present
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('a:has-text("Invoices")')).toBeVisible();
    await expect(page.locator('a:has-text("Purchases")')).toBeVisible();
    await expect(page.locator('a:has-text("Expenses")')).toBeVisible();
    await expect(page.locator('a:has-text("Products")')).toBeVisible();
    await expect(page.locator('a:has-text("Customers")')).toBeVisible();
    await expect(page.locator('a:has-text("Vendors")')).toBeVisible();
    await expect(page.locator('a:has-text("Cashflow")')).toBeVisible();
    await expect(page.locator('a:has-text("Settings")')).toBeVisible();
  });
});
