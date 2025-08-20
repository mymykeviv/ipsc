"""
Dental Clinic API Router
Handles dental clinic domain-specific features including patient management, treatment tracking, and dental supplies
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import Response
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession

from .dental_manager import dental_manager
from .tenant_config import tenant_config_manager
from .security_manager import security_manager
from .db import get_tenant_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dental", tags=["dental"])

# Dependency to get tenant session
async def get_dental_session(request: Request):
    """Get database session for dental operations"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    # Check if tenant has dental features enabled
    has_dental_features = await tenant_config_manager.has_feature(tenant_id, 'dental_clinic')
    if not has_dental_features:
        raise HTTPException(status_code=403, detail="Dental clinic features not enabled for this tenant")
    
    async for session in get_tenant_db(tenant_id):
        yield session

@router.get("/patients")
async def list_patients(session: AsyncSession = Depends(get_dental_session)):
    """List all patients for the dental clinic"""
    try:
        # This would be implemented in dental_manager
        # For now, return a placeholder
        return {
            "patients": [],
            "count": 0,
            "message": "Patient listing endpoint"
        }
    except Exception as e:
        logger.error(f"Error listing patients: {e}")
        raise HTTPException(status_code=500, detail="Failed to list patients")

@router.get("/patients/{patient_id}")
async def get_patient(patient_id: str, session: AsyncSession = Depends(get_dental_session)):
    """Get comprehensive patient profile"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        patient_profile = await dental_manager.get_patient_profile(tenant_id, patient_id, session)
        
        if not patient_profile:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return patient_profile
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting patient {patient_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get patient profile")

@router.post("/patients")
async def create_patient(patient_data: Dict[str, Any], session: AsyncSession = Depends(get_dental_session)):
    """Create a new patient"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        result = await dental_manager.create_patient(tenant_id, patient_data, session)
        
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create patient")
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating patient: {e}")
        raise HTTPException(status_code=500, detail="Failed to create patient")

@router.put("/patients/{patient_id}")
async def update_patient(patient_id: str, updates: Dict[str, Any], session: AsyncSession = Depends(get_dental_session)):
    """Update patient information"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        success = await dental_manager.update_patient(tenant_id, patient_id, updates, session)
        
        if not success:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return {
            "success": True,
            "message": "Patient updated successfully",
            "patient_id": patient_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating patient {patient_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update patient")

@router.post("/treatments")
async def create_treatment(treatment_data: Dict[str, Any], session: AsyncSession = Depends(get_dental_session)):
    """Create a new treatment record"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        result = await dental_manager.create_treatment_record(tenant_id, treatment_data, session)
        
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create treatment record")
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating treatment: {e}")
        raise HTTPException(status_code=500, detail="Failed to create treatment record")

@router.get("/treatments/{patient_id}")
async def get_patient_treatments(patient_id: str, session: AsyncSession = Depends(get_dental_session)):
    """Get treatment history for a patient"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        patient_profile = await dental_manager.get_patient_profile(tenant_id, patient_id, session)
        
        if not patient_profile:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return {
            "patient_id": patient_id,
            "patient_name": patient_profile['name'],
            "treatments": patient_profile['treatments'],
            "treatment_count": patient_profile['treatment_count']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting treatments for patient {patient_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get treatment history")

@router.get("/appointments")
async def get_appointments(date: Optional[date] = None, session: AsyncSession = Depends(get_dental_session)):
    """Get appointment schedule for a specific date or today"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        schedule = await dental_manager.get_appointment_schedule(tenant_id, date, session)
        
        return {
            "date": date or datetime.utcnow().date(),
            "appointments": schedule,
            "count": len(schedule)
        }
        
    except Exception as e:
        logger.error(f"Error getting appointments: {e}")
        raise HTTPException(status_code=500, detail="Failed to get appointment schedule")

@router.post("/appointments")
async def create_appointment(appointment_data: Dict[str, Any], session: AsyncSession = Depends(get_dental_session)):
    """Create a new appointment"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        result = await dental_manager.create_appointment(tenant_id, appointment_data, session)
        
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create appointment")
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating appointment: {e}")
        raise HTTPException(status_code=500, detail="Failed to create appointment")

@router.get("/supplies")
async def get_dental_supplies(session: AsyncSession = Depends(get_dental_session)):
    """Get dental supplies inventory"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        supplies = await dental_manager.get_dental_supplies(tenant_id, session)
        
        return {
            "supplies": supplies,
            "count": len(supplies),
            "low_stock_count": len([s for s in supplies if s['current_stock'] <= s['reorder_level']])
        }
        
    except Exception as e:
        logger.error(f"Error getting dental supplies: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dental supplies")

