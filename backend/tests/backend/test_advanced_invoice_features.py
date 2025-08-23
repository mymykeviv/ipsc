"""
Tests for Advanced Invoice Features
"""
import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models import (
    User, Party, Product, CompanySettings, 
    RecurringInvoiceTemplate, RecurringInvoiceTemplateItem, RecurringInvoice
)
from app.currency import CurrencyManager, get_exchange_rate, convert_amount, format_currency
from app.recurring_invoices import RecurringInvoiceService


class TestCurrencyManagement:
    """Test currency and exchange rate functionality"""
    
    def test_supported_currencies(self):
        """Test getting supported currencies"""
        manager = CurrencyManager()
        currencies = manager.get_supported_currencies()
        
        assert 'INR' in currencies
        assert 'USD' in currencies
        assert 'EUR' in currencies
        assert 'GBP' in currencies
        
        # Check currency info structure
        inr_info = currencies['INR']
        assert 'symbol' in inr_info
        assert 'name' in inr_info
        assert inr_info['symbol'] == '₹'
        assert inr_info['name'] == 'Indian Rupee'
    
    def test_currency_validation(self):
        """Test currency validation"""
        manager = CurrencyManager()
        
        assert manager.is_supported_currency('INR') == True
        assert manager.is_supported_currency('USD') == True
        assert manager.is_supported_currency('XYZ') == False
    
    def test_exchange_rate_same_currency(self):
        """Test exchange rate for same currency"""
        rate = get_exchange_rate('INR', 'INR')
        assert rate == 1.0
    
    def test_exchange_rate_fallback(self):
        """Test fallback exchange rates"""
        # Test with fallback rates
        rate = get_exchange_rate('USD', 'INR')
        assert rate > 0
        assert isinstance(rate, float)
    
    def test_currency_conversion(self):
        """Test currency conversion"""
        amount = Decimal('100.00')
        converted = convert_amount(amount, 'USD', 'INR')
        assert converted > amount
        assert isinstance(converted, Decimal)
    
    def test_currency_formatting(self):
        """Test currency formatting"""
        amount = Decimal('1234.56')
        
        # Test INR formatting
        formatted_inr = format_currency(amount, 'INR')
        assert '₹' in formatted_inr
        assert '1,234.56' in formatted_inr
        
        # Test USD formatting
        formatted_usd = format_currency(amount, 'USD')
        assert '$' in formatted_usd
        assert '1,234.56' in formatted_usd


