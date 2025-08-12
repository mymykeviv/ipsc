from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
import re
from datetime import datetime, timedelta

from .auth import authenticate_user, create_access_token, get_current_user, require_role
from .db import get_db
from .models import Product, User, Party, CompanySettings, Invoice, InvoiceItem, StockLedgerEntry, Purchase, PurchaseItem, Payment, PurchasePayment, Expense, AuditTrail
from .audit import AuditService
from .gst import money, split_gst
from decimal import Decimal
from .emailer import send_email
from fastapi import Query
import json
import calendar


# Indian States for GST Compliance
INDIAN_STATES = {
    "Andhra Pradesh": "37",
    "Arunachal Pradesh": "12",
    "Assam": "18",
    "Bihar": "10",
    "Chhattisgarh": "22",
    "Goa": "30",
    "Gujarat": "24",
    "Haryana": "06",
    "Himachal Pradesh": "02",
    "Jharkhand": "20",
    "Karnataka": "29",
    "Kerala": "32",
    "Madhya Pradesh": "23",
    "Maharashtra": "27",
    "Manipur": "14",
    "Meghalaya": "17",
    "Mizoram": "15",
    "Nagaland": "13",
    "Odisha": "21",
    "Punjab": "03",
    "Rajasthan": "08",
    "Sikkim": "11",
    "Tamil Nadu": "33",
    "Telangana": "36",
    "Tripura": "16",
    "Uttar Pradesh": "09",
    "Uttarakhand": "05",
    "West Bengal": "19",
    "Delhi": "07",
    "Jammu and Kashmir": "01",
    "Ladakh": "38",
    "Chandigarh": "04",
    "Dadra and Nagar Haveli": "26",
    "Daman and Diu": "25",
    "Lakshadweep": "31",
    "Puducherry": "34",
    "Andaman and Nicobar Islands": "35"
}

# Utility functions for invoice calculations
def calculate_due_date(invoice_date: str, terms: str) -> datetime:
    """Calculate due date based on terms"""
    date_obj = datetime.fromisoformat(invoice_date.replace('Z', '+00:00'))
    
    if terms == "Due on Receipt":
        return date_obj
    elif terms == "15 days":
        return date_obj + timedelta(days=15)
    elif terms == "30 days":
        return date_obj + timedelta(days=30)
    elif terms == "45 days":
        return date_obj + timedelta(days=45)
    elif terms == "60 days":
        return date_obj + timedelta(days=60)
    elif terms == "90 days":
        return date_obj + timedelta(days=90)
    else:
        return date_obj


