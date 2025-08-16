import { test, expect } from '@playwright/test';

test.describe('Payment Form Debug', () => {
  test('should display payment form for invoice without login', async ({ page }) => {
    // Navigate directly to invoice payment add page
    await page.goto('/payments/invoice/add');
    
    // Check if the page loads (should redirect to login or show form)
    await page.waitForTimeout(2000);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/payment-form-debug-no-login.png' });
    
    // Check if we're redirected to login or if form is visible
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('Redirected to login page');
    } else {
      console.log('On payment form page');
      // Check if form elements are present
      const form = page.locator('form');
      const formVisible = await form.isVisible();
      console.log(`Form visible: ${formVisible}`);
      
      if (formVisible) {
        const h1 = page.locator('h1');
        const h1Text = await h1.textContent();
        console.log(`H1 text: ${h1Text}`);
      }
    }
  });

  test('should display payment form with correct login', async ({ page }) => {
    // Login first with correct selectors
    await page.goto('/login');
    
    // Wait for the form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Use correct selectors based on the actual Login component
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL('/', { timeout: 10000 });
    
    // Navigate to invoice payment add page
    await page.goto('/payments/invoice/add');
    
    // Check if the page loads
    await expect(page.locator('h1:has-text("Add Invoice Payment")')).toBeVisible();
    
    // Check if form elements are present
    await expect(page.locator('form')).toBeVisible();
    
    // Check for basic form fields
    await expect(page.locator('label:has-text("Select Invoice")')).toBeVisible();
    await expect(page.locator('label:has-text("Payment Amount")')).toBeVisible();
    await expect(page.locator('label:has-text("Payment Method")')).toBeVisible();
    
    // Check if form inputs are present
    await expect(page.locator('select')).toBeVisible();
    await expect(page.locator('input[type="number"]')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    
    // Check if submit button is present
    await expect(page.locator('button:has-text("Add Payment")')).toBeVisible();
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/payment-form-debug-with-login.png' });
  });

  test('should load invoice data for payment form', async ({ page }) => {
    // Login first with correct selectors
    await page.goto('/login');
    await page.waitForSelector('form', { timeout: 10000 });
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    
    // Navigate to invoice payment add page
    await page.goto('/payments/invoice/add');
    
    // Wait for the form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Check if invoice dropdown is populated
    const invoiceSelect = page.locator('select');
    await expect(invoiceSelect).toBeVisible();
    
    // Wait a bit for data to load
    await page.waitForTimeout(2000);
    
    // Check if there are options in the invoice dropdown
    const invoiceOptions = page.locator('select option');
    const optionCount = await invoiceOptions.count();
    console.log(`Invoice options count: ${optionCount}`);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/payment-form-with-data.png' });
  });

  test('should render payment form component without API calls', async ({ page }) => {
    // This test will help us understand if the component itself has issues
    // Navigate to a simple page first
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check if the main app loads
    const appContent = page.locator('#root');
    const appVisible = await appContent.isVisible();
    console.log(`App content visible: ${appVisible}`);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/app-loads.png' });
  });

  test('should render login page properly', async ({ page }) => {
    // Navigate directly to login page
    await page.goto('/login');
    await page.waitForTimeout(2000);
    
    // Check if login page loads
    const loginForm = page.locator('form');
    const formVisible = await loginForm.isVisible();
    console.log(`Login form visible: ${formVisible}`);
    
    if (formVisible) {
      const usernameInput = page.locator('input[placeholder="Enter your username"]');
      const passwordInput = page.locator('input[placeholder="Enter your password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      const usernameVisible = await usernameInput.isVisible();
      const passwordVisible = await passwordInput.isVisible();
      const buttonVisible = await submitButton.isVisible();
      
      console.log(`Username input visible: ${usernameVisible}`);
      console.log(`Password input visible: ${passwordVisible}`);
      console.log(`Submit button visible: ${buttonVisible}`);
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/login-page.png' });
  });

  test('should capture console errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate to the app
    await page.goto('/');
    await page.waitForTimeout(5000);
    
    // Log any errors
    console.log('Console errors:', errors);
    
    // Check if the app rendered
    const appContent = page.locator('#root');
    const appVisible = await appContent.isVisible();
    console.log(`App content visible: ${appVisible}`);
    
    // Check if there's any content in the root
    const rootContent = await page.locator('#root').innerHTML();
    console.log(`Root content length: ${rootContent.length}`);
    console.log(`Root content preview: ${rootContent.substring(0, 200)}`);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/console-errors.png' });
  });
});
