import { test, expect } from '@playwright/test';

test.describe('Cashflow & Expenses Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to cashflow
    await page.goto('/');
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('should display cashflow transactions page', async ({ page }) => {
    // Navigate to cashflow
    await page.goto('/cashflow');
    
    // Verify cashflow page heading
    await expect(page.locator('h1:has-text("Cashflow")')).toBeVisible();
    
    // Check for cashflow transactions table
    await expect(page.locator('table')).toBeVisible();
    
    // Check for transaction columns
    await expect(page.locator('th:has-text("Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
    await expect(page.locator('th:has-text("Amount")')).toBeVisible();
    await expect(page.locator('th:has-text("Description")')).toBeVisible();
  });

  test('should display expenses list page', async ({ page }) => {
    // Navigate to expenses
    await page.goto('/expenses');
    
    // Verify expenses page heading
    await expect(page.locator('h1:has-text("Expenses")')).toBeVisible();
    
    // Check for add expense button
    await expect(page.locator('button:has-text("Add Expense")')).toBeVisible();
    
    // Check for search functionality
    await expect(page.locator('input[placeholder*="search"]')).toBeVisible();
  });

  test('should add a new expense', async ({ page }) => {
    // Navigate to expenses
    await page.goto('/expenses');
    
    // Click add expense button
    await page.click('button:has-text("Add Expense")');
    
    // Wait for form to load
    await page.waitForURL('/expenses/add');
    
    // Fill in expense details
    await page.fill('input[name="description"]', 'Test Expense');
    await page.fill('input[name="amount"]', '100');
    await page.selectOption('select[name="category"]', 'Office Supplies');
    await page.selectOption('select[name="payment_method"]', 'Cash');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    
    // Submit the form
    await page.click('button:has-text("Save Expense")');
    
    // Wait for redirect to expenses list
    await page.waitForURL('/expenses');
    
    // Verify expense was added
    await expect(page.locator('text=Test Expense')).toBeVisible();
  });

  test('should edit expense details', async ({ page }) => {
    // Navigate to expenses
    await page.goto('/expenses');
    
    // Find and click edit button for first expense
    await page.click('button:has-text("Edit")').first();
    
    // Wait for edit form to load
    await page.waitForURL(/\/expenses\/edit\/\d+/);
    
    // Update expense description
    await page.fill('input[name="description"]', 'Updated Expense Description');
    
    // Save changes
    await page.click('button:has-text("Update Expense")');
    
    // Wait for redirect to expenses list
    await page.waitForURL('/expenses');
    
    // Verify expense was updated
    await expect(page.locator('text=Updated Expense Description')).toBeVisible();
  });

  test('should delete expense', async ({ page }) => {
    // Navigate to expenses
    await page.goto('/expenses');
    
    // Find and click delete button for first expense
    await page.click('button:has-text("Delete")').first();
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    
    // Wait for deletion
    await page.waitForTimeout(1000);
    
    // Verify expense was deleted
    await expect(page.locator('text=Expense deleted successfully')).toBeVisible();
  });

  test('should search and filter expenses', async ({ page }) => {
    // Navigate to expenses
    await page.goto('/expenses');
    
    // Search for an expense
    await page.fill('input[placeholder*="search"]', 'Test');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Verify search results
    const searchResults = page.locator('tr:has-text("Test")');
    await expect(searchResults).toBeVisible();
  });

  test('should display expense details in table', async ({ page }) => {
    // Navigate to expenses
    await page.goto('/expenses');
    
    // Check for expense table columns
    await expect(page.locator('th:has-text("Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Description")')).toBeVisible();
    await expect(page.locator('th:has-text("Category")')).toBeVisible();
    await expect(page.locator('th:has-text("Amount")')).toBeVisible();
    await expect(page.locator('th:has-text("Payment Method")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('should filter cashflow transactions by type', async ({ page }) => {
    // Navigate to cashflow
    await page.goto('/cashflow');
    
    // Check for filter options
    await expect(page.locator('select[name="transaction_type"]')).toBeVisible();
    
    // Filter by invoice payments
    await page.selectOption('select[name="transaction_type"]', 'invoice_payment');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // Verify filtered results
    await expect(page.locator('text=Invoice Payment')).toBeVisible();
  });

  test('should filter cashflow transactions by date range', async ({ page }) => {
    // Navigate to cashflow
    await page.goto('/cashflow');
    
    // Check for date filter inputs
    await expect(page.locator('input[name="date_from"]')).toBeVisible();
    await expect(page.locator('input[name="date_to"]')).toBeVisible();
    
    // Set date range
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="date_from"]', today);
    await page.fill('input[name="date_to"]', today);
    
    // Apply filter
    await page.click('button:has-text("Apply Filter")');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // Verify filtered results
    await expect(page.locator('table')).toBeVisible();
  });
});
