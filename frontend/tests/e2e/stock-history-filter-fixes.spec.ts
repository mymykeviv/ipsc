import { test, expect } from '@playwright/test'

test.describe('Stock History Filter Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if we need to login
    const loginForm = page.locator('[data-testid="login-form"]')
    if (await loginForm.isVisible()) {
      await page.fill('[data-testid="username"]', 'admin')
      await page.fill('[data-testid="password"]', 'admin123')
      await page.click('[data-testid="login-button"]')
      
      // Wait for login to complete
      await page.waitForURL('http://localhost:5173/dashboard')
    }
  })

  test('should show correct product filter when navigating from product page', async ({ page }) => {
    // Navigate to products page
    await page.click('text=PRODUCTS')
    await page.click('text=Manage Products')
    
    // Wait for products to load
    await page.waitForSelector('table')
    
    // Get the first product name for testing
    const firstProductName = await page.locator('table tbody tr').first().locator('td').nth(1).textContent()
    
    // Click on stock history for the first product
    await page.locator('table tbody tr').first().locator('text=Stock History').click()
    
    // Wait for stock history page to load
    await page.waitForSelector('text=Stock Movement History')
    
    // Check that the product filter shows the correct product
    const productFilter = page.locator('select').filter({ hasText: 'Product' })
    await expect(productFilter).toHaveValue(firstProductName)
    
    // Check that filters show 1 active filter
    const filtersButton = page.locator('button').filter({ hasText: 'Filters' })
    await expect(filtersButton).toContainText('1')
    
    // Verify URL contains product parameter
    await expect(page.url()).toContain('product=')
  })

  test('should clear all filters and show all products when Clear All is clicked', async ({ page }) => {
    // Navigate to products page
    await page.click('text=PRODUCTS')
    await page.click('text=Manage Products')
    
    // Wait for products to load
    await page.waitForSelector('table')
    
    // Click on stock history for a specific product
    await page.locator('table tbody tr').first().locator('text=Stock History').click()
    
    // Wait for stock history page to load
    await page.waitForSelector('text=Stock Movement History')
    
    // Verify we're on a filtered view (should show 1 active filter)
    const filtersButton = page.locator('button').filter({ hasText: 'Filters' })
    await expect(filtersButton).toContainText('1')
    
    // Verify URL contains product parameter
    await expect(page.url()).toContain('product=')
    
    // Click Clear All
    await page.click('text=Clear All')
    
    // Wait for the page to update
    await page.waitForTimeout(2000)
    
    // Verify we're now showing all products (no active filters)
    await expect(filtersButton).toContainText('0')
    
    // Check that the product filter shows "All Products"
    const productFilter = page.locator('select').filter({ hasText: 'Product' })
    await expect(productFilter).toContainText('All Products')
    
    // Verify URL no longer contains product parameter
    await expect(page.url()).not.toContain('product=')
    
    // Verify we're still on the stock history page
    await expect(page.url()).toContain('/products/stock-history')
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
    
    // Wait for filter to apply
    await page.waitForTimeout(1000)
    
    // Verify we now have 1 active filter
    await expect(filtersButton).toContainText('1')
    
    // Click Clear All
    await page.click('text=Clear All')
    
    // Wait for update
    await page.waitForTimeout(1000)
    
    // Verify filters are cleared
    await expect(filtersButton).toContainText('0')
    await expect(productFilter).toContainText('All Products')
  })

  test('should handle multiple filter combinations and clear all properly', async ({ page }) => {
    // Navigate to stock history
    await page.goto('http://localhost:5173/products/stock-history')
    await page.waitForSelector('text=Stock Movement History')
    
    // Apply multiple filters
    const productFilter = page.locator('select').filter({ hasText: 'Product' })
    await productFilter.selectOption({ index: 1 })
    
    const entryTypeFilter = page.locator('select').filter({ hasText: 'Entry Type' })
    await entryTypeFilter.selectOption('incoming')
    
    const financialYearFilter = page.locator('select').filter({ hasText: 'Financial Year' })
    await financialYearFilter.selectOption({ index: 1 })
    
    // Wait for filters to apply
    await page.waitForTimeout(1000)
    
    // Verify multiple active filters
    const filtersButton = page.locator('button').filter({ hasText: 'Filters' })
    await expect(filtersButton).toContainText('3')
    
    // Click Clear All
    await page.click('text=Clear All')
    
    // Wait for update
    await page.waitForTimeout(1000)
    
    // Verify all filters are cleared
    await expect(filtersButton).toContainText('0')
    await expect(productFilter).toContainText('All Products')
    await expect(entryTypeFilter).toContainText('All Entries')
    await expect(financialYearFilter).toContainText('All Years')
  })

  test('should handle URL parameters correctly when navigating back and forth', async ({ page }) => {
    // Start from products page
    await page.click('text=PRODUCTS')
    await page.click('text=Manage Products')
    await page.waitForSelector('table')
    
    // Navigate to stock history for a product
    await page.locator('table tbody tr').first().locator('text=Stock History').click()
    await page.waitForSelector('text=Stock Movement History')
    
    // Verify URL has product parameter
    await expect(page.url()).toContain('product=')
    
    // Clear all filters
    await page.click('text=Clear All')
    await page.waitForTimeout(2000)
    
    // Verify URL no longer has product parameter
    await expect(page.url()).not.toContain('product=')
    
    // Navigate back to products and try again
    await page.click('text=← Back to Products')
    await page.waitForSelector('table')
    
    // Navigate to stock history again
    await page.locator('table tbody tr').first().locator('text=Stock History').click()
    await page.waitForSelector('text=Stock Movement History')
    
    // Verify URL has product parameter again
    await expect(page.url()).toContain('product=')
    
    // Clear all filters again
    await page.click('text=Clear All')
    await page.waitForTimeout(2000)
    
    // Verify URL is cleared again
    await expect(page.url()).not.toContain('product=')
  })

  test('should show correct summary data when filters are applied and cleared', async ({ page }) => {
    // Navigate to stock history
    await page.goto('http://localhost:5173/products/stock-history')
    await page.waitForSelector('text=Stock Movement History')
    
    // Get initial summary data
    const initialSummary = await page.locator('text=Summary').first().textContent()
    
    // Apply product filter
    const productFilter = page.locator('select').filter({ hasText: 'Product' })
    await productFilter.selectOption({ index: 1 })
    await page.waitForTimeout(1000)
    
    // Get filtered summary data
    const filteredSummary = await page.locator('text=Summary').first().textContent()
    
    // Verify summary changed
    expect(filteredSummary).not.toBe(initialSummary)
    
    // Clear all filters
    await page.click('text=Clear All')
    await page.waitForTimeout(1000)
    
    // Get cleared summary data
    const clearedSummary = await page.locator('text=Summary').first().textContent()
    
    // Verify summary returned to initial state
    expect(clearedSummary).toBe(initialSummary)
  })
})
