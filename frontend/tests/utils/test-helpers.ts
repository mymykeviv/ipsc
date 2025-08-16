import { Page, expect } from '@playwright/test';

export interface TestUser {
  username: string;
  password: string;
  role: string;
}

export interface TestData {
  party: {
    customer: any;
    vendor: any;
  };
  product: any;
  invoice: any;
  purchase: any;
  expense: any;
}

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Login to the application
   */
  async login(user: TestUser = { username: 'admin', password: 'admin123', role: 'admin' }) {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="username-input"]', user.username);
    await this.page.fill('[data-testid="password-input"]', user.password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('/');
    await expect(this.page.locator('[data-testid="dashboard-title"]')).toBeVisible();
  }

  /**
   * Navigate to a specific page
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for API response
   */
  async waitForAPIResponse(urlPattern: string) {
    await this.page.waitForResponse(response => 
      response.url().includes(urlPattern) && response.status() === 200
    );
  }

  /**
   * Fill form fields
   */
  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      const selector = `[data-testid="${field}-input"]`;
      await this.page.fill(selector, value);
    }
  }

  /**
   * Submit form
   */
  async submitForm() {
    await this.page.click('[data-testid="submit-button"]');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check for success message
   */
  async expectSuccessMessage(message?: string) {
    const successSelector = '[data-testid="success-message"]';
    await expect(this.page.locator(successSelector)).toBeVisible();
    if (message) {
      await expect(this.page.locator(successSelector)).toContainText(message);
    }
  }

  /**
   * Check for error message
   */
  async expectErrorMessage(message?: string) {
    const errorSelector = '[data-testid="error-message"]';
    await expect(this.page.locator(errorSelector)).toBeVisible();
    if (message) {
      await expect(this.page.locator(errorSelector)).toContainText(message);
    }
  }

  /**
   * Check table has data
   */
  async expectTableHasData(tableSelector: string, minRows: number = 1) {
    const rows = this.page.locator(`${tableSelector} tbody tr`);
    await expect(rows).toHaveCount({ min: minRows });
  }

  /**
   * Check pagination works
   */
  async testPagination(tableSelector: string) {
    const paginationSelector = '[data-testid="pagination"]';
    const nextButton = this.page.locator(`${paginationSelector} [data-testid="next-button"]`);
    const prevButton = this.page.locator(`${paginationSelector} [data-testid="prev-button"]`);
    
    // Check if pagination exists
    if (await this.page.locator(paginationSelector).isVisible()) {
      // Test next button
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await this.page.waitForLoadState('networkidle');
        await expect(this.page.locator(`${paginationSelector} [data-testid="current-page"]`)).toContainText('2');
      }
      
      // Test prev button
      if (await prevButton.isEnabled()) {
        await prevButton.click();
        await this.page.waitForLoadState('networkidle');
        await expect(this.page.locator(`${paginationSelector} [data-testid="current-page"]`)).toContainText('1');
      }
    }
  }

  /**
   * Test search functionality
   */
  async testSearch(searchTerm: string, resultsSelector: string) {
    const searchInput = this.page.locator('[data-testid="search-input"]');
    await searchInput.fill(searchTerm);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
    
    // Check if results contain search term
    const results = this.page.locator(resultsSelector);
    await expect(results).toContainText(searchTerm);
  }

  /**
   * Test filter functionality
   */
  async testFilter(filterType: string, filterValue: string) {
    const filterSelect = this.page.locator(`[data-testid="${filterType}-filter"]`);
    await filterSelect.selectOption(filterValue);
    await this.page.waitForLoadState('networkidle');
    
    // Verify filter is applied
    await expect(filterSelect).toHaveValue(filterValue);
  }

  /**
   * Test responsive design
   */
  async testResponsiveDesign() {
    // Test mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.waitForTimeout(1000);
    
    // Check if mobile menu is accessible
    const mobileMenuButton = this.page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(this.page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    }
    
    // Test tablet viewport
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.page.waitForTimeout(1000);
    
    // Test desktop viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.page.waitForTimeout(1000);
  }

  /**
   * Test accessibility
   */
  async testAccessibility() {
    // Check for proper heading structure
    const headings = this.page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings).toHaveCount({ min: 1 });
    
    // Check for alt text on images
    const images = this.page.locator('img');
    for (let i = 0; i < await images.count(); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    // Check for proper form labels
    const inputs = this.page.locator('input, select, textarea');
    for (let i = 0; i < await inputs.count(); i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      if (id) {
        const label = this.page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      }
    }
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation() {
    // Test tab navigation
    await this.page.keyboard.press('Tab');
    await expect(this.page.locator(':focus')).toBeVisible();
    
    // Test enter key on buttons
    const buttons = this.page.locator('button');
    for (let i = 0; i < Math.min(await buttons.count(), 3); i++) {
      await buttons.nth(i).focus();
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Generate test data
   */
  generateTestData(): TestData {
    const timestamp = Date.now();
    return {
      party: {
        customer: {
          name: `Test Customer ${timestamp}`,
          email: `customer${timestamp}@test.com`,
          phone: `98765${timestamp.toString().slice(-5)}`,
          gst_status: 'GST',
          billing_address_line1: '123 Test Street',
          billing_city: 'Mumbai',
          billing_state: 'Maharashtra',
          billing_pincode: '400001'
        },
        vendor: {
          name: `Test Vendor ${timestamp}`,
          email: `vendor${timestamp}@test.com`,
          phone: `98765${timestamp.toString().slice(-5)}`,
          gst_status: 'GST',
          billing_address_line1: '456 Vendor Street',
          billing_city: 'Delhi',
          billing_state: 'Delhi',
          billing_pincode: '110001'
        }
      },
      product: {
        name: `Test Product ${timestamp}`,
        sku: `SKU${timestamp}`,
        unit: 'Pcs',
        sales_price: '100.00',
        purchase_price: '80.00',
        gst_rate: '18',
        hsn_code: '12345678',
        category: 'Test Category'
      },
      invoice: {
        customer_id: 1,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{
          product_id: 1,
          qty: '5',
          rate: '100.00',
          discount: '0.00'
        }]
      },
      purchase: {
        vendor_id: 1,
        purchase_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{
          product_id: 1,
          qty: '10',
          rate: '80.00',
          discount: '0.00'
        }]
      },
      expense: {
        expense_date: new Date().toISOString().split('T')[0],
        amount: '500.00',
        category: 'Office Supplies',
        description: 'Test expense',
        payment_method: 'Cash'
      }
    };
  }
}
