import { test, expect } from '@playwright/test';

test.describe('User Stories Feedback Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login
    await page.goto('/');
    await page.fill('[data-testid="username"]', 'admin');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Story 1: Critical Form Submission Issues', () => {
    test('should create invoice without HTTP 400 error', async ({ page }) => {
      // Navigate to invoice creation
      await page.goto('/invoices/add');
      
      // Fill required fields
      await page.fill('input[name="invoice_no"]', 'INV-TEST-001');
      await page.fill('input[name="date"]', '2024-12-15');
      await page.selectOption('select[name="customer_id"]', '1');
      
      // Add invoice item
      await page.click('button:has-text("Add Item")');
      await page.selectOption('select[name="product_id"]', '1');
      await page.fill('input[name="qty"]', '1');
      await page.fill('input[name="rate"]', '100');
      
      // Submit form
      await page.click('button:has-text("Create Invoice")');
      
      // Should not show HTTP 400 error
      await expect(page.locator('text=HTTP 400')).not.toBeVisible();
      await expect(page.locator('text=Bad Request')).not.toBeVisible();
      
      // Should either show success or specific validation errors
      const errorText = await page.locator('.error-message').textContent();
      if (errorText) {
        expect(errorText).not.toContain('HTTP 400');
        expect(errorText).not.toContain('Bad Request');
      }
    });

    test('should create product without HTTP 422 error', async ({ page }) => {
      // Navigate to product creation
      await page.goto('/products/add');
      
      // Fill required fields
      await page.fill('input[name="name"]', 'Test Product');
      await page.selectOption('select[name="product_type"]', 'tradable');
      await page.fill('input[name="sales_price"]', '100');
      await page.fill('input[name="opening_stock"]', '10');
      await page.fill('input[name="unit"]', 'Pcs');
      
      // Submit form
      await page.click('button:has-text("Add Product")');
      
      // Should not show HTTP 422 error
      await expect(page.locator('text=HTTP 422')).not.toBeVisible();
      await expect(page.locator('text=Unprocessable Entity')).not.toBeVisible();
    });
  });

  test.describe('Story 2: Contextual Party Management', () => {
    test('should show Add Customer button on customer page', async ({ page }) => {
      await page.goto('/customers');
      
      // Should show contextual button
      await expect(page.locator('button:has-text("Add Customer")')).toBeVisible();
      await expect(page.locator('button:has-text("Add Vendor")')).not.toBeVisible();
      await expect(page.locator('button:has-text("Add New Party")')).not.toBeVisible();
      
      // Should not show tabs when on specific customer page
      await expect(page.locator('text=Customers')).not.toBeVisible();
      await expect(page.locator('text=Vendors')).not.toBeVisible();
    });

    test('should show Add Vendor button on vendor page', async ({ page }) => {
      await page.goto('/vendors');
      
      // Should show contextual button
      await expect(page.locator('button:has-text("Add Vendor")')).toBeVisible();
      await expect(page.locator('button:has-text("Add Customer")')).not.toBeVisible();
      await expect(page.locator('button:has-text("Add New Party")')).not.toBeVisible();
      
      // Should not show tabs when on specific vendor page
      await expect(page.locator('text=Customers')).not.toBeVisible();
      await expect(page.locator('text=Vendors')).not.toBeVisible();
    });

    test('should show contextual buttons and no generic Add New Party on general parties page', async ({ page }) => {
      await page.goto('/parties');
      
      // Should show tabs on general parties page
      await expect(page.locator('text=Customers')).toBeVisible();
      await expect(page.locator('text=Vendors')).toBeVisible();
      
      // Should NOT show generic Add New Party button (removed as per feedback)
      await expect(page.locator('button:has-text("Add New Party")')).not.toBeVisible();
    });
  });

  test.describe('Story 3: Party Form Layout Redesign', () => {
    test('should have 2-column layout in party form', async ({ page }) => {
      await page.goto('/customers/add');
      
      // Check for 2-column layout sections
      await expect(page.locator('text=Basic Information')).toBeVisible();
      await expect(page.locator('text=GST Information')).toBeVisible();
      await expect(page.locator('text=Billing Address')).toBeVisible();
      await expect(page.locator('text=Shipping Address')).toBeVisible();
      
      // Check for copy billing address button
      await expect(page.locator('button:has-text("Copy Billing Address")')).toBeVisible();
      
      // Check Party Type is in Basic Information section
      await expect(page.locator('label:has-text("Party Type")')).toBeVisible();
    });

    test('should copy billing address when button is clicked', async ({ page }) => {
      await page.goto('/customers/add');
      
      // Fill billing address
      await page.fill('input[name="billing_address_line1"]', 'Test Billing Address');
      await page.fill('input[name="billing_city"]', 'Test City');
      await page.fill('input[name="billing_state"]', 'Test State');
      
      // Click copy button
      await page.click('button:has-text("Copy Billing Address")');
      
      // Check shipping address is filled
      await expect(page.locator('input[name="shipping_address_line1"]')).toHaveValue('Test Billing Address');
      await expect(page.locator('input[name="shipping_city"]')).toHaveValue('Test City');
      await expect(page.locator('input[name="shipping_state"]')).toHaveValue('Test State');
    });

    test('should show dynamic button text based on party type', async ({ page }) => {
      // Test customer form
      await page.goto('/customers/add');
      await expect(page.locator('button[type="submit"]')).toContainText('Add Customer');
      
      // Change to vendor type
      await page.selectOption('select[name="type"]', 'vendor');
      await expect(page.locator('button[type="submit"]')).toContainText('Add Vendor');
      
      // Test vendor form
      await page.goto('/vendors/add');
      await expect(page.locator('button[type="submit"]')).toContainText('Add Vendor');
      
      // Change to customer type
      await page.selectOption('select[name="type"]', 'customer');
      await expect(page.locator('button[type="submit"]')).toContainText('Add Customer');
    });
  });

  test.describe('Story 4: Parties Page Filter Improvements', () => {
    test('should not show quick filters', async ({ page }) => {
      await page.goto('/customers');
      
      // Should not show quick filter section at all
      await expect(page.locator('text=Quick Filters:')).not.toBeVisible();
      await expect(page.locator('text=All Parties')).not.toBeVisible();
      await expect(page.locator('text=Active')).not.toBeVisible();
      await expect(page.locator('text=GST Registered')).not.toBeVisible();
      await expect(page.locator('text=Non-GST')).not.toBeVisible();
      await expect(page.locator('text=Recent (30 Days)')).not.toBeVisible();
      await expect(page.locator('text=Outstanding')).not.toBeVisible();
      await expect(page.locator('text=Low Activity')).not.toBeVisible();
      await expect(page.locator('text=New This Month')).not.toBeVisible();
      await expect(page.locator('text=High Value')).not.toBeVisible();
      await expect(page.locator('text=Inactive')).not.toBeVisible();
    });

    test('should show simplified search and basic filters', async ({ page }) => {
      await page.goto('/customers');
      
      // Should show search bar
      await expect(page.locator('input[placeholder*="Search parties"]')).toBeVisible();
      
      // Should show basic filter dropdowns
      await expect(page.locator('select[placeholder="Status"]')).toBeVisible();
      await expect(page.locator('select[placeholder="GST Status"]')).toBeVisible();
      
      // Should show clear button
      await expect(page.locator('button:has-text("Clear")')).toBeVisible();
      
      // Should NOT show enhanced advanced filters accordion
      await expect(page.locator('text=🔍 Advanced Filters')).not.toBeVisible();
    });
  });

  test.describe('Story 5: Purchase Management Display Fixes', () => {
    test('should show new purchases in manage purchase section', async ({ page }) => {
      await page.goto('/purchases');
      
      // Get initial count
      const initialCount = await page.locator('tr').count();
      
      // Create a new purchase
      await page.goto('/purchases/add');
      await page.fill('input[name="vendor_id"]', '1');
      await page.fill('input[name="date"]', '2024-12-15');
      await page.fill('input[name="due_date"]', '2024-12-30');
      await page.fill('input[name="terms"]', 'Due on Receipt');
      await page.fill('input[name="place_of_supply"]', 'Test Location');
      
      // Add item
      await page.click('button:has-text("Add Item")');
      await page.selectOption('select[name="product_id"]', '1');
      await page.fill('input[name="qty"]', '1');
      await page.fill('input[name="rate"]', '100');
      
      await page.click('button:has-text("Create Purchase")');
      
      // Should navigate back to purchases list
      await expect(page).toHaveURL('/purchases');
      
      // Should show the new purchase in the list
      await expect(page.locator('text=Test Location')).toBeVisible();
    });
  });

  test.describe('Story 6: Expense History Display Fixes', () => {
    test('should show new expenses in expense history', async ({ page }) => {
      await page.goto('/expenses');
      
      // Get initial count
      const initialCount = await page.locator('tr').count();
      
      // Create a new expense
      await page.goto('/expenses/add');
      await page.fill('input[name="expense_date"]', '2024-12-15');
      await page.fill('input[name="expense_type"]', 'Test Expense');
      await page.selectOption('select[name="category"]', 'Direct/COGS');
      await page.fill('input[name="description"]', 'Test Description');
      await page.fill('input[name="amount"]', '100');
      await page.selectOption('select[name="payment_method"]', 'Cash');
      await page.selectOption('select[name="account_head"]', 'Cash');
      
      await page.click('button:has-text("Add Expense")');
      
      // Should navigate back to expenses list
      await expect(page).toHaveURL('/expenses');
      
      // Should show the new expense in the list
      await expect(page.locator('text=Test Expense')).toBeVisible();
    });
  });

  test.describe('Story 7: Dashboard Expense Breakdown', () => {
    test('should show expense breakdown by category', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should show expense breakdown section
      await expect(page.locator('text=Expense Breakdown by Category')).toBeVisible();
      
      // Should show Direct/COGS category
      await expect(page.locator('text=Direct/COGS')).toBeVisible();
      
      // Should show Indirect/Operating category
      await expect(page.locator('text=Indirect/Operating')).toBeVisible();
      
      // Should show percentage breakdowns
      await expect(page.locator('text=% of total expenses')).toBeVisible();
    });
  });

  test.describe('Story 8: Enhanced Form Error Handling', () => {
    test('should show enhanced error messages', async ({ page }) => {
      await page.goto('/invoices/add');
      
      // Try to submit without required fields
      await page.click('button:has-text("Create Invoice")');
      
      // Should show enhanced error message with icon
      await expect(page.locator('.error-message')).toBeVisible();
      await expect(page.locator('text=❌')).toBeVisible();
      
      // Should show specific validation errors
      await expect(page.locator('text=Customer is required')).toBeVisible();
      await expect(page.locator('text=Invoice date is required')).toBeVisible();
    });

    test('should show dismissible error messages', async ({ page }) => {
      await page.goto('/invoices/add');
      
      // Try to submit without required fields
      await page.click('button:has-text("Create Invoice")');
      
      // Should show dismiss button
      await expect(page.locator('button[aria-label="Dismiss error"]')).toBeVisible();
      
      // Click dismiss button
      await page.click('button[aria-label="Dismiss error"]');
      
      // Error should be dismissed
      await expect(page.locator('.error-message')).not.toBeVisible();
    });
  });

  test.describe('Integration Tests', () => {
    test('should complete full user journey without errors', async ({ page }) => {
      // 1. Create a customer
      await page.goto('/customers/add');
      await page.fill('input[name="name"]', 'Test Customer');
      await page.selectOption('select[name="type"]', 'customer');
      await page.fill('input[name="billing_address_line1"]', 'Test Address');
      await page.fill('input[name="billing_city"]', 'Test City');
      await page.fill('input[name="billing_state"]', 'Test State');
      await page.fill('input[name="billing_pincode"]', '123456');
      await page.click('button:has-text("Add Customer")');
      
      // Should navigate back to customers list
      await expect(page).toHaveURL('/customers');
      await expect(page.locator('text=Test Customer')).toBeVisible();
      
      // 2. Create a product
      await page.goto('/products/add');
      await page.fill('input[name="name"]', 'Test Product');
      await page.selectOption('select[name="product_type"]', 'tradable');
      await page.fill('input[name="sales_price"]', '100');
      await page.fill('input[name="opening_stock"]', '10');
      await page.fill('input[name="unit"]', 'Pcs');
      await page.click('button:has-text("Add Product")');
      
      // Should navigate back to products list
      await expect(page).toHaveURL('/products');
      await expect(page.locator('text=Test Product')).toBeVisible();
      
      // 3. Create an invoice
      await page.goto('/invoices/add');
      await page.fill('input[name="invoice_no"]', 'INV-TEST-001');
      await page.fill('input[name="date"]', '2024-12-15');
      await page.selectOption('select[name="customer_id"]', '1');
      await page.fill('input[name="place_of_supply"]', 'Test Location');
      await page.fill('input[name="place_of_supply_state_code"]', '29');
      await page.fill('input[name="bill_to_address"]', 'Test Address');
      await page.fill('input[name="ship_to_address"]', 'Test Address');
      
      // Add item
      await page.click('button:has-text("Add Item")');
      await page.selectOption('select[name="product_id"]', '1');
      await page.fill('input[name="qty"]', '1');
      await page.fill('input[name="rate"]', '100');
      
      await page.click('button:has-text("Create Invoice")');
      
      // Should not show HTTP errors
      await expect(page.locator('text=HTTP 400')).not.toBeVisible();
      await expect(page.locator('text=HTTP 422')).not.toBeVisible();
    });
  });
});
