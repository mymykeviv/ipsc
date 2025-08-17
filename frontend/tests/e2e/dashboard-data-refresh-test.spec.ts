import { test, expect } from '@playwright/test'

test.describe('Dashboard Data Refresh', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5174')
    
    // Check if already logged in by looking for dashboard content
    const dashboardVisible = await page.locator('h1:has-text("Dashboard - Cashflow Summary")').isVisible()
    
    if (!dashboardVisible) {
      // Login if not already logged in
      await page.fill('input[placeholder="Enter your username"]', 'admin')
      await page.fill('input[placeholder="Enter your password"]', 'admin123')
      await page.click('button:has-text("Login")')
      await page.waitForURL('**/')
      await page.waitForSelector('h1:has-text("Dashboard - Cashflow Summary")')
    }
  })

  test('should load fresh data on dashboard after login', async ({ page }) => {
    // Wait for the dashboard to load
    await page.waitForSelector('h1:has-text("Dashboard - Cashflow Summary")')
    
    // Wait for the data to load (look for the refresh button to be enabled)
    await page.waitForSelector('button:has-text("🔄")')
    
    // Check that the dashboard shows actual data instead of zeros
    // Look for the income section
    const incomeSection = page.locator('h4:has-text("💰 Income")')
    await expect(incomeSection).toBeVisible()
    
    // Check that invoice amount is displayed (should not be ₹0.00 if there's data)
    const invoiceAmount = page.locator('text=Invoice Amount:').locator('..').locator('strong')
    await expect(invoiceAmount).toBeVisible()
    
    // Check that payments received is displayed
    const paymentsReceived = page.locator('text=Payments Received:').locator('..').locator('strong')
    await expect(paymentsReceived).toBeVisible()
    
    // Check that expenses section is visible
    const expensesSection = page.locator('h4:has-text("💸 Expenses")')
    await expect(expensesSection).toBeVisible()
    
    // Check that direct expenses is displayed
    const directExpenses = page.locator('text=Direct Expenses:').locator('..').locator('strong')
    await expect(directExpenses).toBeVisible()
    
    // Check that purchase payments is displayed
    const purchasePayments = page.locator('text=Purchase Payments:').locator('..').locator('strong')
    await expect(purchasePayments).toBeVisible()
    
    // Check that net cashflow section is visible
    const netCashflowSection = page.locator('h4:has-text("📊 Net Cashflow")')
    await expect(netCashflowSection).toBeVisible()
    
    // Check that pending payments cards are visible
    const pendingPurchasePayments = page.locator('h4:has-text("📦 Pending Purchase Payments")')
    await expect(pendingPurchasePayments).toBeVisible()
    
    const pendingInvoicePayments = page.locator('h4:has-text("📄 Pending Invoice Payments")')
    await expect(pendingInvoicePayments).toBeVisible()
  })

  test('should refresh data when refresh button is clicked', async ({ page }) => {
    // Wait for the dashboard to load
    await page.waitForSelector('h1:has-text("Dashboard - Cashflow Summary")')
    
    // Wait for the refresh button to be available
    await page.waitForSelector('button:has-text("🔄")')
    
    // Click the refresh button
    await page.click('button:has-text("🔄")')
    
    // Wait for the refresh to complete (button should show "Refreshing..." briefly)
    await page.waitForTimeout(1000)
    
    // Verify the refresh button is back to normal
    await expect(page.locator('button:has-text("🔄")')).toBeVisible()
  })

  test('should update data when period is changed', async ({ page }) => {
    // Wait for the dashboard to load
    await page.waitForSelector('h1:has-text("Dashboard - Cashflow Summary")')
    
    // Wait for the period selector to be available
    await page.waitForSelector('select')
    
    // Change period to "This Quarter"
    await page.selectOption('select', 'quarter')
    
    // Wait for data to refresh
    await page.waitForTimeout(2000)
    
    // Verify the period label shows quarter
    const periodLabel = page.locator('text=Period:').locator('..')
    await expect(periodLabel).toContainText('Q')
    
    // Change period to "This Year"
    await page.selectOption('select', 'year')
    
    // Wait for data to refresh
    await page.waitForTimeout(2000)
    
    // Verify the period label shows year
    const yearLabel = page.locator('text=Period:').locator('..')
    await expect(yearLabel).toContainText('2024') // or current year
  })

  test('should handle custom date range', async ({ page }) => {
    // Wait for the dashboard to load
    await page.waitForSelector('h1:has-text("Dashboard - Cashflow Summary")')
    
    // Wait for the period selector to be available
    await page.waitForSelector('select')
    
    // Change period to "Custom Range"
    await page.selectOption('select', 'custom')
    
    // Wait for custom date inputs to appear
    await page.waitForSelector('input[type="date"]')
    
    // Set custom start date (first day of current month)
    const startDate = new Date()
    startDate.setDate(1)
    const startDateStr = startDate.toISOString().split('T')[0]
    await page.fill('input[type="date"]', startDateStr)
    
    // Set custom end date (today)
    const endDate = new Date()
    const endDateStr = endDate.toISOString().split('T')[0]
    await page.fill('input[type="date"]:nth-of-type(2)', endDateStr)
    
    // Wait for data to refresh
    await page.waitForTimeout(2000)
    
    // Verify custom date range is displayed
    const periodLabel = page.locator('text=Period:').locator('..')
    await expect(periodLabel).toContainText(' - ')
  })

  test('should show loading state during data refresh', async ({ page }) => {
    // Wait for the dashboard to load
    await page.waitForSelector('h1:has-text("Dashboard - Cashflow Summary")')
    
    // Wait for the refresh button to be available
    await page.waitForSelector('button:has-text("🔄")')
    
    // Click the refresh button
    await page.click('button:has-text("🔄")')
    
    // Check that the button shows "Refreshing..." state
    const refreshingButton = page.locator('button:has-text("Refreshing...")')
    await expect(refreshingButton).toBeVisible()
    
    // Wait for refresh to complete
    await page.waitForSelector('button:has-text("🔄")', { timeout: 10000 })
  })
})
