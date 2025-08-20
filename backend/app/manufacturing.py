"""
Manufacturing API Router
Handles manufacturing domain-specific features including BOM management, production tracking, and material cost analysis
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import Response
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from .manufacturing_manager import manufacturing_manager
from .tenant_config import tenant_config_manager
from .security_manager import security_manager
from .db import get_tenant_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/manufacturing", tags=["manufacturing"])

# Dependency to get tenant session
async def get_manufacturing_session(request: Request):
    """Get database session for manufacturing operations"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    # Check if tenant has manufacturing features enabled
    has_manufacturing_features = await tenant_config_manager.has_feature(tenant_id, 'manufacturing')
    if not has_manufacturing_features:
        raise HTTPException(status_code=403, detail="Manufacturing features not enabled for this tenant")
    
    async for session in get_tenant_db(tenant_id):
        yield session

@router.get("/boms")
async def list_boms(session: AsyncSession = Depends(get_manufacturing_session)):
    """List all BOMs for the manufacturing facility"""
    try:
        # This would be implemented in manufacturing_manager
        # For now, return a placeholder
        return {
            "boms": [],
            "count": 0,
            "message": "BOM listing endpoint"
        }
    except Exception as e:
        logger.error(f"Error listing BOMs: {e}")
        raise HTTPException(status_code=500, detail="Failed to list BOMs")

@router.get("/boms/{bom_id}")
async def get_bom(bom_id: str, session: AsyncSession = Depends(get_manufacturing_session)):
    """Get BOM details with component information"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        bom_details = await manufacturing_manager.get_bom(tenant_id, bom_id, session)
        
        if not bom_details:
            raise HTTPException(status_code=404, detail="BOM not found")
        
        return bom_details
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting BOM {bom_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get BOM details")

@router.post("/boms")
async def create_bom(bom_data: Dict[str, Any], session: AsyncSession = Depends(get_manufacturing_session)):
    """Create a new Bill of Materials (BOM)"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        result = await manufacturing_manager.create_bom(tenant_id, bom_data, session)
        
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create BOM")
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating BOM: {e}")
        raise HTTPException(status_code=500, detail="Failed to create BOM")

