import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('UI Issues Fixes - Comprehensive Testing', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login();
  });

  test.describe('Issue 1: Expense Edit Form Prefilling', () => {
    test('should prefill expense form when editing', async ({ page }) => {
      // First create an expense
      const testData = helpers.generateTestData();
      await page.goto('/expenses/add');
      
      await helpers.fillForm({
        expense_date: testData.expense.expense_date,
        expense_type: 'Office Supplies',
        category: 'Indirect/Operating',
        description: 'Test expense for editing',
        amount: '500.00',
        payment_method: 'Cash',
        account_head: 'Cash'
      });
      
      await helpers.submitForm();
      await helpers.expectSuccessMessage();
      
      // Navigate to expenses list and click edit
      await page.goto('/expenses');
      await page.click('[data-testid="edit-expense-button"]');
      
      // Check if form is prefilled
      await expect(page.locator('[data-testid="expense_date-input"]')).toHaveValue(testData.expense.expense_date);
      await expect(page.locator('[data-testid="expense_type-input"]')).toHaveValue('Office Supplies');
      await expect(page.locator('[data-testid="category-input"]')).toHaveValue('Indirect/Operating');
      await expect(page.locator('[data-testid="description-input"]')).toHaveValue('Test expense for editing');
      await expect(page.locator('[data-testid="amount-input"]')).toHaveValue('500.00');
      await expect(page.locator('[data-testid="payment_method-input"]')).toHaveValue('Cash');
      await expect(page.locator('[data-testid="account_head-input"]')).toHaveValue('Cash');
    });

    test('should update expense when form is submitted', async ({ page }) => {
      // Navigate to edit an existing expense
      await page.goto('/expenses');
      await page.click('[data-testid="edit-expense-button"]');
      
      // Modify the description
      await page.fill('[data-testid="description-input"]', 'Updated expense description');
      
      // Submit the form
      await helpers.submitForm();
      await helpers.expectSuccessMessage('Expense updated successfully');
      
      // Verify the expense was updated
      await page.goto('/expenses');
      await expect(page.locator('text=Updated expense description')).toBeVisible();
    });
  });

  test.describe('Issue 2: GST Reports UI Availability', () => {
    test('should navigate to GST Reports page', async ({ page }) => {
      await page.goto('/');
      
      // Click on GST Reports link
      await page.click('a:has-text("GST Reports (GSTR-1 & GSTR-3B)")');
      
      // Verify we're on the GST reports page
      await expect(page.locator('h1:has-text("Reports")')).toBeVisible();
    });

    test('should display all report types in navigation', async ({ page }) => {
      await page.goto('/');
      
      // Check if all report links exist
      const reportLinks = [
        'GST Reports (GSTR-1 & GSTR-3B)',
        'Cashflow Reports',
        'Income Reports',
        'Expense Reports',
        'Inventory Reports',
        'Purchase Reports',
        'Payment Reports',
        'Financial Reports (P&L, Balance Sheet)'
      ];
      
      for (const linkText of reportLinks) {
        const link = page.locator(`a:has-text("${linkText}")`);
        await expect(link).toBeVisible();
      }
    });

    test('should navigate to different report sections', async ({ page }) => {
      // Test GST reports
      await page.goto('/reports/gst');
      await expect(page.locator('h1:has-text("Reports")')).toBeVisible();
      
      // Test Financial reports
      await page.goto('/reports/financial');
      await expect(page.locator('h1:has-text("Reports")')).toBeVisible();
      
      // Test Cashflow reports
      await page.goto('/reports/cashflow');
      await expect(page.locator('h1:has-text("Reports")')).toBeVisible();
    });
  });

  test.describe('Issue 3: Date Filter Dropdowns', () => {
    test('should display date filter in Cashflow transactions', async ({ page }) => {
      await page.goto('/cashflow');
      
      // Check if date filter dropdown exists
      const dateFilter = page.locator('select:has-text("All Dates")');
      await expect(dateFilter).toBeVisible();
      
      // Check if all date options are available
      const dateOptions = [
        'All Dates',
        'Today',
        'Yesterday',
        'Last 7 Days',
        'Last 30 Days',
        'This Month',
        'Last Month'
      ];
      
      for (const option of dateOptions) {
        await expect(page.locator(`option:has-text("${option}")`)).toBeVisible();
      }
    });

    test('should filter cashflow transactions by date', async ({ page }) => {
      await page.goto('/cashflow');
      
      // Select "Today" filter
      await page.selectOption('select:has-text("All Dates")', 'today');
      
      // Verify filter is applied
      await expect(page.locator('select:has-text("Today")')).toHaveValue('today');
      
      // Select "Last 7 Days" filter
      await page.selectOption('select:has-text("Today")', 'last7days');
      await expect(page.locator('select:has-text("Last 7 Days")')).toHaveValue('last7days');
    });

    test('should display date filter in Products table', async ({ page }) => {
      await page.goto('/products');
      
      // Check if date filter dropdown exists
      const dateFilter = page.locator('select[data-testid="date-filter"]');
      await expect(dateFilter).toBeVisible();
    });

    test('should display date filter in Invoices table', async ({ page }) => {
      await page.goto('/invoices');
      
      // Check if date filter dropdown exists
      const dateFilter = page.locator('select[data-testid="date-filter"]');
      await expect(dateFilter).toBeVisible();
    });

    test('should display date filter in Purchases table', async ({ page }) => {
      await page.goto('/purchases');
      
      // Check if date filter dropdown exists
      const dateFilter = page.locator('select[data-testid="date-filter"]');
      await expect(dateFilter).toBeVisible();
    });

    test('should display date filter in Payments table', async ({ page }) => {
      await page.goto('/payments/invoice/list');
      
      // Check if date filter dropdown exists
      const dateFilter = page.locator('select[data-testid="date-filter"]');
      await expect(dateFilter).toBeVisible();
    });
  });

  test.describe('Issue 4: Customer and Vendor Menu Merging', () => {
    test('should display merged Customers/Vendors section', async ({ page }) => {
      await page.goto('/');
      
      // Check if merged section exists
      const mergedSection = page.locator('.nav-section:has-text("👥 Customers / Vendors")');
      await expect(mergedSection).toBeVisible();
    });

    test('should navigate to Customers from merged menu', async ({ page }) => {
      await page.goto('/');
      
      // Click on Customers link
      await page.click('a:has-text("Customers")');
      
      // Verify we're on the customers page
      await expect(page.locator('h1:has-text("Manage Customers")')).toBeVisible();
    });

    test('should navigate to Vendors from merged menu', async ({ page }) => {
      await page.goto('/');
      
      // Click on Vendors link
      await page.click('a:has-text("Vendors")');
      
      // Verify we're on the vendors page
      await expect(page.locator('h1:has-text("Manage Vendors")')).toBeVisible();
    });

    test('should add new customer from merged menu', async ({ page }) => {
      await page.goto('/');
      
      // Click on Add/Edit Customer link
      await page.click('a:has-text("Add/Edit Customer")');
      
      // Verify we're on the add customer page
      await expect(page.locator('h1:has-text("Add Customer")')).toBeVisible();
    });

    test('should add new vendor from merged menu', async ({ page }) => {
      await page.goto('/');
      
      // Click on Add/Edit Vendor link
      await page.click('a:has-text("Add/Edit Vendor")');
      
      // Verify we're on the add vendor page
      await expect(page.locator('h1:has-text("Add Vendor")')).toBeVisible();
    });
  });

  test.describe('Issue 5: Invoice and Purchase Menu Merging', () => {
    test('should display separate Invoices and Purchases sections', async ({ page }) => {
      await page.goto('/');
      
      // Check if both sections exist
      const invoicesSection = page.locator('.nav-section:has-text("📄 Invoices")');
      const purchasesSection = page.locator('.nav-section:has-text("📦 Purchases")');
      
      await expect(invoicesSection).toBeVisible();
      await expect(purchasesSection).toBeVisible();
    });

    test('should navigate to Invoices section', async ({ page }) => {
      await page.goto('/');
      
      // Click on Manage Invoices
      await page.click('a:has-text("Manage Invoices")');
      
      // Verify we're on the invoices page
      await expect(page.locator('h1:has-text("Manage Invoices")')).toBeVisible();
    });

    test('should navigate to Purchases section', async ({ page }) => {
      await page.goto('/');
      
      // Click on Manage Purchases
      await page.click('a:has-text("Manage Purchases")');
      
      // Verify we're on the purchases page
      await expect(page.locator('h1:has-text("Manage Purchases")')).toBeVisible();
    });
  });

  test.describe('Issue 6: Invoice Payment Form Links', () => {
    test('should navigate to invoice payment form from side menu', async ({ page }) => {
      await page.goto('/');
      
      // Click on Add/Edit Invoice Payment link
      await page.click('a:has-text("Add/Edit Invoice Payment")');
      
      // Verify we're on the invoice payment form
      await expect(page.locator('h1:has-text("Add Invoice Payment")')).toBeVisible();
    });

    test('should navigate to invoice payment form from invoice table', async ({ page }) => {
      await page.goto('/invoices');
      
      // Click on payment button for first invoice
      await page.click('[data-testid="payment-button"]');
      
      // Verify we're on the payment form
      await expect(page.locator('h1:has-text("Add Invoice Payment")')).toBeVisible();
    });

    test('should navigate to purchase payment form from side menu', async ({ page }) => {
      await page.goto('/');
      
      // Click on Add/Edit Purchase Payment link
      await page.click('a:has-text("Add/Edit Purchase Payment")');
      
      // Verify we're on the purchase payment form
      await expect(page.locator('h1:has-text("Add Purchase Payment")')).toBeVisible();
    });
  });

  test.describe('Issue 7: Side Menu Collapsible Behavior', () => {
    test('should auto-expand active section', async ({ page }) => {
      await page.goto('/products');
      
      // Check if products section is expanded
      const productsSection = page.locator('.nav-section:has-text("🏷️ Products")');
      await expect(productsSection).toBeVisible();
      
      // Check if products sub-links are visible
      await expect(page.locator('a:has-text("Manage Products")')).toBeVisible();
      await expect(page.locator('a:has-text("Add/Edit Product")')).toBeVisible();
    });

    test('should collapse other sections when navigating', async ({ page }) => {
      await page.goto('/products');
      
      // Navigate to invoices
      await page.click('a:has-text("Manage Invoices")');
      
      // Check if invoices section is expanded and products is collapsed
      await expect(page.locator('a:has-text("Manage Invoices")')).toBeVisible();
      await expect(page.locator('a:has-text("Add/Edit Invoice")')).toBeVisible();
      
      // Products section should be collapsed
      const productsSubLinks = page.locator('.nav-section:has-text("🏷️ Products") a:has-text("Manage Products")');
      await expect(productsSubLinks).not.toBeVisible();
    });

    test('should toggle section when header is clicked', async ({ page }) => {
      await page.goto('/');
      
      // Click on Products section header
      await page.click('.nav-section:has-text("🏷️ Products") .nav-section-header');
      
      // Check if products section is expanded
      await expect(page.locator('a:has-text("Manage Products")')).toBeVisible();
      
      // Click again to collapse
      await page.click('.nav-section:has-text("🏷️ Products") .nav-section-header');
      
      // Check if products section is collapsed
      await expect(page.locator('a:has-text("Manage Products")')).not.toBeVisible();
    });

    test('should show correct expand/collapse indicators', async ({ page }) => {
      await page.goto('/');
      
      // Check if all sections show collapse indicator (▶)
      const sections = ['products', 'invoices', 'purchases', 'customers', 'cashflow', 'reporting', 'settings'];
      
      for (const section of sections) {
        const sectionHeader = page.locator(`.nav-section:has-text("${section}") .nav-section-header`);
        await expect(sectionHeader).toContainText('▶');
      }
    });
  });

  test.describe('Integration Tests', () => {
    test('should maintain state across navigation', async ({ page }) => {
      // Start on products page
      await page.goto('/products');
      
      // Navigate to invoices
      await page.click('a:has-text("Manage Invoices")');
      await expect(page.locator('h1:has-text("Manage Invoices")')).toBeVisible();
      
      // Navigate to purchases
      await page.click('a:has-text("Manage Purchases")');
      await expect(page.locator('h1:has-text("Manage Purchases")')).toBeVisible();
      
      // Navigate back to products
      await page.click('a:has-text("Manage Products")');
      await expect(page.locator('h1:has-text("Manage Products")')).toBeVisible();
    });

    test('should handle all UI interactions without errors', async ({ page }) => {
      await page.goto('/');
      
      // Test all major navigation paths
      const navigationTests = [
        { link: 'Manage Products', expectedTitle: 'Manage Products' },
        { link: 'Manage Invoices', expectedTitle: 'Manage Invoices' },
        { link: 'Manage Purchases', expectedTitle: 'Manage Purchases' },
        { link: 'Customers', expectedTitle: 'Manage Customers' },
        { link: 'Vendors', expectedTitle: 'Manage Vendors' },
        { link: 'View Cashflow Transactions', expectedTitle: 'Cashflow Transactions' },
        { link: 'Manage Expenses', expectedTitle: 'Manage Expenses' },
        { link: 'GST Reports (GSTR-1 & GSTR-3B)', expectedTitle: 'Reports' }
      ];
      
      for (const test of navigationTests) {
        await page.click(`a:has-text("${test.link}")`);
        await expect(page.locator(`h1:has-text("${test.expectedTitle}")`)).toBeVisible();
        await page.goto('/'); // Go back to start
      }
    });
  });

  test.describe('Accessibility and Responsive Design', () => {
    test('should be accessible via keyboard navigation', async ({ page }) => {
      await page.goto('/');
      
      // Test tab navigation through menu items
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Test arrow key navigation
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      
      // Should navigate to a page
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should be responsive on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Check if sidebar is accessible on mobile
      const sidebar = page.locator('.sidebar');
      await expect(sidebar).toBeVisible();
      
      // Check if menu items are touch-friendly
      const menuItems = page.locator('.nav-link');
      for (let i = 0; i < Math.min(await menuItems.count(), 3); i++) {
        const item = menuItems.nth(i);
        const box = await item.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThan(44); // Minimum touch target
        }
      }
    });
  });
});
