from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Numeric, Text, Date
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, date
from .db import Base
from .tenant_models import Tenant, TenantUser, TenantSettings, TenantBranding, TenantDomain


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
    role: Mapped[Role] = relationship()
    tenant: Mapped[Tenant | None] = relationship("Tenant")


class CompanySettings(Base):
    __tablename__ = "company_settings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    gstin: Mapped[str] = mapped_column(String(15), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    state_code: Mapped[str] = mapped_column(String(2), nullable=False)
    invoice_series: Mapped[str] = mapped_column(String(50), nullable=False)
    # Address & Contact (single-tenant authoritative fields)
    address_line1: Mapped[str | None] = mapped_column(String(200), nullable=True)
    address_line2: Mapped[str | None] = mapped_column(String(200), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # GST System Settings
    gst_enabled_by_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    require_gstin_validation: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    tenant: Mapped[Tenant | None] = relationship("Tenant")


class Party(Base):
    __tablename__ = "parties"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    gstin: Mapped[str | None] = mapped_column(String(15), nullable=True)
    gst_enabled: Mapped[bool] = mapped_column(Boolean, nullable=True)
    contact_person: Mapped[str | None] = mapped_column(String(100), nullable=True)
    contact_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(100), nullable=True)
    billing_address_line1: Mapped[str | None] = mapped_column(String(200), nullable=True)
    billing_address_line2: Mapped[str | None] = mapped_column(String(200), nullable=True)
    billing_city: Mapped[str | None] = mapped_column(String(50), nullable=True)
    billing_state: Mapped[str | None] = mapped_column(String(50), nullable=True)
    billing_country: Mapped[str | None] = mapped_column(String(50), nullable=True, default="India")
    billing_pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    shipping_address_line1: Mapped[str | None] = mapped_column(String(200), nullable=True)
    shipping_address_line2: Mapped[str | None] = mapped_column(String(200), nullable=True)
    shipping_city: Mapped[str | None] = mapped_column(String(50), nullable=True)
    shipping_state: Mapped[str | None] = mapped_column(String(50), nullable=True)
    shipping_country: Mapped[str | None] = mapped_column(String(50), nullable=True)
    shipping_pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    gst_registration_status: Mapped[str | None] = mapped_column(String(50), nullable=True, default="GST not registered")
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=True, default=True)
    is_customer: Mapped[bool] = mapped_column(Boolean, nullable=True)
    is_vendor: Mapped[bool] = mapped_column(Boolean, nullable=True)
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    
    @property
    def type(self) -> str:
        """Convert boolean flags to type string for API compatibility"""
        if self.is_vendor:
            return "vendor"
        elif self.is_customer:
            return "customer"
        else:
            return "customer"  # Default to customer


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
    invoice_id: Mapped[int | None] = mapped_column(ForeignKey("invoices.id"), nullable=True)
    amount: Mapped[Numeric | None] = mapped_column(Numeric(12, 2), nullable=True)
    payment_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Cash, Bank Transfer, Cheque, UPI, etc.
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Cheque number, UPI reference, etc.
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tenant: Mapped[Tenant | None] = relationship("Tenant")


class Purchase(Base):
    __tablename__ = "purchases"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("parties.id"), nullable=False)
    purchase_no: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)  # max length 16 as per GST law
    reference_bill_number: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Vendor's bill/invoice number
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
    expected_rate: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    discount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    discount_type: Mapped[str] = mapped_column(String(20), nullable=False, default="Percentage")
    gst_rate: Mapped[float] = mapped_column(Float, nullable=False)
    amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


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


class GSTInvoiceTemplate(Base):
    """GST Invoice Template Model for the 5 pre-defined templates"""
    __tablename__ = "gst_invoice_templates"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Template Identification
    template_id: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)  # e.g., "GST_TABULAR_A4A5_V1"
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Template Requirements
    requires_gst: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    requires_hsn: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    title: Mapped[str] = mapped_column(String(50), nullable=False, default="Tax Invoice")
    
    # Template Configuration
    template_config: Mapped[str] = mapped_column(Text, nullable=False)  # JSON configuration
    paper_sizes: Mapped[str] = mapped_column(String(50), nullable=False, default="A4,A5")  # comma-separated
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")


