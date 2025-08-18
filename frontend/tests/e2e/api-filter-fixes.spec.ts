import { test, expect } from '@playwright/test';

test.describe('API Filter Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login
    await page.goto('/');
    await page.fill('[data-testid="username"]', 'admin');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Purchases List Loading', () => {
    test('should load purchases without "Failed to load purchases" error', async ({ page }) => {
      await page.goto('/purchases');
      
      // Wait for the page to load
      await page.waitForLoadState('networkidle');
      
      // Should not show "Failed to load purchases" error
      await expect(page.locator('text=Failed to load purchases')).not.toBeVisible();
      
      // Should either show purchases list or empty state message
      const hasPurchases = await page.locator('table tbody tr').count() > 0;
      const hasEmptyMessage = await page.locator('text=No purchases found').isVisible();
      
      // Should have either purchases or empty message, but not error
      expect(hasPurchases || hasEmptyMessage).toBeTruthy();
    });

    test('should show purchases after creating new purchase', async ({ page }) => {
      await page.goto('/purchases');
      
      // Get initial count
      const initialCount = await page.locator('table tbody tr').count();
      
      // Create a new purchase
      await page.goto('/purchases/add');
      await page.fill('input[name="purchase_no"]', 'PUR-TEST-001');
      await page.fill('input[name="date"]', '2024-12-15');
      await page.selectOption('select[name="vendor_id"]', '1');
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
      await expect(page.locator('text=PUR-TEST-001')).toBeVisible();
      
      // Count should have increased
      const newCount = await page.locator('table tbody tr').count();
      expect(newCount).toBeGreaterThan(initialCount);
    });
  });

  test.describe('Expenses List Loading', () => {
    test('should load expenses without "Failed to load expenses" error', async ({ page }) => {
      await page.goto('/expenses');
      
      // Wait for the page to load
      await page.waitForLoadState('networkidle');
      
      // Should not show "Failed to load expenses" error
      await expect(page.locator('text=Failed to load expenses')).not.toBeVisible();
      
      // Should either show expenses list or empty state message
      const hasExpenses = await page.locator('table tbody tr').count() > 0;
      const hasEmptyMessage = await page.locator('text=No expenses found').isVisible();
      
      // Should have either expenses or empty message, but not error
      expect(hasExpenses || hasEmptyMessage).toBeTruthy();
    });

    test('should show expenses after creating new expense', async ({ page }) => {
      await page.goto('/expenses');
      
      // Get initial count
      const initialCount = await page.locator('table tbody tr').count();
      
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
      
      // Count should have increased
      const newCount = await page.locator('table tbody tr').count();
      expect(newCount).toBeGreaterThan(initialCount);
    });
  });

  test.describe('Filter Functionality', () => {
    test('should apply filters without causing API errors', async ({ page }) => {
      await page.goto('/purchases');
      
      // Apply a filter
      await page.selectOption('select[placeholder="Status"]', 'active');
      
      // Should not show API error
      await expect(page.locator('text=Failed to load purchases')).not.toBeVisible();
      
      // Should show filtered results or empty state
      const hasResults = await page.locator('table tbody tr').count() > 0;
      const hasEmptyMessage = await page.locator('text=No purchases found').isVisible();
      
      expect(hasResults || hasEmptyMessage).toBeTruthy();
    });

    test('should clear filters without causing API errors', async ({ page }) => {
      await page.goto('/expenses');
      
      // Apply a filter
      await page.selectOption('select[placeholder="Category"]', 'Direct/COGS');
      
      // Clear filters
      await page.click('button:has-text("Clear")');
      
      // Should not show API error
      await expect(page.locator('text=Failed to load expenses')).not.toBeVisible();
      
      // Should show all results or empty state
      const hasResults = await page.locator('table tbody tr').count() > 0;
      const hasEmptyMessage = await page.locator('text=No expenses found').isVisible();
      
      expect(hasResults || hasEmptyMessage).toBeTruthy();
    });
  });
});
