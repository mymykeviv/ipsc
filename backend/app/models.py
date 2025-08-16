from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Numeric, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from .db import Base


class Role(Base):
    __tablename__ = "roles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    role: Mapped[Role] = relationship()


class CompanySettings(Base):
    __tablename__ = "company_settings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    gstin: Mapped[str] = mapped_column(String(15), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    state_code: Mapped[str] = mapped_column(String(2), nullable=False)
    invoice_series: Mapped[str] = mapped_column(String(50), nullable=False)
    # GST System Settings
    gst_enabled_by_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    require_gstin_validation: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Party(Base):
    __tablename__ = "parties"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String(10), nullable=False)  # customer|vendor
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_person: Mapped[str | None] = mapped_column(String(100), nullable=True)
    contact_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(100), nullable=True)
    gstin: Mapped[str | None] = mapped_column(String(15), nullable=True)
    gst_registration_status: Mapped[str] = mapped_column(String(20), nullable=False, default="GST not registered")  # GST registered, GST not registered
    billing_address_line1: Mapped[str] = mapped_column(String(200), nullable=False)
    billing_address_line2: Mapped[str | None] = mapped_column(String(200), nullable=True)
    billing_city: Mapped[str] = mapped_column(String(100), nullable=False)
    billing_state: Mapped[str] = mapped_column(String(100), nullable=False)
    billing_country: Mapped[str] = mapped_column(String(100), nullable=False, default="India")
    billing_pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    shipping_address_line1: Mapped[str | None] = mapped_column(String(200), nullable=True)
    shipping_address_line2: Mapped[str | None] = mapped_column(String(200), nullable=True)
    shipping_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    shipping_state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    shipping_country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    shipping_pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    gst_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Product(Base):
    __tablename__ = "products"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # max length 100
    description: Mapped[str | None] = mapped_column(String(200), nullable=True)  # max length 200
    item_type: Mapped[str] = mapped_column(String(20), nullable=False, default="tradable")  # tradable, consumable, manufactured
    sales_price: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    purchase_price: Mapped[Numeric | None] = mapped_column(Numeric(12, 2), nullable=True)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # integer only
    sku: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)  # max length 50
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="Pcs")  # Kg, Pcs, Bucket, Litre, etc.
    supplier: Mapped[str | None] = mapped_column(String(100), nullable=True)  # max length 100
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)  # max length 100
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    hsn: Mapped[str | None] = mapped_column(String(10), nullable=True)
    gst_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class StockLedgerEntry(Base):
    __tablename__ = "stock_ledger"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    qty: Mapped[float] = mapped_column(Float, nullable=False)
    entry_type: Mapped[str] = mapped_column(String(10), nullable=False)  # in|out|adjust
    ref_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    ref_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Invoice(Base):
    __tablename__ = "invoices"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("parties.id"), nullable=False)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("parties.id"), nullable=False)  # New field for supplier
    invoice_no: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)  # max length 16 as per GST law
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    terms: Mapped[str] = mapped_column(String(20), nullable=False, default="Due on Receipt")
    
    # Invoice Details
    invoice_type: Mapped[str] = mapped_column(String(20), nullable=False, default="Invoice")  # Invoice, Credit Note, Debit Note
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")  # INR, USD, EUR, GBP, etc.
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Draft")  # Draft, Sent, Paid, Overdue, Partially Paid
    
    # GST Compliance Fields
    place_of_supply: Mapped[str] = mapped_column(String(100), nullable=False)
    place_of_supply_state_code: Mapped[str] = mapped_column(String(10), nullable=False)
    eway_bill_number: Mapped[str | None] = mapped_column(String(15), nullable=True)  # max length 15
    reverse_charge: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    export_supply: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    # Address Details
    bill_to_address: Mapped[str] = mapped_column(String(200), nullable=False)
    ship_to_address: Mapped[str] = mapped_column(String(200), nullable=False)
    
    # Amount Details
    taxable_value: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    total_discount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    cgst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    sgst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    igst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    utgst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)  # New field for UTGST
    cess: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)  # New field for CESS
    round_off: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)  # New field for round off
    grand_total: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    
    # Payment Tracking
    paid_amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    balance_amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    
    # Additional Fields
    notes: Mapped[str | None] = mapped_column(String(200), nullable=True)  # max length 200
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)





