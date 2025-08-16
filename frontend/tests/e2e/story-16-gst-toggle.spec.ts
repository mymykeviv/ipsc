import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Story #16: GST Toggle System', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login();
  });

  test('should display GST status dropdown in party form', async ({ page }) => {
    await page.goto('/customers/add');
    
    // Check GST status dropdown exists
    const gstStatusDropdown = page.locator('[data-testid="gst_status-input"]');
    await expect(gstStatusDropdown).toBeVisible();
    
    // Check dropdown options
    await gstStatusDropdown.click();
    await expect(page.locator('option[value="GST"]')).toBeVisible();
    await expect(page.locator('option[value="Non-GST"]')).toBeVisible();
    await expect(page.locator('option[value="Exempted"]')).toBeVisible();
  });

  test('should create customer with GST enabled', async ({ page }) => {
    const testData = helpers.generateTestData();
    await page.goto('/customers/add');
    
    // Fill customer form with GST enabled
    await helpers.fillForm({
      name: testData.party.customer.name,
      email: testData.party.customer.email,
      phone: testData.party.customer.phone,
      gst_status: 'GST',
      billing_address_line1: testData.party.customer.billing_address_line1,
      billing_city: testData.party.customer.billing_city,
      billing_state: testData.party.customer.billing_state,
      billing_pincode: testData.party.customer.billing_pincode
    });
    
    // GSTIN and registration status should be enabled
    const gstinInput = page.locator('[data-testid="gstin-input"]');
    const gstRegistrationSelect = page.locator('[data-testid="gst_registration_status-input"]');
    
    await expect(gstinInput).toBeEnabled();
    await expect(gstRegistrationSelect).toBeEnabled();
    
    await helpers.submitForm();
    await helpers.expectSuccessMessage();
  });

  test('should create customer with Non-GST status', async ({ page }) => {
    const testData = helpers.generateTestData();
    await page.goto('/customers/add');
    
    // Fill customer form with Non-GST
    await helpers.fillForm({
      name: testData.party.customer.name,
      email: testData.party.customer.email,
      phone: testData.party.customer.phone,
      gst_status: 'Non-GST',
      billing_address_line1: testData.party.customer.billing_address_line1,
      billing_city: testData.party.customer.billing_city,
      billing_state: testData.party.customer.billing_state,
      billing_pincode: testData.party.customer.billing_pincode
    });
    
    // GSTIN and registration status should be disabled
    const gstinInput = page.locator('[data-testid="gstin-input"]');
    const gstRegistrationSelect = page.locator('[data-testid="gst_registration_status-input"]');
    
    await expect(gstinInput).toBeDisabled();
    await expect(gstRegistrationSelect).toBeDisabled();
    
    await helpers.submitForm();
    await helpers.expectSuccessMessage();
  });

  test('should create customer with Exempted status', async ({ page }) => {
    const testData = helpers.generateTestData();
    await page.goto('/customers/add');
    
    // Fill customer form with Exempted
    await helpers.fillForm({
      name: testData.party.customer.name,
      email: testData.party.customer.email,
      phone: testData.party.customer.phone,
      gst_status: 'Exempted',
      billing_address_line1: testData.party.customer.billing_address_line1,
      billing_city: testData.party.customer.billing_city,
      billing_state: testData.party.customer.billing_state,
      billing_pincode: testData.party.customer.billing_pincode
    });
    
    // GSTIN and registration status should be disabled
    const gstinInput = page.locator('[data-testid="gstin-input"]');
    const gstRegistrationSelect = page.locator('[data-testid="gst_registration_status-input"]');
    
    await expect(gstinInput).toBeDisabled();
    await expect(gstRegistrationSelect).toBeDisabled();
    
    await helpers.submitForm();
    await helpers.expectSuccessMessage();
  });

  test('should validate GSTIN format when GST is enabled', async ({ page }) => {
    await page.goto('/customers/add');
    
    // Set GST status to GST
    await page.selectOption('[data-testid="gst_status-input"]', 'GST');
    
    // Enter invalid GSTIN
    await page.fill('[data-testid="gstin-input"]', 'INVALID');
    
    await helpers.submitForm();
    await helpers.expectErrorMessage('Invalid GSTIN format');
  });

  test('should allow valid GSTIN when GST is enabled', async ({ page }) => {
    const testData = helpers.generateTestData();
    await page.goto('/customers/add');
    
    // Fill form with valid GSTIN
    await helpers.fillForm({
      name: testData.party.customer.name,
      email: testData.party.customer.email,
      phone: testData.party.customer.phone,
      gst_status: 'GST',
      gstin: '27AABCA1234A1Z5',
      billing_address_line1: testData.party.customer.billing_address_line1,
      billing_city: testData.party.customer.billing_city,
      billing_state: testData.party.customer.billing_state,
      billing_pincode: testData.party.customer.billing_pincode
    });
    
    await helpers.submitForm();
    await helpers.expectSuccessMessage();
  });

  test('should update existing customer GST status', async ({ page }) => {
    // First create a customer
    const testData = helpers.generateTestData();
    await page.goto('/customers/add');
    await helpers.fillForm({
      name: testData.party.customer.name,
      email: testData.party.customer.email,
      phone: testData.party.customer.phone,
      gst_status: 'GST',
      billing_address_line1: testData.party.customer.billing_address_line1,
      billing_city: testData.party.customer.billing_city,
      billing_state: testData.party.customer.billing_state,
      billing_pincode: testData.party.customer.billing_pincode
    });
    await helpers.submitForm();
    
    // Navigate to customers list and edit
    await page.goto('/customers');
    await page.click('[data-testid="edit-customer-button"]');
    
    // Change GST status to Non-GST
    await page.selectOption('[data-testid="gst_status-input"]', 'Non-GST');
    
    await helpers.submitForm();
    await helpers.expectSuccessMessage();
  });

  test('should display GST status in customer list', async ({ page }) => {
    await page.goto('/customers');
    
    // Check if GST status column exists
    const gstStatusHeader = page.locator('th:has-text("GST Status")');
    await expect(gstStatusHeader).toBeVisible();
    
    // Check if GST status is displayed for customers
    const gstStatusCells = page.locator('td[data-testid="gst-status"]');
    await expect(gstStatusCells.first()).toBeVisible();
  });

  test('should filter customers by GST status', async ({ page }) => {
    await page.goto('/customers');
    
    // Test GST filter
    await helpers.testFilter('gst_status', 'GST');
    
    // Test Non-GST filter
    await helpers.testFilter('gst_status', 'Non-GST');
    
    // Test Exempted filter
    await helpers.testFilter('gst_status', 'Exempted');
  });

  test('should apply GST calculations based on customer GST status', async ({ page }) => {
    // Create a GST customer
    const testData = helpers.generateTestData();
    await page.goto('/customers/add');
    await helpers.fillForm({
      name: testData.party.customer.name,
      email: testData.party.customer.email,
      phone: testData.party.customer.phone,
      gst_status: 'GST',
      billing_address_line1: testData.party.customer.billing_address_line1,
      billing_city: testData.party.customer.billing_city,
      billing_state: testData.party.customer.billing_state,
      billing_pincode: testData.party.customer.billing_pincode
    });
    await helpers.submitForm();
    
    // Create invoice for GST customer
    await page.goto('/invoices/add');
    await page.selectOption('[data-testid="customer-select"]', testData.party.customer.name);
    
    // Add item with GST
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="item-qty"]', '5');
    await page.fill('[data-testid="item-rate"]', '100');
    
    // Check if GST is calculated
    const gstAmount = page.locator('[data-testid="gst-amount"]');
    await expect(gstAmount).toContainText('90.00'); // 18% GST on 500
  });

  test('should not apply GST for Non-GST customers', async ({ page }) => {
    // Create a Non-GST customer
    const testData = helpers.generateTestData();
    await page.goto('/customers/add');
    await helpers.fillForm({
      name: testData.party.customer.name,
      email: testData.party.customer.email,
      phone: testData.party.customer.phone,
      gst_status: 'Non-GST',
      billing_address_line1: testData.party.customer.billing_address_line1,
      billing_city: testData.party.customer.billing_city,
      billing_state: testData.party.customer.billing_state,
      billing_pincode: testData.party.customer.billing_pincode
    });
    await helpers.submitForm();
    
    // Create invoice for Non-GST customer
    await page.goto('/invoices/add');
    await page.selectOption('[data-testid="customer-select"]', testData.party.customer.name);
    
    // Add item
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="item-qty"]', '5');
    await page.fill('[data-testid="item-rate"]', '100');
    
    // Check if GST is not calculated
    const gstAmount = page.locator('[data-testid="gst-amount"]');
    await expect(gstAmount).toContainText('0.00');
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    await page.goto('/customers/add');
    
    // Test tab navigation to GST status dropdown
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const gstStatusDropdown = page.locator('[data-testid="gst_status-input"]');
    await expect(gstStatusDropdown).toBeFocused();
    
    // Test dropdown navigation with arrow keys
    await page.keyboard.press('ArrowDown');
    await expect(gstStatusDropdown).toHaveValue('Non-GST');
    
    await page.keyboard.press('ArrowDown');
    await expect(gstStatusDropdown).toHaveValue('Exempted');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/customers/add');
    
    // Check if GST status dropdown is visible and usable on mobile
    const gstStatusDropdown = page.locator('[data-testid="gst_status-input"]');
    await expect(gstStatusDropdown).toBeVisible();
    await expect(gstStatusDropdown).toBeEnabled();
  });
});
