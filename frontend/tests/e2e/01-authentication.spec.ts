import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should display login page when not authenticated', async ({ page }) => {
    // Check if we're redirected to login page
    await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();
    
    // Check for login form elements
    await expect(page.locator('input[placeholder="Enter your username"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter your password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill in login credentials
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    
    // Click login button
    await page.click('button:has-text("Sign in")');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/', { timeout: 10000 });
    
    // Verify we're on the dashboard
    await expect(page.locator('h1:has-text("📊 ProfitPath Dashboard")')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[placeholder="Enter your username"]', 'invalid');
    await page.fill('input[placeholder="Enter your password"]', 'wrongpassword');
    
    // Click login button
    await page.click('button:has-text("Sign in")');
    
    // Check for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should show error for empty credentials', async ({ page }) => {
    // Try to login without credentials
    await page.click('button:has-text("Sign in")');
    
    // Wait a moment for any validation to trigger
    await page.waitForTimeout(500);
    
    // Check for either browser validation or custom validation error
    const browserValidation = page.locator('input[placeholder="Enter your username"]:invalid');
    const customValidation = page.locator('text=Username and password are required');
    
    // Check if either validation is present
    const hasBrowserValidation = await browserValidation.count() > 0;
    const hasCustomValidation = await customValidation.isVisible();
    
    expect(hasBrowserValidation || hasCustomValidation).toBeTruthy();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/', { timeout: 10000 });
    
    // Click logout button
    await page.click('button:has-text("Logout")');
    
    // Verify we're back to login page
    await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();
  });
});
