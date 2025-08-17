import { test, expect } from '@playwright/test'

test.describe('Side Menu Collapse Behavior', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5174')
    
    // Check if already logged in
    const isLoggedIn = await page.locator('text=Dashboard').isVisible()
    
    if (!isLoggedIn) {
      // Login if not already logged in
      await page.fill('input[placeholder="Enter your username"]', 'admin')
      await page.fill('input[placeholder="Enter your password"]', 'admin123')
      await page.click('button:has-text("Login")')
      await page.waitForURL('**/')
    }
  })

  test('should have all sections collapsed except invoices after login', async ({ page }) => {
    // Wait for the dashboard to load
    await page.waitForSelector('h1:has-text("Dashboard - Cashflow Summary")')
    
    // Check that Products section is collapsed (should show ▼)
    const productsHeader = page.locator('text=🏷️ Products')
    await expect(productsHeader).toBeVisible()
    await expect(page.locator('text=🏷️ Products ▼')).toBeVisible()
    
    // Check that Invoices section is expanded (should show ▶)
    const invoicesHeader = page.locator('text=📄 Invoices')
    await expect(invoicesHeader).toBeVisible()
    await expect(page.locator('text=📄 Invoices ▶')).toBeVisible()
    
    // Check that Invoices sub-links are visible
    await expect(page.locator('text=Manage Invoices')).toBeVisible()
    await expect(page.locator('text=Add/Edit Invoice')).toBeVisible()
    await expect(page.locator('text=Invoice Payments')).toBeVisible()
    await expect(page.locator('text=Add/Edit Invoice Payment')).toBeVisible()
    
    // Check that other sections are collapsed
    await expect(page.locator('text=📦 Purchases ▼')).toBeVisible()
    await expect(page.locator('text=👥 Customers / Vendors ▼')).toBeVisible()
    await expect(page.locator('text=💰 Cashflow ▼')).toBeVisible()
    await expect(page.locator('text=📊 Reporting ▼')).toBeVisible()
    await expect(page.locator('text=⚙️ Settings ▼')).toBeVisible()
  })

  test('should toggle sections when clicked', async ({ page }) => {
    // Wait for the dashboard to load
    await page.waitForSelector('h1:has-text("Dashboard - Cashflow Summary")')
    
    // Click on Products section to expand it
    await page.click('text=🏷️ Products')
    
    // Check that Products section is now expanded
    await expect(page.locator('text=🏷️ Products ▶')).toBeVisible()
    await expect(page.locator('text=Manage Products')).toBeVisible()
    await expect(page.locator('text=Add/Edit Product')).toBeVisible()
    
    // Click on Products section again to collapse it
    await page.click('text=🏷️ Products')
    
    // Check that Products section is collapsed again
    await expect(page.locator('text=🏷️ Products ▼')).toBeVisible()
    await expect(page.locator('text=Manage Products')).not.toBeVisible()
    
    // Verify Invoices section remains expanded
    await expect(page.locator('text=📄 Invoices ▶')).toBeVisible()
    await expect(page.locator('text=Manage Invoices')).toBeVisible()
  })

  test('should maintain invoice section open when navigating', async ({ page }) => {
    // Wait for the dashboard to load
    await page.waitForSelector('h1:has-text("Dashboard - Cashflow Summary")')
    
    // Navigate to a different page
    await page.click('text=Manage Products')
    await page.waitForURL('**/products')
    
    // Check that Invoices section is still expanded
    await expect(page.locator('text=📄 Invoices ▶')).toBeVisible()
    await expect(page.locator('text=Manage Invoices')).toBeVisible()
    
    // Navigate back to dashboard
    await page.click('text=📊 Dashboard')
    await page.waitForURL('**/')
    
    // Check that Invoices section is still expanded
    await expect(page.locator('text=📄 Invoices ▶')).toBeVisible()
    await expect(page.locator('text=Manage Invoices')).toBeVisible()
  })
})
