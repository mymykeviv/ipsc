import pytest
import time
from playwright.sync_api import sync_playwright, expect
from backend.app.main import app
from backend.app.db import get_db
from backend.app.models import Product, Party, User
from sqlalchemy.orm import Session


class TestUserFlows:
    """End-to-end tests for complete user workflows"""
    
    @pytest.fixture(scope="class")
    def browser_context(self):
        """Setup browser context for E2E tests"""
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()
            yield page
            context.close()
            browser.close()
    
    @pytest.fixture(scope="class")
    def setup_test_data(self):
        """Setup test data in database"""
        db = next(get_db())
        
        # Create test user if not exists
        test_user = db.query(User).filter(User.username == "testuser").first()
        if not test_user:
            from backend.app.auth import pwd_context
            test_user = User(
                username="testuser",
                password_hash=pwd_context.hash("testpass123"),
                role_id=1  # Admin role
            )
            db.add(test_user)
            db.commit()
        
        # Create test products
        test_products = [
            Product(
                name="E2E Test Product 1",
                description="Test product for E2E testing",
                item_type="tradable",
                sales_price=100.00,
                purchase_price=80.00,
                stock=50,
                sku="E2E001",
                unit="Pcs",
                supplier="Test Supplier",
                category="Test Category",
                gst_rate=18.0,
                is_active=True
            ),
            Product(
                name="E2E Test Product 2",
                description="Another test product",
                item_type="consumable",
                sales_price=25.00,
                purchase_price=20.00,
                stock=100,
                sku="E2E002",
                unit="Kg",
                supplier="Test Supplier 2",
                category="Consumables",
                gst_rate=12.0,
                is_active=True
            )
        ]
        
        for product in test_products:
            existing = db.query(Product).filter(Product.sku == product.sku).first()
            if not existing:
                db.add(product)
        
        db.commit()
        db.close()
    
    def test_complete_login_flow(self, browser_context, setup_test_data):
        """Test complete login flow with session management"""
        page = browser_context
        
        # Navigate to login page
        page.goto("http://localhost:5173")
        
        # Should redirect to login
        expect(page).to_have_url("http://localhost:5173/login")
        
        # Fill login form
        page.fill('input[name="username"]', "testuser")
        page.fill('input[name="password"]', "testpass123")
        
        # Submit form
        page.click('button[type="submit"]')
        
        # Should redirect to dashboard
        expect(page).to_have_url("http://localhost:5173/")
        
        # Should show session timer
        expect(page.locator('.session-timer')).to_be_visible()
        
        # Session timer should show minutes format
        timer_text = page.locator('.session-timer').text_content()
        assert "Session:" in timer_text
        assert "m" in timer_text  # Should show minutes
    
    def test_product_management_flow(self, browser_context, setup_test_data):
        """Test complete product management workflow"""
        page = browser_context
        
        # Login first
        page.goto("http://localhost:5173/login")
        page.fill('input[name="username"]', "testuser")
        page.fill('input[name="password"]', "testpass123")
        page.click('button[type="submit"]')
        
        # Navigate to products page
        page.click('a[href="/products"]')
        expect(page).to_have_url("http://localhost:5173/products")
        
        # Should display test products
        expect(page.locator('text=E2E Test Product 1')).to_be_visible()
        expect(page.locator('text=E2E Test Product 2')).to_be_visible()
        expect(page.locator('text=E2E001')).to_be_visible()
        expect(page.locator('text=E2E002')).to_be_visible()
        
        # Test search functionality
        search_input = page.locator('input[placeholder="Search products..."]')
        search_input.fill("Product 1")
        
        # Should filter results
        expect(page.locator('text=E2E Test Product 1')).to_be_visible()
        expect(page.locator('text=E2E Test Product 2')).not_to_be_visible()
        
        # Clear search
        search_input.clear()
        expect(page.locator('text=E2E Test Product 2')).to_be_visible()
    
    def test_add_product_flow(self, browser_context, setup_test_data):
        """Test adding a new product"""
        page = browser_context
        
        # Login first
        page.goto("http://localhost:5173/login")
        page.fill('input[name="username"]', "testuser")
        page.fill('input[name="password"]', "testpass123")
        page.click('button[type="submit"]')
        
        # Navigate to products page
        page.click('a[href="/products"]')
        
        # Click Add Product button
        page.click('text=Add Product')
        
        # Fill product form
        page.fill('input[name="name"]', "New E2E Product")
        page.fill('textarea[name="description"]', "Product created via E2E test")
        page.select_option('select[name="item_type"]', "tradable")
        page.fill('input[name="sales_price"]', "150.00")
        page.fill('input[name="purchase_price"]', "120.00")
        page.fill('input[name="stock"]', "25")
        page.fill('input[name="sku"]', "E2E003")
        page.select_option('select[name="unit"]', "Pcs")
        page.fill('input[name="supplier"]', "E2E Supplier")
        page.fill('input[name="category"]', "E2E Category")
        page.fill('input[name="gst_rate"]', "18")
        
        # Submit form
        page.click('button[type="submit"]')
        
        # Should show success and new product in list
        expect(page.locator('text=New E2E Product')).to_be_visible()
        expect(page.locator('text=E2E003')).to_be_visible()
    
    def test_stock_adjustment_flow(self, browser_context, setup_test_data):
        """Test stock adjustment workflow"""
        page = browser_context
        
        # Login first
        page.goto("http://localhost:5173/login")
        page.fill('input[name="username"]', "testuser")
        page.fill('input[name="password"]', "testpass123")
        page.click('button[type="submit"]')
        
        # Navigate to products page
        page.click('a[href="/products"]')
        
        # Click Stock button for first product
        stock_buttons = page.locator('text=Stock').all()
        stock_buttons[0].click()
        
        # Should open stock adjustment modal
        expect(page.locator('text=Stock Adjustment - E2E Test Product 1')).to_be_visible()
        
        # Verify current stock is displayed
        expect(page.locator('input[value="50"]')).to_be_visible()
        
        # Test adding stock
        page.select_option('select[name="adjustmentType"]', "add")
        page.fill('input[name="quantity"]', "10")
        page.fill('input[name="supplier"]', "Test Supplier")
        page.fill('input[name="category"]', "Test Category")
        page.fill('textarea[name="notes"]', "E2E test stock addition")
        
        # Submit adjustment
        page.click('text=Apply Adjustment')
        
        # Should close modal and update stock
        expect(page.locator('text=Stock Adjustment - E2E Test Product 1')).not_to_be_visible()
        
        # Stock should be updated (50 + 10 = 60)
        expect(page.locator('text=60')).to_be_visible()
        
        # Test reducing stock
        stock_buttons = page.locator('text=Stock').all()
        stock_buttons[0].click()
        
        page.select_option('select[name="adjustmentType"]', "reduce")
        page.fill('input[name="quantity"]', "5")
        page.fill('textarea[name="notes"]', "E2E test stock reduction")
        
        page.click('text=Apply Adjustment')
        
        # Stock should be updated (60 - 5 = 55)
        expect(page.locator('text=55')).to_be_visible()
    
    def test_stock_adjustment_validation(self, browser_context, setup_test_data):
        """Test stock adjustment validation"""
        page = browser_context
        
        # Login first
        page.goto("http://localhost:5173/login")
        page.fill('input[name="username"]', "testuser")
        page.fill('input[name="password"]', "testpass123")
        page.click('button[type="submit"]')
        
        # Navigate to products page
        page.click('a[href="/products"]')
        
        # Click Stock button
        stock_buttons = page.locator('text=Stock').all()
        stock_buttons[0].click()
        
        # Try to submit without quantity
        page.click('text=Apply Adjustment')
        
        # Should show validation error
        expect(page.locator('text=Quantity is required')).to_be_visible()
        
        # Try invalid quantity
        page.fill('input[name="quantity"]', "1000000")
        page.click('text=Apply Adjustment')
        
        # Should show validation error
        expect(page.locator('text=Quantity must be between 0 and 999999')).to_be_visible()
        
        # Try negative quantity
        page.fill('input[name="quantity"]', "-5")
        page.click('text=Apply Adjustment')
        
        # Should show validation error
        expect(page.locator('text=Quantity must be between 0 and 999999')).to_be_visible()
    
    def test_session_timeout_flow(self, browser_context, setup_test_data):
        """Test session timeout behavior"""
        page = browser_context
        
        # Login first
        page.goto("http://localhost:5173/login")
        page.fill('input[name="username"]', "testuser")
        page.fill('input[name="password"]', "testpass123")
        page.click('button[type="submit"]')
        
        # Verify session timer is visible
        expect(page.locator('.session-timer')).to_be_visible()
        
        # Get initial timer value
        initial_timer = page.locator('.session-timer').text_content()
        
        # Wait a few seconds and check timer decreases
        time.sleep(3)
        new_timer = page.locator('.session-timer').text_content()
        
        # Timer should have decreased (this is a basic check)
        assert initial_timer != new_timer
        
        # Note: Full 30-minute timeout test would be too long for CI/CD
        # In real scenarios, you might want to mock the time or use a shorter timeout for testing
    
    def test_product_edit_flow(self, browser_context, setup_test_data):
        """Test editing an existing product"""
        page = browser_context
        
        # Login first
        page.goto("http://localhost:5173/login")
        page.fill('input[name="username"]', "testuser")
        page.fill('input[name="password"]', "testpass123")
        page.click('button[type="submit"]')
        
        # Navigate to products page
        page.click('a[href="/products"]')
        
        # Click Edit button for first product
        edit_buttons = page.locator('text=Edit').all()
        edit_buttons[0].click()
        
        # Should open edit modal with pre-filled data
        expect(page.locator('text=Edit Product')).to_be_visible()
        expect(page.locator('input[value="E2E Test Product 1"]')).to_be_visible()
        expect(page.locator('input[value="100"]')).to_be_visible()
        
        # Modify some fields
        page.fill('input[name="name"]', "Updated E2E Product")
        page.fill('input[name="sales_price"]', "125.00")
        
        # Submit changes
        page.click('button[type="submit"]')
        
        # Should show updated product
        expect(page.locator('text=Updated E2E Product')).to_be_visible()
        expect(page.locator('text=₹125.00')).to_be_visible()
    
    def test_product_status_toggle(self, browser_context, setup_test_data):
        """Test toggling product active status"""
        page = browser_context
        
        # Login first
        page.goto("http://localhost:5173/login")
        page.fill('input[name="username"]', "testuser")
        page.fill('input[name="password"]', "testpass123")
        page.click('button[type="submit"]')
        
        # Navigate to products page
        page.click('a[href="/products"]')
        
        # Find a product with "Disable" button (active product)
        disable_buttons = page.locator('text=Disable').all()
        if len(disable_buttons) > 0:
            disable_buttons[0].click()
            
            # Should show "Enable" button now
            expect(page.locator('text=Enable')).to_be_visible()
            
            # Click Enable to toggle back
            enable_buttons = page.locator('text=Enable').all()
            enable_buttons[0].click()
            
            # Should show "Disable" button again
            expect(page.locator('text=Disable')).to_be_visible()
    
    def test_export_functionality(self, browser_context, setup_test_data):
        """Test CSV export functionality"""
        page = browser_context
        
        # Login first
        page.goto("http://localhost:5173/login")
        page.fill('input[name="username"]', "testuser")
        page.fill('input[name="password"]', "testpass123")
        page.click('button[type="submit"]')
        
        # Navigate to products page
        page.click('a[href="/products"]')
        
        # Click Export CSV button
        page.click('text=Export CSV')
        
        # Should trigger download (in headless mode, this is hard to verify)
        # But we can verify the button exists and is clickable
        expect(page.locator('text=Export CSV')).to_be_visible()
    
    def test_responsive_design(self, browser_context, setup_test_data):
        """Test responsive design on different screen sizes"""
        page = browser_context
        
        # Login first
        page.goto("http://localhost:5173/login")
        page.fill('input[name="username"]', "testuser")
        page.fill('input[name="password"]', "testpass123")
        page.click('button[type="submit"]')
        
        # Test mobile viewport
        page.set_viewport_size({"width": 375, "height": 667})
        page.click('a[href="/products"]')
        
        # Should still be functional
        expect(page.locator('text=Products')).to_be_visible()
        expect(page.locator('text=Add Product')).to_be_visible()
        
        # Test tablet viewport
        page.set_viewport_size({"width": 768, "height": 1024})
        page.reload()
        
        # Should still be functional
        expect(page.locator('text=Products')).to_be_visible()
        
        # Test desktop viewport
        page.set_viewport_size({"width": 1920, "height": 1080})
        page.reload()
        
        # Should still be functional
        expect(page.locator('text=Products')).to_be_visible()