class TestRecurringInvoiceService:
    """Test recurring invoice service functionality"""
    
    def test_create_template(self, db: Session):
        """Test creating a recurring invoice template"""
        # Create test data
        customer = Party(
            name="Test Customer",
            gstin="27AAAAA0000A1Z5",
            gst_enabled=True,
            is_customer=True,
            is_vendor=False,
            billing_address_line1="Test Address Line 1",
            billing_city="Test City",
            billing_state="Test State"
        )
        supplier = Party(
            name="Test Supplier",
            gstin="27AAAAA0000A1Z5",
            gst_enabled=True,
            is_customer=False,
            is_vendor=True,
            billing_address_line1="Test Address Line 1",
            billing_city="Test City",
            billing_state="Test State"
        )
        db.add(customer)
        db.add(supplier)
        db.commit()
        
        service = RecurringInvoiceService(db)
        
        template_data = {
            'name': 'Monthly Subscription',
            'customer_id': customer.id,
            'supplier_id': supplier.id,
            'recurrence_type': 'monthly',
            'recurrence_interval': 1,
            'start_date': datetime.utcnow(),
            'next_generation_date': datetime.utcnow(),
            'currency': 'INR',
            'exchange_rate': Decimal('1.0'),
            'terms': 'Net 30',
            'place_of_supply': 'Mumbai, Maharashtra',
            'place_of_supply_state_code': '27',
            'bill_to_address': 'Test Bill Address',
            'ship_to_address': 'Test Ship Address',
            'notes': 'Test notes'
        }
        
        template = service.create_template(template_data)
        
        assert template.name == 'Monthly Subscription'
        assert template.customer_id == customer.id
        assert template.supplier_id == supplier.id
        assert template.recurrence_type == 'monthly'
        assert template.is_active == True
    
    def test_add_template_item(self, db: Session):
        """Test adding items to a recurring invoice template"""
        # Create test data
        customer = Party(
            name="Test Customer", 
            gst_enabled=True,
            is_customer=True,
            is_vendor=False,
            billing_address_line1="Test Address Line 1",
            billing_city="Test City",
            billing_state="Test State"
        )
        supplier = Party(
            name="Test Supplier", 
            gst_enabled=True,
            is_customer=False,
            is_vendor=True,
            billing_address_line1="Test Address Line 1",
            billing_city="Test City",
            billing_state="Test State"
        )
        product = Product(
            name="Test Product",
            description="Test Description",
            hsn="12345678",
            gst_rate=18.0,
            stock=100.0,
            sales_price=100.0  # Add required sales_price field
        )
        db.add_all([customer, supplier, product])
        db.commit()
        
        service = RecurringInvoiceService(db)
        
        # Create template
        template_data = {
            'name': 'Test Template',
            'customer_id': customer.id,
            'supplier_id': supplier.id,
            'recurrence_type': 'monthly',
            'recurrence_interval': 1,
            'start_date': datetime.utcnow(),
            'next_generation_date': datetime.utcnow(),
            'currency': 'INR',
            'exchange_rate': Decimal('1.0'),
            'terms': 'Net 30',
            'place_of_supply': 'Mumbai, Maharashtra',
            'place_of_supply_state_code': '27',
            'bill_to_address': 'Test Bill Address',
            'ship_to_address': 'Test Ship Address'
        }
        template = service.create_template(template_data)
        
        # Add item
        item_data = {
            'product_id': product.id,
            'description': 'Test Item',
            'hsn_code': '12345678',
            'qty': 10.0,
            'rate': Decimal('100.00'),
            'discount': Decimal('10.00'),
            'discount_type': 'Percentage',
            'gst_rate': 18.0
        }
        
        item = service.add_template_item(template.id, item_data)
        
        assert item.template_id == template.id
        assert item.product_id == product.id
        assert item.description == 'Test Item'
        assert item.qty == 10.0
        assert item.rate == Decimal('100.00')
    
    def test_get_active_templates(self, db: Session):
        """Test getting active templates"""
        # Create test data
        customer = Party(
            name="Test Customer",
            gst_enabled=True,
            is_customer=True,
            is_vendor=False,
            billing_address_line1="Test Address Line 1",
            billing_city="Test City",
            billing_state="Test State",
            
        )
        supplier = Party(
            name="Test Supplier",
            gst_enabled=True,
            is_customer=False,
            is_vendor=True,
            billing_address_line1="Test Address Line 1",
            billing_city="Test City",
            billing_state="Test State",
            
        )
        db.add_all([customer, supplier])
        db.commit()
        
        service = RecurringInvoiceService(db)
        
        # Create active template
        template_data = {
            'name': 'Active Template',
            'customer_id': customer.id,
            'supplier_id': supplier.id,
            'recurrence_type': 'monthly',
            'recurrence_interval': 1,
            'start_date': datetime.utcnow(),
            'next_generation_date': datetime.utcnow(),
            'currency': 'INR',
            'exchange_rate': Decimal('1.0'),
            'terms': 'Net 30',
            'place_of_supply': 'Mumbai, Maharashtra',
            'place_of_supply_state_code': '27',
            'bill_to_address': 'Test Bill Address',
            'ship_to_address': 'Test Ship Address',
            'is_active': True
        }
        active_template = service.create_template(template_data)
        
        # Create inactive template
        template_data['name'] = 'Inactive Template'
        template_data['is_active'] = False
        inactive_template = service.create_template(template_data)
        
        # Get active templates
        active_templates = service.get_active_templates()
        
        assert len(active_templates) == 1
        assert active_templates[0].name == 'Active Template'
        assert active_templates[0].is_active == True
    
    def test_deactivate_template(self, db: Session):
        """Test deactivating a recurring invoice template"""
        # Create test data
        customer = Party(
            name="Test Customer",
            gst_enabled=True,
            is_customer=True,
            is_vendor=False,
            billing_address_line1="Test Address Line 1",
            billing_city="Test City",
            billing_state="Test State",
            
        )
        supplier = Party(
            name="Test Supplier",
            gst_enabled=True,
            is_customer=False,
            is_vendor=True,
            billing_address_line1="Test Address Line 1",
            billing_city="Test City",
            billing_state="Test State",
            
        )
        db.add_all([customer, supplier])
        db.commit()
        
        service = RecurringInvoiceService(db)
        
        # Create template
        template_data = {
            'name': 'Test Template',
            'customer_id': customer.id,
            'supplier_id': supplier.id,
            'recurrence_type': 'monthly',
            'recurrence_interval': 1,
            'start_date': datetime.utcnow(),
            'next_generation_date': datetime.utcnow(),
            'currency': 'INR',
            'exchange_rate': Decimal('1.0'),
            'terms': 'Net 30',
            'place_of_supply': 'Mumbai, Maharashtra',
            'place_of_supply_state_code': '27',
            'bill_to_address': 'Test Bill Address',
            'ship_to_address': 'Test Ship Address',
            'is_active': True
        }
        template = service.create_template(template_data)
        
        # Deactivate template
        success = service.deactivate_template(template.id)
        assert success == True
        
        # Verify template is deactivated
        updated_template = service.get_template_by_id(template.id)
        assert updated_template.is_active == False
    
    def test_calculate_due_date(self, db: Session):
        """Test due date calculation"""
        service = RecurringInvoiceService(db)
        invoice_date = datetime.utcnow()
        
        # Test different terms
        due_date = service._calculate_due_date("Due on Receipt", invoice_date)
        assert due_date == invoice_date
        
        due_date = service._calculate_due_date("Net 30", invoice_date)
        expected_date = invoice_date + timedelta(days=30)
        assert due_date == expected_date
        
        due_date = service._calculate_due_date("Net 60", invoice_date)
        expected_date = invoice_date + timedelta(days=60)
        assert due_date == expected_date