# Dental Clinic Models
class Patient(Base):
    """Dental patient information"""
    __tablename__ = "patients"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Basic Information
    patient_id: Mapped[str] = mapped_column(String(20), nullable=False)  # Clinic-specific patient ID
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)  # Male, Female, Other
    
    # Contact Information
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str | None] = mapped_column(String(100), nullable=True)
    emergency_contact: Mapped[str | None] = mapped_column(String(100), nullable=True)
    emergency_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    
    # Address
    address_line1: Mapped[str] = mapped_column(String(200), nullable=False)
    address_line2: Mapped[str | None] = mapped_column(String(200), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    pincode: Mapped[str] = mapped_column(String(10), nullable=False)
    
    # Medical Information
    blood_group: Mapped[str | None] = mapped_column(String(5), nullable=True)
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    medical_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    current_medications: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Dental Information
    dental_insurance: Mapped[str | None] = mapped_column(String(100), nullable=True)
    insurance_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    insurance_provider: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    registration_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    last_visit_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Additional Information
    occupation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    referred_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    appointments: Mapped[list["Appointment"]] = relationship("Appointment", back_populates="patient")
    treatments: Mapped[list["Treatment"]] = relationship("Treatment", back_populates="patient")
    medical_history: Mapped[list["MedicalHistory"]] = relationship("MedicalHistory", back_populates="patient")


class Appointment(Base):
    """Dental appointment scheduling"""
    __tablename__ = "appointments"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Appointment Details
    appointment_id: Mapped[str] = mapped_column(String(20), nullable=False)  # Clinic-specific appointment ID
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    doctor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    # Scheduling
    appointment_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    
    # Appointment Type
    appointment_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Consultation, Cleaning, Treatment, Follow-up
    treatment_type: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Specific treatment if applicable
    
    # Status
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Scheduled")  # Scheduled, Confirmed, In Progress, Completed, Cancelled, No Show
    confirmation_status: Mapped[str] = mapped_column(String(20), nullable=False, default="Pending")  # Pending, Confirmed, Reminder Sent
    
    # Notes
    patient_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    doctor_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Reminders
    reminder_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reminder_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    patient: Mapped["Patient"] = relationship("Patient", back_populates="appointments")
    doctor: Mapped["User"] = relationship("User")
    treatments: Mapped[list["Treatment"]] = relationship("Treatment", back_populates="appointment")


class Treatment(Base):
    """Dental treatment records"""
    __tablename__ = "treatments"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Treatment Details
    treatment_id: Mapped[str] = mapped_column(String(20), nullable=False)  # Clinic-specific treatment ID
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    appointment_id: Mapped[int | None] = mapped_column(ForeignKey("appointments.id"), nullable=True)
    doctor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    # Treatment Information
    treatment_type: Mapped[str] = mapped_column(String(100), nullable=False)  # Root Canal, Filling, Extraction, etc.
    treatment_category: Mapped[str] = mapped_column(String(50), nullable=False)  # Preventive, Restorative, Surgical, Cosmetic
    tooth_numbers: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Comma-separated tooth numbers
    
    # Treatment Details
    diagnosis: Mapped[str] = mapped_column(Text, nullable=False)
    treatment_plan: Mapped[str] = mapped_column(Text, nullable=False)
    procedure_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    post_treatment_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Treatment Status
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Planned")  # Planned, In Progress, Completed, Cancelled
    treatment_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completion_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Follow-up
    follow_up_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    follow_up_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    follow_up_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Cost Information
    estimated_cost: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    actual_cost: Mapped[Numeric | None] = mapped_column(Numeric(10, 2), nullable=True)
    insurance_coverage: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    patient_share: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    patient: Mapped["Patient"] = relationship("Patient", back_populates="treatments")
    appointment: Mapped["Appointment"] = relationship("Appointment", back_populates="treatments")
    doctor: Mapped["User"] = relationship("User")
    treatment_items: Mapped[list["TreatmentItem"]] = relationship("TreatmentItem", back_populates="treatment")


class TreatmentItem(Base):
    """Individual items/procedures within a treatment"""
    __tablename__ = "treatment_items"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Treatment Item Details
    treatment_id: Mapped[int] = mapped_column(ForeignKey("treatments.id"), nullable=False)
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    item_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Procedure Details
    procedure_code: Mapped[str | None] = mapped_column(String(20), nullable=True)  # Dental procedure codes
    tooth_number: Mapped[str | None] = mapped_column(String(10), nullable=True)
    surface: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Mesial, Distal, Buccal, Lingual, Occlusal
    
    # Cost Information
    unit_cost: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    total_cost: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    
    # Status
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Planned")  # Planned, Completed, Cancelled
    completion_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    treatment: Mapped["Treatment"] = relationship("Treatment", back_populates="treatment_items")


class MedicalHistory(Base):
    """Patient medical history records"""
    __tablename__ = "medical_history"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Medical History Details
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    record_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    record_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Medical, Dental, Surgical, Allergy
    
    # Record Information
    condition: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[str | None] = mapped_column(String(20), nullable=True)  # Mild, Moderate, Severe
    
    # Treatment Information
    treatment_received: Mapped[str | None] = mapped_column(Text, nullable=True)
    medications: Mapped[str | None] = mapped_column(Text, nullable=True)
    outcome: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Resolved, Ongoing, Chronic
    
    # Dates
    onset_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    resolution_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    
    # Healthcare Provider
    provider_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    provider_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Doctor, Dentist, Specialist
    
    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    patient: Mapped["Patient"] = relationship("Patient", back_populates="medical_history")


class DentalSupply(Base):
    """Dental supplies and materials inventory"""
    __tablename__ = "dental_supplies"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Supply Information
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)  # Consumables, Equipment, Materials
    subcategory: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Anesthetics, Fillings, etc.
    
    # Product Details
    sku: Mapped[str | None] = mapped_column(String(50), nullable=True)
    brand: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Inventory
    current_stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    minimum_stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    maximum_stock: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="Pieces")
    
    # Cost Information
    unit_cost: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    selling_price: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    
    # Supplier Information
    supplier_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    supplier_contact: Mapped[str | None] = mapped_column(String(100), nullable=True)
    supplier_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_sterile: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    requires_refrigeration: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    # Expiry and Lot
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    lot_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")


