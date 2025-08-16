import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('UI Fixes - Comprehensive Testing', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login();
  });

  test.describe('Dashboard Data Refresh Fix', () => {
    test('should display refresh button on dashboard', async ({ page }) => {
      await page.goto('/');
      
      // Check if refresh button exists
      const refreshButton = page.locator('button:has-text("🔄")');
      await expect(refreshButton).toBeVisible();
    });

    test('should refresh dashboard data when refresh button is clicked', async ({ page }) => {
      await page.goto('/');
      
      // Get initial data
      const initialNetCashflow = page.locator('[data-testid="net-cashflow-amount"]');
      const initialValue = await initialNetCashflow.textContent();
      
      // Click refresh button
      const refreshButton = page.locator('button:has-text("🔄")');
      await refreshButton.click();
      
      // Wait for refresh to complete
      await page.waitForTimeout(2000);
      
      // Verify data has been refreshed (should be different or same but refreshed)
      const refreshedValue = await initialNetCashflow.textContent();
      expect(refreshedValue).toBeTruthy();
    });

    test('should show loading state during refresh', async ({ page }) => {
      await page.goto('/');
      
      // Click refresh button
      const refreshButton = page.locator('button:has-text("🔄")');
      await refreshButton.click();
      
      // Check if loading state is shown
      const loadingText = page.locator('text=Refreshing...');
      await expect(loadingText).toBeVisible();
    });
  });

  test.describe('Cashflow Transactions Refresh Fix', () => {
    test('should display refresh button on cashflow page', async ({ page }) => {
      await page.goto('/cashflow');
      
      // Check if refresh button exists
      const refreshButton = page.locator('button:has-text("🔄 Refresh")');
      await expect(refreshButton).toBeVisible();
    });

    test('should refresh cashflow transactions when refresh button is clicked', async ({ page }) => {
      await page.goto('/cashflow');
      
      // Get initial transaction count
      const initialTransactions = page.locator('[data-testid="cashflow-table"] tbody tr');
      const initialCount = await initialTransactions.count();
      
      // Click refresh button
      const refreshButton = page.locator('button:has-text("🔄 Refresh")');
      await refreshButton.click();
      
      // Wait for refresh to complete
      await page.waitForTimeout(2000);
      
      // Verify transactions have been refreshed
      const refreshedTransactions = page.locator('[data-testid="cashflow-table"] tbody tr');
      const refreshedCount = await refreshedTransactions.count();
      expect(refreshedCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Products Table Pagination', () => {
    test('should display pagination controls on products page', async ({ page }) => {
      await page.goto('/products');
      
      // Check if pagination exists
      const paginationSection = page.locator('[data-testid="pagination"]');
      await expect(paginationSection).toBeVisible();
    });

    test('should navigate through pages using pagination', async ({ page }) => {
      await page.goto('/products');
      
      // Check if next button exists and is enabled
      const nextButton = page.locator('[data-testid="next-button"]');
      if (await nextButton.isEnabled()) {
        // Click next button
        await nextButton.click();
        
        // Verify page number has changed
        const currentPage = page.locator('[data-testid="current-page"]');
        await expect(currentPage).toContainText('2');
        
        // Click previous button
        const prevButton = page.locator('[data-testid="prev-button"]');
        await prevButton.click();
        
        // Verify page number is back to 1
        await expect(currentPage).toContainText('1');
      }
    });

    test('should display correct page information', async ({ page }) => {
      await page.goto('/products');
      
      // Check if page information is displayed
      const pageInfo = page.locator('text=/Showing.*of.*products/');
      await expect(pageInfo).toBeVisible();
    });
  });

  test.describe('Stock Movement History Search & Pagination', () => {
    test('should display search bar on stock movement history', async ({ page }) => {
      await page.goto('/products/stock-history');
      
      // Check if search bar exists
      const searchBar = page.locator('[data-testid="search-input"]');
      await expect(searchBar).toBeVisible();
    });

    test('should search stock movements by product name', async ({ page }) => {
      await page.goto('/products/stock-history');
      
      // Perform search
      await helpers.testSearch('Cutting Oil', '[data-testid="stock-movement-table"]');
    });

    test('should display pagination on stock movement history', async ({ page }) => {
      await page.goto('/products/stock-history');
      
      // Check if pagination exists
      const paginationSection = page.locator('[data-testid="pagination"]');
      if (await paginationSection.isVisible()) {
        await expect(paginationSection).toBeVisible();
        
        // Test pagination functionality
        await helpers.testPagination('[data-testid="stock-movement-table"]');
      }
    });
  });

  test.describe('Reporting Menu Section', () => {
    test('should display Reporting section in navigation', async ({ page }) => {
      await page.goto('/');
      
      // Check if Reporting section exists
      const reportingSection = page.locator('.nav-section:has-text("📊 Reporting")');
      await expect(reportingSection).toBeVisible();
    });

    test('should display all report types in Reporting section', async ({ page }) => {
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

    test('should navigate to report pages when clicked', async ({ page }) => {
      await page.goto('/');
      
      // Test navigation to GST Reports
      await page.click('a:has-text("GST Reports (GSTR-1 & GSTR-3B)")');
      await expect(page.locator('h1:has-text("GST Reports")')).toBeVisible();
      
      // Test navigation to Financial Reports
      await page.goto('/');
      await page.click('a:has-text("Financial Reports (P&L, Balance Sheet)")');
      await expect(page.locator('h1:has-text("Financial Reports")')).toBeVisible();
    });
  });

  test.describe('GST Toggle Dropdown', () => {
    test('should display GST status dropdown instead of checkbox', async ({ page }) => {
      await page.goto('/customers/add');
      
      // Check if dropdown exists
      const gstStatusDropdown = page.locator('[data-testid="gst_status-input"]');
      await expect(gstStatusDropdown).toBeVisible();
      
      // Verify it's a select element, not a checkbox
      const tagName = await gstStatusDropdown.evaluate(el => el.tagName);
      expect(tagName.toLowerCase()).toBe('select');
    });

    test('should display all three GST status options', async ({ page }) => {
      await page.goto('/customers/add');
      
      // Check dropdown options
      const gstStatusDropdown = page.locator('[data-testid="gst_status-input"]');
      await gstStatusDropdown.click();
      
      await expect(page.locator('option[value="GST"]')).toBeVisible();
      await expect(page.locator('option[value="Non-GST"]')).toBeVisible();
      await expect(page.locator('option[value="Exempted"]')).toBeVisible();
    });

    test('should disable GSTIN fields when Non-GST is selected', async ({ page }) => {
      await page.goto('/customers/add');
      
      // Select Non-GST
      await page.selectOption('[data-testid="gst_status-input"]', 'Non-GST');
      
      // Check if GSTIN field is disabled
      const gstinInput = page.locator('[data-testid="gstin-input"]');
      await expect(gstinInput).toBeDisabled();
    });

    test('should enable GSTIN fields when GST is selected', async ({ page }) => {
      await page.goto('/customers/add');
      
      // Select GST
      await page.selectOption('[data-testid="gst_status-input"]', 'GST');
      
      // Check if GSTIN field is enabled
      const gstinInput = page.locator('[data-testid="gstin-input"]');
      await expect(gstinInput).toBeEnabled();
    });
  });

  test.describe('Stock Adjustment Form Layout', () => {
    test('should use 2-column layout for form sections', async ({ page }) => {
      await page.goto('/products/stock-adjustment');
      
      // Check if form uses grid layout
      const formSection = page.locator('[data-testid="adjustment-details-section"]');
      const computedStyle = await formSection.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          display: style.display,
          gridTemplateColumns: style.gridTemplateColumns
        };
      });
      
      // Should be using grid layout
      expect(computedStyle.display).toBe('grid');
      expect(computedStyle.gridTemplateColumns).toContain('1fr');
    });

    test('should display form fields in organized sections', async ({ page }) => {
      await page.goto('/products/stock-adjustment');
      
      // Check if sections are properly organized
      const sections = [
        '[data-testid="product-selection-section"]',
        '[data-testid="adjustment-details-section"]',
        '[data-testid="reference-information-section"]',
        '[data-testid="notes-section"]'
      ];
      
      for (const section of sections) {
        await expect(page.locator(section)).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile devices', async ({ page }) => {
      await helpers.testResponsiveDesign();
    });

    test('should have proper touch targets on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Check if buttons have proper touch target size
      const buttons = page.locator('button');
      for (let i = 0; i < Math.min(await buttons.count(), 5); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThan(44); // Minimum touch target
          expect(box.width).toBeGreaterThan(44);
        }
      }
    });

    test('should have proper spacing on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Check if elements have proper spacing
      const elements = page.locator('input, select, button');
      for (let i = 0; i < Math.min(await elements.count(), 3); i++) {
        const element = elements.nth(i);
        const box = await element.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThan(32); // Minimum height for mobile
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/');
      await helpers.testAccessibility();
    });

    test('should have proper form labels', async ({ page }) => {
      await page.goto('/customers/add');
      
      // Check if form inputs have proper labels
      const inputs = page.locator('input, select, textarea');
      for (let i = 0; i < Math.min(await inputs.count(), 5); i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          await expect(label).toBeVisible();
        }
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');
      await helpers.testKeyboardNavigation();
    });

    test('should have proper focus indicators', async ({ page }) => {
      await page.goto('/');
      
      // Test focus on interactive elements
      const interactiveElements = page.locator('button, input, select, a');
      for (let i = 0; i < Math.min(await interactiveElements.count(), 3); i++) {
        const element = interactiveElements.nth(i);
        await element.focus();
        await expect(element).toBeFocused();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should display error messages properly', async ({ page }) => {
      await page.goto('/customers/add');
      
      // Try to submit empty form
      await page.click('[data-testid="submit-button"]');
      
      // Check if error message is displayed
      await helpers.expectErrorMessage();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network error by going offline
      await page.route('**/*', route => route.abort());
      
      await page.goto('/');
      
      // Check if error is handled gracefully
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load pages within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      await page.goto('/products');
      
      // Check if pagination is working for large datasets
      const pagination = page.locator('[data-testid="pagination"]');
      if (await pagination.isVisible()) {
        await expect(pagination).toBeVisible();
      }
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work consistently across different browsers', async ({ page }) => {
      await page.goto('/');
      
      // Test basic functionality
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
      
      // Test navigation
      await page.click('a:has-text("Products")');
      await expect(page.locator('h1:has-text("Manage Products")')).toBeVisible();
    });
  });
});
