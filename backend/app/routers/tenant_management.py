"""
Tenant Management API Endpoints
Handles tenant creation, management, and configuration
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, validator
import re
from datetime import datetime

from ..db import get_db
from ..tenant_service import tenant_service
from ..middleware.tenant_routing import get_current_tenant, get_current_tenant_id
from ..models import Tenant, TenantUser, TenantSettings, TenantBranding

router = APIRouter(prefix="/api/tenants", tags=["Tenant Management"])


# Pydantic models for API requests/responses
class TenantCreateRequest(BaseModel):
    name: str
    slug: str
    organization_type: str = "business"
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    gstin: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    pincode: Optional[str] = None
    
    @validator('slug')
    def validate_slug(cls, v):
        if not re.match(r'^[a-z0-9-]+$', v):
            raise ValueError('Slug must contain only lowercase letters, numbers, and hyphens')
        if len(v) < 3 or len(v) > 50:
            raise ValueError('Slug must be between 3 and 50 characters')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        if len(v) < 2 or len(v) > 200:
            raise ValueError('Name must be between 2 and 200 characters')
        return v


class TenantUpdateRequest(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    gstin: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    subscription_plan: Optional[str] = None
    max_users: Optional[int] = None
    max_products: Optional[int] = None
    max_transactions_per_month: Optional[int] = None


class TenantResponse(BaseModel):
    id: int
    name: str
    slug: str
    organization_type: str
    industry: Optional[str]
    size: Optional[str]
    contact_person: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    gstin: Optional[str]
    subscription_plan: str
    subscription_status: str
    is_active: bool
    is_trial: bool
    trial_end_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TenantUserResponse(BaseModel):
    id: int
    user_id: int
    role: str
    permissions: Optional[str]
    is_active: bool
    is_primary_contact: bool
    joined_at: datetime
    last_access_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class TenantSettingResponse(BaseModel):
    id: int
    category: str
    setting_key: str
    setting_value: Optional[str]
    setting_type: str
    description: Optional[str]
    is_editable: bool
    is_required: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TenantBrandingResponse(BaseModel):
    id: int
    logo_url: Optional[str]
    logo_alt_text: Optional[str]
    favicon_url: Optional[str]
    primary_color: str
    secondary_color: str
    accent_color: str
    background_color: str
    text_color: str
    primary_font: str
    secondary_font: str
    custom_css: Optional[str]
    invoice_header_text: str
    invoice_footer_text: str
    invoice_terms_text: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TenantLimitsResponse(BaseModel):
    users: Dict[str, Any]
    products: Dict[str, Any]
    transactions: Dict[str, Any]


# API Endpoints
@router.post("/create", response_model=TenantResponse)
def create_tenant(
    request: TenantCreateRequest,
    db: Session = Depends(get_db)
):
    """Create a new tenant"""
    try:
        tenant = tenant_service.create_tenant(
            db=db,
            name=request.name,
            slug=request.slug,
            organization_type=request.organization_type,
            contact_person=request.contact_person,
            contact_email=request.contact_email,
            contact_phone=request.contact_phone,
            gstin=request.gstin,
            industry=request.industry,
            size=request.size,
            address_line1=request.address_line1,
            address_line2=request.address_line2,
            city=request.city,
            state=request.state,
            country=request.country,
            pincode=request.pincode
        )
        
        # Create default company settings
        tenant_service.create_default_company_settings(db, tenant.id)
        
        return tenant
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create tenant: {str(e)}")


@router.get("/validate-slug/{slug}")
def validate_tenant_slug(slug: str, db: Session = Depends(get_db)):
    """Validate if a tenant slug is available"""
    try:
        # Validate slug format
        if not re.match(r'^[a-z0-9-]+$', slug):
            return {"available": False, "reason": "Invalid format"}
        
        if len(slug) < 3 or len(slug) > 50:
            return {"available": False, "reason": "Length must be between 3 and 50 characters"}
        
        # Check if slug exists
        existing_tenant = tenant_service.get_tenant_by_slug(db, slug)
        if existing_tenant:
            return {"available": False, "reason": "Slug already taken"}
        
        return {"available": True, "reason": "Slug is available"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to validate slug: {str(e)}")


@router.get("/list", response_model=List[TenantResponse])
def list_tenants(
    active_only: bool = True,
    organization_type: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """List all tenants with optional filtering"""
    try:
        tenants = tenant_service.list_tenants(
            db=db,
            active_only=active_only,
            organization_type=organization_type,
            limit=limit,
            offset=offset
        )
        return tenants
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list tenants: {str(e)}")


@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant(tenant_id: int, db: Session = Depends(get_db)):
    """Get tenant by ID"""
    try:
        tenant = tenant_service.get_tenant_by_id(db, tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        return tenant
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tenant: {str(e)}")


@router.put("/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    tenant_id: int,
    request: TenantUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update tenant information"""
    try:
        # Convert request to dict, excluding None values
        updates = {k: v for k, v in request.dict().items() if v is not None}
        
        tenant = tenant_service.update_tenant(db, tenant_id, updates)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        return tenant
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update tenant: {str(e)}")