def number_to_words(amount: float) -> str:
    """Convert number to words (simplified version)"""
    if amount == 0:
        return "Zero Rupees Only"
    
    # This is a simplified version - in production, you'd want a more comprehensive implementation
    units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
    teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    
    def convert_less_than_one_thousand(n):
        if n == 0:
            return ""
        elif n < 10:
            return units[n]
        elif n < 20:
            return teens[n - 10]
        elif n < 100:
            return tens[n // 10] + (" " + units[n % 10] if n % 10 != 0 else "")
        else:
            return units[n // 100] + " Hundred" + (" " + convert_less_than_one_thousand(n % 100) if n % 100 != 0 else "")
    
    rupees = int(amount)
    paise = int((amount - rupees) * 100)
    
    if rupees == 0:
        return f"{paise} Paise Only"
    elif paise == 0:
        return f"{convert_less_than_one_thousand(rupees)} Rupees Only"
    else:
        return f"{convert_less_than_one_thousand(rupees)} Rupees and {paise} Paise Only"


api = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


@api.post("/auth/login")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Log successful login
    AuditService.log_login(db, user, request)
    
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
        
        # Log product creation
        AuditService.log_create(
            db=db,
            user=_,  # Current user from dependency
            table_name="products",
            record_id=product.id,
            new_values=payload.model_dump(),
            request=None  # We don't have request context here
        )
        
        return product
    except Exception as e:
        db.rollback()
        # Check for specific database constraint violations
        error_str = str(e).lower()
        if "unique constraint" in error_str and "sku" in error_str:
            raise HTTPException(status_code=400, detail="SKU already exists")
        elif "duplicate key value" in error_str and "sku" in error_str:
            raise HTTPException(status_code=400, detail="SKU already exists")
        elif "not null constraint" in error_str:
            raise HTTPException(status_code=400, detail="Required fields cannot be empty")
        elif "check constraint" in error_str:
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
    discount: float = 0
    discount_type: str = "Percentage"  # Percentage, Fixed


class PaymentIn(BaseModel):
    payment_date: str  # ISO date string
    payment_amount: float
    payment_method: str
    reference_number: str | None = None
    notes: str | None = None


class PaymentOut(BaseModel):
    id: int
    invoice_id: int
    payment_date: datetime
    payment_amount: float
    payment_method: str
    reference_number: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InvoiceOut(BaseModel):
    id: int
    customer_id: int
    invoice_no: str
    date: datetime
    due_date: datetime
    terms: str
    
    # GST Compliance Fields
    place_of_supply: str
    place_of_supply_state_code: str
    eway_bill_number: str | None
    reverse_charge: bool
    export_supply: bool
    
    # Address Details
    bill_to_address: str
    ship_to_address: str
    
    # Amount Details
    taxable_value: float
    total_discount: float
    cgst: float
    sgst: float
    igst: float
    grand_total: float
    
    # Additional Fields
    notes: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InvoiceCreate(BaseModel):
    customer_id: int
    invoice_no: str | None = None  # Optional, will auto-generate if not provided
    date: str  # ISO date string
    terms: str = "Due on Receipt"
    
    # GST Compliance Fields
    place_of_supply: str
    place_of_supply_state_code: str
    eway_bill_number: str | None = None
    reverse_charge: bool = False
    export_supply: bool = False
    
    # Address Details
    bill_to_address: str
    ship_to_address: str
    
    # Items and Notes
    items: list[InvoiceItemIn]
    notes: str | None = None


def _next_invoice_no(db: Session) -> str:
    settings = db.query(CompanySettings).first()
    prefix = settings.invoice_series if settings else "INV-"
    last = db.query(Invoice).order_by(Invoice.id.desc()).first()
    seq = (last.id + 1) if last else 1
    
    # Ensure the total length doesn't exceed 16 characters
    # Calculate available space for sequence number
    max_seq_length = 16 - len(prefix)
    if max_seq_length < 1:
        # If prefix is too long, truncate it
        prefix = prefix[:15]
        max_seq_length = 16 - len(prefix)
    
    # Format sequence number with appropriate padding
    if max_seq_length >= 5:
        seq_str = f"{seq:05d}"
    elif max_seq_length >= 4:
        seq_str = f"{seq:04d}"
    elif max_seq_length >= 3:
        seq_str = f"{seq:03d}"
    elif max_seq_length >= 2:
        seq_str = f"{seq:02d}"
    else:
        seq_str = str(seq)
    
    # Ensure final length doesn't exceed 16
    result = f"{prefix}{seq_str}"
    if len(result) > 16:
        result = result[:16]
    
    return result


@api.post('/invoices', response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def create_invoice(payload: InvoiceCreate, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Validation
    if payload.invoice_no and len(payload.invoice_no) > 16:
        raise HTTPException(status_code=400, detail="Invoice number must be 16 characters or less as per GST law")
    if payload.invoice_no and not re.match(r'^[a-zA-Z0-9\s-]+$', payload.invoice_no):
        raise HTTPException(status_code=400, detail="Invoice number must be alphanumeric with spaces and hyphens only")
    if len(payload.bill_to_address) > 200:
        raise HTTPException(status_code=400, detail="Bill to address must be 200 characters or less")
    if len(payload.ship_to_address) > 200:
        raise HTTPException(status_code=400, detail="Ship to address must be 200 characters or less")
    if payload.notes and len(payload.notes) > 200:
        raise HTTPException(status_code=400, detail="Notes must be 200 characters or less")
    if payload.eway_bill_number and len(payload.eway_bill_number) > 50:
        raise HTTPException(status_code=400, detail="E-way bill number must be 50 characters or less")
    if payload.eway_bill_number and not re.match(r'^[0-9]+$', payload.eway_bill_number):
        raise HTTPException(status_code=400, detail="E-way bill number must contain only numbers")
    if not payload.place_of_supply:
        raise HTTPException(status_code=400, detail="Place of supply is mandatory as per GST law")
    if not payload.place_of_supply_state_code:
        raise HTTPException(status_code=400, detail="Place of supply state code is mandatory as per GST law")
    
    company = db.query(CompanySettings).first()
    customer = db.query(Party).filter(Party.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=400, detail='Invalid customer')
    
    # Generate invoice number if not provided
    invoice_no = payload.invoice_no if payload.invoice_no else _next_invoice_no(db)
    
    # Calculate due date
    due_date = calculate_due_date(payload.date, payload.terms)
    
    intra = company and payload.place_of_supply == company.state

    taxable_total = money(0)
    discount_total = money(0)
    cgst_total = money(0)
    sgst_total = money(0)
    igst_total = money(0)

    inv = Invoice(
        customer_id=customer.id,
        invoice_no=invoice_no,
        date=datetime.fromisoformat(payload.date.replace('Z', '+00:00')),
        due_date=due_date,
        terms=payload.terms,
        place_of_supply=payload.place_of_supply,
        place_of_supply_state_code=payload.place_of_supply_state_code,
        eway_bill_number=payload.eway_bill_number,
        reverse_charge=payload.reverse_charge,
        export_supply=payload.export_supply,
        bill_to_address=payload.bill_to_address,
        ship_to_address=payload.ship_to_address,
        taxable_value=money(0),
        total_discount=money(0),
        cgst=money(0), sgst=money(0), igst=money(0),
        grand_total=money(0),
        paid_amount=money(0),
        balance_amount=money(0),
        notes=payload.notes,
        status="Draft"
    )
    db.add(inv)
    db.flush()

    for it in payload.items:
        prod = db.query(Product).filter(Product.id == it.product_id).first()
        if not prod:
            raise HTTPException(status_code=400, detail='Invalid product')
        
        # Calculate line item amounts
        line_total = money(Decimal(it.qty) * Decimal(it.rate))
        
        # Apply discount
        if it.discount > 0:
            if it.discount_type == "Percentage":
                discount_amount = money(line_total * Decimal(it.discount) / Decimal(100))
            else:  # Fixed
                discount_amount = money(Decimal(it.discount))
            line_total -= discount_amount
            discount_total += discount_amount
        
        # Calculate GST
        cgst, sgst, igst = split_gst(line_total, prod.gst_rate, bool(intra))
        
        item = InvoiceItem(
            invoice_id=inv.id,
            product_id=prod.id,
            description=prod.name,
            hsn_code=prod.hsn,
            qty=it.qty,
            rate=money(it.rate),
            discount=money(it.discount),
            discount_type=it.discount_type,
            taxable_value=line_total,
            gst_rate=prod.gst_rate,
            cgst=cgst, sgst=sgst, igst=igst,
            amount=line_total + cgst + sgst + igst
        )
        db.add(item)
        # stock out for sale
        db.add(StockLedgerEntry(product_id=prod.id, qty=it.qty, entry_type='out', ref_type='invoice', ref_id=inv.id))
        taxable_total += line_total
        cgst_total += cgst
        sgst_total += sgst
        igst_total += igst

    inv.taxable_value = taxable_total
    inv.total_discount = discount_total
    inv.cgst = cgst_total
    inv.sgst = sgst_total
    inv.igst = igst_total
    inv.grand_total = money(taxable_total + cgst_total + sgst_total + igst_total)
    inv.balance_amount = money(taxable_total + cgst_total + sgst_total + igst_total)
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


@api.get('/invoices/{invoice_id}', response_model=InvoiceOut)
def get_invoice(invoice_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail='Invoice not found')
    return inv


@api.put('/invoices/{invoice_id}', response_model=InvoiceOut)
def update_invoice(invoice_id: int, payload: InvoiceCreate, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail='Invoice not found')
    
    # Validation (same as create_invoice)
    if payload.invoice_no and len(payload.invoice_no) > 16:
        raise HTTPException(status_code=400, detail="Invoice number must be 16 characters or less as per GST law")
    if payload.invoice_no and not re.match(r'^[a-zA-Z0-9\s-]+$', payload.invoice_no):
        raise HTTPException(status_code=400, detail="Invoice number must be alphanumeric with spaces and hyphens only")
    if len(payload.bill_to_address) > 200:
        raise HTTPException(status_code=400, detail="Bill to address must be 200 characters or less")
    if len(payload.ship_to_address) > 200:
        raise HTTPException(status_code=400, detail="Ship to address must be 200 characters or less")
    if payload.notes and len(payload.notes) > 200:
        raise HTTPException(status_code=400, detail="Notes must be 200 characters or less")
    if payload.eway_bill_number and len(payload.eway_bill_number) > 50:
        raise HTTPException(status_code=400, detail="E-way bill number must be 50 characters or less")
    if payload.eway_bill_number and not re.match(r'^[0-9]+$', payload.eway_bill_number):
        raise HTTPException(status_code=400, detail="E-way bill number must contain only numbers")
    if not payload.place_of_supply:
        raise HTTPException(status_code=400, detail="Place of supply is mandatory as per GST law")
    if not payload.place_of_supply_state_code:
        raise HTTPException(status_code=400, detail="Place of supply state code is mandatory as per GST law")
    
    # Check if invoice number is being changed and if it's unique
    if payload.invoice_no and payload.invoice_no != inv.invoice_no:
        existing = db.query(Invoice).filter(Invoice.invoice_no == payload.invoice_no).first()
        if existing:
            raise HTTPException(status_code=400, detail="Invoice number already exists")
    
    # Update invoice details
    inv.invoice_no = payload.invoice_no or inv.invoice_no
    inv.date = datetime.fromisoformat(payload.date.replace('Z', '+00:00'))
    inv.due_date = calculate_due_date(payload.date, payload.terms)
    inv.terms = payload.terms
    inv.place_of_supply = payload.place_of_supply
    inv.place_of_supply_state_code = payload.place_of_supply_state_code
    inv.eway_bill_number = payload.eway_bill_number
    inv.reverse_charge = payload.reverse_charge
    inv.export_supply = payload.export_supply
    inv.bill_to_address = payload.bill_to_address
    inv.ship_to_address = payload.ship_to_address
    inv.notes = payload.notes
    
    # Delete existing items and recreate them
    db.query(InvoiceItem).filter(InvoiceItem.invoice_id == inv.id).delete()
    
    # Recalculate totals
    taxable_total = money(0)
    discount_total = money(0)
    cgst_total = money(0)
    sgst_total = money(0)
    igst_total = money(0)
    
    company = db.query(CompanySettings).first()
    customer = db.query(Party).filter(Party.id == inv.customer_id).first()
    intra = company and inv.place_of_supply == company.state
    
    for it in payload.items:
        prod = db.query(Product).filter(Product.id == it.product_id).first()
        if not prod:
            raise HTTPException(status_code=400, detail='Invalid product')
        
        # Calculate line item amounts
        line_total = money(Decimal(it.qty) * Decimal(it.rate))
        
        # Apply discount
        if it.discount > 0:
            if it.discount_type == "Percentage":
                discount_amount = money(line_total * Decimal(it.discount) / Decimal(100))
            else:  # Fixed
                discount_amount = money(Decimal(it.discount))
            line_total -= discount_amount
            discount_total += discount_amount
        
        # Calculate GST
        cgst, sgst, igst = split_gst(line_total, prod.gst_rate, bool(intra))
        
        item = InvoiceItem(
            invoice_id=inv.id,
            product_id=prod.id,
            description=prod.name,
            hsn_code=prod.hsn,
            qty=it.qty,
            rate=money(it.rate),
            discount=money(it.discount),
            discount_type=it.discount_type,
            taxable_value=line_total,
            gst_rate=prod.gst_rate,
            cgst=cgst, sgst=sgst, igst=igst,
            amount=line_total + cgst + sgst + igst
        )
        db.add(item)
        taxable_total += line_total
        cgst_total += cgst
        sgst_total += sgst
        igst_total += igst
    
    # Update invoice totals
    inv.taxable_value = taxable_total
    inv.total_discount = discount_total
    inv.cgst = cgst_total
    inv.sgst = sgst_total
    inv.igst = igst_total
    inv.grand_total = money(taxable_total + cgst_total + sgst_total + igst_total)
    
    db.commit()
    db.refresh(inv)
    return inv


@api.patch('/invoices/{invoice_id}/status', response_model=InvoiceOut)
def update_invoice_status(invoice_id: int, status: str, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail='Invoice not found')
    
    if status not in ["Draft", "Sent", "Paid", "Overdue"]:
        raise HTTPException(status_code=400, detail='Invalid status')
    
    inv.status = status
    db.commit()
    db.refresh(inv)
    return inv


@api.delete('/invoices/{invoice_id}')
def delete_invoice(invoice_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail='Invoice not found')
    
    # Delete related items first
    db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice_id).delete()
    db.delete(inv)
    db.commit()
    return {"message": "Invoice deleted successfully"}


# Payment Management Endpoints
@api.post('/invoices/{invoice_id}/payments', response_model=PaymentOut)
def add_payment(invoice_id: int, payload: PaymentIn, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=400, detail='Invoice not found')
    
    # Validation
    if payload.payment_amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than 0")
    
    if payload.payment_amount > float(inv.balance_amount):
        raise HTTPException(status_code=400, detail="Payment amount cannot exceed balance amount")
    
    if not payload.payment_method:
        raise HTTPException(status_code=400, detail="Payment method is required")
    
    if len(payload.payment_method) > 50:
        raise HTTPException(status_code=400, detail="Payment method must be 50 characters or less")
    
    if payload.reference_number and len(payload.reference_number) > 100:
        raise HTTPException(status_code=400, detail="Reference number must be 100 characters or less")
    
    if payload.notes and len(payload.notes) > 200:
        raise HTTPException(status_code=400, detail="Notes must be 200 characters or less")
    
    # Create payment record
    payment = Payment(
        invoice_id=invoice_id,
        payment_date=datetime.fromisoformat(payload.payment_date.replace('Z', '+00:00')),
        payment_amount=money(payload.payment_amount),
        payment_method=payload.payment_method,
        reference_number=payload.reference_number,
        notes=payload.notes
    )
    db.add(payment)
    
    # Update invoice payment status
    inv.paid_amount += money(payload.payment_amount)
    inv.balance_amount = inv.grand_total - inv.paid_amount
    
    # Update invoice status based on payment
    if inv.balance_amount == 0:
        inv.status = "Paid"
    elif inv.paid_amount > 0:
        inv.status = "Partially Paid"
    
    db.commit()
    db.refresh(payment)
    return payment


@api.get('/invoices/{invoice_id}/payments', response_model=list[PaymentOut])
def get_invoice_payments(invoice_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail='Invoice not found')
    
    payments = db.query(Payment).filter(Payment.invoice_id == invoice_id).order_by(Payment.payment_date.desc()).all()
    return payments


@api.delete('/payments/{payment_id}')
def delete_payment(payment_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=400, detail='Payment not found')
    
    # Update invoice payment status
    inv = db.query(Invoice).filter(Invoice.id == payment.invoice_id).first()
    if inv:
        inv.paid_amount -= payment.payment_amount
        inv.balance_amount = inv.grand_total - inv.paid_amount
        
        # Update invoice status based on payment
        if inv.balance_amount == inv.grand_total:
            inv.status = "Sent"
        elif inv.balance_amount == 0:
            inv.status = "Paid"
        elif inv.paid_amount > 0:
            inv.status = "Partially Paid"
    
    db.delete(payment)
    db.commit()
    return {"message": "Payment deleted successfully"}


@api.post('/invoices/{invoice_id}/email', status_code=202)
def email_invoice(invoice_id: int, payload: EmailRequest, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail='Invoice not found')
    
    # Update status to Sent when emailing
    inv.status = "Sent"
    db.commit()
    
    ok = send_email(payload.to, f"Invoice {inv.invoice_no}", f"Total: {inv.grand_total}")
    return {"status": "queued" if ok else "disabled"}


# Audit Trail Endpoints
class AuditTrailOut(BaseModel):
    id: int
    user_id: int
    action: str
    table_name: str
    record_id: int | None
    old_values: str | None
    new_values: str | None
    ip_address: str | None
    user_agent: str | None
    created_at: datetime

    class Config:
        from_attributes = True


@api.get('/audit-trail', response_model=list[AuditTrailOut])
def get_audit_trail(
    table_name: str | None = None,
    user_id: int | None = None,
    action: str | None = None,
    from_date: str | None = None,
    to_date: str | None = None,
    page: int = 1,
    limit: int = 50,
    _: User = Depends(require_role("Admin")),
    db: Session = Depends(get_db)
):
    """Get audit trail entries with filtering and pagination"""
    query = db.query(AuditTrail)
    
    # Apply filters
    if table_name:
        query = query.filter(AuditTrail.table_name == table_name)
    if user_id:
        query = query.filter(AuditTrail.user_id == user_id)
    if action:
        query = query.filter(AuditTrail.action == action)
    if from_date:
        query = query.filter(AuditTrail.created_at >= datetime.fromisoformat(from_date))
    if to_date:
        query = query.filter(AuditTrail.created_at <= datetime.fromisoformat(to_date))
    
    # Apply pagination
    offset = (page - 1) * limit
    total = query.count()
    entries = query.order_by(AuditTrail.created_at.desc()).offset(offset).limit(limit).all()
    
    return entries


@api.get('/audit-trail/export')
def export_audit_trail(
    table_name: str | None = None,
    user_id: int | None = None,
    action: str | None = None,
    from_date: str | None = None,
    to_date: str | None = None,
    _: User = Depends(require_role("Admin")),
    db: Session = Depends(get_db)
):
    """Export audit trail to CSV"""
    import csv
    from io import StringIO
    
    query = db.query(AuditTrail)
    
    # Apply filters
    if table_name:
        query = query.filter(AuditTrail.table_name == table_name)
    if user_id:
        query = query.filter(AuditTrail.user_id == user_id)
    if action:
        query = query.filter(AuditTrail.action == action)
    if from_date:
        query = query.filter(AuditTrail.created_at >= datetime.fromisoformat(from_date))
    if to_date:
        query = query.filter(AuditTrail.created_at <= datetime.fromisoformat(to_date))
    
    entries = query.order_by(AuditTrail.created_at.desc()).all()
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'User ID', 'Action', 'Table', 'Record ID', 'Old Values', 'New Values', 'IP Address', 'User Agent', 'Created At'])
    
    for entry in entries:
        writer.writerow([
            entry.id,
            entry.user_id,
            entry.action,
            entry.table_name,
            entry.record_id,
            entry.old_values,
            entry.new_values,
            entry.ip_address,
            entry.user_agent,
            entry.created_at.isoformat()
        ])
    
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename=audit_trail.csv'}
    )


