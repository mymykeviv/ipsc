import { test as base, expect } from '@playwright/test';

// Test user credentials
const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

// Extend the base test with authentication
export const test = base.extend({
  // Auto-authenticate for all tests
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill in credentials
    await page.fill('input[placeholder*="username" i], input[name*="username" i]', TEST_USER.username);
    await page.fill('input[type="password"], input[placeholder*="password" i]', TEST_USER.password);
    
    // Submit login form
    await page.click('button[type="submit"], input[type="submit"]');
    
    // Wait for successful login (redirect to dashboard or home)
    await page.waitForURL(/\/$|\/dashboard|\/invoices/, { timeout: 10000 });
    
    // Verify we're logged in
    await expect(page).not.toHaveURL(/\/login/);
    
    await use(page);
  },
  
  // Setup test data
  testData: async ({ authenticatedPage }, use) => {
    // Create test data if needed
    const data = {
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+91-9876543210'
      },
      product: {
        name: 'Test Product',
        price: '100.00',
        description: 'Test product description'
      },
      invoice: {
        number: `INV-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount: '100.00'
      }
    };
    
    await use(data);
  }
});

export { expect } from '@playwright/test';
