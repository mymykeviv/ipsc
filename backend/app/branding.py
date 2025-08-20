"""
Branding API Router
Handles client branding and customization endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import Response
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from .branding_manager import branding_manager
from .tenant_config import tenant_config_manager
from .security_manager import security_manager
from .db import get_tenant_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/branding", tags=["branding"])

# Dependency to get tenant session
async def get_branding_session(request: Request):
    """Get database session for branding operations"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    # Check if tenant has branding features enabled
    has_branding_features = await tenant_config_manager.has_feature(tenant_id, 'branding')
    if not has_branding_features:
        raise HTTPException(status_code=403, detail="Branding features not enabled for this tenant")
    
    async for session in get_tenant_db(tenant_id):
        yield session

@router.get("/status")
async def get_branding_status(session: AsyncSession = Depends(get_branding_session)):
    """Get branding system status"""
    try:
        return {
            "branding_enabled": True,
            "templates_available": True,
            "pdf_generation_enabled": True,
            "qr_code_generation_enabled": True,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting branding status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get branding status")

@router.get("/templates")
async def get_available_templates(session: AsyncSession = Depends(get_branding_session)):
    """Get available branding templates"""
    try:
        templates = branding_manager.get_available_templates_info()
        return {"templates": templates, "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Error getting branding templates: {e}")
        raise HTTPException(status_code=500, detail="Failed to get branding templates")

@router.get("/{tenant_id}")
async def get_tenant_branding(tenant_id: str, session: AsyncSession = Depends(get_branding_session)):
    """Get branding configuration for a specific tenant"""
    try:
        branding = await branding_manager.get_tenant_branding(tenant_id)
        if not branding:
            raise HTTPException(status_code=404, detail=f"Branding for tenant {tenant_id} not found")
        return {"branding": branding, "company_info": await tenant_config_manager.get_company_info(tenant_id)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tenant branding: {e}")
        raise HTTPException(status_code=500, detail="Failed to get tenant branding")

@router.post("/{tenant_id}/invoice")
async def generate_branded_invoice(tenant_id: str, invoice_data: Dict[str, Any], session: AsyncSession = Depends(get_branding_session)):
    """Generate branded invoice PDF"""
    try:
        pdf_data = await branding_manager.generate_branded_invoice(tenant_id, invoice_data, session)
        return Response(content=pdf_data, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=invoice.pdf"})
    except Exception as e:
        logger.error(f"Error generating branded invoice: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate branded invoice")

@router.post("/{tenant_id}/report")
async def generate_branded_report(tenant_id: str, report_data: Dict[str, Any], session: AsyncSession = Depends(get_branding_session)):
    """Generate branded report PDF"""
    try:
        pdf_data = await branding_manager.generate_branded_report(tenant_id, report_data, session)
        return Response(content=pdf_data, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=report.pdf"})
    except Exception as e:
        logger.error(f"Error generating branded report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate branded report")

@router.get("/{tenant_id}/qr-code")
async def generate_qr_code(tenant_id: str, data: str, session: AsyncSession = Depends(get_branding_session)):
    """Generate QR code with tenant branding"""
    try:
        qr_data = await branding_manager.generate_qr_code(tenant_id, data, session)
        return Response(content=qr_data, media_type="image/png", headers={"Content-Disposition": "attachment; filename=qr_code.png"})
    except Exception as e:
        logger.error(f"Error generating QR code: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate QR code")