class TreatmentSupplyUsage(Base):
    """Track supplies used in treatments"""
    __tablename__ = "treatment_supply_usage"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Usage Details
    treatment_id: Mapped[int] = mapped_column(ForeignKey("treatments.id"), nullable=False)
    supply_id: Mapped[int] = mapped_column(ForeignKey("dental_supplies.id"), nullable=False)
    
    # Usage Information
    quantity_used: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    unit_cost: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total_cost: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    
    # Usage Details
    usage_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    treatment: Mapped["Treatment"] = relationship("Treatment")
    supply: Mapped["DentalSupply"] = relationship("DentalSupply")
    user: Mapped["User"] = relationship("User")


# Manufacturing Models
class BillOfMaterials(Base):
    """Bill of Materials (BOM) for manufacturing"""
    __tablename__ = "bill_of_materials"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # BOM Information
    bom_id: Mapped[str] = mapped_column(String(20), nullable=False)  # Manufacturing-specific BOM ID
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[str] = mapped_column(String(20), nullable=False, default="1.0")
    
    # Product Information
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    product_quantity: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    product_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="Pieces")
    
    # BOM Details
    bom_type: Mapped[str] = mapped_column(String(50), nullable=False, default="Production")  # Production, Engineering, Costing
    revision_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    
    # Cost Information
    total_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    labor_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    overhead_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    
    # Status
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Draft")  # Draft, Approved, Active, Obsolete
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    
    # Approval
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    product: Mapped["Product"] = relationship("Product")
    approved_by_user: Mapped["User"] = relationship("User")
    bom_components: Mapped[list["BOMComponent"]] = relationship("BOMComponent", back_populates="bom")
    production_orders: Mapped[list["ProductionOrder"]] = relationship("ProductionOrder", back_populates="bom")


class BOMComponent(Base):
    """Individual components in a Bill of Materials"""
    __tablename__ = "bom_components"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Component Details
    bom_id: Mapped[int] = mapped_column(ForeignKey("bill_of_materials.id"), nullable=False)
    component_product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    
    # Quantity Information
    quantity_required: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    quantity_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="Pieces")
    scrap_factor: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)  # Percentage of scrap/waste
    total_quantity: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)  # Including scrap
    
    # Cost Information
    unit_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    
    # Component Details
    component_type: Mapped[str] = mapped_column(String(50), nullable=False, default="Raw Material")  # Raw Material, Sub-Assembly, Consumable
    position: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Position in assembly
    operation_sequence: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    
    # Status
    is_critical: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_optional: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    bom: Mapped["BillOfMaterials"] = relationship("BillOfMaterials", back_populates="bom_components")
    component_product: Mapped["Product"] = relationship("Product")


