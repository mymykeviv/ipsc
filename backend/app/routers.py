from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
import re

from .auth import authenticate_user, create_access_token, get_current_user, require_role
from .db import get_db
from .models import Product, User, Party, CompanySettings, Invoice, InvoiceItem, StockLedgerEntry, Purchase, PurchaseItem, Payment
from .gst import money, split_gst
from decimal import Decimal
from .emailer import send_email


api = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


@api.post("/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user.username)
    return {"access_token": token, "token_type": "bearer"}


class ProductOut(BaseModel):
    id: int
    name: str
    description: str | None
    item_type: str
    sales_price: float
    purchase_price: float | None
    stock: int
    sku: str | None
    unit: str
    supplier: str | None
    category: str | None
    notes: str | None
    hsn: str | None
    gst_rate: float
    is_active: bool

    class Config:
        from_attributes = True


@api.get("/products", response_model=list[ProductOut])
def list_products(_: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id).all()


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    item_type: str = "tradable"
    sales_price: float
    purchase_price: float | None = None
    stock: int = 0
    sku: str | None = None
    unit: str = "Pcs"
    supplier: str | None = None
    category: str | None = None
    notes: str | None = None
    hsn: str | None = None
    gst_rate: float


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    item_type: str | None = None
    sales_price: float | None = None
    purchase_price: float | None = None
    stock: int | None = None
    sku: str | None = None
    unit: str | None = None
    supplier: str | None = None
    category: str | None = None
    notes: str | None = None
    hsn: str | None = None
    gst_rate: float | None = None
    is_active: bool | None = None


@api.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, _: User = Depends(require_role("Admin")), db: Session = Depends(get_db)):
    try:
        # Validation
        if not payload.name or len(payload.name.strip()) == 0:
            raise HTTPException(status_code=400, detail="Name is required")
        if len(payload.name) > 100:
            raise HTTPException(status_code=400, detail="Name must be 100 characters or less")
        if not re.match(r'^[a-zA-Z0-9\s]+$', payload.name):
            raise HTTPException(status_code=400, detail="Name must be alphanumeric with spaces only")
        
        if payload.description and len(payload.description) > 200:
            raise HTTPException(status_code=400, detail="Description must be 200 characters or less")
        
        if payload.sales_price < 0 or payload.sales_price > 999999.99:
            raise HTTPException(status_code=400, detail="Sales price must be between 0 and 999999.99")
        
        if payload.purchase_price is not None:
            if payload.purchase_price < 0 or payload.purchase_price > 999999.99:
                raise HTTPException(status_code=400, detail="Purchase price must be between 0 and 999999.99")
        
        if payload.stock < 0 or payload.stock > 999999:
            raise HTTPException(status_code=400, detail="Stock must be between 0 and 999999")
        
        if payload.sku and len(payload.sku) > 50:
            raise HTTPException(status_code=400, detail="SKU must be 50 characters or less")
        if payload.sku and not re.match(r'^[a-zA-Z0-9\s]+$', payload.sku):
            raise HTTPException(status_code=400, detail="SKU must be alphanumeric with spaces only")
        
        if payload.supplier and len(payload.supplier) > 100:
            raise HTTPException(status_code=400, detail="Supplier must be 100 characters or less")
        
        if payload.category and len(payload.category) > 100:
            raise HTTPException(status_code=400, detail="Category must be 100 characters or less")
        
        # Item type validation
        if payload.item_type not in ["tradable", "consumable", "manufactured"]:
            raise HTTPException(status_code=400, detail="Item type must be tradable, consumable, or manufactured")
        
        # Check if SKU already exists (only if SKU is provided)
        if payload.sku:
            exists = db.query(Product).filter(Product.sku == payload.sku).first()
            if exists:
                raise HTTPException(status_code=400, detail="SKU already exists")
        
        product = Product(**payload.model_dump())
        db.add(product)
        db.commit()
        db.refresh(product)
        return product
    except Exception as e:
        db.rollback()
        # Check for specific database constraint violations
        if "unique constraint" in str(e).lower() and "sku" in str(e).lower():
            raise HTTPException(status_code=400, detail="SKU already exists")
        elif "not null constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Required fields cannot be empty")
        elif "check constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Invalid data provided")
        else:
            # Log the actual error for debugging
            print(f"Database error: {e}")
            raise HTTPException(status_code=500, detail="Database error occurred")