@router.post("/production-orders")
async def create_production_order(order_data: Dict[str, Any], session: AsyncSession = Depends(get_manufacturing_session)):
    """Create a new production order"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        result = await manufacturing_manager.create_production_order(tenant_id, order_data, session)
        
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create production order")
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating production order: {e}")
        raise HTTPException(status_code=500, detail="Failed to create production order")

@router.put("/production-orders/{order_id}")
async def update_production_status(order_id: str, status_updates: Dict[str, Any], session: AsyncSession = Depends(get_manufacturing_session)):
    """Update production order status"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        success = await manufacturing_manager.update_production_status(tenant_id, order_id, status_updates, session)
        
        if not success:
            raise HTTPException(status_code=404, detail="Production order not found")
        
        return {
            "success": True,
            "message": "Production order status updated successfully",
            "order_id": order_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating production order {order_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update production order")

@router.get("/production-schedule")
async def get_production_schedule(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    session: AsyncSession = Depends(get_manufacturing_session)
):
    """Get production schedule for a date range"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        schedule = await manufacturing_manager.get_production_schedule(tenant_id, start_date, end_date, session)
        
        return {
            "start_date": start_date or datetime.utcnow().date(),
            "end_date": end_date or (datetime.utcnow().date() + timedelta(days=30)),
            "schedule": schedule,
            "count": len(schedule)
        }
        
    except Exception as e:
        logger.error(f"Error getting production schedule: {e}")
        raise HTTPException(status_code=500, detail="Failed to get production schedule")

@router.get("/material-requirements/{bom_id}")
async def get_material_requirements(
    bom_id: str,
    quantity: int,
    session: AsyncSession = Depends(get_manufacturing_session)
):
    """Calculate material requirements for production"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        requirements = await manufacturing_manager.get_material_requirements(tenant_id, bom_id, quantity, session)
        
        return {
            "bom_id": bom_id,
            "quantity": quantity,
            "requirements": requirements,
            "total_materials": len(requirements),
            "total_cost": sum(req['total_cost'] for req in requirements)
        }
        
    except Exception as e:
        logger.error(f"Error calculating material requirements: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate material requirements")

@router.get("/analytics")
async def get_manufacturing_analytics(session: AsyncSession = Depends(get_manufacturing_session)):
    """Get manufacturing analytics and insights"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        analytics = await manufacturing_manager.get_production_analytics(tenant_id, session)
        
        return analytics
        
    except Exception as e:
        logger.error(f"Error getting manufacturing analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get manufacturing analytics")

@router.get("/cost-analysis/{product_id}")
async def get_cost_analysis(product_id: str, session: AsyncSession = Depends(get_manufacturing_session)):
    """Get detailed cost analysis for a product"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        cost_analysis = await manufacturing_manager.get_cost_analysis(tenant_id, product_id, session)
        
        if not cost_analysis:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return cost_analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting cost analysis for product {product_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get cost analysis")

@router.get("/dashboard")
async def get_manufacturing_dashboard(session: AsyncSession = Depends(get_manufacturing_session)):
    """Get manufacturing dashboard data"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        
        # Get analytics
        analytics = await manufacturing_manager.get_production_analytics(tenant_id, session)
        
        # Get current production schedule
        current_schedule = await manufacturing_manager.get_production_schedule(tenant_id, datetime.utcnow().date(), datetime.utcnow().date() + timedelta(days=7), session)
        
        # Get low stock materials
        low_stock_materials = analytics.get('low_stock_materials', [])
        
        return {
            "analytics": analytics,
            "current_schedule": current_schedule,
            "low_stock_materials": low_stock_materials,
            "dashboard_date": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting manufacturing dashboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to get manufacturing dashboard")

@router.get("/reports/production")
async def get_production_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    session: AsyncSession = Depends(get_manufacturing_session)
):
    """Get production report for a date range"""
    try:
        # This would be implemented in manufacturing_manager
        # For now, return a placeholder
        return {
            "report_type": "production",
            "start_date": start_date or datetime.utcnow().date(),
            "end_date": end_date or datetime.utcnow().date(),
            "total_orders": 0,
            "completed_orders": 0,
            "total_production_value": 0,
            "average_completion_time": 0
        }
        
    except Exception as e:
        logger.error(f"Error getting production report: {e}")
        raise HTTPException(status_code=500, detail="Failed to get production report")

@router.get("/reports/materials")
async def get_materials_report(session: AsyncSession = Depends(get_manufacturing_session)):
    """Get materials usage and cost report"""
    try:
        # This would be implemented in manufacturing_manager
        # For now, return a placeholder
        return {
            "report_type": "materials",
            "total_materials": 0,
            "low_stock_materials": 0,
            "total_inventory_value": 0,
            "monthly_usage": []
        }
        
    except Exception as e:
        logger.error(f"Error getting materials report: {e}")
        raise HTTPException(status_code=500, detail="Failed to get materials report")

@router.get("/reports/costs")
async def get_costs_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    session: AsyncSession = Depends(get_manufacturing_session)
):
    """Get manufacturing costs report"""
    try:
        # This would be implemented in manufacturing_manager
        # For now, return a placeholder
        return {
            "report_type": "costs",
            "start_date": start_date or datetime.utcnow().date(),
            "end_date": end_date or datetime.utcnow().date(),
            "total_material_cost": 0,
            "total_labor_cost": 0,
            "total_overhead_cost": 0,
            "cost_trends": []
        }
        
    except Exception as e:
        logger.error(f"Error getting costs report: {e}")
        raise HTTPException(status_code=500, detail="Failed to get costs report")

@router.get("/status")
async def get_manufacturing_status(session: AsyncSession = Depends(get_manufacturing_session)):
    """Get manufacturing system status"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        
        # Check if manufacturing features are enabled
        has_manufacturing_features = await tenant_config_manager.has_feature(tenant_id, 'manufacturing')
        
        return {
            "manufacturing_features_enabled": has_manufacturing_features,
            "bom_management_enabled": has_manufacturing_features,
            "production_tracking_enabled": has_manufacturing_features,
            "material_management_enabled": has_manufacturing_features,
            "cost_analysis_enabled": has_manufacturing_features,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting manufacturing status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get manufacturing status")
