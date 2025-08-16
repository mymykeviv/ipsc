#!/usr/bin/env python3
"""
Test Data Seeding Script for Cashflow Application

This script populates the database with comprehensive test data for testing
all functionalities including GST reports, invoices, purchases, parties, etc.
"""

import sys
import os
from datetime import date, datetime, timedelta
from decimal import Decimal
import random

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.db import SessionLocal, engine
from app.models import (
    User, CompanySettings, Party, Product, Invoice, InvoiceItem,
    Purchase, PurchaseItem, Payment, Expense, StockMovement
)
from app.auth import get_password_hash


def create_test_data():
    """Create comprehensive test data for all functionalities"""
    db = SessionLocal()
    
    try:
        print("🌱 Starting test data seeding...")
        
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
        admin_user = User(
            username="admin",
            hashed_password=get_password_hash("admin123"),
            is_active=True
        )
        db.add(admin_user)
        
        test_user = User(
            username="testuser",
            hashed_password=get_password_hash("test123"),
            is_active=True
        )
        db.add(test_user)
        db.flush()
        print("✅ Test users created")
        
        # 3. Create Parties (Customers and Vendors)
        print("👥 Creating parties...")
        
        # GST Registered Customers
        customers = [
            {
                "name": "ABC Electronics Ltd",
                "gstin": "27AABCA1234A1Z5",
                "gst_enabled": True,
                "gst_registration_status": "GST registered",
                "contact_person": "John Doe",
                "contact_number": "9876543210",
                "email": "john@abcelectronics.com",
                "billing_address_line1": "123 Tech Park",
                "billing_city": "Mumbai",
                "billing_state": "Maharashtra",
                "billing_pincode": "400001"
            },
            {
                "name": "XYZ Manufacturing Co",
                "gstin": "29BABCA5678B2Z6",
                "gst_enabled": True,
                "gst_registration_status": "GST registered",
                "contact_person": "Jane Smith",
                "contact_number": "9876543211",
                "email": "jane@xyzmanufacturing.com",
                "billing_address_line1": "456 Industrial Area",
                "billing_city": "Bangalore",
                "billing_state": "Karnataka",
                "billing_pincode": "560001"
            },
            {
                "name": "Local Retail Store",
                "gstin": None,
                "gst_enabled": False,
                "gst_registration_status": "GST not registered",
                "contact_person": "Bob Wilson",
                "contact_number": "9876543212",
                "email": "bob@localstore.com",
                "billing_address_line1": "789 Main Street",
                "billing_city": "Pune",
                "billing_state": "Maharashtra",
                "billing_pincode": "411001"
            }
        ]
        
        # Vendors
        vendors = [
            {
                "name": "Supplier Corp Ltd",
                "gstin": "27AABCA9999C3Z7",
                "gst_enabled": True,
                "gst_registration_status": "GST registered",
                "contact_person": "Alice Johnson",
                "contact_number": "9876543213",
                "email": "alice@suppliercorp.com",
                "billing_address_line1": "321 Supply Chain",
                "billing_city": "Mumbai",
                "billing_state": "Maharashtra",
                "billing_pincode": "400002"
            },
            {
                "name": "Raw Materials Inc",
                "gstin": "33AABCA8888D4Z8",
                "gst_enabled": True,
                "gst_registration_status": "GST registered",
                "contact_person": "Charlie Brown",
                "contact_number": "9876543214",
                "email": "charlie@rawmaterials.com",
                "billing_address_line1": "654 Material Zone",
                "billing_city": "Chennai",
                "billing_state": "Tamil Nadu",
                "billing_pincode": "600001"
            }
        ]
        
        # Create customers
        customer_parties = []
        for customer_data in customers:
            party = Party(
                type="customer",
                **customer_data
            )
            db.add(party)
            customer_parties.append(party)
        
        # Create vendors
        vendor_parties = []
        for vendor_data in vendors:
            party = Party(
                type="vendor",
                **vendor_data
            )
            db.add(party)
            vendor_parties.append(party)
        
        db.flush()
        print("✅ Parties created")
        
        # 4. Create Products
        print("📦 Creating products...")
        products = [
            {
                "name": "Laptop Computer",
                "description": "High-performance laptop with latest specs",
                "hsn": "84713000",
                "gst_rate": 18.0,
                "sales_price": 45000.00,
                "purchase_price": 40000.00,
                "unit": "PCS",
                "min_stock": 10,
                "current_stock": 25
            },
            {
                "name": "Mobile Phone",
                "description": "Smartphone with advanced features",
                "hsn": "85171200",
                "gst_rate": 18.0,
                "sales_price": 25000.00,
                "purchase_price": 22000.00,
                "unit": "PCS",
                "min_stock": 20,
                "current_stock": 50
            },
            {
                "name": "Wireless Headphones",
                "description": "Bluetooth wireless headphones",
                "hsn": "85183000",
                "gst_rate": 18.0,
                "sales_price": 5000.00,
                "purchase_price": 4000.00,
                "unit": "PCS",
                "min_stock": 30,
                "current_stock": 75
            },
            {
                "name": "USB Cable",
                "description": "High-speed USB-C cable",
                "hsn": "85444900",
                "gst_rate": 18.0,
                "sales_price": 500.00,
                "purchase_price": 300.00,
                "unit": "PCS",
                "min_stock": 100,
                "current_stock": 200
            },
            {
                "name": "Office Chair",
                "description": "Ergonomic office chair",
                "hsn": "94013000",
                "gst_rate": 18.0,
                "sales_price": 8000.00,
                "purchase_price": 6000.00,
                "unit": "PCS",
                "min_stock": 5,
                "current_stock": 15
            }
        ]
        
        product_objects = []
        for product_data in products:
            product = Product(**product_data)
            db.add(product)
            product_objects.append(product)
        
        db.flush()
        print("✅ Products created")
        
        # 5. Create Purchases
        print("🛒 Creating purchases...")
        purchase_dates = [
            date(2024, 1, 5),
            date(2024, 1, 12),
            date(2024, 1, 18),
            date(2024, 1, 25)
        ]
        
        for i, purchase_date in enumerate(purchase_dates):
            vendor = vendor_parties[i % len(vendor_parties)]
            
            # Create purchase
            purchase = Purchase(
                vendor_id=vendor.id,
                supplier_id=vendor.id,
                purchase_no=f"PUR-{purchase_date.strftime('%Y%m%d')}-{i+1:03d}",
                date=purchase_date,
                due_date=purchase_date + timedelta(days=30),
                place_of_supply=vendor.billing_state,
                place_of_supply_state_code=vendor.billing_state_code if hasattr(vendor, 'billing_state_code') else "27",
                bill_from_address=vendor.billing_address_line1,
                ship_from_address=vendor.billing_address_line1,
                taxable_value=0,
                cgst=0,
                sgst=0,
                igst=0,
                grand_total=0
            )
            db.add(purchase)
            db.flush()
            
            # Add purchase items
            total_taxable = 0
            total_cgst = 0
            total_sgst = 0
            total_igst = 0
            
            for j, product in enumerate(product_objects[:3]):  # Use first 3 products
                qty = random.randint(5, 20)
                rate = float(product.purchase_price)
                taxable_value = qty * rate
                
                # Calculate GST
                if vendor.gst_enabled:
                    if vendor.billing_state == "Maharashtra":  # Intra-state
                        cgst = taxable_value * (product.gst_rate / 200)  # Half of GST rate
                        sgst = taxable_value * (product.gst_rate / 200)
                        igst = 0
                    else:  # Inter-state
                        cgst = 0
                        sgst = 0
                        igst = taxable_value * (product.gst_rate / 100)
                else:
                    cgst = sgst = igst = 0
                
                purchase_item = PurchaseItem(
                    purchase_id=purchase.id,
                    product_id=product.id,
                    description=product.description,
                    hsn_code=product.hsn,
                    qty=qty,
                    rate=rate,
                    taxable_value=taxable_value,
                    gst_rate=product.gst_rate,
                    cgst=cgst,
                    sgst=sgst,
                    igst=igst,
                    amount=taxable_value + cgst + sgst + igst
                )
                db.add(purchase_item)
                
                total_taxable += taxable_value
                total_cgst += cgst
                total_sgst += sgst
                total_igst += igst
            
            # Update purchase totals
            purchase.taxable_value = total_taxable
            purchase.cgst = total_cgst
            purchase.sgst = total_sgst
            purchase.igst = total_igst
            purchase.grand_total = total_taxable + total_cgst + total_sgst + total_igst
        
        print("✅ Purchases created")
        
        # 6. Create Invoices
        print("🧾 Creating invoices...")
        invoice_dates = [
            date(2024, 1, 8),
            date(2024, 1, 15),
            date(2024, 1, 22),
            date(2024, 1, 29)
        ]
        
        for i, invoice_date in enumerate(invoice_dates):
            customer = customer_parties[i % len(customer_parties)]
            
            # Create invoice
            invoice = Invoice(
                customer_id=customer.id,
                supplier_id=customer.id,
                invoice_no=f"INV-{invoice_date.strftime('%Y%m%d')}-{i+1:03d}",
                date=invoice_date,
                due_date=invoice_date + timedelta(days=30),
                place_of_supply=customer.billing_state,
                place_of_supply_state_code=customer.billing_state_code if hasattr(customer, 'billing_state_code') else "27",
                bill_to_address=customer.billing_address_line1,
                ship_to_address=customer.billing_address_line1,
                taxable_value=0,
                cgst=0,
                sgst=0,
                igst=0,
                grand_total=0
            )
            db.add(invoice)
            db.flush()
            
            # Add invoice items
            total_taxable = 0
            total_cgst = 0
            total_sgst = 0
            total_igst = 0
            
            for j, product in enumerate(product_objects[:3]):  # Use first 3 products
                qty = random.randint(1, 10)
                rate = float(product.sales_price)
                taxable_value = qty * rate
                
                # Calculate GST only if customer has GST enabled
                if customer.gst_enabled:
                    if customer.billing_state == "Maharashtra":  # Intra-state
                        cgst = taxable_value * (product.gst_rate / 200)  # Half of GST rate
                        sgst = taxable_value * (product.gst_rate / 200)
                        igst = 0
                    else:  # Inter-state
                        cgst = 0
                        sgst = 0
                        igst = taxable_value * (product.gst_rate / 100)
                else:
                    cgst = sgst = igst = 0
                
                invoice_item = InvoiceItem(
                    invoice_id=invoice.id,
                    product_id=product.id,
                    description=product.description,
                    hsn_code=product.hsn,
                    qty=qty,
                    rate=rate,
                    taxable_value=taxable_value,
                    gst_rate=product.gst_rate,
                    cgst=cgst,
                    sgst=sgst,
                    igst=igst,
                    amount=taxable_value + cgst + sgst + igst
                )
                db.add(invoice_item)
                
                total_taxable += taxable_value
                total_cgst += cgst
                total_sgst += sgst
                total_igst += igst
            
            # Update invoice totals
            invoice.taxable_value = total_taxable
            invoice.cgst = total_cgst
            invoice.sgst = total_sgst
            invoice.igst = total_igst
            invoice.grand_total = total_taxable + total_cgst + total_sgst + total_igst
        
        print("✅ Invoices created")
        
        # 7. Create Payments
        print("💰 Creating payments...")
        payments = [
            {
                "date": date(2024, 1, 10),
                "amount": 50000.00,
                "payment_method": "Bank Transfer",
                "reference_no": "BT001"
            },
            {
                "date": date(2024, 1, 20),
                "amount": 75000.00,
                "payment_method": "Cheque",
                "reference_no": "CH001"
            }
        ]
        
        for payment_data in payments:
            payment = Payment(
                date=payment_data["date"],
                amount=payment_data["amount"],
                payment_method=payment_data["payment_method"],
                reference_no=payment_data["reference_no"],
                description=f"Payment for {payment_data['payment_method']}",
                category="Sales"
            )
            db.add(payment)
        
        print("✅ Payments created")
        
        # 8. Create Expenses
        print("💸 Creating expenses...")
        expenses = [
            {
                "date": date(2024, 1, 7),
                "amount": 5000.00,
                "category": "Office Supplies",
                "description": "Office stationery and supplies"
            },
            {
                "date": date(2024, 1, 14),
                "amount": 15000.00,
                "category": "Rent",
                "description": "Office rent for January 2024"
            },
            {
                "date": date(2024, 1, 21),
                "amount": 8000.00,
                "category": "Utilities",
                "description": "Electricity and internet bills"
            }
        ]
        
        for expense_data in expenses:
            expense = Expense(
                date=expense_data["date"],
                amount=expense_data["amount"],
                category=expense_data["category"],
                description=expense_data["description"]
            )
            db.add(expense)
        
        print("✅ Expenses created")
        
        # Commit all changes
        db.commit()
        print("✅ All test data committed successfully!")
        
        # Print summary
        print("\n📊 Test Data Summary:")
        print("=====================")
        print(f"👤 Users: {db.query(User).count()}")
        print(f"👥 Parties: {db.query(Party).count()}")
        print(f"📦 Products: {db.query(Product).count()}")
        print(f"🛒 Purchases: {db.query(Purchase).count()}")
        print(f"🧾 Invoices: {db.query(Invoice).count()}")
        print(f"💰 Payments: {db.query(Payment).count()}")
        print(f"💸 Expenses: {db.query(Expense).count()}")
        
        print("\n🔑 Test Credentials:")
        print("===================")
        print("Username: admin")
        print("Password: admin123")
        print("Username: testuser")
        print("Password: test123")
        
        print("\n🌐 Access URLs:")
        print("===============")
        print("Frontend: http://localhost:5173")
        print("Backend API: http://localhost:8000")
        print("API Docs: http://localhost:8000/docs")
        print("MailHog: http://localhost:8025")
        
        print("\n✅ Test data seeding completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating test data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_test_data()
