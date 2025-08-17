#!/usr/bin/env python3
"""
Simple seed script to create essential test data for dashboard testing
"""
import os
import sys
from datetime import date, datetime, timedelta
from decimal import Decimal

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.db import SessionLocal
from app.models import User, Role, CompanySettings, Party, Product, Invoice, InvoiceItem, Expense
from app.auth import pwd_context


def create_simple_test_data():
    """Create minimal test data for dashboard testing"""
    db = SessionLocal()
    
    try:
        print("🌱 Starting simple test data seeding...")
        
        # 1. Create Company Settings
        print("📋 Creating company settings...")
        company = CompanySettings(
            name="Test Company Pvt Ltd",
            gstin="27AAPFU0939F1Z5",
            state="Maharashtra",
            state_code="27",
            invoice_series="INV",
            gst_enabled_by_default=True,
            require_gstin_validation=True
        )
        db.add(company)
        db.flush()
        print("✅ Company settings created")
        
        # 2. Create Test Users
        print("👤 Creating test users...")
        admin_role = Role(name="admin")
        db.add(admin_role)
        db.flush()
        
        admin_user = User(
            username="admin",
            password_hash=pwd_context.hash("admin123"),
            role_id=admin_role.id
        )
        db.add(admin_user)
        db.flush()
        print("✅ Test users created")
        
        # 3. Create Parties (Customers and Vendors)
        print("👥 Creating parties...")
        
        # GST Registered Customer
        customer = Party(
            type="customer",
            name="ABC Electronics Ltd",
            gstin="27AABCA1234A1Z5",
            gst_registration_status="GST registered",
            contact_person="John Doe",
            contact_number="9876543210",
            email="john@abcelectronics.com",
            billing_address_line1="123 Tech Park",
            billing_city="Mumbai",
            billing_state="Maharashtra",
            billing_country="India",
            billing_pincode="400001",
            gst_enabled=True
        )
        db.add(customer)
        
        # GST Registered Vendor
        vendor = Party(
            type="vendor",
            name="XYZ Manufacturing Co",
            gstin="29BABCA5678B2Z6",
            gst_registration_status="GST registered",
            contact_person="Jane Smith",
            contact_number="9876543211",
            email="jane@xyzmanufacturing.com",
            billing_address_line1="456 Industrial Area",
            billing_city="Bangalore",
            billing_state="Karnataka",
            billing_country="India",
            billing_pincode="560001",
            gst_enabled=True
        )
        db.add(vendor)
        db.flush()
        print("✅ Parties created")
        
        # 4. Create Products
        print("📦 Creating products...")
        product = Product(
            name="Laptop Computer",
            description="High-performance laptop with latest specs",
            hsn="84713000",
            gst_rate=18.0,
            sales_price=Decimal('45000.00'),
            purchase_price=Decimal('40000.00'),
            unit="PCS",
            stock=25
        )
        db.add(product)
        db.flush()
        print("✅ Products created")
        
        # 5. Create Invoices
        print("📄 Creating invoices...")
        invoice = Invoice(
            customer_id=customer.id,
            supplier_id=vendor.id,
            invoice_no="INV-2024-001",
            date=datetime.now(),
            due_date=datetime.now() + timedelta(days=30),
            terms="Due on Receipt",
            place_of_supply="Maharashtra",
            place_of_supply_state_code="27",
            bill_to_address=customer.billing_address_line1,
            ship_to_address=customer.billing_address_line1,
            taxable_value=Decimal('45000.00'),
            cgst=Decimal('4050.00'),
            sgst=Decimal('4050.00'),
            igst=Decimal('0.00'),
            grand_total=Decimal('53100.00')
        )
        db.add(invoice)
        db.flush()
        
        # Create invoice item
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            product_id=product.id,
            description="Laptop Computer",
            qty=1.0,
            rate=Decimal('45000.00'),
            discount=Decimal('0.00'),
            discount_type="Percentage",
            taxable_value=Decimal('45000.00'),
            gst_rate=18.0,
            cgst=Decimal('4050.00'),
            sgst=Decimal('4050.00'),
            igst=Decimal('0.00'),
            utgst=Decimal('0.00'),
            cess=Decimal('0.00'),
            amount=Decimal('53100.00'),
            hsn_code="84713000"
        )
        db.add(invoice_item)
        db.flush()
        print("✅ Invoices created")
        
        # 6. Create Expenses
        print("💰 Creating expenses...")
        expense = Expense(
            expense_date=datetime.now(),
            expense_type="Office Supplies",
            category="Indirect/Operating",
            subcategory="General",
            description="Office Supplies",
            amount=Decimal('5000.00'),
            payment_method="Cash",
            account_head="Cash",
            gst_amount=Decimal('900.00'),
            gst_rate=18.0,
            total_amount=Decimal('5900.00')
        )
        db.add(expense)
        db.flush()
        print("✅ Expenses created")
        
        db.commit()
        print("🎉 All test data created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating test data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_simple_test_data()