@api.put("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate, _: User = Depends(require_role("Admin")), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@api.patch("/products/{product_id}/toggle", response_model=ProductOut)
def toggle_product(product_id: int, _: User = Depends(require_role("Admin")), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Not found")
    product.is_active = not product.is_active
    db.commit()
    db.refresh(product)
    return product


class StockAdjustmentIn(BaseModel):
    quantity: float
    purchase_price: float
    sales_price: float
    date_of_receipt: str  # ISO date string
    reference_bill_number: str | None = None
    notes: str | None = None


@api.post("/products/{product_id}/stock", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def add_stock_to_product(product_id: int, payload: StockAdjustmentIn, _: User = Depends(require_role("Admin")), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Add stock to product
    product.stock += payload.quantity
    
    # Update prices if provided
    if payload.purchase_price > 0:
        product.purchase_price = payload.purchase_price
    if payload.sales_price > 0:
        product.sales_price = payload.sales_price
    
    # Create stock ledger entry
    from datetime import datetime
    stock_entry = StockLedgerEntry(
        product_id=product_id,
        qty=payload.quantity,
        entry_type="in",
        ref_type="stock_adjustment",
        ref_id=0
    )
    db.add(stock_entry)
    
    db.commit()
    db.refresh(product)
    return product
class InvoiceItemIn(BaseModel):
    product_id: int
    qty: float
    rate: float


class InvoiceOut(BaseModel):
    id: int
    customer_id: int
    invoice_no: str
    place_of_supply: str
    taxable_value: float
    cgst: float
    sgst: float
    igst: float
    grand_total: float
    class Config:
        from_attributes = True


class InvoiceCreate(BaseModel):
    customer_id: int
    items: list[InvoiceItemIn]


def _next_invoice_no(db: Session) -> str:
    settings = db.query(CompanySettings).first()
    prefix = settings.invoice_series if settings else "INV-"
    last = db.query(Invoice).order_by(Invoice.id.desc()).first()
    seq = (last.id + 1) if last else 1
    return f"{prefix}{seq:05d}"


@api.post('/invoices', response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def create_invoice(payload: InvoiceCreate, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = db.query(CompanySettings).first()
    customer = db.query(Party).filter(Party.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=400, detail='Invalid customer')
    invoice_no = _next_invoice_no(db)
    intra = company and customer and customer.state == company.state

    taxable_total = money(0)
    cgst_total = money(0)
    sgst_total = money(0)
    igst_total = money(0)

    inv = Invoice(
        customer_id=customer.id,
        invoice_no=invoice_no,
        place_of_supply=customer.state,
        taxable_value=money(0),
        cgst=money(0), sgst=money(0), igst=money(0),
        grand_total=money(0)
    )
    db.add(inv)
    db.flush()

    for it in payload.items:
        prod = db.query(Product).filter(Product.id == it.product_id).first()
        if not prod:
            raise HTTPException(status_code=400, detail='Invalid product')
        taxable = money(Decimal(it.qty) * Decimal(it.rate))
        cgst, sgst, igst = split_gst(taxable, prod.gst_rate, bool(intra))
        item = InvoiceItem(
            invoice_id=inv.id,
            product_id=prod.id,
            description=prod.name,
            qty=it.qty,
            rate=money(it.rate),
            taxable_value=taxable,
            cgst=cgst, sgst=sgst, igst=igst
        )
        db.add(item)
        # stock out for sale
        db.add(StockLedgerEntry(product_id=prod.id, qty=it.qty, entry_type='out', ref_type='invoice', ref_id=inv.id))
        taxable_total += taxable
        cgst_total += cgst
        sgst_total += sgst
        igst_total += igst

    inv.taxable_value = taxable_total
    inv.cgst = cgst_total
    inv.sgst = sgst_total
    inv.igst = igst_total
    inv.grand_total = money(taxable_total + cgst_total + sgst_total + igst_total)
    db.commit()
    db.refresh(inv)
    return inv


from io import BytesIO
from reportlab.pdfgen import canvas


@api.get('/invoices/{invoice_id}/pdf')
def invoice_pdf(invoice_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail='Not found')
    buf = BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(50, 800, f"Invoice: {inv.invoice_no}")
    c.drawString(50, 780, f"Taxable: {inv.taxable_value}  Total: {inv.grand_total}")
    c.showPage()
    c.save()
    pdf = buf.getvalue()
    return Response(content=pdf, media_type='application/pdf')


class EmailRequest(BaseModel):
    to: str


@api.post('/invoices/{invoice_id}/email', status_code=202)
def email_invoice(invoice_id: int, payload: EmailRequest, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail='Invoice not found')
    ok = send_email(payload.to, f"Invoice {inv.invoice_no}", f"Total: {inv.grand_total}")
    return {"status": "queued" if ok else "disabled"}


class InvoiceListOut(BaseModel):
    id: int
    invoice_no: str
    customer_id: int
    grand_total: float
    class Config:
        from_attributes = True


@api.get('/invoices', response_model=list[InvoiceListOut])
def list_invoices(_: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Invoice).order_by(Invoice.id.desc()).all()


from fastapi import Query


@api.get('/reports/gst-summary')
def gst_summary(from_: str = Query(alias='from'), to: str = Query(alias='to'), _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # naive impl: aggregate all invoices between dates
    from sqlalchemy import func
    q = db.query(Invoice).filter(func.date(Invoice.date) >= from_, func.date(Invoice.date) <= to)
    invoices = q.all()
    taxable = sum([float(i.taxable_value) for i in invoices], 0.0)
    cgst = sum([float(i.cgst) for i in invoices], 0.0)
    sgst = sum([float(i.sgst) for i in invoices], 0.0)
    igst = sum([float(i.igst) for i in invoices], 0.0)
    grand = sum([float(i.grand_total) for i in invoices], 0.0)
    # rate-wise breakup using items
    from sqlalchemy import select
    from .models import InvoiceItem, Product
    rows = db.execute(
        select(Product.gst_rate, func.sum(InvoiceItem.taxable_value))
        .join(Product, Product.id == InvoiceItem.product_id)
        .join(Invoice, Invoice.id == InvoiceItem.invoice_id)
        .filter(func.date(Invoice.date) >= from_, func.date(Invoice.date) <= to)
        .group_by(Product.gst_rate)
    ).all()
    rate_breakup = [{"rate": float(r[0]), "taxable_value": float(r[1])} for r in rows]
    return {
        "taxable_value": taxable,
        "cgst": cgst,
        "sgst": sgst,
        "igst": igst,
        "grand_total": grand,
        "rate_breakup": rate_breakup,
    }


@api.get('/reports/gst-summary.csv')
def gst_summary_csv(from_: str = Query(alias='from'), to: str = Query(alias='to'), _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = gst_summary(from_, to, _, db)
    import csv
    from io import StringIO
    buf = StringIO()
    w = csv.writer(buf)
    w.writerow(["taxable_value", "cgst", "sgst", "igst", "grand_total"])
    w.writerow([data['taxable_value'], data['cgst'], data['sgst'], data['igst'], data['grand_total']])
    w.writerow([])
    w.writerow(["rate", "taxable_value"]) 
    for row in data['rate_breakup']:
        w.writerow([row['rate'], row['taxable_value']])
    return Response(content=buf.getvalue(), media_type='text/csv')


class StockRow(BaseModel):
    product_id: int
    sku: str
    name: str
    onhand: int
    item_type: str
    unit: str


@api.get('/stock/summary', response_model=list[StockRow])
def stock_summary(_: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows: list[StockRow] = []
    products = db.query(Product).order_by(Product.id).all()
    for p in products:
        qty_in = db.query(StockLedgerEntry).filter(StockLedgerEntry.product_id == p.id, StockLedgerEntry.entry_type == 'in').with_entities(func.coalesce(func.sum(StockLedgerEntry.qty), 0)).scalar()
        qty_out = db.query(StockLedgerEntry).filter(StockLedgerEntry.product_id == p.id, StockLedgerEntry.entry_type == 'out').with_entities(func.coalesce(func.sum(StockLedgerEntry.qty), 0)).scalar()
        qty_adj = db.query(StockLedgerEntry).filter(StockLedgerEntry.product_id == p.id, StockLedgerEntry.entry_type == 'adjust').with_entities(func.coalesce(func.sum(StockLedgerEntry.qty), 0)).scalar()
        onhand = int((qty_in or 0) - (qty_out or 0) + (qty_adj or 0))
        rows.append(StockRow(product_id=p.id, sku=p.sku or '', name=p.name, onhand=onhand, item_type=p.item_type, unit=p.unit))
    return rows


class PurchaseItemIn(BaseModel):
    product_id: int
    qty: float
    rate: float


class PurchaseCreate(BaseModel):
    vendor_id: int
    items: list[PurchaseItemIn]


@api.post('/purchases', status_code=201)
def create_purchase(payload: PurchaseCreate, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    vendor = db.query(Party).filter(Party.id == payload.vendor_id, Party.type == 'vendor').first()
    if not vendor:
        raise HTTPException(status_code=400, detail='Invalid vendor')
    total = Decimal('0.00')
    pur = Purchase(vendor_id=vendor.id, taxable_value=Decimal('0.00'), total=Decimal('0.00'))
    db.add(pur)
    db.flush()
    for it in payload.items:
        prod = db.query(Product).filter(Product.id == it.product_id).first()
        if not prod:
            raise HTTPException(status_code=400, detail='Invalid product')
        amount = money(Decimal(it.qty) * Decimal(it.rate))
        db.add(PurchaseItem(purchase_id=pur.id, product_id=prod.id, qty=it.qty, rate=money(it.rate), amount=amount))
        total += amount
        db.add(StockLedgerEntry(product_id=prod.id, qty=it.qty, entry_type='in', ref_type='purchase', ref_id=pur.id))
    pur.taxable_value = total
    pur.total = total
    db.commit()
    return {"id": pur.id}


class PaymentIn(BaseModel):
    amount: float
    method: str
    head: str


@api.post('/invoices/{invoice_id}/payments', status_code=201)
def add_payment(invoice_id: int, payload: PaymentIn, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail='Invoice not found')
    pay = Payment(invoice_id=invoice_id, amount=money(payload.amount), method=payload.method, head=payload.head)
    db.add(pay)
    db.commit()
    return {"id": pay.id}


@api.get('/invoices/{invoice_id}/payments')
def list_payments(invoice_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail='Invoice not found')
    pays = db.query(Payment).filter(Payment.invoice_id == invoice_id).all()
    total_paid = float(sum([p.amount for p in pays], 0))
    outstanding = float(inv.grand_total) - total_paid
    return {"payments": [{"id": p.id, "amount": float(p.amount), "method": p.method, "head": p.head} for p in pays], "total_paid": total_paid, "outstanding": outstanding}


class StockAdjustmentIn(BaseModel):
    product_id: int
    quantity: int
    adjustment_type: str  # "add" or "reduce"
    date_of_adjustment: str  # ISO date string
    reference_bill_number: str | None = None
    supplier: str | None = None
    category: str | None = None
    notes: str | None = None


@api.post('/stock/adjust', status_code=201)
def stock_adjust(payload: StockAdjustmentIn, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # Validation
        if payload.quantity < 0 or payload.quantity > 999999:
            raise HTTPException(status_code=400, detail="Quantity must be between 0 and 999999")
        
        if payload.adjustment_type not in ["add", "reduce"]:
            raise HTTPException(status_code=400, detail="Adjustment type must be 'add' or 'reduce'")
        
        if payload.reference_bill_number and len(payload.reference_bill_number) > 10:
            raise HTTPException(status_code=400, detail="Reference bill number must be 10 characters or less")
        
        if payload.supplier and len(payload.supplier) > 50:
            raise HTTPException(status_code=400, detail="Supplier must be 50 characters or less")
        
        if payload.category and len(payload.category) > 50:
            raise HTTPException(status_code=400, detail="Category must be 50 characters or less")
        
        if payload.notes and len(payload.notes) > 200:
            raise HTTPException(status_code=400, detail="Notes must be 200 characters or less")
        
        prod = db.query(Product).filter(Product.id == payload.product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail='Product not found')
        
        # Calculate the delta based on adjustment type
        delta = payload.quantity if payload.adjustment_type == "add" else -payload.quantity
        
        # Check if reducing stock would result in negative stock
        if payload.adjustment_type == "reduce" and (prod.stock - payload.quantity) < 0:
            raise HTTPException(status_code=400, detail="Cannot reduce stock below 0")
        
        # Update product stock
        prod.stock += delta
        
        # Add stock ledger entry
        db.add(StockLedgerEntry(
            product_id=prod.id, 
            qty=delta, 
            entry_type='adjust', 
            ref_type=payload.adjustment_type, 
            ref_id=0
        ))
        
        db.commit()
        return {"ok": True, "new_stock": prod.stock}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to adjust stock")


class PartyOut(BaseModel):
    id: int
    type: str
    name: str
    contact_person: str | None
    contact_number: str | None
    email: str | None
    gstin: str | None
    gst_registration_status: str
    billing_address_line1: str
    billing_address_line2: str | None
    billing_city: str
    billing_state: str
    billing_country: str
    billing_pincode: str | None
    shipping_address_line1: str | None
    shipping_address_line2: str | None
    shipping_city: str | None
    shipping_state: str | None
    shipping_country: str | None
    shipping_pincode: str | None
    notes: str | None
    is_active: bool

    class Config:
        from_attributes = True


class PartyCreate(BaseModel):
    type: str  # customer|vendor
    name: str
    contact_person: str | None = None
    contact_number: str | None = None
    email: str | None = None
    gstin: str | None = None
    gst_registration_status: str = "GST not registered"
    billing_address_line1: str
    billing_address_line2: str | None = None
    billing_city: str
    billing_state: str
    billing_country: str = "India"
    billing_pincode: str | None = None
    shipping_address_line1: str | None = None
    shipping_address_line2: str | None = None
    shipping_city: str | None = None
    shipping_state: str | None = None
    shipping_country: str | None = None
    shipping_pincode: str | None = None
    notes: str | None = None


class PartyUpdate(BaseModel):
    name: str | None = None
    contact_person: str | None = None
    contact_number: str | None = None
    email: str | None = None
    gstin: str | None = None
    gst_registration_status: str | None = None
    billing_address_line1: str | None = None
    billing_address_line2: str | None = None
    billing_city: str | None = None
    billing_state: str | None = None
    billing_country: str | None = None
    billing_pincode: str | None = None
    shipping_address_line1: str | None = None
    shipping_address_line2: str | None = None
    shipping_city: str | None = None
    shipping_state: str | None = None
    shipping_country: str | None = None
    shipping_pincode: str | None = None
    notes: str | None = None


@api.get('/parties', response_model=list[PartyOut])
def list_parties(
    type: str | None = None,
    search: str | None = None,
    _: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    query = db.query(Party)
    
    if type:
        query = query.filter(Party.type == type)
    
    if search:
        search_filter = (
            Party.name.ilike(f"%{search}%") |
            Party.contact_person.ilike(f"%{search}%") |
            Party.contact_number.ilike(f"%{search}%") |
            Party.email.ilike(f"%{search}%") |
            Party.gstin.ilike(f"%{search}%") |
            Party.gst_registration_status.ilike(f"%{search}%") |
            Party.billing_address_line1.ilike(f"%{search}%") |
            Party.shipping_address_line1.ilike(f"%{search}%") |
            Party.notes.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    return query.filter(Party.is_active == True).order_by(Party.name).all()


@api.get('/parties/customers', response_model=list[PartyOut])
def list_customers(
    search: str | None = None,
    _: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    query = db.query(Party).filter(Party.type == "customer")
    
    if search:
        search_filter = (
            Party.name.ilike(f"%{search}%") |
            Party.contact_person.ilike(f"%{search}%") |
            Party.contact_number.ilike(f"%{search}%") |
            Party.email.ilike(f"%{search}%") |
            Party.gstin.ilike(f"%{search}%") |
            Party.gst_registration_status.ilike(f"%{search}%") |
            Party.billing_address_line1.ilike(f"%{search}%") |
            Party.shipping_address_line1.ilike(f"%{search}%") |
            Party.notes.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    return query.filter(Party.is_active == True).order_by(Party.name).all()


@api.get('/parties/vendors', response_model=list[PartyOut])
def list_vendors(
    search: str | None = None,
    _: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    query = db.query(Party).filter(Party.type == "vendor")
    
    if search:
        search_filter = (
            Party.name.ilike(f"%{search}%") |
            Party.contact_person.ilike(f"%{search}%") |
            Party.contact_number.ilike(f"%{search}%") |
            Party.email.ilike(f"%{search}%") |
            Party.gstin.ilike(f"%{search}%") |
            Party.gst_registration_status.ilike(f"%{search}%") |
            Party.billing_address_line1.ilike(f"%{search}%") |
            Party.shipping_address_line1.ilike(f"%{search}%") |
            Party.notes.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    return query.filter(Party.is_active == True).order_by(Party.name).all()


@api.post('/parties', response_model=PartyOut, status_code=status.HTTP_201_CREATED)
def create_party(payload: PartyCreate, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        party = Party(**payload.model_dump())
        db.add(party)
        db.commit()
        db.refresh(party)
        return party
    except Exception as e:
        db.rollback()
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create party")


@api.put('/parties/{party_id}', response_model=PartyOut)
def update_party(party_id: int, payload: PartyUpdate, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    party = db.query(Party).filter(Party.id == party_id).first()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    
    try:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(party, field, value)
        
        db.commit()
        db.refresh(party)
        return party
    except Exception as e:
        db.rollback()
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update party")


@api.patch('/parties/{party_id}/toggle', response_model=PartyOut)
def toggle_party(party_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    party = db.query(Party).filter(Party.id == party_id).first()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    
    party.is_active = not party.is_active
    db.commit()
    db.refresh(party)
    return party

