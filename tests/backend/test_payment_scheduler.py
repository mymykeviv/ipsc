"""
Tests for Payment Scheduler functionality
"""
import pytest
from datetime import datetime, date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models import Payment, PurchasePayment, Expense, Invoice, Purchase, Party, Product
from app.payment_scheduler import PaymentScheduler, PaymentStatus, PaymentReminderType


class TestPaymentScheduler:
    """Test payment scheduler functionality"""
    
    def test_payment_status_determination(self, db: Session):
        """Test payment status determination logic"""
        scheduler = PaymentScheduler(db)
        
        # Test paid status
        status = scheduler._determine_payment_status(date.today(), Decimal('0'))
        assert status == PaymentStatus.PAID
        
        # Test overdue status
        overdue_date = date.today() - timedelta(days=5)
        status = scheduler._determine_payment_status(overdue_date, Decimal('100'))
        assert status == PaymentStatus.OVERDUE
        
        # Test pending status
        future_date = date.today() + timedelta(days=5)
        status = scheduler._determine_payment_status(future_date, Decimal('100'))
        assert status == PaymentStatus.PENDING
    
    def test_payment_schedule_invoice_payments(self, db: Session):
        """Test invoice payment schedule"""
        # Create test data
        customer = Party(name="Test Customer", gstin="123456789012345", party_type="Customer")
        db.add(customer)
        db.flush()
        
        # Create invoice with balance
        invoice = Invoice(
            customer_id=customer.id,
            invoice_no="INV-001",
            grand_total=Decimal("1000.00"),
            paid_amount=Decimal("400.00"),
            balance_amount=Decimal("600.00"),
            due_date=date.today() + timedelta(days=10)
        )
        db.add(invoice)
        db.commit()
        
        scheduler = PaymentScheduler(db)
        schedule = scheduler.get_payment_schedule(payment_type="invoice")
        
        assert len(schedule["scheduled_payments"]) == 1
        payment = schedule["scheduled_payments"][0]
        assert payment["type"] == "invoice"
        assert payment["reference"] == "INV-001"
        assert payment["amount"] == 600.0
        assert payment["status"] == PaymentStatus.PENDING
        assert schedule["summary"]["total_scheduled"] == 600.0
    
    def test_payment_schedule_purchase_payments(self, db: Session):
        """Test purchase payment schedule"""
        # Create test data
        vendor = Party(name="Test Vendor", gstin="987654321098765", party_type="Vendor")
        db.add(vendor)
        db.flush()
        
        # Create purchase with balance
        purchase = Purchase(
            vendor_id=vendor.id,
            purchase_no="PUR-001",
            grand_total=Decimal("500.00"),
            paid_amount=Decimal("200.00"),
            balance_amount=Decimal("300.00"),
            due_date=date.today() - timedelta(days=5)  # Overdue
        )
        db.add(purchase)
        db.commit()
        
        scheduler = PaymentScheduler(db)
        schedule = scheduler.get_payment_schedule(payment_type="purchase")
        
        assert len(schedule["scheduled_payments"]) == 1
        payment = schedule["scheduled_payments"][0]
        assert payment["type"] == "purchase"
        assert payment["reference"] == "PUR-001"
        assert payment["amount"] == 300.0
        assert payment["status"] == PaymentStatus.OVERDUE
        assert schedule["summary"]["total_overdue"] == 300.0
    
    def test_payment_schedule_filtering(self, db: Session):
        """Test payment schedule filtering"""
        # Create test data
        customer = Party(name="Test Customer", gstin="123456789012345", party_type="Customer")
        vendor = Party(name="Test Vendor", gstin="987654321098765", party_type="Vendor")
        db.add_all([customer, vendor])
        db.flush()
        
        # Create overdue invoice
        overdue_invoice = Invoice(
            customer_id=customer.id,
            invoice_no="INV-OVERDUE",
            grand_total=Decimal("1000.00"),
            balance_amount=Decimal("1000.00"),
            due_date=date.today() - timedelta(days=10)
        )
        
        # Create pending invoice
        pending_invoice = Invoice(
            customer_id=customer.id,
            invoice_no="INV-PENDING",
            grand_total=Decimal("500.00"),
            balance_amount=Decimal("500.00"),
            due_date=date.today() + timedelta(days=10)
        )
        
        db.add_all([overdue_invoice, pending_invoice])
        db.commit()
        
        scheduler = PaymentScheduler(db)
        
        # Test overdue filter
        overdue_schedule = scheduler.get_payment_schedule(status=PaymentStatus.OVERDUE)
        assert len(overdue_schedule["scheduled_payments"]) == 1
        assert overdue_schedule["scheduled_payments"][0]["reference"] == "INV-OVERDUE"
        
        # Test pending filter
        pending_schedule = scheduler.get_payment_schedule(status=PaymentStatus.PENDING)
        assert len(pending_schedule["scheduled_payments"]) == 1
        assert pending_schedule["scheduled_payments"][0]["reference"] == "INV-PENDING"
    
    def test_payment_reminders(self, db: Session):
        """Test payment reminders"""
        # Create test data
        customer = Party(name="Test Customer", gstin="123456789012345", party_type="Customer", email="test@example.com")
        db.add(customer)
        db.flush()
        
        # Create invoice due soon
        due_soon_invoice = Invoice(
            customer_id=customer.id,
            invoice_no="INV-DUE-SOON",
            grand_total=Decimal("1000.00"),
            balance_amount=Decimal("1000.00"),
            due_date=date.today() + timedelta(days=3)
        )
        
        # Create overdue invoice
        overdue_invoice = Invoice(
            customer_id=customer.id,
            invoice_no="INV-OVERDUE",
            grand_total=Decimal("500.00"),
            balance_amount=Decimal("500.00"),
            due_date=date.today() - timedelta(days=5)
        )
        
        db.add_all([due_soon_invoice, overdue_invoice])
        db.commit()
        
        scheduler = PaymentScheduler(db)
        
        # Test all reminders
        reminders = scheduler.get_payment_reminders()
        assert len(reminders) >= 2
        
        # Test due soon reminders
        due_soon_reminders = scheduler.get_payment_reminders(PaymentReminderType.DUE_SOON)
        assert len(due_soon_reminders) >= 1
        
        # Test overdue reminders
        overdue_reminders = scheduler.get_payment_reminders(PaymentReminderType.OVERDUE)
        assert len(overdue_reminders) >= 1
    
    def test_payment_analytics(self, db: Session):
        """Test payment analytics"""
        # Create test data
        customer = Party(name="Test Customer", gstin="123456789012345", party_type="Customer")
        vendor = Party(name="Test Vendor", gstin="987654321098765", party_type="Vendor")
        db.add_all([customer, vendor])
        db.flush()
        
        # Create invoice and payment
        invoice = Invoice(
            customer_id=customer.id,
            invoice_no="INV-001",
            grand_total=Decimal("1000.00"),
            balance_amount=Decimal("600.00")
        )
        db.add(invoice)
        db.flush()
        
        payment = Payment(
            invoice_id=invoice.id,
            payment_amount=Decimal("400.00"),
            payment_method="Bank Transfer",
            account_head="Bank"
        )
        db.add(payment)
        
        # Create purchase and payment
        purchase = Purchase(
            vendor_id=vendor.id,
            purchase_no="PUR-001",
            grand_total=Decimal("500.00"),
            balance_amount=Decimal("300.00")
        )
        db.add(purchase)
        db.flush()
        
        purchase_payment = PurchasePayment(
            purchase_id=purchase.id,
            payment_amount=Decimal("200.00"),
            payment_method="Cash",
            account_head="Cash"
        )
        db.add(purchase_payment)
        
        db.commit()
        
        scheduler = PaymentScheduler(db)
        analytics = scheduler.get_payment_analytics()
        
        assert "period" in analytics
        assert "collections" in analytics
        assert "payments" in analytics
        assert "overdue" in analytics
        
        # Check collections
        assert analytics["collections"]["total_collected"] == 400.0
        assert analytics["collections"]["payment_count"] == 1
        
        # Check payments
        assert analytics["payments"]["total_paid"] == 200.0
        assert analytics["payments"]["payment_count"] == 1
    
    def test_empty_database(self, db: Session):
        """Test with empty database"""
        scheduler = PaymentScheduler(db)
        
        # Test empty schedule
        schedule = scheduler.get_payment_schedule()
        assert len(schedule["scheduled_payments"]) == 0
        assert schedule["summary"]["total_scheduled"] == 0
        
        # Test empty reminders
        reminders = scheduler.get_payment_reminders()
        assert len(reminders) == 0
        
        # Test empty analytics
        analytics = scheduler.get_payment_analytics()
        assert analytics["collections"]["total_collected"] == 0.0
        assert analytics["payments"]["total_paid"] == 0.0


