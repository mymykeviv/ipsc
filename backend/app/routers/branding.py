"""
Branding API Router
Handles tenant-specific branding, customization, and branded output generation
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import Response
from typing import Dict, Any, Optional
import logging
from ..branding_manager import branding_manager
from ..tenant_config import tenant_config_manager
from ..security_manager import security_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/branding", tags=["branding"])


@router.get("/{tenant_id}")
async def get_tenant_branding(tenant_id: str):
    """Get complete branding configuration for a tenant"""
    try:
        branding = await branding_manager.get_tenant_branding(tenant_id)
        return {
            "tenant_id": tenant_id,
            "branding": branding,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Failed to get branding for tenant {tenant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get branding configuration")


@router.get("/{tenant_id}/ui")
async def get_ui_branding(tenant_id: str):
    """Get UI branding configuration for frontend"""
    try:
        ui_branding = await branding_manager.get_ui_branding(tenant_id)
        return {
            "tenant_id": tenant_id,
            "ui_branding": ui_branding,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Failed to get UI branding for tenant {tenant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get UI branding")


@router.put("/{tenant_id}")
async def update_tenant_branding(tenant_id: str, branding_updates: Dict[str, Any]):
    """Update tenant branding configuration"""
    try:
        # Validate tenant exists
        config = await tenant_config_manager.get_tenant_config(tenant_id)
        if not config:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Update branding
        success = await branding_manager.update_tenant_branding(tenant_id, branding_updates)
        
        if success:
            return {
                "tenant_id": tenant_id,
                "message": "Branding updated successfully",
                "status": "success"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update branding")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update branding for tenant {tenant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update branding")


@router.post("/{tenant_id}/logo")
async def upload_logo(tenant_id: str, file: UploadFile = File(...)):
    """Upload logo for tenant branding"""
    try:
        # Validate tenant exists
        config = await tenant_config_manager.get_tenant_config(tenant_id)
        if not config:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file content
        content = await file.read()
        
        # Save logo (in production, this would save to a file system or cloud storage)
        # For now, we'll update the branding with the file name
        branding_updates = {
            'logo_url': f"/assets/logos/{tenant_id}/{file.filename}",
            'logo_data': None  # Would be base64 encoded in production
        }
        
        success = await branding_manager.update_tenant_branding(tenant_id, branding_updates)
        
        if success:
            return {
                "tenant_id": tenant_id,
                "message": "Logo uploaded successfully",
                "filename": file.filename,
                "status": "success"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to upload logo")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload logo for tenant {tenant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload logo")


@router.post("/{tenant_id}/invoice")
async def generate_branded_invoice(tenant_id: str, invoice_data: Dict[str, Any]):
    """Generate branded invoice PDF"""
    try:
        # Validate tenant exists
        config = await tenant_config_manager.get_tenant_config(tenant_id)
        if not config:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Generate branded invoice
        pdf_data = await branding_manager.generate_branded_invoice(tenant_id, invoice_data)
        
        # Log invoice generation
        await security_manager.log_security_event(
            'INVOICE_GENERATED', tenant_id, None,
            {'invoice_number': invoice_data.get('invoice_number')}, 'INFO'
        )
        
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=invoice_{invoice_data.get('invoice_number', 'unknown')}.pdf"
            }
        )
        
    except Exception as e:
        logger.error(f"Failed to generate branded invoice for tenant {tenant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate invoice")


@router.post("/{tenant_id}/report/{report_type}")
async def generate_branded_report(tenant_id: str, report_type: str, report_data: Dict[str, Any]):
    """Generate branded report PDF"""
    try:
        # Validate tenant exists
        config = await tenant_config_manager.get_tenant_config(tenant_id)
        if not config:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Validate report type
        valid_report_types = ['financial', 'inventory', 'sales']
        if report_type not in valid_report_types:
            raise HTTPException(status_code=400, detail=f"Invalid report type. Must be one of: {valid_report_types}")
        
        # Generate branded report
        pdf_data = await branding_manager.generate_branded_report(tenant_id, report_data, report_type)
        
        # Log report generation
        await security_manager.log_security_event(
            'REPORT_GENERATED', tenant_id, None,
            {'report_type': report_type}, 'INFO'
        )
        
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={report_type}_report_{tenant_id}.pdf"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate branded report for tenant {tenant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate report")


@router.post("/{tenant_id}/qr-code")
async def generate_qr_code(tenant_id: str, data: str):
    """Generate QR code with tenant branding"""
    try:
        # Validate tenant exists
        config = await tenant_config_manager.get_tenant_config(tenant_id)
        if not config:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Generate QR code
        qr_data = await branding_manager.generate_qr_code(tenant_id, data)
        
        return {
            "tenant_id": tenant_id,
            "qr_code": qr_data,
            "data": data,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Failed to generate QR code for tenant {tenant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate QR code")


@router.get("/{tenant_id}/templates")
async def get_branding_templates(tenant_id: str):
    """Get available branding templates for tenant"""
    try:
        # Validate tenant exists
        config = await tenant_config_manager.get_tenant_config(tenant_id)
        if not config:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Get domain-specific templates
        templates = {
            'dental': {
                'name': 'Dental Clinic',
                'description': 'Professional medical branding for dental clinics',
                'colors': {
                    'primary': '#2E86AB',
                    'secondary': '#A23B72',
                    'accent': '#F18F01'
                },
                'font_family': 'Arial',
                'header_style': 'medical'
            },
            'manufacturing': {
                'name': 'Manufacturing',
                'description': 'Industrial branding for manufacturing companies',
                'colors': {
                    'primary': '#1B4332',
                    'secondary': '#2D3748',
                    'accent': '#E53E3E'
                },
                'font_family': 'Roboto',
                'header_style': 'industrial'
            },
            'default': {
                'name': 'Default',
                'description': 'Standard business branding',
                'colors': {
                    'primary': '#2E86AB',
                    'secondary': '#A23B72',
                    'accent': '#F18F01'
                },
                'font_family': 'Helvetica',
                'header_style': 'modern'
            }
        }
        
        return {
            "tenant_id": tenant_id,
            "templates": templates,
            "current_domain": config.domain,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Failed to get branding templates for tenant {tenant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get branding templates")


@router.post("/{tenant_id}/apply-template/{template_name}")
async def apply_branding_template(tenant_id: str, template_name: str):
    """Apply a branding template to tenant"""
    try:
        # Validate tenant exists
        config = await tenant_config_manager.get_tenant_config(tenant_id)
        if not config:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Define template configurations
        templates = {
            'dental': {
                'primary_color': '#2E86AB',
                'secondary_color': '#A23B72',
                'accent_color': '#F18F01',
                'font_family': 'Arial',
                'header_style': 'medical',
                'footer_text': 'Your trusted dental care partner'
            },
            'manufacturing': {
                'primary_color': '#1B4332',
                'secondary_color': '#2D3748',
                'accent_color': '#E53E3E',
                'font_family': 'Roboto',
                'header_style': 'industrial',
                'footer_text': 'Quality manufacturing solutions'
            },
            'default': {
                'primary_color': '#2E86AB',
                'secondary_color': '#A23B72',
                'accent_color': '#F18F01',
                'font_family': 'Helvetica',
                'header_style': 'modern',
                'footer_text': 'Thank you for your business'
            }
        }
        
        if template_name not in templates:
            raise HTTPException(status_code=400, detail=f"Invalid template: {template_name}")
        
        # Apply template
        template_config = templates[template_name]
        success = await branding_manager.update_tenant_branding(tenant_id, template_config)
        
        if success:
            return {
                "tenant_id": tenant_id,
                "template_applied": template_name,
                "message": f"Template '{template_name}' applied successfully",
                "status": "success"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to apply template")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to apply template for tenant {tenant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to apply template")


@router.delete("/{tenant_id}/cache")
async def clear_branding_cache(tenant_id: str):
    """Clear branding cache for tenant"""
    try:
        # Validate tenant exists
        config = await tenant_config_manager.get_tenant_config(tenant_id)
        if not config:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Clear cache
        await branding_manager.clear_branding_cache(tenant_id)
        
        return {
            "tenant_id": tenant_id,
            "message": "Branding cache cleared successfully",
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Failed to clear branding cache for tenant {tenant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear branding cache")


@router.get("/{tenant_id}/preview")
async def get_branding_preview(tenant_id: str):
    """Get branding preview with sample data"""
    try:
        # Validate tenant exists
        config = await tenant_config_manager.get_tenant_config(tenant_id)
        if not config:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Get current branding
        branding = await branding_manager.get_tenant_branding(tenant_id)
        
        # Create sample data for preview
        sample_invoice_data = {
            'invoice_number': 'INV-2024-001',
            'date': '2024-01-20',
            'customer_name': 'Sample Customer',
            'customer_address': '123 Main St, City, State 12345',
            'customer_phone': '+1-555-123-4567',
            'items': [
                {
                    'description': 'Sample Product 1',
                    'quantity': 2,
                    'price': 25.00,
                    'total': 50.00
                },
                {
                    'description': 'Sample Service 1',
                    'quantity': 1,
                    'price': 100.00,
                    'total': 100.00
                }
            ],
            'subtotal': 150.00,
            'tax': 15.00,
            'total': 165.00
        }
        
        # Generate sample invoice
        pdf_data = await branding_manager.generate_branded_invoice(tenant_id, sample_invoice_data)
        
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=branding_preview_{tenant_id}.pdf"
            }
        )
        
    except Exception as e:
        logger.error(f"Failed to generate branding preview for tenant {tenant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate branding preview")
