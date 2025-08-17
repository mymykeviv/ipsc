import { test, expect } from '@playwright/test';

test.describe('Login Functionality Test', () => {
  test('should load login page and allow login', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5174');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if login form is visible
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    await expect(page.locator('text=Sign in to your account to continue')).toBeVisible();
    
    // Check if login form inputs are present
    await expect(page.locator('input[placeholder="Enter your username"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter your password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Fill in login credentials
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard (root path)
    await page.waitForURL('**/', { timeout: 10000 });
    
    // Verify we're on the dashboard
    await expect(page.locator('text=Dashboard - Cashflow Summary')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5174');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in invalid credentials
    await page.fill('input[placeholder="Enter your username"]', 'invalid');
    await page.fill('input[placeholder="Enter your password"]', 'invalid');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=Invalid credentials. Please try again.')).toBeVisible();
  });
});
