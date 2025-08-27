#!/usr/bin/env python3
"""
Seed minimal, targeted data to verify Dashboard widgets.
- One overdue customer invoice with partial payment (this month)
- One overdue vendor purchase (unpaid)
- Three products: normal, low, out of stock
- A few payments and an expense within this month
- Taxed invoice item(s) for GST breakdown

Safe to run repeatedly: checks for existing key records by name/number and updates/creates accordingly.
"""
import os
import sys
from datetime import datetime, timedelta, date
from decimal import Decimal

# Ensure backend app is importable when running from repo root
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
sys.path.append(BASE_DIR)

from app.db import LegacySessionLocal
from app.models import (
    Role,
    User,
    CompanySettings,
    Party,
    Product,
    Invoice,
    InvoiceItem,
    Payment,
    Purchase,
    PurchaseItem,
    PurchasePayment,
    Expense,
)
from app.auth import pwd_context


def get_or_create(session, model, defaults=None, **kwargs):
    instance = session.query(model).filter_by(**kwargs).first()
    if instance:
        return instance, False
    params = {**(defaults or {}), **kwargs}
    instance = model(**params)
    session.add(instance)
    session.flush()
    return instance, True


def in_current_month(dt: datetime) -> bool:
    now = datetime.now()
    return dt.year == now.year and dt.month == now.month


