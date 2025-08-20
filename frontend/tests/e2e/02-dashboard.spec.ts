import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/');
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('should display dashboard with main sections', async ({ page }) => {
    // Verify dashboard heading
    await expect(page.locator('h1:has-text("📊 ProfitPath Dashboard")')).toBeVisible();
    
    // Check for main dashboard sections
    await expect(page.locator('h3:has-text("Income")')).toBeVisible();
    await expect(page.locator('h3:has-text("Expenses")')).toBeVisible();
    await expect(page.locator('h3:has-text("Cashflow")')).toBeVisible();
  });

  test('should display refresh button and allow data refresh', async ({ page }) => {
    // Check for refresh button
    const refreshButton = page.locator('button:has-text("🔄")');
    await expect(refreshButton).toBeVisible();
    
    // Click refresh button
    await refreshButton.click();
    
    // Verify button shows loading state briefly
    await expect(page.locator('button:has-text("🔄 Loading...")')).toBeVisible();
    
    // Wait for refresh to complete
    await expect(refreshButton).toBeVisible({ timeout: 10000 });
  });

  test('should allow period selection', async ({ page }) => {
    // Check for period selector buttons
    const monthButton = page.locator('button:has-text("Month")');
    const quarterButton = page.locator('button:has-text("Quarter")');
    const yearButton = page.locator('button:has-text("Year")');
    
    await expect(monthButton).toBeVisible();
    await expect(quarterButton).toBeVisible();
    await expect(yearButton).toBeVisible();
    
    // Change period to "Quarter"
    await quarterButton.click();
    
    // Wait for data to refresh
    await page.waitForTimeout(2000);
    
    // Change period to "Year"
    await yearButton.click();
    
    // Wait for data to refresh
    await page.waitForTimeout(2000);
    
    // Change back to "Month"
    await monthButton.click();
    
    // Wait for data to refresh
    await page.waitForTimeout(2000);
  });

  test('should display pending items section', async ({ page }) => {
    // Check for pending items section
    const pendingSection = page.locator('h3:has-text("⏰ Pending Items")');
    await expect(pendingSection).toBeVisible();
    
    // Check for overdue invoices card
    await expect(page.locator('text=Overdue Invoices')).toBeVisible();
    
    // Check for due payments card
    await expect(page.locator('text=Due Payments')).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    // Check for main navigation sections
    await expect(page.locator('text=🏷️ Products')).toBeVisible();
    await expect(page.locator('text=📄 Invoices')).toBeVisible();
    await expect(page.locator('text=📦 Purchases')).toBeVisible();
    await expect(page.locator('text=👥 Parties')).toBeVisible();
    await expect(page.locator('text=💰 Cashflow')).toBeVisible();
  });

  test('should allow navigation menu collapse/expand', async ({ page }) => {
    // Check that invoices section is expanded by default
    await expect(page.locator('text=Manage Invoices')).toBeVisible();
    
    // Click to collapse invoices section
    await page.click('text=📄 Invoices');
    
    // Verify section is collapsed
    await expect(page.locator('text=Manage Invoices')).not.toBeVisible();
    
    // Click to expand again
    await page.click('text=📄 Invoices');
    
    // Verify section is expanded
    await expect(page.locator('text=Manage Invoices')).toBeVisible();
  });
});
