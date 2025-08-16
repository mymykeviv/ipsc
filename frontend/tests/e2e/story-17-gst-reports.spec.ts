import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Story #17: Enhanced GST Reports', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login();
  });

  test('should display GST Reports in navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Check if Reporting section exists
    const reportingSection = page.locator('.nav-section:has-text("📊 Reporting")');
    await expect(reportingSection).toBeVisible();
    
    // Check if GST Reports link exists
    const gstReportsLink = page.locator('a:has-text("GST Reports (GSTR-1 & GSTR-3B)")');
    await expect(gstReportsLink).toBeVisible();
  });

  test('should navigate to GST Reports page', async ({ page }) => {
    await page.goto('/reports/gst');
    
    // Check if GST Reports page loads
    await expect(page.locator('h1:has-text("GST Reports")')).toBeVisible();
    
    // Check if report type selector exists
    const reportTypeSelect = page.locator('[data-testid="report-type-select"]');
    await expect(reportTypeSelect).toBeVisible();
    
    // Check if date range inputs exist
    const startDateInput = page.locator('[data-testid="start-date-input"]');
    const endDateInput = page.locator('[data-testid="end-date-input"]');
    await expect(startDateInput).toBeVisible();
    await expect(endDateInput).toBeVisible();
  });

  test('should generate GSTR-1 report', async ({ page }) => {
    await page.goto('/reports/gst');
    
    // Select GSTR-1 report type
    await page.selectOption('[data-testid="report-type-select"]', 'gstr1');
    
    // Set date range
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';
    await page.fill('[data-testid="start-date-input"]', startDate);
    await page.fill('[data-testid="end-date-input"]', endDate);
    
    // Generate report
    await page.click('[data-testid="generate-report-button"]');
    
    // Wait for report generation
    await page.waitForSelector('[data-testid="report-loading"]', { state: 'hidden' });
    
    // Check if report data is displayed
    await expect(page.locator('[data-testid="report-content"]')).toBeVisible();
    
    // Check if download button exists
    const downloadButton = page.locator('[data-testid="download-csv-button"]');
    await expect(downloadButton).toBeVisible();
  });

  test('should generate GSTR-3B report', async ({ page }) => {
    await page.goto('/reports/gst');
    
    // Select GSTR-3B report type
    await page.selectOption('[data-testid="report-type-select"]', 'gstr3b');
    
    // Set date range
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';
    await page.fill('[data-testid="start-date-input"]', startDate);
    await page.fill('[data-testid="end-date-input"]', endDate);
    
    // Generate report
    await page.click('[data-testid="generate-report-button"]');
    
    // Wait for report generation
    await page.waitForSelector('[data-testid="report-loading"]', { state: 'hidden' });
    
    // Check if report data is displayed
    await expect(page.locator('[data-testid="report-content"]')).toBeVisible();
    
    // Check if download button exists
    const downloadButton = page.locator('[data-testid="download-csv-button"]');
    await expect(downloadButton).toBeVisible();
  });

  test('should validate date range for reports', async ({ page }) => {
    await page.goto('/reports/gst');
    
    // Try to generate report without date range
    await page.click('[data-testid="generate-report-button"]');
    
    // Check for validation error
    await helpers.expectErrorMessage('Date range is required');
    
    // Try with invalid date range (end date before start date)
    await page.fill('[data-testid="start-date-input"]', '2024-12-31');
    await page.fill('[data-testid="end-date-input"]', '2024-01-01');
    await page.click('[data-testid="generate-report-button"]');
    
    // Check for validation error
    await helpers.expectErrorMessage('End date must be after start date');
  });

  test('should display report summary information', async ({ page }) => {
    await page.goto('/reports/gst');
    
    // Generate a report
    await page.selectOption('[data-testid="report-type-select"]', 'gstr1');
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-12-31');
    await page.click('[data-testid="generate-report-button"]');
    
    // Wait for report generation
    await page.waitForSelector('[data-testid="report-loading"]', { state: 'hidden' });
    
    // Check if summary information is displayed
    const summarySection = page.locator('[data-testid="report-summary"]');
    await expect(summarySection).toBeVisible();
    
    // Check for key summary fields
    await expect(page.locator('[data-testid="total-invoices"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-gst"]')).toBeVisible();
  });

  test('should display report sections correctly', async ({ page }) => {
    await page.goto('/reports/gst');
    
    // Generate GSTR-1 report
    await page.selectOption('[data-testid="report-type-select"]', 'gstr1');
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-12-31');
    await page.click('[data-testid="generate-report-button"]');
    
    // Wait for report generation
    await page.waitForSelector('[data-testid="report-loading"]', { state: 'hidden' });
    
    // Check if report sections are displayed
    const sections = [
      '[data-testid="b2b-section"]',
      '[data-testid="b2c-section"]',
      '[data-testid="rate-wise-summary"]'
    ];
    
    for (const section of sections) {
      await expect(page.locator(section)).toBeVisible();
    }
  });

  test('should download CSV report', async ({ page }) => {
    await page.goto('/reports/gst');
    
    // Generate a report
    await page.selectOption('[data-testid="report-type-select"]', 'gstr1');
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-12-31');
    await page.click('[data-testid="generate-report-button"]');
    
    // Wait for report generation
    await page.waitForSelector('[data-testid="report-loading"]', { state: 'hidden' });
    
    // Download CSV
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-csv-button"]');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('gstr1');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should display data validation results', async ({ page }) => {
    await page.goto('/reports/gst');
    
    // Generate a report
    await page.selectOption('[data-testid="report-type-select"]', 'gstr1');
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-12-31');
    await page.click('[data-testid="generate-report-button"]');
    
    // Wait for report generation
    await page.waitForSelector('[data-testid="report-loading"]', { state: 'hidden' });
    
    // Check if validation results are displayed
    const validationSection = page.locator('[data-testid="validation-results"]');
    await expect(validationSection).toBeVisible();
    
    // Check for validation status
    const validationStatus = page.locator('[data-testid="validation-status"]');
    await expect(validationStatus).toBeVisible();
  });

  test('should handle empty data scenarios', async ({ page }) => {
    await page.goto('/reports/gst');
    
    // Generate report for period with no data
    await page.selectOption('[data-testid="report-type-select"]', 'gstr1');
    await page.fill('[data-testid="start-date-input"]', '2020-01-01');
    await page.fill('[data-testid="end-date-input"]', '2020-01-31');
    await page.click('[data-testid="generate-report-button"]');
    
    // Wait for report generation
    await page.waitForSelector('[data-testid="report-loading"]', { state: 'hidden' });
    
    // Check if empty state is handled gracefully
    const emptyState = page.locator('[data-testid="empty-report-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No data found for the selected period');
  });

  test('should provide report preview functionality', async ({ page }) => {
    await page.goto('/reports/gst');
    
    // Generate a report
    await page.selectOption('[data-testid="report-type-select"]', 'gstr1');
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-12-31');
    await page.click('[data-testid="generate-report-button"]');
    
    // Wait for report generation
    await page.waitForSelector('[data-testid="report-loading"]', { state: 'hidden' });
    
    // Check if preview button exists
    const previewButton = page.locator('[data-testid="preview-report-button"]');
    await expect(previewButton).toBeVisible();
    
    // Click preview
    await previewButton.click();
    
    // Check if preview modal opens
    const previewModal = page.locator('[data-testid="report-preview-modal"]');
    await expect(previewModal).toBeVisible();
  });

  test('should support report customization options', async ({ page }) => {
    await page.goto('/reports/gst');
    
    // Check if customization options exist
    const customizationSection = page.locator('[data-testid="customization-options"]');
    await expect(customizationSection).toBeVisible();
    
    // Test include/exclude options
    const includeOptions = [
      '[data-testid="include-b2b"]',
      '[data-testid="include-b2c"]',
      '[data-testid="include-exports"]'
    ];
    
    for (const option of includeOptions) {
      const checkbox = page.locator(option);
      await expect(checkbox).toBeVisible();
      await checkbox.check();
    }
  });

  test('should display report generation progress', async ({ page }) => {
    await page.goto('/reports/gst');
    
    // Start report generation
    await page.selectOption('[data-testid="report-type-select"]', 'gstr1');
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-12-31');
    await page.click('[data-testid="generate-report-button"]');
    
    // Check if progress indicator is shown
    const progressIndicator = page.locator('[data-testid="report-progress"]');
    await expect(progressIndicator).toBeVisible();
    
    // Wait for completion
    await page.waitForSelector('[data-testid="report-progress"]', { state: 'hidden' });
  });

  test('should handle report generation errors gracefully', async ({ page }) => {
    // Mock API error by using invalid date range
    await page.goto('/reports/gst');
    
    // Try to generate report with very large date range
    await page.selectOption('[data-testid="report-type-select"]', 'gstr1');
    await page.fill('[data-testid="start-date-input"]', '1900-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-12-31');
    await page.click('[data-testid="generate-report-button"]');
    
    // Check if error is handled gracefully
    await helpers.expectErrorMessage('Unable to generate report');
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    await page.goto('/reports/gst');
    
    // Test tab navigation through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="report-type-select"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="start-date-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="end-date-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="generate-report-button"]')).toBeFocused();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/reports/gst');
    
    // Check if form elements are properly sized for mobile
    const reportTypeSelect = page.locator('[data-testid="report-type-select"]');
    const startDateInput = page.locator('[data-testid="start-date-input"]');
    const endDateInput = page.locator('[data-testid="end-date-input"]');
    const generateButton = page.locator('[data-testid="generate-report-button"]');
    
    await expect(reportTypeSelect).toBeVisible();
    await expect(startDateInput).toBeVisible();
    await expect(endDateInput).toBeVisible();
    await expect(generateButton).toBeVisible();
    
    // Check if elements are touch-friendly
    const buttonBox = await generateButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThan(44); // Minimum touch target size
  });

  test('should support report scheduling', async ({ page }) => {
    await page.goto('/reports/gst');
    
    // Check if schedule report option exists
    const scheduleButton = page.locator('[data-testid="schedule-report-button"]');
    await expect(scheduleButton).toBeVisible();
    
    // Click schedule button
    await scheduleButton.click();
    
    // Check if schedule modal opens
    const scheduleModal = page.locator('[data-testid="schedule-report-modal"]');
    await expect(scheduleModal).toBeVisible();
    
    // Fill schedule form
    await page.fill('[data-testid="schedule-frequency"]', 'monthly');
    await page.fill('[data-testid="schedule-email"]', 'test@example.com');
    
    // Submit schedule
    await page.click('[data-testid="submit-schedule-button"]');
    await helpers.expectSuccessMessage('Report scheduled successfully');
  });
});