def seed():
    db = LegacySessionLocal()
    try:
        print("🌱 Seeding minimal dashboard data...")
        now = datetime.now()
        start_of_month = datetime(now.year, now.month, 1)

        # 1) Company settings
        company, _ = get_or_create(
            db,
            CompanySettings,
            name="Test Company Pvt Ltd",
            gstin="27AAPFU0939F1Z5",
            state="Maharashtra",
            state_code="27",
            invoice_series="INV",
            gst_enabled_by_default=True,
            require_gstin_validation=True,
        )

        # 2) Role and admin user
        admin_role, _ = get_or_create(db, Role, name="admin")
        admin_user, created_user = get_or_create(
            db,
            User,
            username="admin",
            defaults={
                "password_hash": pwd_context.hash("admin123"),
                "role_id": admin_role.id,
            },
        )
        if not created_user and not admin_user.password_hash:
            admin_user.password_hash = pwd_context.hash("admin123")

        # 3) Parties
        customer, _ = get_or_create(
            db,
            Party,
            name="Dashboard Test Customer",
            defaults={
                "gstin": "27ABCDE1234F1Z5",
                "gst_registration_status": "GST registered",
                "contact_person": "John Doe",
                "contact_number": "9999999999",
                "email": "customer@example.com",
                "billing_address_line1": "123 Street",
                "billing_city": "Mumbai",
                "billing_state": "Maharashtra",
                "billing_country": "India",
                "billing_pincode": "400001",
                "gst_enabled": True,
                "is_customer": True,
                "is_vendor": False,
            },
        )

        vendor, _ = get_or_create(
            db,
            Party,
            name="Dashboard Test Vendor",
            defaults={
                "gstin": "27ABCDE5678F2Z6",
                "gst_registration_status": "GST registered",
                "contact_person": "Jane Smith",
                "contact_number": "8888888888",
                "email": "vendor@example.com",
                "billing_address_line1": "456 Avenue",
                "billing_city": "Mumbai",
                "billing_state": "Maharashtra",
                "billing_country": "India",
                "billing_pincode": "400002",
                "gst_enabled": True,
                "is_customer": False,
                "is_vendor": True,
            },
        )

        # 4) Products: normal, low, out-of-stock
        product_normal, _ = get_or_create(
            db,
            Product,
            name="Widget Normal",
            defaults={
                "description": "Normal stock item",
                "hsn": "84713000",
                "gst_rate": 18.0,
                "sales_price": Decimal("1000.00"),
                "purchase_price": Decimal("800.00"),
                "unit": "PCS",
                "stock": 30,
                "item_type": "tradable",
            },
        )

        product_low, _ = get_or_create(
            db,
            Product,
            name="Widget Low",
            defaults={
                "description": "Low stock item",
                "hsn": "84713000",
                "gst_rate": 18.0,
                "sales_price": Decimal("500.00"),
                "purchase_price": Decimal("400.00"),
                "unit": "PCS",
                "stock": 3,
                "item_type": "tradable",
            },
        )

        product_oos, _ = get_or_create(
            db,
            Product,
            name="Widget OOS",
            defaults={
                "description": "Out of stock item",
                "hsn": "84713000",
                "gst_rate": 18.0,
                "sales_price": Decimal("750.00"),
                "purchase_price": Decimal("600.00"),
                "unit": "PCS",
                "stock": 0,
                "item_type": "tradable",
            },
        )

        # 5) Overdue invoice with partial payment (dated this month, due in past)
        # Keep invoice_no <= 16 chars (models.Invoice.invoice_no is String(16))
        # Example: INV-YYMM-001 => max 12 chars
        inv_number = f"INV-{now:%y%m}-001"
        invoice, created_inv = get_or_create(
            db,
            Invoice,
            invoice_no=inv_number,
            defaults={
                "customer_id": customer.id,
                "supplier_id": vendor.id,
                "date": start_of_month + timedelta(days=1),
                "due_date": now - timedelta(days=5),  # overdue
                "terms": "Due on Receipt",
                "place_of_supply": "Maharashtra",
                "place_of_supply_state_code": "27",
                "bill_to_address": customer.billing_address_line1 or "123 Street",
                "ship_to_address": customer.billing_address_line1 or "123 Street",
                "taxable_value": Decimal("10000.00"),
                "cgst": Decimal("900.00"),
                "sgst": Decimal("900.00"),
                "igst": Decimal("0.00"),
                "utgst": Decimal("0.00"),
                "cess": Decimal("0.00"),
                "round_off": Decimal("0.00"),
                "grand_total": Decimal("11800.00"),
                "paid_amount": Decimal("3000.00"),
                "balance_amount": Decimal("8800.00"),
                "status": "Overdue",
            },
        )

        if created_inv:
            # One 18% line
            item = InvoiceItem(
                invoice_id=invoice.id,
                product_id=product_normal.id,
                description="Widget Normal",
                qty=10,
                rate=Decimal("1000.00"),
                discount=Decimal("0.00"),
                discount_type="Percentage",
                taxable_value=Decimal("10000.00"),
                gst_rate=18.0,
                cgst=Decimal("900.00"),
                sgst=Decimal("900.00"),
                igst=Decimal("0.00"),
                utgst=Decimal("0.00"),
                cess=Decimal("0.00"),
                amount=Decimal("11800.00"),
                hsn_code="84713000",
            )
            db.add(item)
            db.flush()

            # Partial payment this month
            pay = Payment(
                invoice_id=invoice.id,
                amount=Decimal("3000.00"),
                payment_date=date.today(),
                payment_method="UPI",
                reference_number="UPI-REF-001",
                notes="Partial payment",
            )
            db.add(pay)

        # 6) Overdue vendor purchase (unpaid)
        # Keep purchase_no <= 16 chars as well
        po_number = f"PO-{now:%y%m}-001"
        purchase, created_po = get_or_create(
            db,
            Purchase,
            purchase_no=po_number,
            defaults={
                "vendor_id": vendor.id,
                "date": start_of_month + timedelta(days=2),
                "due_date": now - timedelta(days=3),  # overdue
                "terms": "Net 7",
                "place_of_supply": "Maharashtra",
                "place_of_supply_state_code": "27",
                "bill_from_address": vendor.billing_address_line1 or "456 Avenue",
                "ship_from_address": vendor.billing_address_line1 or "456 Avenue",
                "taxable_value": Decimal("5000.00"),
                "cgst": Decimal("450.00"),
                "sgst": Decimal("450.00"),
                "igst": Decimal("0.00"),
                "utgst": Decimal("0.00"),
                "cess": Decimal("0.00"),
                "round_off": Decimal("0.00"),
                "grand_total": Decimal("5900.00"),
                "paid_amount": Decimal("0.00"),
                "balance_amount": Decimal("5900.00"),
                "status": "Draft",
                "total_discount": Decimal("0.00"),
                "notes": "Overdue vendor bill - unpaid",
            },
        )
        if created_po:
            poi = PurchaseItem(
                purchase_id=purchase.id,
                product_id=product_low.id,
                description="Widget Low",
                qty=10,
                expected_rate=Decimal("500.00"),
                discount=Decimal("0.00"),
                discount_type="Percentage",
                gst_rate=18.0,
                amount=Decimal("5900.00"),
                hsn_code="84713000",
            )
            db.add(poi)
            db.flush()

        # 7) Additional outflow: expense this month
        exp, created_exp = get_or_create(
            db,
            Expense,
            description="Dashboard Test Expense",
            defaults={
                "expense_date": start_of_month + timedelta(days=3),
                "expense_type": "Office Supplies",
                "category": "Indirect/Operating",
                "subcategory": "General",
                "amount": Decimal("1000.00"),
                "payment_method": "Cash",
                "account_head": "Cash",
                "reference_number": "EXP-REF-001",
                "gst_amount": Decimal("180.00"),
                "gst_rate": 18.0,
                "total_amount": Decimal("1180.00"),
                "notes": "Seeded expense",
            },
        )

        db.commit()
        print("✅ Minimal dashboard data seeded.")

    except Exception as e:
        print(f"❌ Error seeding minimal dashboard data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
