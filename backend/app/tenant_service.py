"""
Multi-Tenant Management Service
Handles tenant creation, management, and data isolation
"""

import logging
from typing import Dict, Any, Optional, List, Union
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
import json
import re
from .models import Tenant, TenantUser, TenantSettings, TenantBranding, User, CompanySettings, Product, Invoice, Purchase
from .db import get_db
from .auth import get_password_hash

logger = logging.getLogger(__name__)


class TenantService:
    """Service for managing multi-tenant operations"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def create_tenant(
        self, 
        db: Session,
        name: str,
        slug: str,
        organization_type: str = "business",
        contact_person: Optional[str] = None,
        contact_email: Optional[str] = None,
        contact_phone: Optional[str] = None,
        gstin: Optional[str] = None,
        **kwargs
    ) -> Tenant:
        """
        Create a new tenant with default settings
        
        Args:
            db: Database session
            name: Tenant organization name
            slug: URL-friendly identifier
            organization_type: Type of organization (dental_clinic, manufacturing, etc.)
            contact_person: Primary contact person
            contact_email: Contact email
            contact_phone: Contact phone
            gstin: GST registration number
            **kwargs: Additional tenant properties
        
        Returns:
            Created tenant object
        """
        try:
            # Validate slug format
            if not re.match(r'^[a-z0-9-]+$', slug):
                raise ValueError("Slug must contain only lowercase letters, numbers, and hyphens")
            
            # Check if slug already exists
            existing_tenant = db.query(Tenant).filter(Tenant.slug == slug).first()
            if existing_tenant:
                raise ValueError(f"Tenant with slug '{slug}' already exists")
            
            # Create tenant
            tenant = Tenant(
                name=name,
                slug=slug,
                organization_type=organization_type,
                contact_person=contact_person,
                contact_email=contact_email,
                contact_phone=contact_phone,
                gstin=gstin,
                **kwargs
            )
            
            db.add(tenant)
            db.flush()  # Get the tenant ID
            
            # Create default tenant branding
            branding = TenantBranding(
                tenant_id=tenant.id,
                primary_color="#2c3e50",
                secondary_color="#3498db",
                accent_color="#e74c3c"
            )
            db.add(branding)
            
            # Create default tenant settings
            default_settings = self._get_default_settings(organization_type)
            for setting in default_settings:
                db.add(setting)
            
            db.commit()
            self.logger.info(f"Created tenant: {tenant.name} (ID: {tenant.id})")
            return tenant
            
        except Exception as e:
            db.rollback()
            self.logger.error(f"Failed to create tenant: {str(e)}")
            raise
    
    def _get_default_settings(self, organization_type: str) -> List[TenantSettings]:
        """Get default settings for organization type"""
        settings = []
        
        # Common settings
        common_settings = [
            ("gst", "gst_enabled", "true", "boolean", "Enable GST for this tenant"),
            ("invoice", "default_currency", "INR", "string", "Default currency for invoices"),
            ("invoice", "default_terms", "Due on Receipt", "string", "Default payment terms"),
            ("branding", "show_logo", "true", "boolean", "Show company logo on invoices"),
            ("security", "session_timeout_minutes", "480", "number", "Session timeout in minutes"),
        ]
        
        # Organization-specific settings
        if organization_type == "dental_clinic":
            org_settings = [
                ("dental", "patient_management_enabled", "true", "boolean", "Enable patient management"),
                ("dental", "appointment_scheduling", "true", "boolean", "Enable appointment scheduling"),
                ("dental", "treatment_tracking", "true", "boolean", "Enable treatment tracking"),
            ]
        elif organization_type == "manufacturing":
            org_settings = [
                ("manufacturing", "bom_management", "true", "boolean", "Enable BOM management"),
                ("manufacturing", "production_tracking", "true", "boolean", "Enable production tracking"),
                ("manufacturing", "material_management", "true", "boolean", "Enable material management"),
            ]
        else:
            org_settings = []
        
        # Create TenantSettings objects
        for category, key, value, setting_type, description in common_settings + org_settings:
            setting = TenantSettings(
                category=category,
                setting_key=key,
                setting_value=value,
                setting_type=setting_type,
                description=description,
                is_editable=True,
                is_required=False
            )
            settings.append(setting)
        
        return settings
    
    def get_tenant_by_slug(self, db: Session, slug: str) -> Optional[Tenant]:
        """Get tenant by slug"""
        return db.query(Tenant).filter(Tenant.slug == slug).first()
    
    def get_tenant_by_id(self, db: Session, tenant_id: int) -> Optional[Tenant]:
        """Get tenant by ID"""
        return db.query(Tenant).filter(Tenant.id == tenant_id).first()
    
    def get_tenant_by_domain(self, db: Session, domain: str) -> Optional[Tenant]:
        """Get tenant by custom domain"""
        return db.query(Tenant).filter(Tenant.domain == domain).first()
    
    def list_tenants(
        self, 
        db: Session, 
        active_only: bool = True,
        organization_type: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[Tenant]:
        """List tenants with optional filtering"""
        query = db.query(Tenant)
        
        if active_only:
            query = query.filter(Tenant.is_active == True)
        
        if organization_type:
            query = query.filter(Tenant.organization_type == organization_type)
        
        if offset:
            query = query.offset(offset)
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    def update_tenant(
        self, 
        db: Session, 
        tenant_id: int, 
        updates: Dict[str, Any]
    ) -> Optional[Tenant]:
        """Update tenant information"""
        tenant = self.get_tenant_by_id(db, tenant_id)
        if not tenant:
            return None
        
        # Update allowed fields
        allowed_fields = [
            'name', 'domain', 'organization_type', 'industry', 'size',
            'contact_person', 'contact_email', 'contact_phone',
            'address_line1', 'address_line2', 'city', 'state', 'country', 'pincode',
            'gstin', 'pan', 'business_registration_number',
            'subscription_plan', 'subscription_status',
            'max_users', 'max_products', 'max_transactions_per_month', 'storage_limit_gb',
            'is_active', 'is_trial', 'trial_end_date'
        ]
        
        for field, value in updates.items():
            if field in allowed_fields and hasattr(tenant, field):
                setattr(tenant, field, value)
        
        tenant.updated_at = datetime.utcnow()
        db.commit()
        
        self.logger.info(f"Updated tenant: {tenant.name} (ID: {tenant.id})")
        return tenant
    
    def delete_tenant(self, db: Session, tenant_id: int) -> bool:
        """Delete tenant (soft delete by setting is_active=False)"""
        tenant = self.get_tenant_by_id(db, tenant_id)
        if not tenant:
            return False
        
        tenant.is_active = False
        tenant.updated_at = datetime.utcnow()
        db.commit()
        
        self.logger.info(f"Deleted tenant: {tenant.name} (ID: {tenant.id})")
        return True
    
    def add_user_to_tenant(
        self, 
        db: Session, 
        tenant_id: int, 
        user_id: int, 
        role: str = "user",
        permissions: Optional[Dict[str, Any]] = None,
        is_primary_contact: bool = False
    ) -> TenantUser:
        """Add user to tenant"""
        # Check if user is already in tenant
        existing = db.query(TenantUser).filter(
            and_(TenantUser.tenant_id == tenant_id, TenantUser.user_id == user_id)
        ).first()
        
        if existing:
            raise ValueError(f"User {user_id} is already a member of tenant {tenant_id}")
        
        tenant_user = TenantUser(
            tenant_id=tenant_id,
            user_id=user_id,
            role=role,
            permissions=json.dumps(permissions) if permissions else None,
            is_primary_contact=is_primary_contact
        )
        
        db.add(tenant_user)
        db.commit()
        
        self.logger.info(f"Added user {user_id} to tenant {tenant_id} with role {role}")
        return tenant_user
    
    def remove_user_from_tenant(self, db: Session, tenant_id: int, user_id: int) -> bool:
        """Remove user from tenant"""
        tenant_user = db.query(TenantUser).filter(
            and_(TenantUser.tenant_id == tenant_id, TenantUser.user_id == user_id)
        ).first()
        
        if not tenant_user:
            return False
        
        db.delete(tenant_user)
        db.commit()
        
        self.logger.info(f"Removed user {user_id} from tenant {tenant_id}")
        return True
    
    def get_tenant_users(
        self, 
        db: Session, 
        tenant_id: int, 
        active_only: bool = True
    ) -> List[TenantUser]:
        """Get all users for a tenant"""
        query = db.query(TenantUser).filter(TenantUser.tenant_id == tenant_id)
        
        if active_only:
            query = query.filter(TenantUser.is_active == True)
        
        return query.all()
    
    def get_user_tenants(self, db: Session, user_id: int) -> List[TenantUser]:
        """Get all tenants for a user"""
        return db.query(TenantUser).filter(TenantUser.user_id == user_id).all()
    
    def update_tenant_setting(
        self, 
        db: Session, 
        tenant_id: int, 
        category: str, 
        key: str, 
        value: str
    ) -> Optional[TenantSettings]:
        """Update tenant setting"""
        setting = db.query(TenantSettings).filter(
            and_(
                TenantSettings.tenant_id == tenant_id,
                TenantSettings.category == category,
                TenantSettings.setting_key == key
            )
        ).first()
        
        if not setting:
            # Create new setting
            setting = TenantSettings(
                tenant_id=tenant_id,
                category=category,
                setting_key=key,
                setting_value=value,
                setting_type="string"
            )
            db.add(setting)
        else:
            setting.setting_value = value
            setting.updated_at = datetime.utcnow()
        
        db.commit()
        return setting
    
    def get_tenant_setting(
        self, 
        db: Session, 
        tenant_id: int, 
        category: str, 
        key: str
    ) -> Optional[str]:
        """Get tenant setting value"""
        setting = db.query(TenantSettings).filter(
            and_(
                TenantSettings.tenant_id == tenant_id,
                TenantSettings.category == category,
                TenantSettings.setting_key == key
            )
        ).first()
        
        return setting.setting_value if setting else None
    
    def get_tenant_settings(
        self, 
        db: Session, 
        tenant_id: int, 
        category: Optional[str] = None
    ) -> List[TenantSettings]:
        """Get all settings for a tenant"""
        query = db.query(TenantSettings).filter(TenantSettings.tenant_id == tenant_id)
        
        if category:
            query = query.filter(TenantSettings.category == category)
        
        return query.all()
    
    def update_tenant_branding(
        self, 
        db: Session, 
        tenant_id: int, 
        branding_updates: Dict[str, Any]
    ) -> Optional[TenantBranding]:
        """Update tenant branding"""
        branding = db.query(TenantBranding).filter(
            TenantBranding.tenant_id == tenant_id
        ).first()
        
        if not branding:
            branding = TenantBranding(tenant_id=tenant_id)
            db.add(branding)
        
        # Update allowed fields
        allowed_fields = [
            'logo_url', 'logo_alt_text', 'favicon_url',
            'primary_color', 'secondary_color', 'accent_color',
            'background_color', 'text_color',
            'primary_font', 'secondary_font', 'custom_css',
            'invoice_header_text', 'invoice_footer_text', 'invoice_terms_text'
        ]
        
        for field, value in branding_updates.items():
            if field in allowed_fields and hasattr(branding, field):
                setattr(branding, field, value)
        
        branding.updated_at = datetime.utcnow()
        db.commit()
        
        return branding
    
    def get_tenant_branding(self, db: Session, tenant_id: int) -> Optional[TenantBranding]:
        """Get tenant branding"""
        return db.query(TenantBranding).filter(
            TenantBranding.tenant_id == tenant_id
        ).first()
    
    def check_tenant_limits(self, db: Session, tenant_id: int) -> Dict[str, Any]:
        """Check tenant usage against limits"""
        tenant = self.get_tenant_by_id(db, tenant_id)
        if not tenant:
            return {}
        
        # Count current usage
        user_count = db.query(TenantUser).filter(
            and_(TenantUser.tenant_id == tenant_id, TenantUser.is_active == True)
        ).count()
        
        product_count = db.query(Product).filter(Product.tenant_id == tenant_id).count()
        
        # Count transactions this month
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        invoice_count = db.query(Invoice).filter(
            and_(Invoice.tenant_id == tenant_id, Invoice.created_at >= start_of_month)
        ).count()
        
        purchase_count = db.query(Purchase).filter(
            and_(Purchase.tenant_id == tenant_id, Purchase.created_at >= start_of_month)
        ).count()
        
        total_transactions = invoice_count + purchase_count
        
        return {
            'users': {
                'current': user_count,
                'limit': tenant.max_users,
                'usage_percent': (user_count / tenant.max_users) * 100 if tenant.max_users > 0 else 0
            },
            'products': {
                'current': product_count,
                'limit': tenant.max_products,
                'usage_percent': (product_count / tenant.max_products) * 100 if tenant.max_products > 0 else 0
            },
            'transactions': {
                'current': total_transactions,
                'limit': tenant.max_transactions_per_month,
                'usage_percent': (total_transactions / tenant.max_transactions_per_month) * 100 if tenant.max_transactions_per_month > 0 else 0
            }
        }
    
    def create_default_company_settings(self, db: Session, tenant_id: int) -> CompanySettings:
        """Create default company settings for a tenant"""
        tenant = self.get_tenant_by_id(db, tenant_id)
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")
        
        # Check if company settings already exist
        existing = db.query(CompanySettings).filter(
            CompanySettings.tenant_id == tenant_id
        ).first()
        
        if existing:
            return existing
        
        # Create default company settings
        company_settings = CompanySettings(
            tenant_id=tenant_id,
            name=tenant.name,
            gstin=tenant.gstin or "",
            state=tenant.state or "Maharashtra",
            state_code=tenant.state_code or "27",
            invoice_series="INV",
            gst_enabled_by_default=True,
            require_gstin_validation=True
        )
        
        db.add(company_settings)
        db.commit()
        
        return company_settings


# Global tenant service instance
tenant_service = TenantService()
