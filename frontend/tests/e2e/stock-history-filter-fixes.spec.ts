import { test, expect } from '@playwright/test'

test.describe('Stock History Filter Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173')
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000) // Additional wait for app to fully load
    
    // Check if we need to login
    const loginForm = page.locator('[data-testid="login-form"]')
    if (await loginForm.isVisible()) {
      await page.fill('[data-testid="username"]', 'admin')
      await page.fill('[data-testid="password"]', 'admin123')
      await page.click('[data-testid="login-button"]')
      
      // Wait for login to complete and dashboard to load
      await page.waitForURL('http://localhost:5173/dashboard')
      await page.waitForTimeout(3000) // Wait for dashboard to fully load
    }
  })

  test('should show correct product filter when navigating from product page', async ({ page }) => {
    // Wait for sidebar to be visible
    await page.waitForSelector('text=PRODUCTS', { timeout: 15000 })
    
    // Navigate to products page
    await page.click('text=PRODUCTS')
    await page.waitForTimeout(2000)
    await page.click('text=Manage Products')
    
    // Wait for products to load
    await page.waitForSelector('table', { timeout: 15000 })
    await page.waitForTimeout(3000) // Wait for table data to load
    
    // Get the first product name for testing
    const firstProductRow = page.locator('table tbody tr').first()
    await expect(firstProductRow).toBeVisible()
    const firstProductName = await firstProductRow.locator('td').nth(1).textContent()
    
    // Click on stock history for the first product
    await firstProductRow.locator('text=Stock History').click()
    
    // Wait for stock history page to load
    await page.waitForSelector('text=Stock Movement History', { timeout: 15000 })
    await page.waitForTimeout(3000) // Wait for data to load
    
    // Check that the product filter shows the correct product
    const productFilter = page.locator('select').filter({ hasText: 'Product' })
    await expect(productFilter).toBeVisible()
    if (firstProductName) {
      await expect(productFilter).toHaveValue(firstProductName)
    }
    
    // Check that filters show 1 active filter
    const filtersButton = page.locator('button').filter({ hasText: 'Filters' })
    await expect(filtersButton).toBeVisible()
    await expect(filtersButton).toContainText('1')
    
    // Verify URL contains product parameter
    await expect(page.url()).toContain('product=')
  })

  test('should clear all filters and show all products when Clear All is clicked', async ({ page }) => {
    // Wait for sidebar to be visible
    await page.waitForSelector('text=PRODUCTS', { timeout: 15000 })
    
    // Navigate to products page
    await page.click('text=PRODUCTS')
    await page.waitForTimeout(2000)
    await page.click('text=Manage Products')
    
    // Wait for products to load
    await page.waitForSelector('table', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Click on stock history for a specific product
    const firstProductRow = page.locator('table tbody tr').first()
    await expect(firstProductRow).toBeVisible()
    await firstProductRow.locator('text=Stock History').click()
    
    // Wait for stock history page to load
    await page.waitForSelector('text=Stock Movement History', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Verify we're on a filtered view (should show 1 active filter)
    const filtersButton = page.locator('button').filter({ hasText: 'Filters' })
    await expect(filtersButton).toBeVisible()
    await expect(filtersButton).toContainText('1')
    
    // Verify URL contains product parameter
    await expect(page.url()).toContain('product=')
    
    // Click Clear All
    await page.click('text=Clear All')
    
    // Wait for the page to update
    await page.waitForTimeout(4000)
    
    // Verify we're now showing all products (no active filters)
    await expect(filtersButton).toContainText('0')
    
    // Check that the product filter shows "All Products"
    const productFilter = page.locator('select').filter({ hasText: 'Product' })
    await expect(productFilter).toBeVisible()
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
    await page.waitForSelector('text=Stock Movement History', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Verify no active filters initially
    const filtersButton = page.locator('button').filter({ hasText: 'Filters' })
    await expect(filtersButton).toBeVisible()
    await expect(filtersButton).toContainText('0')
    
    // Select a specific product from the dropdown
    const productFilter = page.locator('select').filter({ hasText: 'Product' })
    await expect(productFilter).toBeVisible()
    await productFilter.selectOption({ index: 1 }) // Select first product (not "All Products")
    
    // Wait for filter to apply
    await page.waitForTimeout(3000)
    
    // Verify we now have 1 active filter
    await expect(filtersButton).toContainText('1')
    
    // Click Clear All
    await page.click('text=Clear All')
    
    // Wait for update
    await page.waitForTimeout(3000)
    
    // Verify filters are cleared
    await expect(filtersButton).toContainText('0')
    await expect(productFilter).toContainText('All Products')
  })

  test('should handle multiple filter combinations and clear all properly', async ({ page }) => {
    // Navigate to stock history
    await page.goto('http://localhost:5173/products/stock-history')
    await page.waitForSelector('text=Stock Movement History', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Apply multiple filters
    const productFilter = page.locator('select').filter({ hasText: 'Product' })
    await expect(productFilter).toBeVisible()
    await productFilter.selectOption({ index: 1 })
    
    const entryTypeFilter = page.locator('select').filter({ hasText: 'Entry Type' })
    await expect(entryTypeFilter).toBeVisible()
    await entryTypeFilter.selectOption('incoming')
    
    const financialYearFilter = page.locator('select').filter({ hasText: 'Financial Year' })
    await expect(financialYearFilter).toBeVisible()
    await financialYearFilter.selectOption({ index: 1 })
    
    // Wait for filters to apply
    await page.waitForTimeout(3000)
    
    // Verify multiple active filters
    const filtersButton = page.locator('button').filter({ hasText: 'Filters' })
    await expect(filtersButton).toBeVisible()
    await expect(filtersButton).toContainText('3')
    
    // Click Clear All
    await page.click('text=Clear All')
    
    // Wait for update
    await page.waitForTimeout(3000)
    
    // Verify all filters are cleared
    await expect(filtersButton).toContainText('0')
    await expect(productFilter).toContainText('All Products')
    await expect(entryTypeFilter).toContainText('All Entries')
    await expect(financialYearFilter).toContainText('All Years')
  })

  test('should handle URL parameters correctly when navigating back and forth', async ({ page }) => {
    // Wait for sidebar to be visible
    await page.waitForSelector('text=PRODUCTS', { timeout: 15000 })
    
    // Start from products page
    await page.click('text=PRODUCTS')
    await page.waitForTimeout(2000)
    await page.click('text=Manage Products')
    await page.waitForSelector('table', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Navigate to stock history for a product
    const firstProductRow = page.locator('table tbody tr').first()
    await expect(firstProductRow).toBeVisible()
    await firstProductRow.locator('text=Stock History').click()
    await page.waitForSelector('text=Stock Movement History', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Verify URL has product parameter
    await expect(page.url()).toContain('product=')
    
    // Clear all filters
    await page.click('text=Clear All')
    await page.waitForTimeout(4000)
    
    // Verify URL no longer has product parameter
    await expect(page.url()).not.toContain('product=')
    
    // Navigate back to products and try again
    await page.click('text=← Back to Products')
    await page.waitForSelector('table', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Navigate to stock history again
    await firstProductRow.locator('text=Stock History').click()
    await page.waitForSelector('text=Stock Movement History', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Verify URL has product parameter again
    await expect(page.url()).toContain('product=')
    
    // Clear all filters again
    await page.click('text=Clear All')
    await page.waitForTimeout(4000)
    
    // Verify URL is cleared again
    await expect(page.url()).not.toContain('product=')
  })

  test('should show correct summary data when filters are applied and cleared', async ({ page }) => {
    // Navigate to stock history
    await page.goto('http://localhost:5173/products/stock-history')
    await page.waitForSelector('text=Stock Movement History', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Get initial summary data
    const summaryElement = page.locator('text=Summary').first()
    await expect(summaryElement).toBeVisible()
    const initialSummary = await summaryElement.textContent()
    
    // Apply product filter
    const productFilter = page.locator('select').filter({ hasText: 'Product' })
    await expect(productFilter).toBeVisible()
    await productFilter.selectOption({ index: 1 })
    await page.waitForTimeout(3000)
    
    // Get filtered summary data
    const filteredSummary = await summaryElement.textContent()
    
    // Verify summary changed
    expect(filteredSummary).not.toBe(initialSummary)
    
    // Clear all filters
    await page.click('text=Clear All')
    await page.waitForTimeout(3000)
    
    // Get cleared summary data
    const clearedSummary = await summaryElement.textContent()
    
    // Verify summary returned to initial state
    expect(clearedSummary).toBe(initialSummary)
  })
})