class TestPaymentSchedulerAPI:
    """Test payment scheduler API endpoints"""
    
    def test_get_payment_schedule_api(self, client, auth_headers):
        """Test payment schedule API endpoint"""
        response = client.get("/api/payment-schedule", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "scheduled_payments" in data
        assert "summary" in data
        assert "total_scheduled" in data["summary"]
        assert "total_overdue" in data["summary"]
        assert "total_pending" in data["summary"]
    
    def test_get_payment_schedule_with_filters(self, client, auth_headers):
        """Test payment schedule API with filters"""
        # Test with payment type filter
        response = client.get("/api/payment-schedule?payment_type=invoice", headers=auth_headers)
        assert response.status_code == 200
        
        # Test with status filter
        response = client.get("/api/payment-schedule?status=pending", headers=auth_headers)
        assert response.status_code == 200
        
        # Test with date filters
        response = client.get("/api/payment-schedule?start_date=2024-01-01&end_date=2024-12-31", headers=auth_headers)
        assert response.status_code == 200
    
    def test_get_payment_reminders_api(self, client, auth_headers):
        """Test payment reminders API endpoint"""
        response = client.get("/api/payment-reminders", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Test with reminder type filter
        response = client.get("/api/payment-reminders?reminder_type=overdue", headers=auth_headers)
        assert response.status_code == 200
    
    def test_get_payment_analytics_api(self, client, auth_headers):
        """Test payment analytics API endpoint"""
        response = client.get("/api/payment-analytics", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "period" in data
        assert "collections" in data
        assert "payments" in data
        assert "overdue" in data
        
        # Test with date filters
        response = client.get("/api/payment-analytics?start_date=2024-01-01&end_date=2024-12-31", headers=auth_headers)
        assert response.status_code == 200
    
    def test_invalid_status_filter(self, client, auth_headers):
        """Test invalid status filter"""
        response = client.get("/api/payment-schedule?status=invalid", headers=auth_headers)
        assert response.status_code == 400
        assert "Invalid status value" in response.json()["detail"]
    
    def test_invalid_reminder_type_filter(self, client, auth_headers):
        """Test invalid reminder type filter"""
        response = client.get("/api/payment-reminders?reminder_type=invalid", headers=auth_headers)
        assert response.status_code == 400
        assert "Invalid reminder type" in response.json()["detail"]
    
    def test_invalid_date_format(self, client, auth_headers):
        """Test invalid date format"""
        response = client.get("/api/payment-schedule?start_date=invalid-date", headers=auth_headers)
        assert response.status_code == 422  # Validation error