class ProductionOrder(Base):
    """Production orders for manufacturing"""
    __tablename__ = "production_orders"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Production Order Details
    production_order_id: Mapped[str] = mapped_column(String(20), nullable=False)  # Manufacturing-specific PO ID
    bom_id: Mapped[int] = mapped_column(ForeignKey("bill_of_materials.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    
    # Production Information
    quantity_to_produce: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    quantity_produced: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    quantity_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="Pieces")
    
    # Scheduling
    planned_start_date: Mapped[date] = mapped_column(Date, nullable=False)
    planned_end_date: Mapped[date] = mapped_column(Date, nullable=False)
    actual_start_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    actual_end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Priority and Status
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="Normal")  # Low, Normal, High, Urgent
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Planned")  # Planned, In Progress, Completed, Cancelled, On Hold
    
    # Cost Information
    estimated_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    actual_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    labor_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    material_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    overhead_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    
    # Quality Control
    quality_check_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    quality_check_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    quality_check_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    quality_check_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    # Assignment
    assigned_to: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    supervisor: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    # Notes
    production_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    quality_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    bom: Mapped["BillOfMaterials"] = relationship("BillOfMaterials", back_populates="production_orders")
    product: Mapped["Product"] = relationship("Product")
    assigned_to_user: Mapped["User"] = relationship("User", foreign_keys=[assigned_to])
    supervisor_user: Mapped["User"] = relationship("User", foreign_keys=[supervisor])
    quality_check_user: Mapped["User"] = relationship("User", foreign_keys=[quality_check_by])
    production_steps: Mapped[list["ProductionStep"]] = relationship("ProductionStep", back_populates="production_order")
    material_consumption: Mapped[list["MaterialConsumption"]] = relationship("MaterialConsumption", back_populates="production_order")


class ProductionStep(Base):
    """Individual steps in production process"""
    __tablename__ = "production_steps"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Step Details
    production_order_id: Mapped[int] = mapped_column(ForeignKey("production_orders.id"), nullable=False)
    step_name: Mapped[str] = mapped_column(String(200), nullable=False)
    step_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Sequence and Timing
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    actual_duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Pending")  # Pending, In Progress, Completed, Skipped
    start_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Assignment
    assigned_to: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    # Quality Check
    quality_check_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    quality_check_passed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    quality_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Notes
    step_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    production_order: Mapped["ProductionOrder"] = relationship("ProductionOrder", back_populates="production_steps")
    assigned_to_user: Mapped["User"] = relationship("User")


class MaterialConsumption(Base):
    """Track material consumption during production"""
    __tablename__ = "material_consumption"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Consumption Details
    production_order_id: Mapped[int] = mapped_column(ForeignKey("production_orders.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    
    # Quantity Information
    quantity_planned: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    quantity_consumed: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    quantity_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="Pieces")
    
    # Cost Information
    unit_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    
    # Consumption Details
    consumption_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    consumed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    production_order: Mapped["ProductionOrder"] = relationship("ProductionOrder", back_populates="material_consumption")
    product: Mapped["Product"] = relationship("Product")
    consumed_by_user: Mapped["User"] = relationship("User")


class WorkCenter(Base):
    """Manufacturing work centers/stations"""
    __tablename__ = "work_centers"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Work Center Information
    work_center_id: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Location and Capacity
    location: Mapped[str | None] = mapped_column(String(100), nullable=True)
    capacity_per_hour: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    capacity_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="Pieces")
    
    # Equipment and Resources
    equipment_list: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string of equipment
    required_skills: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string of required skills
    
    # Cost Information
    hourly_rate: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    setup_cost: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    
    # Maintenance
    last_maintenance_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_maintenance_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    maintenance_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")


class QualityControl(Base):
    """Quality control records for production"""
    __tablename__ = "quality_control"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Quality Control Details
    production_order_id: Mapped[int] = mapped_column(ForeignKey("production_orders.id"), nullable=False)
    inspection_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    inspector_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    # Inspection Details
    inspection_type: Mapped[str] = mapped_column(String(50), nullable=False)  # In-Process, Final, Sampling
    quantity_inspected: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    quantity_passed: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    quantity_failed: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    
    # Quality Metrics
    pass_rate: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    defect_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    
    # Defect Information
    defect_types: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string of defect types and counts
    defect_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Corrective Actions
    corrective_action_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    corrective_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    action_taken_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action_taken_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Overall Result
    overall_result: Mapped[str] = mapped_column(String(20), nullable=False, default="Pass")  # Pass, Fail, Conditional Pass
    
    # Notes
    inspection_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    production_order: Mapped["ProductionOrder"] = relationship("ProductionOrder")
    inspector: Mapped["User"] = relationship("User", foreign_keys=[inspector_id])
    action_taken_user: Mapped["User"] = relationship("User", foreign_keys=[action_taken_by])

