#!/usr/bin/env bash
set -euo pipefail

# Seed comprehensive test data using the backend container
# This script ensures the dev stack is up, waits for health, then executes
# scripts/seed_test_data.py inside the backend container via stdin.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/deployment/docker/docker-compose.dev.yml"

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[1;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[seed]${NC} $*"; }
success() { echo -e "${GREEN}[ok]${NC} $*"; }
fail() { echo -e "${RED}[err]${NC} $*"; }

log "Starting dev stack (if not already running)..."
docker compose -f "$COMPOSE_FILE" up -d >/dev/null

log "Waiting for backend health..."
retries=30
until curl -fsS http://localhost:8000/health >/dev/null 2>&1; do
  ((retries-=1)) || { fail "Backend did not become healthy in time"; exit 1; }
  sleep 1
done
success "Backend is healthy"

log "Seeding test data via backend container..."
# Execute inline Python that imports from /app inside the container
if docker compose -f "$COMPOSE_FILE" exec -T backend python - <<'PY'
import sys
sys.path.append('/app')
from datetime import date, timedelta
import random
from app.db import SessionLocal
from app.models import (
    User, Role, CompanySettings, Party, Product, Invoice, InvoiceItem,
    Purchase, PurchaseItem, Payment, Expense
)
from app.auth import pwd_context

def create_test_data():
    db = SessionLocal()
    try:
        print("\U0001F331 Starting test data seeding...")
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

        admin_role = Role(name="admin")
        db.add(admin_role)
        db.flush()

        db.add_all([
            User(username="admin", password_hash=pwd_context.hash("admin123"), role_id=admin_role.id),
            User(username="testuser", password_hash=pwd_context.hash("test123"), role_id=admin_role.id),
        ])
        db.flush()

        customers = [
            {"name": "ABC Electronics Ltd", "gstin": "27AABCA1234A1Z5", "gst_enabled": True, "gst_registration_status": "GST registered", "contact_person": "John Doe", "contact_number": "9876543210", "email": "john@abcelectronics.com", "billing_address_line1": "123 Tech Park", "billing_city": "Mumbai", "billing_state": "Maharashtra", "billing_pincode": "400001"},
            {"name": "XYZ Manufacturing Co", "gstin": "29BABCA5678B2Z6", "gst_enabled": True, "gst_registration_status": "GST registered", "contact_person": "Jane Smith", "contact_number": "9876543211", "email": "jane@xyzmanufacturing.com", "billing_address_line1": "456 Industrial Area", "billing_city": "Bangalore", "billing_state": "Karnataka", "billing_pincode": "560001"},
            {"name": "Local Retail Store", "gstin": None, "gst_enabled": False, "gst_registration_status": "GST not registered", "contact_person": "Bob Wilson", "contact_number": "9876543212", "email": "bob@localstore.com", "billing_address_line1": "789 Main Street", "billing_city": "Pune", "billing_state": "Maharashtra", "billing_pincode": "411001"},
        ]

        vendors = [
            {"name": "Supplier Corp Ltd", "gstin": "27AABCA9999C3Z7", "gst_enabled": True, "gst_registration_status": "GST registered", "contact_person": "Alice Johnson", "contact_number": "9876543213", "email": "alice@suppliercorp.com", "billing_address_line1": "321 Supply Chain", "billing_city": "Mumbai", "billing_state": "Maharashtra", "billing_pincode": "400002"},
            {"name": "Raw Materials Inc", "gstin": "33AABCA8888D4Z8", "gst_enabled": True, "gst_registration_status": "GST registered", "contact_person": "Charlie Brown", "contact_number": "9876543214", "email": "charlie@rawmaterials.com", "billing_address_line1": "654 Material Zone", "billing_city": "Chennai", "billing_state": "Tamil Nadu", "billing_pincode": "600001"},
        ]

        customer_parties, vendor_parties = [], []
        for c in customers:
            p = Party(type="customer", **c); db.add(p); customer_parties.append(p)
        for v in vendors:
            p = Party(type="vendor", **v); db.add(p); vendor_parties.append(p)
        db.flush()

        products_data = [
            {"name": "Laptop Computer", "description": "High-performance laptop with latest specs", "hsn": "84713000", "gst_rate": 18.0, "sales_price": 45000.00, "purchase_price": 40000.00, "unit": "PCS", "stock": 25},
            {"name": "Mobile Phone", "description": "Smartphone with advanced features", "hsn": "85171200", "gst_rate": 18.0, "sales_price": 25000.00, "purchase_price": 22000.00, "unit": "PCS", "stock": 50},
            {"name": "Wireless Headphones", "description": "Bluetooth wireless headphones", "hsn": "85183000", "gst_rate": 18.0, "sales_price": 5000.00, "purchase_price": 4000.00, "unit": "PCS", "stock": 75},
            {"name": "USB Cable", "description": "High-speed USB-C cable", "hsn": "85444900", "gst_rate": 18.0, "sales_price": 500.00, "purchase_price": 300.00, "unit": "PCS", "stock": 200},
            {"name": "Office Chair", "description": "Ergonomic office chair", "hsn": "94013000", "gst_rate": 18.0, "sales_price": 8000.00, "purchase_price": 6000.00, "unit": "PCS", "stock": 15},
        ]
        products = []
        for pd in products_data:
            pr = Product(**pd); db.add(pr); products.append(pr)
        db.flush()

        purchase_dates = [date(2024, 1, 5), date(2024, 1, 12), date(2024, 1, 18), date(2024, 1, 25)]
        for i, purchase_date in enumerate(purchase_dates):
            vendor = vendor_parties[i % len(vendor_parties)]
            purchase = Purchase(
                vendor_id=vendor.id,
                supplier_id=vendor.id,
                purchase_no=f"PUR-{purchase_date.strftime('%Y%m%d')}-{i+1:03d}",
                date=purchase_date,
                due_date=purchase_date + timedelta(days=30),
                place_of_supply=vendor.billing_state,
                place_of_supply_state_code=getattr(vendor, 'billing_state_code', '27'),
                bill_from_address=vendor.billing_address_line1,
                ship_from_address=vendor.billing_address_line1,
                taxable_value=0, cgst=0, sgst=0, igst=0, grand_total=0,
            )
            db.add(purchase); db.flush()
            total_taxable = total_cgst = total_sgst = total_igst = 0
            for product in products[:3]:
                qty = random.randint(5, 20)
                rate = float(product.purchase_price)
                taxable_value = qty * rate
                if vendor.gst_enabled:
                    if vendor.billing_state == "Maharashtra":
                        cgst = taxable_value * (product.gst_rate / 200)
                        sgst = taxable_value * (product.gst_rate / 200)
                        igst = 0
                    else:
                        cgst = sgst = 0
                        igst = taxable_value * (product.gst_rate / 100)
                else:
                    cgst = sgst = igst = 0
                db.add(PurchaseItem(
                    purchase_id=purchase.id, product_id=product.id, description=product.description,
                    hsn_code=product.hsn, qty=qty, rate=rate, taxable_value=taxable_value,
                    gst_rate=product.gst_rate, cgst=cgst, sgst=sgst, igst=igst, amount=taxable_value + cgst + sgst + igst
                ))
                total_taxable += taxable_value; total_cgst += cgst; total_sgst += sgst; total_igst += igst
            purchase.taxable_value = total_taxable; purchase.cgst = total_cgst; purchase.sgst = total_sgst; purchase.igst = total_igst
            purchase.grand_total = total_taxable + total_cgst + total_sgst + total_igst

        invoice_dates = [date(2024, 1, 8), date(2024, 1, 15), date(2024, 1, 22), date(2024, 1, 29)]
        for i, invoice_date in enumerate(invoice_dates):
            customer = customer_parties[i % len(customer_parties)]
            invoice = Invoice(
                customer_id=customer.id,
                supplier_id=customer.id,
                invoice_no=f"INV-{invoice_date.strftime('%Y%m%d')}-{i+1:03d}",
                date=invoice_date,
                due_date=invoice_date + timedelta(days=30),
                place_of_supply=customer.billing_state,
                place_of_supply_state_code=getattr(customer, 'billing_state_code', '27'),
                bill_to_address=customer.billing_address_line1,
                ship_to_address=customer.billing_address_line1,
                taxable_value=0, cgst=0, sgst=0, igst=0, grand_total=0,
            )
            db.add(invoice); db.flush()
            total_taxable = total_cgst = total_sgst = total_igst = 0
            for product in products[:3]:
                qty = random.randint(1, 10)
                rate = float(product.sales_price)
                taxable_value = qty * rate
                if customer.gst_enabled:
                    if customer.billing_state == "Maharashtra":
                        cgst = taxable_value * (product.gst_rate / 200); sgst = taxable_value * (product.gst_rate / 200); igst = 0
                    else:
                        cgst = sgst = 0; igst = taxable_value * (product.gst_rate / 100)
                else:
                    cgst = sgst = igst = 0
                db.add(InvoiceItem(
                    invoice_id=invoice.id, product_id=product.id, description=product.description,
                    hsn_code=product.hsn, qty=qty, rate=rate, taxable_value=taxable_value,
                    gst_rate=product.gst_rate, cgst=cgst, sgst=sgst, igst=igst, amount=taxable_value + cgst + sgst + igst
                ))
                total_taxable += taxable_value; total_cgst += cgst; total_sgst += sgst; total_igst += igst
            invoice.taxable_value = total_taxable; invoice.cgst = total_cgst; invoice.sgst = total_sgst; invoice.igst = total_igst
            invoice.grand_total = total_taxable + total_cgst + total_sgst + total_igst

        for p in [
            {"date": date(2024, 1, 10), "amount": 50000.00, "payment_method": "Bank Transfer", "reference_no": "BT001"},
            {"date": date(2024, 1, 20), "amount": 75000.00, "payment_method": "Cheque", "reference_no": "CH001"},
        ]:
            db.add(Payment(date=p["date"], amount=p["amount"], payment_method=p["payment_method"], reference_no=p["reference_no"], description=f"Payment for {p['payment_method']}", category="Sales"))

        for e in [
            {"date": date(2024, 1, 7), "amount": 5000.00, "category": "Office Supplies", "description": "Office stationery and supplies"},
            {"date": date(2024, 1, 14), "amount": 15000.00, "category": "Rent", "description": "Office rent for January 2024"},
            {"date": date(2024, 1, 21), "amount": 8000.00, "category": "Utilities", "description": "Electricity and internet bills"},
        ]:
            db.add(Expense(**e))

        db.commit()
        print("\n\U0001F197 Seeding complete. Credentials: admin/admin123, testuser/test123")
    except Exception as e:
        db.rollback(); print(f"Seeding error: {e}"); raise
    finally:
        db.close()

if __name__ == '__main__':
    create_test_data()
PY
then
  success "Seeding completed"
else
  fail "Seeding failed"
  exit 1
fi
