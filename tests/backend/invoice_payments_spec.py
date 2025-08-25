import os
from datetime import datetime

from fastapi.testclient import TestClient
import pytest

from backend.app.models import Invoice, Party
from backend.app.db import Base

# Note: The app is constructed via tests/conftest.py fixtures.
# Endpoints are served under prefix /api (see backend/app/main.py include_router)

AUTH_HEADERS = {"Authorization": "Bearer test-token"}


def create_party(db, name: str, type_: str = "Customer") -> Party:
    # Party.type is a read-only property; set flags instead
    is_customer = type_.lower() == "customer"
    is_vendor = type_.lower() in ("vendor", "supplier")
    p = Party(
        name=name,
        is_active=True,
        is_customer=is_customer,
        is_vendor=is_vendor,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def create_invoice(db, customer_id: int, supplier_id: int, grand_total: float) -> Invoice:
    now = datetime.utcnow()
    inv = Invoice(
        customer_id=customer_id,
        supplier_id=supplier_id,
        invoice_no=f"TEST-{int(now.timestamp())}",
        date=now,
        due_date=now,
        terms="Due on Receipt",
        # GST compliance minimal fields
        place_of_supply="Maharashtra",
        place_of_supply_state_code="27",
        reverse_charge=False,
        export_supply=False,
        # Addresses
        bill_to_address="Test Bill To",
        ship_to_address="Test Ship To",
        # Amounts
        taxable_value=grand_total,
        total_discount=0,
        cgst=0,
        sgst=0,
        igst=0,
        utgst=0,
        cess=0,
        round_off=0,
        grand_total=grand_total,
        paid_amount=0,
        balance_amount=grand_total,
        status="Sent",
        currency="INR",
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@pytest.mark.usefixtures("setup_db_schema")
def test_invoice_list_and_payment_flow(client: TestClient, db):
    # Arrange: create customer, supplier, and an invoice
    cust = create_party(db, "Acme Corp", type_="Customer")
    supp = create_party(db, "My Company", type_="Supplier")
    inv = create_invoice(db, cust.id, supp.id, grand_total=1000.0)

    # Act: fetch invoices list
    r1 = client.get("/api/invoices", headers=AUTH_HEADERS)
    assert r1.status_code == 200, r1.text
    data1 = r1.json()
    inv_row = next((x for x in data1["invoices"] if x["id"] == inv.id), None)
    assert inv_row is not None
    assert inv_row["grand_total"] == pytest.approx(1000.0)
    assert inv_row["paid_amount"] == pytest.approx(0.0)
    assert inv_row["balance_amount"] == pytest.approx(1000.0)

    # Act: post a payment of 250
    payload = {
        "payment_date": datetime.utcnow().date().isoformat(),
        "payment_amount": 250.0,
        "payment_method": "Cash",
        "account_head": "Invoice Payments",
        "reference_number": "T-001",
        "notes": "Test payment",
    }
    r2 = client.post(f"/api/invoices/{inv.id}/payments", json=payload, headers=AUTH_HEADERS)
    assert r2.status_code == 201, r2.text

    # Assert: invoice list reflects updated amounts
    r3 = client.get("/api/invoices", headers=AUTH_HEADERS)
    assert r3.status_code == 200, r3.text
    data3 = r3.json()
    inv_row2 = next((x for x in data3["invoices"] if x["id"] == inv.id), None)
    assert inv_row2 is not None
    assert inv_row2["paid_amount"] == pytest.approx(250.0)
    assert inv_row2["balance_amount"] == pytest.approx(750.0)
