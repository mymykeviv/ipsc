import { test, expect } from '@playwright/test';

test('should capture console errors and debug app loading', async ({ page }) => {
  // Listen for console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Listen for page errors
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  // Navigate to the application
  await page.goto('http://localhost:5173');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Wait a bit more for React to render
  await page.waitForTimeout(5000);
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-app-loading.png', fullPage: true });
  
  // Get page content
  const pageContent = await page.content();
  
  // Check if root div exists
  const rootDiv = await page.locator('#root');
  const rootExists = await rootDiv.count() > 0;
  
  // Check if any React content is rendered
  const reactContent = await page.locator('[data-reactroot], [data-reactid]').count();
  
  // Log debug information
  console.log('=== DEBUG INFORMATION ===');
  console.log('Root div exists:', rootExists);
  console.log('React content elements:', reactContent);
  console.log('Page title:', await page.title());
  console.log('Current URL:', page.url());
  
  if (consoleErrors.length > 0) {
    console.log('Console errors:', consoleErrors);
  }
  
  if (pageErrors.length > 0) {
    console.log('Page errors:', pageErrors);
  }
  
  // Check if the page contains any React-related content
  const hasReactContent = pageContent.includes('react') || pageContent.includes('React');
  console.log('Page contains React references:', hasReactContent);
  
  // Try to find any text content
  const bodyText = await page.locator('body').textContent();
  console.log('Body text (first 200 chars):', bodyText?.substring(0, 200));
  
  // Check if login form elements exist
  const usernameInput = await page.locator('input[placeholder="Enter your username"]').count();
  const passwordInput = await page.locator('input[placeholder="Enter your password"]').count();
  console.log('Username input exists:', usernameInput > 0);
  console.log('Password input exists:', passwordInput > 0);
  
  // If login form exists, try to interact with it
  if (usernameInput > 0 && passwordInput > 0) {
    console.log('Login form found - attempting to fill');
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    console.log('After login attempt - URL:', page.url());
  }
});