class InvoiceListOut(BaseModel):
    id: int
    invoice_no: str
    customer_id: int
    customer_name: str
    date: datetime
    due_date: datetime
    grand_total: float
    status: str

    class Config:
        from_attributes = True


@api.get('/invoices', response_model=dict)
def list_invoices(
    search: str | None = None,
    status: str | None = None,
    page: int = 1,
    limit: int = 10,
    sort_field: str = 'date',
    sort_direction: str = 'desc',
    _: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Validation
    if page < 1:
        page = 1
    if limit < 1 or limit > 100:
        limit = 10
    
    query = db.query(Invoice).join(Party, Invoice.customer_id == Party.id)
    
    if search:
        search_filter = (
            Invoice.invoice_no.ilike(f"%{search}%") |
            Party.name.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if status:
        query = query.filter(Invoice.status == status)
    
    # Get total count for pagination
    total_count = query.count()
    
    # Apply sorting
    sort_column_map = {
        'invoice_no': Invoice.invoice_no,
        'customer_name': Party.name,
        'date': Invoice.date,
        'due_date': Invoice.due_date,
        'grand_total': Invoice.grand_total,
        'status': Invoice.status
    }
    
    sort_column = sort_column_map.get(sort_field, Invoice.date)
    if sort_direction.lower() == 'asc':
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())
    
    # Apply pagination
    offset = (page - 1) * limit
    invoices = query.offset(offset).limit(limit).all()
    
    # Convert to response format with customer name
    result = []
    for inv in invoices:
        customer = db.query(Party).filter(Party.id == inv.customer_id).first()
        result.append(InvoiceListOut(
            id=inv.id,
            invoice_no=inv.invoice_no,
            customer_id=inv.customer_id,
            customer_name=customer.name if customer else "Unknown",
            date=inv.date,
            due_date=inv.due_date,
            grand_total=float(inv.grand_total),
            status=inv.status
        ))
    
    # Calculate pagination info
    total_pages = (total_count + limit - 1) // limit
    has_next = page < total_pages
    has_prev = page > 1
    
    return {
        "invoices": result,
        "pagination": {
            "page": page,
            "limit": limit,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev
        }
    }


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


@api.get('/reports/gst-filing')
def gst_filing_report(
    period_type: str = Query(..., description="month/quarter/year"),
    period_value: str = Query(..., description="YYYY-MM for month, YYYY-Q1/Q2/Q3/Q4 for quarter, YYYY for year"),
    report_type: str = Query(..., description="gstr1/gstr2/gstr3b"),
    format: str = Query("json", description="json/csv/excel"),
    _: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Generate GST filing reports compliant with Indian GST portal requirements"""
    
    # Calculate date range based on period
    start_date, end_date = _calculate_period_dates(period_type, period_value)
    
    if report_type == "gstr1":
        return _generate_gstr1_report(start_date, end_date, format, db)
    elif report_type == "gstr2":
        return _generate_gstr2_report(start_date, end_date, format, db)
    elif report_type == "gstr3b":
        return _generate_gstr3b_report(start_date, end_date, format, db)
    else:
        raise HTTPException(status_code=400, detail="Invalid report type. Use gstr1, gstr2, or gstr3b")


def _calculate_period_dates(period_type: str, period_value: str) -> tuple[str, str]:
    """Calculate start and end dates for the given period"""
    if period_type == "month":
        # period_value format: YYYY-MM
        year, month = period_value.split("-")
        start_date = f"{year}-{month}-01"
        # Get last day of month
        last_day = calendar.monthrange(int(year), int(month))[1]
        end_date = f"{year}-{month}-{last_day}"
    elif period_type == "quarter":
        # period_value format: YYYY-Q1/Q2/Q3/Q4
        year, quarter = period_value.split("-")
        year = int(year)
        quarter = int(quarter[1])  # Q1 -> 1, Q2 -> 2, etc.
        
        start_month = (quarter - 1) * 3 + 1
        end_month = quarter * 3
        
        start_date = f"{year}-{start_month:02d}-01"
        last_day = calendar.monthrange(year, end_month)[1]
        end_date = f"{year}-{end_month:02d}-{last_day}"
    elif period_type == "year":
        # period_value format: YYYY
        year = int(period_value)
        start_date = f"{year}-01-01"
        end_date = f"{year}-12-31"
    else:
        raise HTTPException(status_code=400, detail="Invalid period type. Use month, quarter, or year")
    
    return start_date, end_date


def _generate_gstr1_report(start_date: str, end_date: str, format: str, db: Session):
    """Generate GSTR-1 (Outward Supplies) report"""
    from sqlalchemy import func, select
    from .models import Invoice, InvoiceItem, Product, Party
    
    # Get all invoices in the period
    invoices = db.query(Invoice).filter(
        func.date(Invoice.date) >= func.date(start_date),
        func.date(Invoice.date) <= func.date(end_date)
    ).all()
    
    gstr1_data = {
        "period": f"{start_date} to {end_date}",
        "report_type": "GSTR-1",
        "generated_on": datetime.now().isoformat(),
        "sections": {
            "b2b": [],
            "b2c": [],
            "nil_rated": [],
            "exempted": [],
            "rate_wise_summary": []
        }
    }
    
    # Process each invoice
    for invoice in invoices:
        customer = db.query(Party).filter(Party.id == invoice.customer_id).first()
        
        # Determine if B2B or B2C based on customer GSTIN
        is_b2b = customer and customer.gstin and len(customer.gstin) == 15
        
        invoice_data = {
            "invoice_no": invoice.invoice_no,
            "invoice_date": invoice.date.isoformat(),
            "customer_name": customer.name if customer else "Unknown",
            "customer_gstin": customer.gstin if customer else "",
            "place_of_supply": invoice.place_of_supply,
            "reverse_charge": invoice.reverse_charge,
            "items": [],
            "total_taxable_value": float(invoice.taxable_value),
            "total_cgst": float(invoice.cgst),
            "total_sgst": float(invoice.sgst),
            "total_igst": float(invoice.igst),
            "grand_total": float(invoice.grand_total)
        }
        
        # Get invoice items
        items = db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice.id).all()
        for item in items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            item_data = {
                "description": item.description,
                "hsn_code": product.hsn if product else "",
                "qty": float(item.qty),
                "rate": float(item.rate),
                "taxable_value": float(item.taxable_value),
                "gst_rate": float(item.gst_rate),
                "cgst": float(item.cgst),
                "sgst": float(item.sgst),
                "igst": float(item.igst),
                "amount": float(item.amount)
            }
            invoice_data["items"].append(item_data)
        
        # Categorize invoice
        if is_b2b:
            gstr1_data["sections"]["b2b"].append(invoice_data)
        else:
            gstr1_data["sections"]["b2c"].append(invoice_data)
    
    # Generate rate-wise summary
    rate_summary = db.execute(
        select(Product.gst_rate, func.sum(InvoiceItem.taxable_value), func.sum(InvoiceItem.cgst), func.sum(InvoiceItem.sgst), func.sum(InvoiceItem.igst))
        .join(Product, Product.id == InvoiceItem.product_id)
        .join(Invoice, Invoice.id == InvoiceItem.invoice_id)
        .filter(func.date(Invoice.date) >= func.date(start_date), func.date(Invoice.date) <= func.date(end_date))
        .group_by(Product.gst_rate)
    ).all()
    
    for rate, taxable, cgst, sgst, igst in rate_summary:
        gstr1_data["sections"]["rate_wise_summary"].append({
            "gst_rate": float(rate),
            "taxable_value": float(taxable),
            "cgst": float(cgst),
            "sgst": float(sgst),
            "igst": float(igst)
        })
    
    return _format_report(gstr1_data, format, "gstr1")


def _generate_gstr2_report(start_date: str, end_date: str, format: str, db: Session):
    """Generate GSTR-2 (Inward Supplies) report"""
    from sqlalchemy import func, select
    from .models import Purchase, PurchaseItem, Product, Party
    
    # Get all purchases in the period
    purchases = db.query(Purchase).filter(
        func.date(Purchase.date) >= func.date(start_date),
        func.date(Purchase.date) <= func.date(end_date)
    ).all()
    
    gstr2_data = {
        "period": f"{start_date} to {end_date}",
        "report_type": "GSTR-2",
        "generated_on": datetime.now().isoformat(),
        "sections": {
            "b2b": [],
            "imports": [],
            "rate_wise_summary": []
        }
    }
    
    # Process each purchase
    for purchase in purchases:
        vendor = db.query(Party).filter(Party.id == purchase.vendor_id).first()
        
        purchase_data = {
            "purchase_no": purchase.purchase_no,
            "purchase_date": purchase.date.isoformat(),
            "vendor_name": vendor.name if vendor else "Unknown",
            "vendor_gstin": vendor.gstin if vendor else "",
            "place_of_supply": purchase.place_of_supply,
            "reverse_charge": purchase.reverse_charge,
            "items": [],
            "total_taxable_value": float(purchase.taxable_value),
            "total_cgst": float(purchase.cgst),
            "total_sgst": float(purchase.sgst),
            "total_igst": float(purchase.igst),
            "grand_total": float(purchase.grand_total)
        }
        
        # Get purchase items
        items = db.query(PurchaseItem).filter(PurchaseItem.purchase_id == purchase.id).all()
        for item in items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            item_data = {
                "description": item.description,
                "hsn_code": product.hsn if product else "",
                "qty": float(item.qty),
                "rate": float(item.rate),
                "taxable_value": float(item.taxable_value),
                "gst_rate": float(item.gst_rate),
                "cgst": float(item.cgst),
                "sgst": float(item.sgst),
                "igst": float(item.igst),
                "amount": float(item.amount)
            }
            purchase_data["items"].append(item_data)
        
        gstr2_data["sections"]["b2b"].append(purchase_data)
    
    # Generate rate-wise summary
    rate_summary = db.execute(
        select(Product.gst_rate, func.sum(PurchaseItem.taxable_value), func.sum(PurchaseItem.cgst), func.sum(PurchaseItem.sgst), func.sum(PurchaseItem.igst))
        .join(Product, Product.id == PurchaseItem.product_id)
        .join(Purchase, Purchase.id == PurchaseItem.purchase_id)
        .filter(func.date(Purchase.date) >= func.date(start_date), func.date(Purchase.date) <= func.date(end_date))
        .group_by(Product.gst_rate)
    ).all()
    
    for rate, taxable, cgst, sgst, igst in rate_summary:
        gstr2_data["sections"]["rate_wise_summary"].append({
            "gst_rate": float(rate),
            "taxable_value": float(taxable),
            "cgst": float(cgst),
            "sgst": float(sgst),
            "igst": float(igst)
        })
    
    return _format_report(gstr2_data, format, "gstr2")


def _generate_gstr3b_report(start_date: str, end_date: str, format: str, db: Session):
    """Generate GSTR-3B (Summary) report"""
    from sqlalchemy import func, select
    from .models import Invoice, Purchase, InvoiceItem, PurchaseItem, Product
    
    gstr3b_data = {
        "period": f"{start_date} to {end_date}",
        "report_type": "GSTR-3B",
        "generated_on": datetime.now().isoformat(),
        "sections": {
            "outward_supplies": {},
            "inward_supplies": {},
            "summary": {}
        }
    }
    
    # Outward supplies (GSTR-1 data)
    invoices = db.query(Invoice).filter(
        func.date(Invoice.date) >= func.date(start_date),
        func.date(Invoice.date) <= func.date(end_date)
    ).all()
    
    outward_taxable = sum([float(i.taxable_value) for i in invoices], 0.0)
    outward_cgst = sum([float(i.cgst) for i in invoices], 0.0)
    outward_sgst = sum([float(i.sgst) for i in invoices], 0.0)
    outward_igst = sum([float(i.igst) for i in invoices], 0.0)
    
    gstr3b_data["sections"]["outward_supplies"] = {
        "total_taxable_value": outward_taxable,
        "total_cgst": outward_cgst,
        "total_sgst": outward_sgst,
        "total_igst": outward_igst,
        "total_tax": outward_cgst + outward_sgst + outward_igst
    }
    
    # Inward supplies (GSTR-2 data)
    purchases = db.query(Purchase).filter(
        func.date(Purchase.date) >= func.date(start_date),
        func.date(Purchase.date) <= func.date(end_date)
    ).all()
    
    inward_taxable = sum([float(p.taxable_value) for p in purchases], 0.0)
    inward_cgst = sum([float(p.cgst) for p in purchases], 0.0)
    inward_sgst = sum([float(p.sgst) for p in purchases], 0.0)
    inward_igst = sum([float(p.igst) for p in purchases], 0.0)
    
    gstr3b_data["sections"]["inward_supplies"] = {
        "total_taxable_value": inward_taxable,
        "total_cgst": inward_cgst,
        "total_sgst": inward_sgst,
        "total_igst": inward_igst,
        "total_tax": inward_cgst + inward_sgst + inward_igst
    }
    
    # Summary calculations
    net_cgst = outward_cgst - inward_cgst
    net_sgst = outward_sgst - inward_sgst
    net_igst = outward_igst - inward_igst
    
    gstr3b_data["sections"]["summary"] = {
        "net_cgst": net_cgst,
        "net_sgst": net_sgst,
        "net_igst": net_igst,
        "total_net_tax": net_cgst + net_sgst + net_igst,
        "total_outward_taxable": outward_taxable,
        "total_inward_taxable": inward_taxable
    }
    
    return _format_report(gstr3b_data, format, "gstr3b")


def _format_report(data: dict, format: str, report_type: str):
    """Format report in requested format"""
    if format == "json":
        return data
    elif format == "csv":
        return _convert_to_csv(data, report_type)
    elif format == "excel":
        return _convert_to_excel(data, report_type)
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use json, csv, or excel")


def _convert_to_csv(data: dict, report_type: str):
    """Convert report data to CSV format"""
    import csv
    from io import StringIO
    
    buf = StringIO()
    w = csv.writer(buf)
    
    # Write header
    w.writerow([f"GST {report_type.upper()} Report"])
    w.writerow([f"Period: {data['period']}"])
    w.writerow([f"Generated On: {data['generated_on']}"])
    w.writerow([])
    
    if report_type == "gstr1":
        # B2B Section
        w.writerow(["B2B Invoices"])
        w.writerow(["Invoice No", "Date", "Customer", "GSTIN", "Taxable Value", "CGST", "SGST", "IGST", "Total"])
        for invoice in data["sections"]["b2b"]:
            w.writerow([
                invoice["invoice_no"],
                invoice["invoice_date"],
                invoice["customer_name"],
                invoice["customer_gstin"],
                invoice["total_taxable_value"],
                invoice["total_cgst"],
                invoice["total_sgst"],
                invoice["total_igst"],
                invoice["grand_total"]
            ])
        
        w.writerow([])
        w.writerow(["Rate-wise Summary"])
        w.writerow(["GST Rate", "Taxable Value", "CGST", "SGST", "IGST"])
        for rate in data["sections"]["rate_wise_summary"]:
            w.writerow([
                rate["gst_rate"],
                rate["taxable_value"],
                rate["cgst"],
                rate["sgst"],
                rate["igst"]
            ])
    
    elif report_type == "gstr2":
        # B2B Section
        w.writerow(["B2B Purchases"])
        w.writerow(["Purchase No", "Date", "Vendor", "GSTIN", "Taxable Value", "CGST", "SGST", "IGST", "Total"])
        for purchase in data["sections"]["b2b"]:
            w.writerow([
                purchase["purchase_no"],
                purchase["purchase_date"],
                purchase["vendor_name"],
                purchase["vendor_gstin"],
                purchase["total_taxable_value"],
                purchase["total_cgst"],
                purchase["total_sgst"],
                purchase["total_igst"],
                purchase["grand_total"]
            ])
    
    elif report_type == "gstr3b":
        w.writerow(["GSTR-3B Summary"])
        w.writerow(["Section", "Taxable Value", "CGST", "SGST", "IGST", "Total Tax"])
        
        outward = data["sections"]["outward_supplies"]
        w.writerow(["Outward Supplies", outward["total_taxable_value"], outward["total_cgst"], outward["total_sgst"], outward["total_igst"], outward["total_tax"]])
        
        inward = data["sections"]["inward_supplies"]
        w.writerow(["Inward Supplies", inward["total_taxable_value"], inward["total_cgst"], inward["total_sgst"], inward["total_igst"], inward["total_tax"]])
        
        summary = data["sections"]["summary"]
        w.writerow(["Net Tax", "", summary["net_cgst"], summary["net_sgst"], summary["net_igst"], summary["total_net_tax"]])
    
    return Response(content=buf.getvalue(), media_type='text/csv')


def _convert_to_excel(data: dict, report_type: str):
    """Convert report data to Excel format"""
    try:
        import openpyxl
        from openpyxl.styles import Font, Alignment, PatternFill
    except ImportError:
        raise HTTPException(status_code=500, detail="Excel export requires openpyxl package")
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = f"GST {report_type.upper()}"
    
    # Header styling
    header_font = Font(bold=True)
    header_fill = PatternFill(start_color="CCCCCC", end_color="CCCCCC", fill_type="solid")
    
    # Write header
    ws['A1'] = f"GST {report_type.upper()} Report"
    ws['A1'].font = Font(bold=True, size=14)
    ws['A2'] = f"Period: {data['period']}"
    ws['A3'] = f"Generated On: {data['generated_on']}"
    
    if report_type == "gstr1":
        # B2B Section
        row = 5
        ws[f'A{row}'] = "B2B Invoices"
        ws[f'A{row}'].font = header_font
        
        row += 1
        headers = ["Invoice No", "Date", "Customer", "GSTIN", "Taxable Value", "CGST", "SGST", "IGST", "Total"]
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=row, column=col, value=header)
            cell.font = header_font
            cell.fill = header_fill
        
        row += 1
        for invoice in data["sections"]["b2b"]:
            ws.cell(row=row, column=1, value=invoice["invoice_no"])
            ws.cell(row=row, column=2, value=invoice["invoice_date"])
            ws.cell(row=row, column=3, value=invoice["customer_name"])
            ws.cell(row=row, column=4, value=invoice["customer_gstin"])
            ws.cell(row=row, column=5, value=invoice["total_taxable_value"])
            ws.cell(row=row, column=6, value=invoice["total_cgst"])
            ws.cell(row=row, column=7, value=invoice["total_sgst"])
            ws.cell(row=row, column=8, value=invoice["total_igst"])
            ws.cell(row=row, column=9, value=invoice["grand_total"])
            row += 1
    
    # Save to bytes
    from io import BytesIO
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    return Response(
        content=output.getvalue(),
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': f'attachment; filename="gst_{report_type}_{data["period"].replace(" ", "_")}.xlsx"'}
    )


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
        # Use the product.stock field directly as it's updated by all operations
        onhand = int(p.stock)
        rows.append(StockRow(product_id=p.id, sku=p.sku or '', name=p.name, onhand=onhand, item_type=p.item_type, unit=p.unit))
    return rows


class PurchaseItemIn(BaseModel):
    product_id: int
    qty: float
    rate: float
    description: str | None = None
    hsn_code: str | None = None
    discount: float = 0
    discount_type: str = "Percentage"  # Percentage, Fixed
    gst_rate: float = 0


class PurchaseCreate(BaseModel):
    vendor_id: int
    date: str  # ISO date string
    due_date: str  # ISO date string
    terms: str = "Due on Receipt"
    place_of_supply: str
    place_of_supply_state_code: str
    eway_bill_number: str | None = None
    reverse_charge: bool = False
    export_supply: bool = False
    bill_from_address: str
    ship_from_address: str
    total_discount: float = 0
    notes: str | None = None
    items: list[PurchaseItemIn]


class PurchaseOut(BaseModel):
    id: int
    purchase_no: str
    vendor_id: int
    vendor_name: str
    date: str
    due_date: str
    terms: str
    place_of_supply: str
    place_of_supply_state_code: str
    eway_bill_number: str | None
    reverse_charge: bool
    export_supply: bool
    bill_from_address: str
    ship_from_address: str
    taxable_value: float
    total_discount: float
    cgst: float
    sgst: float
    igst: float
    grand_total: float
    paid_amount: float
    balance_amount: float
    notes: str | None
    status: str
    created_at: str
    updated_at: str


def _next_purchase_no(db: Session) -> str:
    """Generate next purchase number"""
    settings = db.query(CompanySettings).first()
    if not settings:
        raise HTTPException(status_code=500, detail="Company settings not found")
    
    prefix = settings.invoice_series.replace("INV", "PUR")  # Use similar series for purchases
    last_purchase = db.query(Purchase).filter(Purchase.purchase_no.like(f"{prefix}%")).order_by(Purchase.purchase_no.desc()).first()
    
    if last_purchase:
        # Extract sequence number from last purchase number
        last_seq = int(last_purchase.purchase_no.replace(prefix, ""))
        seq = last_seq + 1
    else:
        seq = 1
    
    # Ensure the total length doesn't exceed 16 characters
    max_seq_length = 16 - len(prefix)
    if max_seq_length < 1:
        prefix = prefix[:15]
        max_seq_length = 16 - len(prefix)
    
    # Format sequence number with appropriate padding
    if max_seq_length >= 5:
        seq_str = f"{seq:05d}"
    elif max_seq_length >= 4:
        seq_str = f"{seq:04d}"
    elif max_seq_length >= 3:
        seq_str = f"{seq:03d}"
    elif max_seq_length >= 2:
        seq_str = f"{seq:02d}"
    else:
        seq_str = str(seq)
    
    # Ensure final length doesn't exceed 16
    result = f"{prefix}{seq_str}"
    if len(result) > 16:
        result = result[:16]
    
    return result


@api.post('/purchases', status_code=201)
def create_purchase(payload: PurchaseCreate, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    vendor = db.query(Party).filter(Party.id == payload.vendor_id, Party.type == 'vendor').first()
    if not vendor:
        raise HTTPException(status_code=400, detail='Invalid vendor')
    
    # Generate purchase number
    purchase_no = _next_purchase_no(db)
    
    # Calculate GST and totals
    taxable_value = Decimal('0.00')
    total_cgst = Decimal('0.00')
    total_sgst = Decimal('0.00')
    total_igst = Decimal('0.00')
    
    # Create purchase
    pur = Purchase(
        vendor_id=vendor.id,
        purchase_no=purchase_no,
        date=datetime.fromisoformat(payload.date),
        due_date=datetime.fromisoformat(payload.due_date),
        terms=payload.terms,
        place_of_supply=payload.place_of_supply,
        place_of_supply_state_code=payload.place_of_supply_state_code,
        eway_bill_number=payload.eway_bill_number,
        reverse_charge=payload.reverse_charge,
        export_supply=payload.export_supply,
        bill_from_address=payload.bill_from_address,
        ship_from_address=payload.ship_from_address,
        total_discount=money(payload.total_discount),
        notes=payload.notes,
        taxable_value=Decimal('0.00'),
        cgst=Decimal('0.00'),
        sgst=Decimal('0.00'),
        igst=Decimal('0.00'),
        grand_total=Decimal('0.00'),
        paid_amount=Decimal('0.00'),
        balance_amount=Decimal('0.00'),
        status="Draft"
    )
    db.add(pur)
    db.flush()
    
    # Process items
    for it in payload.items:
        prod = db.query(Product).filter(Product.id == it.product_id).first()
        if not prod:
            raise HTTPException(status_code=400, detail='Invalid product')
        
        # Calculate item amounts
        base_amount = Decimal(it.qty) * Decimal(it.rate)
        discount_amount = Decimal(it.discount) if it.discount_type == "Fixed" else (base_amount * Decimal(it.discount) / 100)
        taxable_amount = base_amount - discount_amount
        
        # Calculate GST
        gst_rate = Decimal(it.gst_rate)
        if payload.place_of_supply_state_code == "29":  # Intra-state
            cgst = taxable_amount * gst_rate / 200  # Half of GST rate
            sgst = taxable_amount * gst_rate / 200
            igst = Decimal('0.00')
        else:  # Inter-state
            cgst = Decimal('0.00')
            sgst = Decimal('0.00')
            igst = taxable_amount * gst_rate / 100
        
        item_amount = taxable_amount + cgst + sgst + igst
        
        # Create purchase item
        purchase_item = PurchaseItem(
            purchase_id=pur.id,
            product_id=prod.id,
            description=it.description or prod.name,
            hsn_code=it.hsn_code or prod.hsn,
            qty=it.qty,
            rate=money(it.rate),
            discount=money(it.discount),
            discount_type=it.discount_type,
            taxable_value=money(taxable_amount),
            gst_rate=it.gst_rate,
            cgst=money(cgst),
            sgst=money(sgst),
            igst=money(igst),
            amount=money(item_amount)
        )
        db.add(purchase_item)
        
        # Update totals
        taxable_value += taxable_amount
        total_cgst += cgst
        total_sgst += sgst
        total_igst += igst
        
        # Add stock ledger entry
        db.add(StockLedgerEntry(product_id=prod.id, qty=it.qty, entry_type='in', ref_type='purchase', ref_id=pur.id))
    
    # Update purchase totals
    pur.taxable_value = money(taxable_value)
    pur.cgst = money(total_cgst)
    pur.sgst = money(total_sgst)
    pur.igst = money(total_igst)
    pur.grand_total = money(taxable_value + total_cgst + total_sgst + total_igst - Decimal(payload.total_discount))
    pur.balance_amount = pur.grand_total
    
    db.commit()
    return {"id": pur.id, "purchase_no": purchase_no}


@api.get('/purchases', response_model=list[PurchaseOut])
def list_purchases(
    search: str | None = None,
    status: str | None = None,
    _: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    query = db.query(Purchase).join(Party).filter(Party.type == 'vendor')
    
    if search:
        search_filter = or_(
            Purchase.purchase_no.ilike(f'%{search}%'),
            Party.name.ilike(f'%{search}%')
        )
        query = query.filter(search_filter)
    
    if status:
        query = query.filter(Purchase.status == status)
    
    purchases = query.order_by(Purchase.date.desc()).all()
    
    result = []
    for pur in purchases:
        vendor = db.query(Party).filter(Party.id == pur.vendor_id).first()
        result.append(PurchaseOut(
            id=pur.id,
            purchase_no=pur.purchase_no,
            vendor_id=pur.vendor_id,
            vendor_name=vendor.name if vendor else "Unknown",
            date=pur.date.isoformat(),
            due_date=pur.due_date.isoformat(),
            terms=pur.terms,
            place_of_supply=pur.place_of_supply,
            place_of_supply_state_code=pur.place_of_supply_state_code,
            eway_bill_number=pur.eway_bill_number,
            reverse_charge=pur.reverse_charge,
            export_supply=pur.export_supply,
            bill_from_address=pur.bill_from_address,
            ship_from_address=pur.ship_from_address,
            taxable_value=float(pur.taxable_value),
            total_discount=float(pur.total_discount),
            cgst=float(pur.cgst),
            sgst=float(pur.sgst),
            igst=float(pur.igst),
            grand_total=float(pur.grand_total),
            paid_amount=float(pur.paid_amount),
            balance_amount=float(pur.balance_amount),
            notes=pur.notes,
            status=pur.status,
            created_at=pur.created_at.isoformat(),
            updated_at=pur.updated_at.isoformat()
        ))
    
    return result


@api.get('/purchases/{purchase_id}', response_model=PurchaseOut)
def get_purchase(purchase_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail='Purchase not found')
    
    vendor = db.query(Party).filter(Party.id == purchase.vendor_id).first()
    return PurchaseOut(
        id=purchase.id,
        purchase_no=purchase.purchase_no,
        vendor_id=purchase.vendor_id,
        vendor_name=vendor.name if vendor else "Unknown",
        date=purchase.date.isoformat(),
        due_date=purchase.due_date.isoformat(),
        terms=purchase.terms,
        place_of_supply=purchase.place_of_supply,
        place_of_supply_state_code=purchase.place_of_supply_state_code,
        eway_bill_number=purchase.eway_bill_number,
        reverse_charge=purchase.reverse_charge,
        export_supply=purchase.export_supply,
        bill_from_address=purchase.bill_from_address,
        ship_from_address=purchase.ship_from_address,
        taxable_value=float(purchase.taxable_value),
        total_discount=float(purchase.total_discount),
        cgst=float(purchase.cgst),
        sgst=float(purchase.sgst),
        igst=float(purchase.igst),
        grand_total=float(purchase.grand_total),
        paid_amount=float(purchase.paid_amount),
        balance_amount=float(purchase.balance_amount),
        notes=purchase.notes,
        status=purchase.status,
        created_at=purchase.created_at.isoformat(),
        updated_at=purchase.updated_at.isoformat()
    )


@api.delete('/purchases/{purchase_id}')
def delete_purchase(purchase_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail='Purchase not found')
    
    if purchase.status in ["Paid", "Partially Paid"]:
        raise HTTPException(status_code=400, detail='Cannot delete purchase with payments')
    
    # Delete related records
    db.query(PurchaseItem).filter(PurchaseItem.purchase_id == purchase_id).delete()
    db.query(StockLedgerEntry).filter(
        StockLedgerEntry.ref_type == 'purchase', 
        StockLedgerEntry.ref_id == purchase_id
    ).delete()
    
    db.delete(purchase)
    db.commit()
    return {"message": "Purchase deleted successfully"}


# Expense Management for Cashflow
class ExpenseIn(BaseModel):
    expense_date: str  # ISO date string
    expense_type: str
    category: str
    subcategory: str | None = None
    description: str
    amount: float
    payment_method: str
    account_head: str
    reference_number: str | None = None
    vendor_id: int | None = None
    gst_rate: float = 0
    notes: str | None = None


class ExpenseOut(BaseModel):
    id: int
    expense_date: str
    expense_type: str
    category: str
    subcategory: str | None
    description: str
    amount: float
    payment_method: str
    account_head: str
    reference_number: str | None
    vendor_id: int | None
    vendor_name: str | None
    gst_amount: float
    gst_rate: float
    total_amount: float
    notes: str | None
    created_at: str
    updated_at: str


@api.post('/expenses', status_code=201)
def create_expense(payload: ExpenseIn, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Validate vendor if provided
    vendor = None
    if payload.vendor_id:
        vendor = db.query(Party).filter(Party.id == payload.vendor_id, Party.type == 'vendor').first()
        if not vendor:
            raise HTTPException(status_code=400, detail='Invalid vendor')
    
    # Calculate GST and total
    gst_amount = Decimal(payload.amount) * Decimal(payload.gst_rate) / 100
    total_amount = Decimal(payload.amount) + gst_amount
    
    expense = Expense(
        expense_date=datetime.fromisoformat(payload.expense_date),
        expense_type=payload.expense_type,
        category=payload.category,
        subcategory=payload.subcategory,
        description=payload.description,
        amount=money(payload.amount),
        payment_method=payload.payment_method,
        account_head=payload.account_head,
        reference_number=payload.reference_number,
        vendor_id=payload.vendor_id,
        gst_amount=money(gst_amount),
        gst_rate=payload.gst_rate,
        total_amount=money(total_amount),
        notes=payload.notes
    )
    
    db.add(expense)
    db.commit()
    return {"id": expense.id}


@api.get('/expenses', response_model=list[ExpenseOut])
def list_expenses(
    search: str | None = None,
    category: str | None = None,
    expense_type: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    _: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    query = db.query(Expense)
    
    if search:
        search_filter = or_(
            Expense.description.ilike(f'%{search}%'),
            Expense.expense_type.ilike(f'%{search}%')
        )
        query = query.filter(search_filter)
    
    if category:
        query = query.filter(Expense.category == category)
    
    if expense_type:
        query = query.filter(Expense.expense_type == expense_type)
    
    if start_date:
        query = query.filter(Expense.expense_date >= datetime.fromisoformat(start_date))
    
    if end_date:
        query = query.filter(Expense.expense_date <= datetime.fromisoformat(end_date))
    
    expenses = query.order_by(Expense.expense_date.desc()).all()
    
    result = []
    for exp in expenses:
        vendor_name = None
        if exp.vendor_id:
            vendor = db.query(Party).filter(Party.id == exp.vendor_id).first()
            vendor_name = vendor.name if vendor else "Unknown"
        
        result.append(ExpenseOut(
            id=exp.id,
            expense_date=exp.expense_date.isoformat(),
            expense_type=exp.expense_type,
            category=exp.category,
            subcategory=exp.subcategory,
            description=exp.description,
            amount=float(exp.amount),
            payment_method=exp.payment_method,
            account_head=exp.account_head,
            reference_number=exp.reference_number,
            vendor_id=exp.vendor_id,
            vendor_name=vendor_name,
            gst_amount=float(exp.gst_amount),
            gst_rate=exp.gst_rate,
            total_amount=float(exp.total_amount),
            notes=exp.notes,
            created_at=exp.created_at.isoformat(),
            updated_at=exp.updated_at.isoformat()
        ))
    
    return result


@api.get('/expenses/{expense_id}', response_model=ExpenseOut)
def get_expense(expense_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail='Expense not found')
    
    vendor_name = None
    if expense.vendor_id:
        vendor = db.query(Party).filter(Party.id == expense.vendor_id).first()
        vendor_name = vendor.name if vendor else "Unknown"
    
    return ExpenseOut(
        id=expense.id,
        expense_date=expense.expense_date.isoformat(),
        expense_type=expense.expense_type,
        category=expense.category,
        subcategory=expense.subcategory,
        description=expense.description,
        amount=float(expense.amount),
        payment_method=expense.payment_method,
        account_head=expense.account_head,
        reference_number=expense.reference_number,
        vendor_id=expense.vendor_id,
        vendor_name=vendor_name,
        gst_amount=float(expense.gst_amount),
        gst_rate=expense.gst_rate,
        total_amount=float(expense.total_amount),
        notes=expense.notes,
        created_at=expense.created_at.isoformat(),
        updated_at=expense.updated_at.isoformat()
    )


@api.put('/expenses/{expense_id}')
def update_expense(expense_id: int, payload: ExpenseIn, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail='Expense not found')
    
    # Validate vendor if provided
    if payload.vendor_id:
        vendor = db.query(Party).filter(Party.id == payload.vendor_id, Party.type == 'vendor').first()
        if not vendor:
            raise HTTPException(status_code=400, detail='Invalid vendor')
    
    # Calculate GST and total
    gst_amount = Decimal(payload.amount) * Decimal(payload.gst_rate) / 100
    total_amount = Decimal(payload.amount) + gst_amount
    
    # Update expense
    expense.expense_date = datetime.fromisoformat(payload.expense_date)
    expense.expense_type = payload.expense_type
    expense.category = payload.category
    expense.subcategory = payload.subcategory
    expense.description = payload.description
    expense.amount = money(payload.amount)
    expense.payment_method = payload.payment_method
    expense.account_head = payload.account_head
    expense.reference_number = payload.reference_number
    expense.vendor_id = payload.vendor_id
    expense.gst_amount = money(gst_amount)
    expense.gst_rate = payload.gst_rate
    expense.total_amount = money(total_amount)
    expense.notes = payload.notes
    
    db.commit()
    return {"message": "Expense updated successfully"}


@api.delete('/expenses/{expense_id}')
def delete_expense(expense_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail='Expense not found')
    
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}


# Cashflow Summary
@api.get('/cashflow/summary')
def get_cashflow_summary(
    start_date: str | None = None,
    end_date: str | None = None,
    _: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Set default date range if not provided (current month)
    if not start_date:
        start_date = datetime.now().replace(day=1).isoformat()
    if not end_date:
        end_date = datetime.now().isoformat()
    
    start_dt = datetime.fromisoformat(start_date)
    end_dt = datetime.fromisoformat(end_date)
    
    # Get income from invoices
    income_query = db.query(Invoice).filter(
        Invoice.date >= start_dt,
        Invoice.date <= end_dt
    )
    total_income = float(sum([inv.grand_total for inv in income_query.all()], 0))
    
    # Get expenses
    expense_query = db.query(Expense).filter(
        Expense.expense_date >= start_dt,
        Expense.expense_date <= end_dt
    )
    total_expenses = float(sum([exp.total_amount for exp in expense_query.all()], 0))
    
    # Get purchase payments (expenses)
    purchase_payments_query = db.query(PurchasePayment).filter(
        PurchasePayment.payment_date >= start_dt,
        PurchasePayment.payment_date <= end_dt
    )
    total_purchase_payments = float(sum([pp.payment_amount for pp in purchase_payments_query.all()], 0))
    
    # Get invoice payments (income)
    invoice_payments_query = db.query(Payment).filter(
        Payment.payment_date >= start_dt,
        Payment.payment_date <= end_dt
    )
    total_invoice_payments = float(sum([p.payment_amount for p in invoice_payments_query.all()], 0))
    
    # Calculate net cashflow
    net_cashflow = total_invoice_payments - total_expenses - total_purchase_payments
    
    return {
        "period": {
            "start_date": start_date,
            "end_date": end_date
        },
        "income": {
            "total_invoice_amount": total_income,
            "total_payments_received": total_invoice_payments
        },
        "expenses": {
            "total_expenses": total_expenses,
            "total_purchase_payments": total_purchase_payments,
            "total_outflow": total_expenses + total_purchase_payments
        },
        "cashflow": {
            "net_cashflow": net_cashflow,
            "cash_inflow": total_invoice_payments,
            "cash_outflow": total_expenses + total_purchase_payments
        }
    }


class PaymentIn(BaseModel):
    amount: float
    method: str
    account_head: str
    reference_number: str | None = None
    notes: str | None = None


class PurchasePaymentIn(BaseModel):
    amount: float
    method: str
    account_head: str
    reference_number: str | None = None
    notes: str | None = None


@api.post('/invoices/{invoice_id}/payments', status_code=201)
def add_payment(invoice_id: int, payload: PaymentIn, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail='Invoice not found')
    
    pay = Payment(
        invoice_id=invoice_id, 
        payment_amount=money(payload.amount), 
        payment_method=payload.method, 
        account_head=payload.account_head,
        reference_number=payload.reference_number,
        notes=payload.notes
    )
    db.add(pay)
    
    # Update invoice paid amount
    inv.paid_amount += money(payload.amount)
    inv.balance_amount = inv.grand_total - inv.paid_amount
    
    # Update invoice status
    if inv.balance_amount == 0:
        inv.status = "Paid"
    elif inv.paid_amount > 0:
        inv.status = "Partially Paid"
    
    db.commit()
    return {"id": pay.id}


@api.get('/invoices/{invoice_id}/payments')
def list_payments(invoice_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail='Invoice not found')
    
    pays = db.query(Payment).filter(Payment.invoice_id == invoice_id).all()
    total_paid = float(sum([p.payment_amount for p in pays], 0))
    outstanding = float(inv.grand_total) - total_paid
    
    return {
        "payments": [{
            "id": p.id, 
            "payment_date": p.payment_date.isoformat(),
            "amount": float(p.payment_amount), 
            "method": p.payment_method, 
            "account_head": p.account_head,
            "reference_number": p.reference_number,
            "notes": p.notes
        } for p in pays], 
        "total_paid": total_paid, 
        "outstanding": outstanding
    }


@api.post('/purchases/{purchase_id}/payments', status_code=201)
def add_purchase_payment(purchase_id: int, payload: PurchasePaymentIn, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail='Purchase not found')
    
    pay = PurchasePayment(
        purchase_id=purchase_id, 
        payment_amount=money(payload.amount), 
        payment_method=payload.method, 
        account_head=payload.account_head,
        reference_number=payload.reference_number,
        notes=payload.notes
    )
    db.add(pay)
    
    # Update purchase paid amount
    purchase.paid_amount += money(payload.amount)
    purchase.balance_amount = purchase.grand_total - purchase.paid_amount
    
    # Update purchase status
    if purchase.balance_amount == 0:
        purchase.status = "Paid"
    elif purchase.paid_amount > 0:
        purchase.status = "Partially Paid"
    
    db.commit()
    return {"id": pay.id}


@api.get('/purchases/{purchase_id}/payments')
def list_purchase_payments(purchase_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail='Purchase not found')
    
    pays = db.query(PurchasePayment).filter(PurchasePayment.purchase_id == purchase_id).all()
    total_paid = float(sum([p.payment_amount for p in pays], 0))
    outstanding = float(purchase.grand_total) - total_paid
    
    return {
        "payments": [{
            "id": p.id, 
            "payment_date": p.payment_date.isoformat(),
            "amount": float(p.payment_amount), 
            "method": p.payment_method, 
            "account_head": p.account_head,
            "reference_number": p.reference_number,
            "notes": p.notes
        } for p in pays], 
        "total_paid": total_paid, 
        "outstanding": outstanding
    }


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
    include_inactive: bool = False,
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
    
    # Include inactive parties if requested
    if not include_inactive:
        query = query.filter(Party.is_active == True)
    
    return query.order_by(Party.name).all()


@api.get('/parties/customers', response_model=list[PartyOut])
def list_customers(
    search: str | None = None,
    include_inactive: bool = False,
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
    
    # Include inactive customers if requested
    if not include_inactive:
        query = query.filter(Party.is_active == True)
    
    return query.order_by(Party.name).all()


@api.get('/parties/vendors', response_model=list[PartyOut])
def list_vendors(
    search: str | None = None,
    include_inactive: bool = False,
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
    
    # Include inactive vendors if requested
    if not include_inactive:
        query = query.filter(Party.is_active == True)
    
    return query.order_by(Party.name).all()


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

