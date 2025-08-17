import { test, expect } from '@playwright/test';

test.describe('Authentication Flow Test', () => {
  test('should handle authentication flow correctly', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5174');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're already logged in by looking for dashboard content
    const dashboardVisible = await page.locator('text=Dashboard - Cashflow Summary').isVisible();
    
    if (dashboardVisible) {
      // Already logged in - test logout functionality
      console.log('User is already logged in, testing logout...');
      
      // Click logout
      await page.click('button:has-text("Logout")');
      
      // Wait for redirect to login page
      await page.waitForURL('**/login', { timeout: 10000 });
      
      // Verify login form is visible
      await expect(page.locator('text=Welcome Back')).toBeVisible();
      await expect(page.locator('input[placeholder="Enter your username"]')).toBeVisible();
      await expect(page.locator('input[placeholder="Enter your password"]')).toBeVisible();
      
      // Test login
      await page.fill('input[placeholder="Enter your username"]', 'admin');
      await page.fill('input[placeholder="Enter your password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      // Wait for navigation to dashboard
      await page.waitForURL('**/', { timeout: 10000 });
      
      // Verify dashboard is visible
      await expect(page.locator('text=Dashboard - Cashflow Summary')).toBeVisible();
      
    } else {
      // Not logged in - test login functionality
      console.log('User is not logged in, testing login...');
      
      // Verify login form is visible
      await expect(page.locator('text=Welcome Back')).toBeVisible();
      await expect(page.locator('input[placeholder="Enter your username"]')).toBeVisible();
      await expect(page.locator('input[placeholder="Enter your password"]')).toBeVisible();
      
      // Test login
      await page.fill('input[placeholder="Enter your username"]', 'admin');
      await page.fill('input[placeholder="Enter your password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      // Wait for navigation to dashboard
      await page.waitForURL('**/', { timeout: 10000 });
      
      // Verify dashboard is visible
      await expect(page.locator('text=Dashboard - Cashflow Summary')).toBeVisible();
    }
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5174');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we need to logout first
    const dashboardVisible = await page.locator('text=Dashboard - Cashflow Summary').isVisible();
    
    if (dashboardVisible) {
      // Logout first
      await page.click('button:has-text("Logout")');
      await page.waitForURL('**/login', { timeout: 10000 });
    }
    
    // Test invalid credentials
    await page.fill('input[placeholder="Enter your username"]', 'invalid');
    await page.fill('input[placeholder="Enter your password"]', 'invalid');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('text=Invalid credentials. Please try again.')).toBeVisible();
  });
});
