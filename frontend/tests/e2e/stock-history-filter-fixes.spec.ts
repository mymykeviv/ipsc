import { test, expect } from '@playwright/test'

test.describe('Stock History Filter Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173')
    
    // Login
    await page.fill('[data-testid="username"]', 'admin')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    
    // Wait for login to complete
    await page.waitForURL('http://localhost:5173/dashboard')
  })

  test('should show correct product filter when navigating from product page', async ({ page }) => {
    // Navigate to products page
    await page.click('text=PRODUCTS')
    await page.click('text=Manage Products')
    
    // Wait for products to load
    await page.waitForSelector('table')
    
    // Click on stock history for a specific product
    await page.click('text=Stock History')
    
    // Wait for stock history page to load
    await page.waitForSelector('text=Stock Movement History')
    
    // Check that the product filter shows the correct product
    const productFilter = page.locator('select').filter({ hasText: 'Product' })
    await expect(productFilter).toHaveValue(/^(?!all$).*/) // Should not be "all"
    
    // Check that filters show 1 active filter
    const filtersButton = page.locator('button').filter({ hasText: 'Filters' })
    await expect(filtersButton).toContainText('1')
  })

  test('should clear all filters and show all products when Clear All is clicked', async ({ page }) => {
    // Navigate to products page
    await page.click('text=PRODUCTS')
    await page.click('text=Manage Products')
    
    // Wait for products to load
    await page.waitForSelector('table')
    
    // Click on stock history for a specific product
    await page.click('text=Stock History')
    
    // Wait for stock history page to load
    await page.waitForSelector('text=Stock Movement History')
    
    // Verify we're on a filtered view (should show 1 active filter)
    const filtersButton = page.locator('button').filter({ hasText: 'Filters' })
    await expect(filtersButton).toContainText('1')
    
    // Click Clear All
    await page.click('text=Clear All')
    
    // Wait for the page to reload or update
    await page.waitForTimeout(1000)
    
    // Verify we're now showing all products (no active filters)
    await expect(filtersButton).toContainText('0')
    
    // Check that the product filter shows "All Products"
    const productFilter = page.locator('select').filter({ hasText: 'Product' })
    await expect(productFilter).toHaveValue('all')
  })

  test('should maintain filter state correctly when switching between filtered and unfiltered views', async ({ page }) => {
    // Navigate directly to stock history (unfiltered)
    await page.goto('http://localhost:5173/products/stock-history')
    
    // Wait for stock history page to load
    await page.waitForSelector('text=Stock Movement History')
    
    // Verify no active filters initially
    const filtersButton = page.locator('button').filter({ hasText: 'Filters' })
    await expect(filtersButton).toContainText('0')
    
    // Select a specific product from the dropdown
    const productFilter = page.locator('select').filter({ hasText: 'Product' })
    await productFilter.selectOption({ index: 1 }) // Select first product (not "All Products")
    
    // Verify we now have 1 active filter
    await expect(filtersButton).toContainText('1')
    
    // Click Clear All
    await page.click('text=Clear All')
    
    // Wait for update
    await page.waitForTimeout(500)
    
    // Verify filters are cleared
    await expect(filtersButton).toContainText('0')
    await expect(productFilter).toHaveValue('all')
  })
})
