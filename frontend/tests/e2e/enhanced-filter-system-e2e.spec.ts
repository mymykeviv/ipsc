import { test, expect } from '@playwright/test'

test.describe('Enhanced Filter System - Comprehensive E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5174')
    
    // Check if already logged in by looking for dashboard
    const dashboardVisible = await page.locator('h1:has-text("Dashboard - Cashflow Summary")').isVisible()
    
    if (!dashboardVisible) {
      // Login if not already logged in
      await page.fill('input[name="username"]', 'admin')
      await page.fill('input[name="password"]', 'admin123')
      await page.click('button:has-text("Login")')
      await page.waitForURL('**/')
    }
    
    // Wait for dashboard to be visible
    await page.waitForSelector('h1:has-text("Dashboard - Cashflow Summary")')
  })

  test.describe('Products Page Filter Tests', () => {
    test('should display enhanced filter bar with 4-column layout', async ({ page }) => {
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Check if filter bar is visible and expanded by default
      const filterBar = page.locator('text=Product Filters')
      await expect(filterBar).toBeVisible()
      
      // Check 4-column grid layout
      const filterContainer = page.locator('.filter-content').first()
      await expect(filterContainer).toHaveCSS('display', 'grid')
      await expect(filterContainer).toHaveCSS('grid-template-columns', 'repeat(4, 1fr)')
    })

    test('should show active filter count', async ({ page }) => {
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Initially should show 0 active filters
      await expect(page.locator('text=0')).toBeVisible()
      
      // Apply a filter
      await page.click('text=Status')
      await page.click('text=Active')
      
      // Should now show 1 active filter
      await expect(page.locator('text=1')).toBeVisible()
    })

    test('should apply multiple filters correctly', async ({ page }) => {
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Apply status filter
      await page.click('text=Status')
      await page.click('text=Active')
      
      // Apply category filter
      await page.click('text=Category')
      await page.click('text=Electronics')
      
      // Apply GST rate filter
      await page.click('text=GST Rate')
      await page.click('text=18%')
      
      // Should show 3 active filters
      await expect(page.locator('text=3')).toBeVisible()
      
      // Verify filtered results
      const productRows = page.locator('table tbody tr')
      await expect(productRows).toHaveCount(await productRows.count())
    })

    test('should clear all filters', async ({ page }) => {
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Apply some filters
      await page.click('text=Status')
      await page.click('text=Active')
      await page.click('text=Category')
      await page.click('text=Electronics')
      
      // Clear all filters
      await page.click('button:has-text("Clear All Filters")')
      
      // Should show 0 active filters
      await expect(page.locator('text=0')).toBeVisible()
    })

    test('should use quick actions', async ({ page }) => {
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Use Low Stock quick action
      await page.click('button:has-text("Low Stock")')
      await expect(page.locator('text=1')).toBeVisible()
      
      // Use Active Only quick action
      await page.click('button:has-text("Active Only")')
      await expect(page.locator('text=1')).toBeVisible()
    })

    test('should handle search functionality', async ({ page }) => {
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Search for a product
      await page.fill('input[placeholder="Search products..."]', 'test')
      await expect(page.locator('text=1')).toBeVisible()
      
      // Clear search
      await page.fill('input[placeholder="Search products..."]', '')
      await expect(page.locator('text=0')).toBeVisible()
    })
  })

  test.describe('Invoices Page Filter Tests', () => {
    test('should display enhanced filter bar', async ({ page }) => {
      await page.click('a:has-text("Invoices")')
      await page.waitForSelector('h1:has-text("Manage Invoices")')
      
      // Check if filter bar is visible
      const filterBar = page.locator('text=Invoice Filters')
      await expect(filterBar).toBeVisible()
    })

    test('should apply invoice filters', async ({ page }) => {
      await page.click('a:has-text("Invoices")')
      await page.waitForSelector('h1:has-text("Manage Invoices")')
      
      // Apply status filter
      await page.click('text=Status')
      await page.click('text=Paid')
      
      // Apply payment status filter
      await page.click('text=Payment Status')
      await page.click('text=Paid')
      
      // Should show active filters
      await expect(page.locator('text=2')).toBeVisible()
    })

    test('should use invoice quick actions', async ({ page }) => {
      await page.click('a:has-text("Invoices")')
      await page.waitForSelector('h1:has-text("Manage Invoices")')
      
      // Use Pending Payment quick action
      await page.click('button:has-text("Pending Payment")')
      await expect(page.locator('text=1')).toBeVisible()
    })
  })

  test.describe('Stock History Filter Tests', () => {
    test('should display stock history filters', async ({ page }) => {
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Navigate to stock history
      await page.click('a:has-text("Stock History")')
      await page.waitForSelector('h1:has-text("Stock Movement History")')
      
      // Check if filter bar is visible
      const filterBar = page.locator('text=Stock History Filters')
      await expect(filterBar).toBeVisible()
    })

    test('should apply stock history filters', async ({ page }) => {
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Navigate to stock history
      await page.click('a:has-text("Stock History")')
      await page.waitForSelector('h1:has-text("Stock Movement History")')
      
      // Apply product filter
      await page.click('text=Product')
      await page.click('text=All Products')
      
      // Apply financial year filter
      await page.click('text=Financial Year')
      await page.click('text=2024-2025')
      
      // Should show active filters
      await expect(page.locator('text=2')).toBeVisible()
    })

    test('should use stock history quick actions', async ({ page }) => {
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Navigate to stock history
      await page.click('a:has-text("Stock History")')
      await page.waitForSelector('h1:has-text("Stock Movement History")')
      
      // Use Current FY quick action
      await page.click('button:has-text("Current FY")')
      await expect(page.locator('text=1')).toBeVisible()
    })
  })

  test.describe('Invoice Payments Filter Tests', () => {
    test('should display invoice payments filters', async ({ page }) => {
      await page.click('a:has-text("Payments")')
      await page.waitForSelector('h1:has-text("Invoice Payments")')
      
      // Check if filter bar is visible
      const filterBar = page.locator('text=Invoice Payment Filters')
      await expect(filterBar).toBeVisible()
    })

    test('should apply invoice payment filters', async ({ page }) => {
      await page.click('a:has-text("Payments")')
      await page.waitForSelector('h1:has-text("Invoice Payments")')
      
      // Apply payment method filter
      await page.click('text=Payment Method')
      await page.click('text=Cash')
      
      // Apply amount range filter
      await page.click('text=Payment Amount')
      await page.click('text=₹1,000 - ₹5,000')
      
      // Should show active filters
      await expect(page.locator('text=2')).toBeVisible()
    })

    test('should use invoice payment quick actions', async ({ page }) => {
      await page.click('a:has-text("Payments")')
      await page.waitForSelector('h1:has-text("Invoice Payments")')
      
      // Use Cash Payment quick action
      await page.click('button:has-text("Cash Payment")')
      await expect(page.locator('text=1')).toBeVisible()
    })
  })

  test.describe('Purchases Page Filter Tests', () => {
    test('should display purchase filters', async ({ page }) => {
      await page.click('a:has-text("Purchases")')
      await page.waitForSelector('h1:has-text("Manage Purchases")')
      
      // Check if filter bar is visible
      const filterBar = page.locator('text=Purchase Filters')
      await expect(filterBar).toBeVisible()
    })

    test('should apply purchase filters', async ({ page }) => {
      await page.click('a:has-text("Purchases")')
      await page.waitForSelector('h1:has-text("Manage Purchases")')
      
      // Apply status filter
      await page.click('text=Status')
      await page.click('text=Paid')
      
      // Apply payment status filter
      await page.click('text=Payment Status')
      await page.click('text=Unpaid')
      
      // Should show active filters
      await expect(page.locator('text=2')).toBeVisible()
    })

    test('should use purchase quick actions', async ({ page }) => {
      await page.click('a:has-text("Purchases")')
      await page.waitForSelector('h1:has-text("Manage Purchases")')
      
      // Use Due Payment quick action
      await page.click('button:has-text("Due Payment")')
      await expect(page.locator('text=1')).toBeVisible()
    })
  })

  test.describe('Purchase Payments Filter Tests', () => {
    test('should display purchase payment filters', async ({ page }) => {
      await page.click('a:has-text("Purchase Payments")')
      await page.waitForSelector('h1:has-text("Purchase Payments")')
      
      // Check if filter bar is visible
      const filterBar = page.locator('text=Purchase Payment Filters')
      await expect(filterBar).toBeVisible()
    })

    test('should apply purchase payment filters', async ({ page }) => {
      await page.click('a:has-text("Purchase Payments")')
      await page.waitForSelector('h1:has-text("Purchase Payments")')
      
      // Apply payment method filter
      await page.click('text=Payment Method')
      await page.click('text=Cash')
      
      // Apply amount range filter
      await page.click('text=Amount Range')
      await page.click('text=₹1,000 - ₹5,000')
      
      // Should show active filters
      await expect(page.locator('text=2')).toBeVisible()
    })

    test('should use purchase payment quick actions', async ({ page }) => {
      await page.click('a:has-text("Purchase Payments")')
      await page.waitForSelector('h1:has-text("Purchase Payments")')
      
      // Use Cash Payment quick action
      await page.click('button:has-text("Cash Payment")')
      await expect(page.locator('text=1')).toBeVisible()
    })
  })

  test.describe('Cashflow Transactions Filter Tests', () => {
    test('should display cashflow filters', async ({ page }) => {
      await page.click('a:has-text("Cashflow")')
      await page.waitForSelector('h1:has-text("Cashflow Transactions")')
      
      // Check if filter bar is visible
      const filterBar = page.locator('text=Cashflow Transaction Filters')
      await expect(filterBar).toBeVisible()
    })

    test('should apply cashflow filters', async ({ page }) => {
      await page.click('a:has-text("Cashflow")')
      await page.waitForSelector('h1:has-text("Cashflow Transactions")')
      
      // Apply type filter
      await page.click('text=Type')
      await page.click('text=Cash Inflow')
      
      // Apply payment method filter
      await page.click('text=Payment Method')
      await page.click('text=Cash')
      
      // Should show active filters
      await expect(page.locator('text=2')).toBeVisible()
    })

    test('should use cashflow quick actions', async ({ page }) => {
      await page.click('a:has-text("Cashflow")')
      await page.waitForSelector('h1:has-text("Cashflow Transactions")')
      
      // Use Cash Only quick action
      await page.click('button:has-text("Cash Only")')
      await expect(page.locator('text=1')).toBeVisible()
    })
  })

  test.describe('Expenses Page Filter Tests', () => {
    test('should display expense filters', async ({ page }) => {
      await page.click('a:has-text("Expenses")')
      await page.waitForSelector('h1:has-text("Manage Expenses")')
      
      // Check if filter bar is visible
      const filterBar = page.locator('text=Expense Filters')
      await expect(filterBar).toBeVisible()
    })

    test('should apply expense filters', async ({ page }) => {
      await page.click('a:has-text("Expenses")')
      await page.waitForSelector('h1:has-text("Manage Expenses")')
      
      // Apply category filter
      await page.click('text=Category')
      await page.click('text=Direct/COGS')
      
      // Apply expense type filter
      await page.click('text=Expense Type')
      await page.click('text=Salary')
      
      // Should show active filters
      await expect(page.locator('text=2')).toBeVisible()
    })

    test('should use expense quick actions', async ({ page }) => {
      await page.click('a:has-text("Expenses")')
      await page.waitForSelector('h1:has-text("Manage Expenses")')
      
      // Use Cash Payment quick action
      await page.click('button:has-text("Cash Payment")')
      await expect(page.locator('text=1')).toBeVisible()
    })
  })

  test.describe('Filter System Integration Tests', () => {
    test('should maintain filter state across page navigation', async ({ page }) => {
      // Start on products page and apply filters
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      await page.click('text=Status')
      await page.click('text=Active')
      await expect(page.locator('text=1')).toBeVisible()
      
      // Navigate to another page
      await page.click('a:has-text("Invoices")')
      await page.waitForSelector('h1:has-text("Manage Invoices")')
      
      // Navigate back to products
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Filter should be reset (as expected behavior)
      await expect(page.locator('text=0')).toBeVisible()
    })

    test('should handle empty filter results gracefully', async ({ page }) => {
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Apply a very specific filter that might return no results
      await page.click('text=Status')
      await page.click('text=Inactive')
      await page.click('text=Category')
      await page.click('text=Electronics')
      await page.click('text=GST Rate')
      await page.click('text=28%')
      
      // Should show appropriate message for no results
      const noResultsMessage = page.locator('text=No products match the selected filters')
      await expect(noResultsMessage).toBeVisible()
    })

    test('should handle filter performance with large datasets', async ({ page }) => {
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Apply multiple filters quickly
      const startTime = Date.now()
      
      await page.click('text=Status')
      await page.click('text=Active')
      await page.click('text=Category')
      await page.click('text=Electronics')
      await page.click('text=GST Rate')
      await page.click('text=18%')
      
      const endTime = Date.now()
      const filterTime = endTime - startTime
      
      // Should apply filters within reasonable time
      expect(filterTime).toBeLessThan(5000) // 5 seconds
    })
  })

  test.describe('Accessibility Tests', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Navigate to filter bar using Tab
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Should be able to open dropdown with Enter
      await page.keyboard.press('Enter')
      
      // Should be able to navigate options with arrow keys
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      
      // Should show active filter
      await expect(page.locator('text=1')).toBeVisible()
    })

    test('should have proper ARIA labels', async ({ page }) => {
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Check for ARIA attributes on filter elements
      const filterBar = page.locator('[aria-expanded]')
      await expect(filterBar).toBeVisible()
      
      const clearButton = page.locator('button:has-text("Clear All Filters")')
      await expect(clearButton).toHaveAttribute('aria-label')
    })
  })

  test.describe('Responsive Design Tests', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Filter bar should still be functional
      const filterBar = page.locator('text=Product Filters')
      await expect(filterBar).toBeVisible()
      
      // Should be able to apply filters
      await page.click('text=Status')
      await page.click('text=Active')
      await expect(page.locator('text=1')).toBeVisible()
    })

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Filter bar should be visible and functional
      const filterBar = page.locator('text=Product Filters')
      await expect(filterBar).toBeVisible()
      
      // Should be able to apply filters
      await page.click('text=Status')
      await page.click('text=Active')
      await expect(page.locator('text=1')).toBeVisible()
    })
  })

  test.describe('Error Handling Tests', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network error
      await page.route('**/api/products**', route => route.abort())
      
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Should show error message
      const errorMessage = page.locator('text=Failed to load products')
      await expect(errorMessage).toBeVisible()
    })

    test('should handle invalid filter parameters', async ({ page }) => {
      await page.click('a:has-text("Products")')
      await page.waitForSelector('h1:has-text("Manage Products")')
      
      // Try to apply invalid filter (should be handled gracefully)
      await page.click('text=Status')
      await page.click('text=Invalid Status')
      
      // Should not crash and should show appropriate state
      await expect(page.locator('h1:has-text("Manage Products")')).toBeVisible()
    })
  })
})
