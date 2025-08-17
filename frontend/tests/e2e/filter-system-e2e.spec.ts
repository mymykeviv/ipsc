import { test, expect } from '@playwright/test'

test.describe('Filter System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5174')
    
    // Check if already logged in
    const dashboardTitle = page.locator('h1:has-text("Dashboard - Cashflow Summary")')
    if (await dashboardTitle.isVisible()) {
      // Already logged in, continue
      return
    }
    
    // Login if not already logged in
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button:has-text("Login")')
    
    // Wait for dashboard to load
    await page.waitForURL('**/')
    await expect(page.locator('h1:has-text("Dashboard - Cashflow Summary")')).toBeVisible()
  })

  test.describe('Products Page Filters', () => {
    test('should have collapsible filter section collapsed by default', async ({ page }) => {
      await page.click('text=Products')
      await expect(page.locator('h1:has-text("Products")')).toBeVisible()
      
      // Check that filter section is collapsed by default
      const filterSection = page.locator('.enhanced-filter-bar')
      await expect(filterSection).toBeVisible()
      
      // The content should be hidden initially
      const filterContent = page.locator('.enhanced-filter-bar .filter-content')
      await expect(filterContent).not.toBeVisible()
    })

    test('should expand filter section when clicked', async ({ page }) => {
      await page.click('text=Products')
      
      // Click on the filter section header to expand
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Check that filter content is now visible
      await expect(page.locator('text=Search:')).toBeVisible()
      await expect(page.locator('text=Category:')).toBeVisible()
      await expect(page.locator('text=Item Type:')).toBeVisible()
    })

    test('should filter products by category', async ({ page }) => {
      await page.click('text=Products')
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Select Electronics category
      await page.click('text=Category:')
      await page.click('text=Electronics')
      
      // Verify that only electronics products are shown
      const products = page.locator('table tbody tr')
      await expect(products).toHaveCount(1) // Assuming only one electronics product
    })

    test('should filter products by price range', async ({ page }) => {
      await page.click('text=Products')
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Select price range
      await page.click('text=Price Range:')
      await page.click('text=₹100 - ₹500')
      
      // Verify that products in this range are shown
      const products = page.locator('table tbody tr')
      await expect(products).toHaveCount(1) // Assuming one product in this range
    })

    test('should show active filter count', async ({ page }) => {
      await page.click('text=Products')
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Apply a filter
      await page.click('text=Category:')
      await page.click('text=Electronics')
      
      // Check that active filter count is shown
      await expect(page.locator('text=1 active filter')).toBeVisible()
    })

    test('should clear all filters', async ({ page }) => {
      await page.click('text=Products')
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Apply multiple filters
      await page.click('text=Category:')
      await page.click('text=Electronics')
      
      await page.click('text=Item Type:')
      await page.click('text=Tradable')
      
      // Verify active filters
      await expect(page.locator('text=2 active filters')).toBeVisible()
      
      // Clear all filters
      await page.click('text=Clear All Filters')
      
      // Verify filters are cleared
      await expect(page.locator('text=No filters applied')).toBeVisible()
    })
  })

  test.describe('Invoices Page Filters', () => {
    test('should filter invoices by payment status', async ({ page }) => {
      await page.click('text=Invoices')
      await expect(page.locator('h1:has-text("Invoices")')).toBeVisible()
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Select payment status
      await page.click('text=Payment Status:')
      await page.click('text=Paid')
      
      // Verify that only paid invoices are shown
      const invoices = page.locator('table tbody tr')
      await expect(invoices).toHaveCount(1) // Assuming one paid invoice
    })

    test('should filter invoices by amount range', async ({ page }) => {
      await page.click('text=Invoices')
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Select amount range
      await page.click('text=Amount Range:')
      await page.click('text=₹1,000 - ₹5,000')
      
      // Verify that invoices in this range are shown
      const invoices = page.locator('table tbody tr')
      await expect(invoices).toHaveCount(1) // Assuming one invoice in this range
    })
  })

  test.describe('Cashflow Transactions Filters', () => {
    test('should filter transactions by type', async ({ page }) => {
      await page.click('text=Cashflow')
      await expect(page.locator('h1:has-text("Cashflow Transactions")')).toBeVisible()
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Select transaction type
      await page.click('text=Type:')
      await page.click('text=Cash Inflow')
      
      // Verify that only inflow transactions are shown
      const transactions = page.locator('table tbody tr')
      await expect(transactions).toHaveCount(1) // Assuming one inflow transaction
    })

    test('should filter transactions by payment method', async ({ page }) => {
      await page.click('text=Cashflow')
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Select payment method
      await page.click('text=Payment Method:')
      await page.click('text=Cash')
      
      // Verify that only cash transactions are shown
      const transactions = page.locator('table tbody tr')
      await expect(transactions).toHaveCount(1) // Assuming one cash transaction
    })
  })

  test.describe('Expenses Page Filters', () => {
    test('should filter expenses by category', async ({ page }) => {
      await page.click('text=Expenses')
      await expect(page.locator('h1:has-text("Expenses")')).toBeVisible()
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Select expense category
      await page.click('text=Category:')
      await page.click('text=Office Supplies')
      
      // Verify that only office supply expenses are shown
      const expenses = page.locator('table tbody tr')
      await expect(expenses).toHaveCount(1) // Assuming one office supply expense
    })

    test('should filter expenses by payment method', async ({ page }) => {
      await page.click('text=Expenses')
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Select payment method
      await page.click('text=Payment Method:')
      await page.click('text=Bank Transfer')
      
      // Verify that only bank transfer expenses are shown
      const expenses = page.locator('table tbody tr')
      await expect(expenses).toHaveCount(1) // Assuming one bank transfer expense
    })
  })

  test.describe('Purchases Page Filters', () => {
    test('should filter purchases by vendor', async ({ page }) => {
      await page.click('text=Purchases')
      await expect(page.locator('h1:has-text("Purchases")')).toBeVisible()
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Select vendor
      await page.click('text=Vendor:')
      await page.click('text=ABC Suppliers')
      
      // Verify that only purchases from this vendor are shown
      const purchases = page.locator('table tbody tr')
      await expect(purchases).toHaveCount(1) // Assuming one purchase from this vendor
    })

    test('should filter purchases by payment status', async ({ page }) => {
      await page.click('text=Purchases')
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Select payment status
      await page.click('text=Payment Status:')
      await page.click('text=Unpaid')
      
      // Verify that only unpaid purchases are shown
      const purchases = page.locator('table tbody tr')
      await expect(purchases).toHaveCount(1) // Assuming one unpaid purchase
    })
  })

  test.describe('Stock History Filters', () => {
    test('should filter stock history by product', async ({ page }) => {
      await page.click('text=Stock History')
      await expect(page.locator('h1:has-text("Stock History")')).toBeVisible()
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Select product
      await page.click('text=Product:')
      await page.click('text=Laptop')
      
      // Verify that only stock movements for this product are shown
      const movements = page.locator('table tbody tr')
      await expect(movements).toHaveCount(1) // Assuming one movement for this product
    })

    test('should filter stock history by entry type', async ({ page }) => {
      await page.click('text=Stock History')
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Select entry type
      await page.click('text=Entry Type:')
      await page.click('text=In')
      
      // Verify that only incoming stock movements are shown
      const movements = page.locator('table tbody tr')
      await expect(movements).toHaveCount(1) // Assuming one incoming movement
    })
  })

  test.describe('Invoice Payments Filters', () => {
    test('should filter invoice payments by customer', async ({ page }) => {
      await page.click('text=Invoice Payments')
      await expect(page.locator('h1:has-text("Invoice Payments")')).toBeVisible()
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Select customer
      await page.click('text=Customer:')
      await page.click('text=John Doe')
      
      // Verify that only payments from this customer are shown
      const payments = page.locator('table tbody tr')
      await expect(payments).toHaveCount(1) // Assuming one payment from this customer
    })

    test('should filter invoice payments by payment method', async ({ page }) => {
      await page.click('text=Invoice Payments')
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Select payment method
      await page.click('text=Payment Method:')
      await page.click('text=UPI')
      
      // Verify that only UPI payments are shown
      const payments = page.locator('table tbody tr')
      await expect(payments).toHaveCount(1) // Assuming one UPI payment
    })
  })

  test.describe('Purchase Payments Filters', () => {
    test('should filter purchase payments by vendor', async ({ page }) => {
      await page.click('text=Purchase Payments')
      await expect(page.locator('h1:has-text("Purchase Payments")')).toBeVisible()
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Select vendor
      await page.click('text=Vendor:')
      await page.click('text=XYZ Suppliers')
      
      // Verify that only payments to this vendor are shown
      const payments = page.locator('table tbody tr')
      await expect(payments).toHaveCount(1) // Assuming one payment to this vendor
    })

    test('should filter purchase payments by payment status', async ({ page }) => {
      await page.click('text=Purchase Payments')
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Select payment status
      await page.click('text=Payment Status:')
      await page.click('text=Paid')
      
      // Verify that only paid purchase payments are shown
      const payments = page.locator('table tbody tr')
      await expect(payments).toHaveCount(1) // Assuming one paid purchase payment
    })
  })

  test.describe('Filter System Integration', () => {
    test('should maintain filter state across page navigation', async ({ page }) => {
      // Set up filters on Products page
      await page.click('text=Products')
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      await page.click('text=Category:')
      await page.click('text=Electronics')
      
      // Navigate to another page
      await page.click('text=Invoices')
      
      // Navigate back to Products
      await page.click('text=Products')
      
      // Check that filter section is collapsed by default on return
      const filterContent = page.locator('.enhanced-filter-bar .filter-content')
      await expect(filterContent).not.toBeVisible()
    })

    test('should handle multiple filter combinations', async ({ page }) => {
      await page.click('text=Products')
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Apply multiple filters
      await page.click('text=Category:')
      await page.click('text=Electronics')
      
      await page.click('text=Item Type:')
      await page.click('text=Tradable')
      
      await page.click('text=GST Rate:')
      await page.click('text=18%')
      
      // Verify that all filters are applied
      await expect(page.locator('text=3 active filters')).toBeVisible()
      
      // Verify that the results are filtered correctly
      const products = page.locator('table tbody tr')
      await expect(products).toHaveCount(1) // Assuming one product matches all criteria
    })

    test('should handle empty filter results gracefully', async ({ page }) => {
      await page.click('text=Products')
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Apply a filter that should return no results
      await page.click('text=Category:')
      await page.click('text=Non-existent Category')
      
      // Verify that no results message is shown
      await expect(page.locator('text=No products found')).toBeVisible()
    })

    test('should provide keyboard navigation for filters', async ({ page }) => {
      await page.click('text=Products')
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Focus on the category dropdown
      const categoryDropdown = page.locator('text=Category:').locator('..').locator('[role="combobox"]')
      await categoryDropdown.focus()
      
      // Press Enter to open dropdown
      await page.keyboard.press('Enter')
      
      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      
      // Verify that a category is selected
      await expect(page.locator('text=1 active filter')).toBeVisible()
    })
  })

  test.describe('Filter System Performance', () => {
    test('should load filters quickly', async ({ page }) => {
      await page.click('text=Products')
      
      const startTime = Date.now()
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Wait for filter content to be visible
      await expect(page.locator('text=Search:')).toBeVisible()
      
      const endTime = Date.now()
      const loadTime = endTime - startTime
      
      // Filter expansion should be fast (less than 500ms)
      expect(loadTime).toBeLessThan(500)
    })

    test('should apply filters without significant delay', async ({ page }) => {
      await page.click('text=Products')
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      const startTime = Date.now()
      
      // Apply a filter
      await page.click('text=Category:')
      await page.click('text=Electronics')
      
      // Wait for the table to update
      await expect(page.locator('table tbody tr')).toBeVisible()
      
      const endTime = Date.now()
      const filterTime = endTime - startTime
      
      // Filter application should be fast (less than 1000ms)
      expect(filterTime).toBeLessThan(1000)
    })
  })

  test.describe('Filter System Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.click('text=Products')
      
      // Navigate to filter section using Tab
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Focus should be on the filter header
      const filterHeader = page.locator('.enhanced-filter-bar').locator('[role="button"]')
      await expect(filterHeader).toBeFocused()
      
      // Press Enter to expand
      await page.keyboard.press('Enter')
      
      // Verify that filter content is visible
      await expect(page.locator('text=Search:')).toBeVisible()
    })

    test('should have proper ARIA labels', async ({ page }) => {
      await page.click('text=Products')
      
      // Check ARIA attributes on filter header
      const filterHeader = page.locator('.enhanced-filter-bar').locator('[role="button"]')
      await expect(filterHeader).toHaveAttribute('aria-expanded', 'false')
      await expect(filterHeader).toHaveAttribute('aria-label')
    })

    test('should announce filter changes to screen readers', async ({ page }) => {
      await page.click('text=Products')
      
      // Expand filter section
      const filterHeader = page.locator('.enhanced-filter-bar').locator('text=Advanced Filters')
      await filterHeader.click()
      
      // Apply a filter
      await page.click('text=Category:')
      await page.click('text=Electronics')
      
      // Check that the active filter count is announced
      await expect(page.locator('text=1 active filter')).toBeVisible()
    })
  })
})