class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    invoice_id: Mapped[int] = mapped_column(ForeignKey("invoices.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    description: Mapped[str] = mapped_column(String(200), nullable=False)  # max length 200
    hsn_code: Mapped[str | None] = mapped_column(String(10), nullable=True)  # max length 10
    qty: Mapped[float] = mapped_column(Float, nullable=False)
    rate: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    discount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    discount_type: Mapped[str] = mapped_column(String(20), nullable=False, default="Percentage")  # Percentage, Fixed
    taxable_value: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    gst_rate: Mapped[float] = mapped_column(Float, nullable=False)
    cgst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    sgst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    igst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    utgst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)  # New field for UTGST
    cess: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)  # New field for CESS
    amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)


class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    invoice_id: Mapped[int] = mapped_column(ForeignKey("invoices.id"), nullable=False)
    payment_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    payment_amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)  # Cash, Bank Transfer, Cheque, UPI, etc.
    account_head: Mapped[str] = mapped_column(String(50), nullable=False)  # Cash, Bank, Funds, etc.
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Cheque number, UPI reference, etc.
    notes: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Purchase(Base):
    __tablename__ = "purchases"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("parties.id"), nullable=False)
    purchase_no: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)  # max length 16 as per GST law
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    terms: Mapped[str] = mapped_column(String(20), nullable=False, default="Due on Receipt")
    
    # GST Compliance Fields
    place_of_supply: Mapped[str] = mapped_column(String(100), nullable=False)
    place_of_supply_state_code: Mapped[str] = mapped_column(String(10), nullable=False)
    eway_bill_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reverse_charge: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    export_supply: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    # Address Details
    bill_from_address: Mapped[str] = mapped_column(String(200), nullable=False)
    ship_from_address: Mapped[str] = mapped_column(String(200), nullable=False)
    
    # Amount Details
    taxable_value: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    total_discount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    cgst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    sgst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    igst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    grand_total: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    
    # Payment Tracking
    paid_amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    balance_amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    
    # Additional Fields
    notes: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Draft")  # Draft, Received, Paid, Partially Paid
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class PurchaseItem(Base):
    __tablename__ = "purchase_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    purchase_id: Mapped[int] = mapped_column(ForeignKey("purchases.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    description: Mapped[str] = mapped_column(String(200), nullable=False)
    hsn_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    qty: Mapped[float] = mapped_column(Float, nullable=False)
    rate: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    discount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    discount_type: Mapped[str] = mapped_column(String(20), nullable=False, default="Percentage")  # Percentage, Fixed
    taxable_value: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    gst_rate: Mapped[float] = mapped_column(Float, nullable=False)
    cgst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    sgst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    igst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)


class PurchasePayment(Base):
    __tablename__ = "purchase_payments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    purchase_id: Mapped[int] = mapped_column(ForeignKey("purchases.id"), nullable=False)
    payment_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    payment_amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)  # Cash, Bank Transfer, Cheque, UPI, etc.
    account_head: Mapped[str] = mapped_column(String(50), nullable=False)  # Cash, Bank, Funds, etc.
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Cheque number, UPI reference, etc.
    notes: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Expense(Base):
    __tablename__ = "expenses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    expense_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    expense_type: Mapped[str] = mapped_column(String(100), nullable=False)  # Salary, Rent, Electricity, etc.
    category: Mapped[str] = mapped_column(String(100), nullable=False)  # Direct/COGS, Indirect/Operating
    subcategory: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str] = mapped_column(String(200), nullable=False)
    amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)  # Cash, Bank, UPI, etc.
    account_head: Mapped[str] = mapped_column(String(50), nullable=False)  # Cash, Bank, Funds, etc.
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    vendor_id: Mapped[int | None] = mapped_column(ForeignKey("parties.id"), nullable=True)
    gst_amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    gst_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    total_amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class CashflowTransaction(Base):
    __tablename__ = "cashflow_transactions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    transaction_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    type: Mapped[str] = mapped_column(String(10), nullable=False)  # inflow, outflow
    description: Mapped[str] = mapped_column(String(200), nullable=False)
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)  # Cash, Bank Transfer, Cheque, UPI, etc.
    amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    account_head: Mapped[str] = mapped_column(String(50), nullable=False)  # Cash, Bank, Funds, etc.
    
    # Reference fields for tracking source
    source_type: Mapped[str | None] = mapped_column(String(20), nullable=True)  # invoice, purchase, expense, payment
    source_id: Mapped[int | None] = mapped_column(Integer, nullable=True)  # ID of the source record
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class AuditTrail(Base):
    __tablename__ = "audit_trail"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    table_name: Mapped[str] = mapped_column(String(50), nullable=False)  # products, invoices, parties, etc.
    record_id: Mapped[int | None] = mapped_column(Integer, nullable=True)  # ID of the affected record
    old_values: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON of old values (for updates)
    new_values: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON of new values
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