class TestAdvancedInvoiceAPI:
    """Test advanced invoice API endpoints"""
    
    def test_get_currencies(self, client, auth_headers):
        """Test getting supported currencies"""
        response = client.get("/api/currencies", headers=auth_headers)
        assert response.status_code == 200
        
        currencies = response.json()
        assert len(currencies) > 0
        
        # Check for required currencies
        currency_codes = [c['code'] for c in currencies]
        assert 'INR' in currency_codes
        assert 'USD' in currency_codes
        assert 'EUR' in currency_codes
        
        # Check currency structure
        inr_currency = next(c for c in currencies if c['code'] == 'INR')
        assert 'symbol' in inr_currency
        assert 'name' in inr_currency
        assert inr_currency['symbol'] == '₹'
    
    def test_get_exchange_rate(self, client, auth_headers):
        """Test getting exchange rate"""
        response = client.get("/api/exchange-rate/USD/INR", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert 'from_currency' in data
        assert 'to_currency' in data
        assert 'rate' in data
        assert 'last_updated' in data
        assert data['from_currency'] == 'USD'
        assert data['to_currency'] == 'INR'
        assert data['rate'] > 0
    
    def test_get_exchange_rate_same_currency(self, client, auth_headers):
        """Test exchange rate for same currency"""
        response = client.get("/api/exchange-rate/INR/INR", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data['rate'] == 1.0
    
    def test_create_recurring_invoice_template(self, client, auth_headers, db: Session):
        """Test creating a recurring invoice template"""
        # Create test data with required fields
        customer = Party(
            name="Test Customer",
            gst_enabled=True,
            is_customer=True,
            is_vendor=False,
            billing_address_line1="Test Address Line 1",
            billing_city="Test City",
            billing_state="Test State",
            
        )
        supplier = Party(
            name="Test Supplier",
            gst_enabled=True,
            is_customer=False,
            is_vendor=True,
            billing_address_line1="Test Address Line 1",
            billing_city="Test City",
            billing_state="Test State",
            
        )
        db.add_all([customer, supplier])
        db.commit()
        
        template_data = {
            "name": "Monthly Subscription",
            "customer_id": customer.id,
            "supplier_id": supplier.id,
            "recurrence_type": "monthly",
            "recurrence_interval": 1,
            "start_date": datetime.utcnow().isoformat(),
            "currency": "INR",
            "exchange_rate": "1.0",
            "terms": "Net 30",
            "place_of_supply": "Mumbai, Maharashtra",
            "place_of_supply_state_code": "27",
            "bill_to_address": "Test Bill Address",
            "ship_to_address": "Test Ship Address",
            "notes": "Test notes"
        }
        
        response = client.post(
            "/api/recurring-invoice-templates",
            json=template_data,
            headers=auth_headers
        )
        assert response.status_code == 201
        
        data = response.json()
        assert data['name'] == "Monthly Subscription"
        assert data['customer_id'] == customer.id
        assert data['supplier_id'] == supplier.id
        assert data['recurrence_type'] == "monthly"
        assert data['is_active'] == True
    
    def test_get_recurring_invoice_templates(self, client, auth_headers, db: Session):
        """Test getting recurring invoice templates"""
        # Create test data with required fields
        customer = Party(
            name="Test Customer",
            gst_enabled=True,
            is_customer=True,
            is_vendor=False,
            billing_address_line1="Test Address Line 1",
            billing_city="Test City",
            billing_state="Test State",
            
        )
        supplier = Party(
            name="Test Supplier",
            gst_enabled=True,
            is_customer=False,
            is_vendor=True,
            billing_address_line1="Test Address Line 1",
            billing_city="Test City",
            billing_state="Test State",
            
        )
        db.add_all([customer, supplier])
        db.commit()
        
        # Create template via service
        service = RecurringInvoiceService(db)
        template_data = {
            'name': 'Test Template',
            'customer_id': customer.id,
            'supplier_id': supplier.id,
            'recurrence_type': 'monthly',
            'recurrence_interval': 1,
            'start_date': datetime.utcnow(),
            'next_generation_date': datetime.utcnow(),
            'currency': 'INR',
            'exchange_rate': Decimal('1.0'),
            'terms': 'Net 30',
            'place_of_supply': 'Mumbai, Maharashtra',
            'place_of_supply_state_code': '27',
            'bill_to_address': 'Test Bill Address',
            'ship_to_address': 'Test Ship Address'
        }
        service.create_template(template_data)
        
        response = client.get("/api/recurring-invoice-templates", headers=auth_headers)
        assert response.status_code == 200
        
        templates = response.json()
        assert len(templates) > 0
        assert templates[0]['name'] == 'Test Template'
    
    def test_generate_recurring_invoices(self, client, auth_headers, db: Session):
        """Test generating recurring invoices"""
        response = client.post("/api/recurring-invoices/generate", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert 'message' in data
        assert 'generated_invoices' in data
        assert isinstance(data['generated_invoices'], list)


@pytest.fixture
def auth_headers(client, db: Session):
    """Create authentication headers for testing"""
    from app.auth import get_password_hash
    from app.models import Role
    
    # Create test role if it doesn't exist
    role = db.query(Role).filter_by(name="Admin").first()
    if not role:
        role = Role(name="Admin")
        db.add(role)
        db.commit()
        db.refresh(role)
    
    # Create test user with proper password hashing
    user = User(
        username="testuser", 
        password_hash=get_password_hash("testpassword"), 
        role_id=role.id
    )
    db.add(user)
    db.commit()
    
    # Login to get token
    login_data = {"username": "testuser", "password": "testpassword"}
    response = client.post("/api/auth/login", json=login_data)
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    else:
        # Return empty headers if login fails
        return {}