@router.post("/supplies/order")
async def create_supply_order(order_data: Dict[str, Any], session: AsyncSession = Depends(get_dental_session)):
    """Create a dental supply order"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        result = await dental_manager.create_dental_supply_order(tenant_id, order_data, session)
        
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create supply order")
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating supply order: {e}")
        raise HTTPException(status_code=500, detail="Failed to create supply order")

@router.get("/analytics")
async def get_dental_analytics(session: AsyncSession = Depends(get_dental_session)):
    """Get dental clinic analytics and insights"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        analytics = await dental_manager.get_dental_analytics(tenant_id, session)
        
        return analytics
        
    except Exception as e:
        logger.error(f"Error getting dental analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dental analytics")

@router.get("/dashboard")
async def get_dental_dashboard(session: AsyncSession = Depends(get_dental_session)):
    """Get dental clinic dashboard data"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        
        # Get analytics
        analytics = await dental_manager.get_dental_analytics(tenant_id, session)
        
        # Get today's appointments
        today_appointments = await dental_manager.get_appointment_schedule(tenant_id, datetime.utcnow().date(), session)
        
        # Get low stock supplies
        supplies = await dental_manager.get_dental_supplies(tenant_id, session)
        low_stock_supplies = [s for s in supplies if s['current_stock'] <= s['reorder_level']]
        
        return {
            "analytics": analytics,
            "today_appointments": today_appointments,
            "low_stock_supplies": low_stock_supplies,
            "dashboard_date": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting dental dashboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dental dashboard")

@router.get("/reports/treatments")
async def get_treatment_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    session: AsyncSession = Depends(get_dental_session)
):
    """Get treatment report for a date range"""
    try:
        # This would be implemented in dental_manager
        # For now, return a placeholder
        return {
            "report_type": "treatments",
            "start_date": start_date or datetime.utcnow().date(),
            "end_date": end_date or datetime.utcnow().date(),
            "treatments": [],
            "total_revenue": 0,
            "treatment_count": 0
        }
        
    except Exception as e:
        logger.error(f"Error getting treatment report: {e}")
        raise HTTPException(status_code=500, detail="Failed to get treatment report")

@router.get("/reports/patients")
async def get_patient_report(session: AsyncSession = Depends(get_dental_session)):
    """Get patient report and statistics"""
    try:
        # This would be implemented in dental_manager
        # For now, return a placeholder
        return {
            "report_type": "patients",
            "total_patients": 0,
            "new_patients_this_month": 0,
            "active_patients": 0,
            "patient_growth_rate": 0
        }
        
    except Exception as e:
        logger.error(f"Error getting patient report: {e}")
        raise HTTPException(status_code=500, detail="Failed to get patient report")

@router.get("/reports/supplies")
async def get_supplies_report(session: AsyncSession = Depends(get_dental_session)):
    """Get dental supplies report"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        supplies = await dental_manager.get_dental_supplies(tenant_id, session)
        
        total_value = sum(s['current_stock'] * s['cost_price'] for s in supplies)
        low_stock_value = sum(s['current_stock'] * s['cost_price'] for s in supplies if s['current_stock'] <= s['reorder_level'])
        
        return {
            "report_type": "supplies",
            "total_supplies": len(supplies),
            "low_stock_supplies": len([s for s in supplies if s['current_stock'] <= s['reorder_level']]),
            "total_inventory_value": total_value,
            "low_stock_value": low_stock_value,
            "supplies": supplies
        }
        
    except Exception as e:
        logger.error(f"Error getting supplies report: {e}")
        raise HTTPException(status_code=500, detail="Failed to get supplies report")

@router.get("/status")
async def get_dental_status(session: AsyncSession = Depends(get_dental_session)):
    """Get dental clinic system status"""
    try:
        tenant_id = getattr(session.bind.url, 'database', 'default').split('/')[-1]
        
        # Check if dental features are enabled
        has_dental_features = await tenant_config_manager.has_feature(tenant_id, 'dental_clinic')
        
        return {
            "dental_features_enabled": has_dental_features,
            "patient_management_enabled": has_dental_features,
            "treatment_tracking_enabled": has_dental_features,
            "appointment_scheduling_enabled": has_dental_features,
            "dental_supplies_enabled": has_dental_features,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting dental status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dental status")
