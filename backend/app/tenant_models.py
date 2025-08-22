from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from .db import Base


class Tenant(Base):
    """Multi-tenant organization model"""
    __tablename__ = "tenants"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)  # URL-friendly identifier
    domain: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Custom domain
    
    # Organization Details
    organization_type: Mapped[str] = mapped_column(String(50), nullable=False, default="business")  # dental_clinic, manufacturing, etc.
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    size: Mapped[str | None] = mapped_column(String(50), nullable=True)  # small, medium, large
    
    # Contact Information
    contact_person: Mapped[str | None] = mapped_column(String(100), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(100), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    
    # Address
    address_line1: Mapped[str | None] = mapped_column(String(200), nullable=True)
    address_line2: Mapped[str | None] = mapped_column(String(200), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True, default="India")
    pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    
    # Business Details
    gstin: Mapped[str | None] = mapped_column(String(15), nullable=True)
    pan: Mapped[str | None] = mapped_column(String(10), nullable=True)
    business_registration_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Subscription & Billing
    subscription_plan: Mapped[str] = mapped_column(String(50), nullable=False, default="basic")
    subscription_status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")  # active, suspended, cancelled
    subscription_start_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    subscription_end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Limits & Quotas
    max_users: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    max_products: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    max_transactions_per_month: Mapped[int] = mapped_column(Integer, nullable=False, default=10000)
    storage_limit_gb: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_trial: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    trial_end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    users: Mapped[list["TenantUser"]] = relationship("TenantUser", back_populates="tenant")
    settings: Mapped[list["TenantSettings"]] = relationship("TenantSettings", back_populates="tenant")


class TenantUser(Base):
    """User-tenant relationship for multi-tenancy"""
    __tablename__ = "tenant_users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    # Role within this tenant
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="user")  # owner, admin, manager, user
    permissions: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string of permissions
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_primary_contact: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    # Timestamps
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    last_access_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    tenant: Mapped[Tenant] = relationship("Tenant", back_populates="users")
    user: Mapped["User"] = relationship("User")
    
    # Unique constraint
    __table_args__ = (UniqueConstraint('tenant_id', 'user_id', name='uq_tenant_user'),)


class TenantSettings(Base):
    """Tenant-specific settings and configuration"""
    __tablename__ = "tenant_settings"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    
    # Setting category and key
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # branding, gst, invoice, etc.
    setting_key: Mapped[str] = mapped_column(String(100), nullable=False)
    setting_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    setting_type: Mapped[str] = mapped_column(String(20), nullable=False, default="string")  # string, number, boolean, json
    
    # Metadata
    description: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_editable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant] = relationship("Tenant", back_populates="settings")
    
    # Unique constraint
    __table_args__ = (UniqueConstraint('tenant_id', 'category', 'setting_key', name='uq_tenant_setting'),)


class TenantBranding(Base):
    """Tenant-specific branding and customization"""
    __tablename__ = "tenant_branding"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, unique=True)
    
    # Logo and Branding
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    logo_alt_text: Mapped[str | None] = mapped_column(String(100), nullable=True)
    favicon_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Color Scheme
    primary_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#2c3e50")
    secondary_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#3498db")
    accent_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#e74c3c")
    background_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#ffffff")
    text_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#2c3e50")
    
    # Typography
    primary_font: Mapped[str] = mapped_column(String(50), nullable=False, default="Inter")
    secondary_font: Mapped[str] = mapped_column(String(50), nullable=False, default="Inter")
    
    # Custom CSS
    custom_css: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Invoice Branding
    invoice_header_text: Mapped[str] = mapped_column(String(100), nullable=False, default="TAX INVOICE")
    invoice_footer_text: Mapped[str] = mapped_column(String(200), nullable=False, default="Thank you for your business!")
    invoice_terms_text: Mapped[str] = mapped_column(String(200), nullable=False, default="Payment is due within the terms specified above.")
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class TenantDomain(Base):
    """Custom domains for tenants"""
    __tablename__ = "tenant_domains"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    domain: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    
    # SSL and DNS
    ssl_certificate: Mapped[str | None] = mapped_column(Text, nullable=True)
    ssl_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    dns_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
