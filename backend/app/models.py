from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Numeric, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from .db import Base
from .tenant_models import Tenant


class Role(Base):
    __tablename__ = "roles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    role: Mapped[Role] = relationship()
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    tenant: Mapped[Tenant | None] = relationship("Tenant")


class CompanySettings(Base):
    __tablename__ = "company_settings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    gstin: Mapped[str] = mapped_column(String(15), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    state_code: Mapped[str] = mapped_column(String(2), nullable=False)
    invoice_series: Mapped[str] = mapped_column(String(50), nullable=False)
    # GST System Settings
    gst_enabled_by_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    require_gstin_validation: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    tenant: Mapped[Tenant | None] = relationship("Tenant")


class Party(Base):
    __tablename__ = "parties"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
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
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    gst_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Product(Base):
    __tablename__ = "products"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
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
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class StockLedgerEntry(Base):
    __tablename__ = "stock_ledger"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    qty: Mapped[float] = mapped_column(Float, nullable=False)
    entry_type: Mapped[str] = mapped_column(String(10), nullable=False)  # in|out|adjust
    ref_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    ref_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Invoice(Base):
    __tablename__ = "invoices"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("parties.id"), nullable=False)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("parties.id"), nullable=False)  # New field for supplier
    invoice_no: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)  # max length 16 as per GST law
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    terms: Mapped[str] = mapped_column(String(20), nullable=False, default="Due on Receipt")
    
    # Invoice Details
    invoice_type: Mapped[str] = mapped_column(String(20), nullable=False, default="Invoice")  # Invoice, Credit Note, Debit Note
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")  # INR, USD, EUR, GBP, etc.
    exchange_rate: Mapped[Numeric] = mapped_column(Numeric(10, 4), nullable=False, default=1.0)  # Exchange rate to INR
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
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)





class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
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
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)


class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    invoice_id: Mapped[int] = mapped_column(ForeignKey("invoices.id"), nullable=False)
    payment_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    payment_amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)  # Cash, Bank Transfer, Cheque, UPI, etc.
    account_head: Mapped[str] = mapped_column(String(50), nullable=False)  # Cash, Bank, Funds, etc.
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Cheque number, UPI reference, etc.
    notes: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Purchase(Base):
    __tablename__ = "purchases"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
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
    utgst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)  # UTGST for Union Territories
    cess: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)  # CESS amount
    round_off: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)  # Round off amount
    grand_total: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    
    # Payment Tracking
    paid_amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    balance_amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    
    # Additional Fields
    notes: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Draft")  # Draft, Received, Paid, Partially Paid
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class PurchaseItem(Base):
    __tablename__ = "purchase_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
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
    utgst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)  # UTGST for Union Territories
    cess: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)  # CESS amount
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)


class PurchasePayment(Base):
    __tablename__ = "purchase_payments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    purchase_id: Mapped[int] = mapped_column(ForeignKey("purchases.id"), nullable=False)
    payment_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    payment_amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)  # Cash, Bank Transfer, Cheque, UPI, etc.
    account_head: Mapped[str] = mapped_column(String(50), nullable=False)  # Cash, Bank, Funds, etc.
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Cheque number, UPI reference, etc.
    notes: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Expense(Base):
    __tablename__ = "expenses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
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
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# CashflowTransaction model removed - using source tables directly via CashflowService