@router.delete("/{tenant_id}")
def delete_tenant(tenant_id: int, db: Session = Depends(get_db)):
    """Delete tenant (soft delete)"""
    try:
        success = tenant_service.delete_tenant(db, tenant_id)
        if not success:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        return {"message": "Tenant deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete tenant: {str(e)}")


@router.post("/{tenant_id}/users")
def add_user_to_tenant(
    tenant_id: int,
    user_id: int,
    role: str = "user",
    is_primary_contact: bool = False,
    db: Session = Depends(get_db)
):
    """Add user to tenant"""
    try:
        tenant_user = tenant_service.add_user_to_tenant(
            db=db,
            tenant_id=tenant_id,
            user_id=user_id,
            role=role,
            is_primary_contact=is_primary_contact
        )
        
        return {
            "message": "User added to tenant successfully",
            "tenant_user_id": tenant_user.id
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add user to tenant: {str(e)}")


@router.delete("/{tenant_id}/users/{user_id}")
def remove_user_from_tenant(
    tenant_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Remove user from tenant"""
    try:
        success = tenant_service.remove_user_from_tenant(db, tenant_id, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="User not found in tenant")
        
        return {"message": "User removed from tenant successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove user from tenant: {str(e)}")


@router.get("/{tenant_id}/users", response_model=List[TenantUserResponse])
def get_tenant_users(
    tenant_id: int,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all users for a tenant"""
    try:
        users = tenant_service.get_tenant_users(db, tenant_id, active_only)
        return users
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tenant users: {str(e)}")


@router.get("/{tenant_id}/settings", response_model=List[TenantSettingResponse])
def get_tenant_settings(
    tenant_id: int,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get tenant settings"""
    try:
        settings = tenant_service.get_tenant_settings(db, tenant_id, category)
        return settings
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tenant settings: {str(e)}")


@router.put("/{tenant_id}/settings/{category}/{key}")
def update_tenant_setting(
    tenant_id: int,
    category: str,
    key: str,
    value: str,
    db: Session = Depends(get_db)
):
    """Update tenant setting"""
    try:
        setting = tenant_service.update_tenant_setting(db, tenant_id, category, key, value)
        if not setting:
            raise HTTPException(status_code=404, detail="Setting not found")
        
        return {"message": "Setting updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update setting: {str(e)}")


@router.get("/{tenant_id}/branding", response_model=TenantBrandingResponse)
def get_tenant_branding(tenant_id: int, db: Session = Depends(get_db)):
    """Get tenant branding"""
    try:
        branding = tenant_service.get_tenant_branding(db, tenant_id)
        if not branding:
            raise HTTPException(status_code=404, detail="Branding not found")
        
        return branding
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tenant branding: {str(e)}")


@router.put("/{tenant_id}/branding")
def update_tenant_branding(
    tenant_id: int,
    branding_updates: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Update tenant branding"""
    try:
        branding = tenant_service.update_tenant_branding(db, tenant_id, branding_updates)
        if not branding:
            raise HTTPException(status_code=404, detail="Branding not found")
        
        return {"message": "Branding updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update branding: {str(e)}")


@router.get("/{tenant_id}/limits", response_model=TenantLimitsResponse)
def get_tenant_limits(tenant_id: int, db: Session = Depends(get_db)):
    """Get tenant usage limits"""
    try:
        limits = tenant_service.check_tenant_limits(db, tenant_id)
        if not limits:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        return limits
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tenant limits: {str(e)}")


@router.get("/current", response_model=TenantResponse)
def get_current_tenant_info(tenant: Tenant = Depends(get_current_tenant)):
    """Get current tenant information"""
    return tenant


@router.get("/current/limits", response_model=TenantLimitsResponse)
def get_current_tenant_limits(
    tenant_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    """Get current tenant usage limits"""
    try:
        limits = tenant_service.check_tenant_limits(db, tenant_id)
        return limits
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tenant limits: {str(e)}")
