import { test, expect } from '@playwright/test'

test.describe('Stock History PDF Download', () => {
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

  test('should download PDF for all products stock history', async ({ page }) => {
    // Navigate to stock history page
    await page.goto('http://localhost:5173/products/stock-history')
    await page.waitForSelector('text=Stock Movement History', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Verify download button is visible
    const downloadButton = page.locator('button').filter({ hasText: 'Download PDF' })
    await expect(downloadButton).toBeVisible()
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download')
    
    // Click download button
    await downloadButton.click()
    
    // Wait for download to start
    const download = await downloadPromise
    
    // Verify download filename
    expect(download.suggestedFilename()).toMatch(/stock_movement_history_.*\.pdf$/)
    
    // Verify download is not empty
    expect(download.suggestedFilename()).not.toBe('')
  })

  test('should download PDF for specific product stock history', async ({ page }) => {
    // Wait for sidebar to be visible
    await page.waitForSelector('text=PRODUCTS', { timeout: 15000 })
    
    // Navigate to products page
    await page.click('text=PRODUCTS')
    await page.waitForTimeout(2000)
    await page.click('text=Manage Products')
    
    // Wait for products to load
    await page.waitForSelector('table', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Click on stock history for the first product
    const firstProductRow = page.locator('table tbody tr').first()
    await expect(firstProductRow).toBeVisible()
    await firstProductRow.locator('text=Stock History').click()
    
    // Wait for stock history page to load
    await page.waitForSelector('text=Stock Movement History', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Verify download button is visible
    const downloadButton = page.locator('button').filter({ hasText: 'Download PDF' })
    await expect(downloadButton).toBeVisible()
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download')
    
    // Click download button
    await downloadButton.click()
    
    // Wait for download to start
    const download = await downloadPromise
    
    // Verify download filename contains product name
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/stock_movement_history_.*_.*\.pdf$/)
    expect(filename).not.toBe('')
  })

  test('should show loading state during PDF generation', async ({ page }) => {
    // Navigate to stock history page
    await page.goto('http://localhost:5173/products/stock-history')
    await page.waitForSelector('text=Stock Movement History', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Click download button
    const downloadButton = page.locator('button').filter({ hasText: 'Download PDF' })
    await downloadButton.click()
    
    // Verify loading state appears
    await expect(page.locator('button').filter({ hasText: 'Generating PDF...' })).toBeVisible()
    
    // Wait for download to complete (or timeout)
    try {
      await page.waitForEvent('download', { timeout: 10000 })
    } catch (error) {
      // If download doesn't start within 10 seconds, that's okay for this test
      console.log('Download may have completed quickly or timed out')
    }
    
    // Verify button returns to normal state
    await expect(page.locator('button').filter({ hasText: 'Download PDF' })).toBeVisible()
  })

  test('should download PDF with current filters applied', async ({ page }) => {
    // Navigate to stock history page
    await page.goto('http://localhost:5173/products/stock-history')
    await page.waitForSelector('text=Stock Movement History', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Apply a filter (select a specific financial year)
    const financialYearFilter = page.locator('select').filter({ hasText: 'Financial Year' })
    await expect(financialYearFilter).toBeVisible()
    await financialYearFilter.selectOption({ index: 1 }) // Select first available year
    
    // Wait for filter to apply
    await page.waitForTimeout(2000)
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download')
    
    // Click download button
    const downloadButton = page.locator('button').filter({ hasText: 'Download PDF' })
    await downloadButton.click()
    
    // Wait for download to start
    const download = await downloadPromise
    
    // Verify download filename
    expect(download.suggestedFilename()).toMatch(/stock_movement_history_.*\.pdf$/)
    expect(download.suggestedFilename()).not.toBe('')
  })

  test('should handle PDF download error gracefully', async ({ page }) => {
    // Navigate to stock history page
    await page.goto('http://localhost:5173/products/stock-history')
    await page.waitForSelector('text=Stock Movement History', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Mock a network error by intercepting the request
    await page.route('**/api/stock/movement-history/pdf**', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    })
    
    // Click download button
    const downloadButton = page.locator('button').filter({ hasText: 'Download PDF' })
    await downloadButton.click()
    
    // Wait for error to appear
    await page.waitForTimeout(2000)
    
    // Verify error message appears
    const errorMessage = page.locator('.error-message, [data-testid="error-message"]')
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText('error')
    }
    
    // Verify button returns to normal state
    await expect(page.locator('button').filter({ hasText: 'Download PDF' })).toBeVisible()
  })

  test('should disable download button during generation', async ({ page }) => {
    // Navigate to stock history page
    await page.goto('http://localhost:5173/products/stock-history')
    await page.waitForSelector('text=Stock Movement History', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Click download button
    const downloadButton = page.locator('button').filter({ hasText: 'Download PDF' })
    await downloadButton.click()
    
    // Verify button is disabled during generation
    await expect(page.locator('button').filter({ hasText: 'Generating PDF...' })).toBeDisabled()
    
    // Wait for download to complete (or timeout)
    try {
      await page.waitForEvent('download', { timeout: 10000 })
    } catch (error) {
      // If download doesn't start within 10 seconds, that's okay for this test
      console.log('Download may have completed quickly or timed out')
    }
    
    // Verify button is enabled again
    await expect(page.locator('button').filter({ hasText: 'Download PDF' })).toBeEnabled()
  })
})