class AuditTrail(Base):
    __tablename__ = "audit_trail"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    table_name: Mapped[str] = mapped_column(String(50), nullable=False)  # products, invoices, parties, etc.
    record_id: Mapped[int | None] = mapped_column(Integer, nullable=True)  # ID of the affected record
    old_values: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON of old values (for updates)
    new_values: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON of new values
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class RecurringInvoiceTemplate(Base):
    __tablename__ = "recurring_invoice_templates"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey("parties.id"), nullable=False)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("parties.id"), nullable=False)
    
    # Recurrence Settings
    recurrence_type: Mapped[str] = mapped_column(String(20), nullable=False)  # weekly, monthly, yearly
    recurrence_interval: Mapped[int] = mapped_column(Integer, nullable=False, default=1)  # every X weeks/months/years
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)  # null for indefinite
    next_generation_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    # Invoice Settings
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    exchange_rate: Mapped[Numeric] = mapped_column(Numeric(10, 4), nullable=False, default=1.0)
    terms: Mapped[str] = mapped_column(String(20), nullable=False, default="Due on Receipt")
    place_of_supply: Mapped[str] = mapped_column(String(100), nullable=False)
    place_of_supply_state_code: Mapped[str] = mapped_column(String(10), nullable=False)
    bill_to_address: Mapped[str] = mapped_column(String(200), nullable=False)
    ship_to_address: Mapped[str] = mapped_column(String(200), nullable=False)
    notes: Mapped[str | None] = mapped_column(String(200), nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class RecurringInvoiceTemplateItem(Base):
    __tablename__ = "recurring_invoice_template_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    template_id: Mapped[int] = mapped_column(ForeignKey("recurring_invoice_templates.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    description: Mapped[str] = mapped_column(String(200), nullable=False)
    hsn_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    qty: Mapped[float] = mapped_column(Float, nullable=False)
    rate: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    discount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    discount_type: Mapped[str] = mapped_column(String(20), nullable=False, default="Percentage")
    gst_rate: Mapped[float] = mapped_column(Float, nullable=False)
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class RecurringInvoice(Base):
    __tablename__ = "recurring_invoices"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    template_id: Mapped[int] = mapped_column(ForeignKey("recurring_invoice_templates.id"), nullable=False)
    invoice_id: Mapped[int] = mapped_column(ForeignKey("invoices.id"), nullable=False)
    generation_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Generated")  # Generated, Sent, Paid
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("parties.id"), nullable=False)
    po_number: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    expected_delivery_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    # PO Details
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Draft")  # Draft, Approved, Sent, Received, Closed, Cancelled
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    exchange_rate: Mapped[Numeric] = mapped_column(Numeric(10, 4), nullable=False, default=1.0)
    terms: Mapped[str] = mapped_column(String(20), nullable=False, default="Net 30")
    
    # GST Compliance Fields
    place_of_supply: Mapped[str] = mapped_column(String(100), nullable=False)
    place_of_supply_state_code: Mapped[str] = mapped_column(String(10), nullable=False)
    reverse_charge: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    # Address Details
    ship_from_address: Mapped[str] = mapped_column(String(200), nullable=False)
    ship_to_address: Mapped[str] = mapped_column(String(200), nullable=False)
    
    # Amount Details
    subtotal: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total_discount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    cgst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    sgst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    igst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    utgst: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    cess: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    round_off: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    grand_total: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    
    # Workflow Fields
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    received_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Additional Fields
    notes: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    purchase_order_id: Mapped[int] = mapped_column(ForeignKey("purchase_orders.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    description: Mapped[str] = mapped_column(String(200), nullable=False)
    hsn_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    qty: Mapped[float] = mapped_column(Float, nullable=False)
    expected_rate: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    discount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    discount_type: Mapped[str] = mapped_column(String(20), nullable=False, default="Percentage")
    gst_rate: Mapped[float] = mapped_column(Float, nullable=False)
    amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class InvoiceTemplate(Base):
    __tablename__ = "invoice_templates"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(200), nullable=True)
    
    # Template Design Settings
    template_type: Mapped[str] = mapped_column(String(20), nullable=False, default="professional")  # professional, modern, classic, minimal
    primary_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#2c3e50")  # Hex color
    secondary_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#3498db")  # Hex color
    accent_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#e74c3c")  # Hex color
    
    # Typography Settings
    header_font: Mapped[str] = mapped_column(String(50), nullable=False, default="Helvetica-Bold")
    body_font: Mapped[str] = mapped_column(String(50), nullable=False, default="Helvetica")
    header_font_size: Mapped[int] = mapped_column(Integer, nullable=False, default=18)
    body_font_size: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    
    # Layout Settings
    show_logo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    logo_position: Mapped[str] = mapped_column(String(20), nullable=False, default="top-left")  # top-left, top-right, center
    show_company_details: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_customer_details: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_supplier_details: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_terms: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_notes: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_footer: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    
    # Content Settings
    header_text: Mapped[str] = mapped_column(String(100), nullable=False, default="TAX INVOICE")
    footer_text: Mapped[str] = mapped_column(String(200), nullable=False, default="Thank you for your business!")
    terms_text: Mapped[str] = mapped_column(String(200), nullable=False, default="Payment is due within the terms specified above.")
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

