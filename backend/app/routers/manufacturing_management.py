from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, validator
from datetime import date, datetime
import re

from ..db import get_db
from ..manufacturing_service import manufacturing_service
from ..middleware.tenant_routing import get_current_tenant, get_current_tenant_id
from ..models import BillOfMaterials, BOMComponent, ProductionOrder, ProductionStep, MaterialConsumption, WorkCenter, QualityControl

router = APIRouter(prefix="/api/manufacturing", tags=["Manufacturing Management"])


# Pydantic models for request/response
class BOMCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    version: str = "1.0"
    product_id: int
    product_quantity: float = 1.0
    product_unit: str = "Pieces"
    bom_type: str = "Production"
    revision_number: int = 1
    effective_date: date
    expiry_date: Optional[date] = None
    labor_cost: float = 0
    overhead_cost: float = 0
    notes: Optional[str] = None


class BOMUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None
    product_quantity: Optional[float] = None
    product_unit: Optional[str] = None
    bom_type: Optional[str] = None
    revision_number: Optional[int] = None
    effective_date: Optional[date] = None
    expiry_date: Optional[date] = None
    labor_cost: Optional[float] = None
    overhead_cost: Optional[float] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    approved_by: Optional[int] = None
    notes: Optional[str] = None


class BOMResponse(BaseModel):
    id: int
    bom_id: str
    name: str
    description: Optional[str] = None
    version: str
    product_id: int
    product_quantity: float
    product_unit: str
    bom_type: str
    revision_number: int
    effective_date: date
    expiry_date: Optional[date] = None
    total_cost: float
    labor_cost: float
    overhead_cost: float
    status: str
    is_active: bool
    approved_by: Optional[int] = None
    approved_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BOMComponentCreateRequest(BaseModel):
    component_product_id: int
    quantity_required: float = 1.0
    quantity_unit: str = "Pieces"
    scrap_factor: float = 0.0
    total_quantity: float = 1.0
    unit_cost: float = 0
    total_cost: float = 0
    component_type: str = "Raw Material"
    position: Optional[str] = None
    operation_sequence: int = 1
    is_critical: bool = False
    is_optional: bool = False
    notes: Optional[str] = None


class BOMComponentResponse(BaseModel):
    id: int
    bom_id: int
    component_product_id: int
    quantity_required: float
    quantity_unit: str
    scrap_factor: float
    total_quantity: float
    unit_cost: float
    total_cost: float
    component_type: str
    position: Optional[str] = None
    operation_sequence: int
    is_critical: bool
    is_optional: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductionOrderCreateRequest(BaseModel):
    bom_id: str
    product_id: int
    quantity_to_produce: float = 1.0
    quantity_unit: str = "Pieces"
    planned_start_date: date
    planned_end_date: date
    priority: str = "Normal"
    quality_check_required: bool = True
    assigned_to: Optional[int] = None
    supervisor: Optional[int] = None
    production_notes: Optional[str] = None


class ProductionOrderUpdateRequest(BaseModel):
    quantity_to_produce: Optional[float] = None
    quantity_unit: Optional[str] = None
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    quality_check_required: Optional[bool] = None
    quality_check_completed: Optional[bool] = None
    quality_check_date: Optional[datetime] = None
    quality_check_by: Optional[int] = None
    assigned_to: Optional[int] = None
    supervisor: Optional[int] = None
    production_notes: Optional[str] = None
    quality_notes: Optional[str] = None


class ProductionOrderResponse(BaseModel):
    id: int
    production_order_id: str
    bom_id: int
    product_id: int
    quantity_to_produce: float
    quantity_produced: float
    quantity_unit: str
    planned_start_date: date
    planned_end_date: date
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    priority: str
    status: str
    estimated_cost: float
    actual_cost: float
    labor_cost: float
    material_cost: float
    overhead_cost: float
    quality_check_required: bool
    quality_check_completed: bool
    quality_check_date: Optional[datetime] = None
    quality_check_by: Optional[int] = None
    assigned_to: Optional[int] = None
    supervisor: Optional[int] = None
    production_notes: Optional[str] = None
    quality_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductionStepCreateRequest(BaseModel):
    step_name: str
    step_description: Optional[str] = None
    sequence_number: int = 1
    estimated_duration_minutes: int = 30
    quality_check_required: bool = False
    step_notes: Optional[str] = None


class ProductionStepResponse(BaseModel):
    id: int
    production_order_id: int
    step_name: str
    step_description: Optional[str] = None
    sequence_number: int
    estimated_duration_minutes: int
    actual_duration_minutes: Optional[int] = None
    status: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    assigned_to: Optional[int] = None
    quality_check_required: bool
    quality_check_passed: Optional[bool] = None
    quality_notes: Optional[str] = None
    step_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkCenterCreateRequest(BaseModel):
    work_center_id: str
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    capacity_per_hour: float = 1.0
    capacity_unit: str = "Pieces"
    equipment_list: Optional[str] = None
    required_skills: Optional[str] = None
    hourly_rate: float = 0
    setup_cost: float = 0
    is_active: bool = True
    is_available: bool = True
    last_maintenance_date: Optional[date] = None
    next_maintenance_date: Optional[date] = None
    maintenance_notes: Optional[str] = None
    notes: Optional[str] = None


class WorkCenterResponse(BaseModel):
    id: int
    work_center_id: str
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    capacity_per_hour: float
    capacity_unit: str
    equipment_list: Optional[str] = None
    required_skills: Optional[str] = None
    hourly_rate: float
    setup_cost: float
    is_active: bool
    is_available: bool
    last_maintenance_date: Optional[date] = None
    next_maintenance_date: Optional[date] = None
    maintenance_notes: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QualityControlCreateRequest(BaseModel):
    production_order_id: str
    inspection_date: datetime
    inspector_id: int
    inspection_type: str
    quantity_inspected: float = 0.0
    quantity_passed: float = 0.0
    quantity_failed: float = 0.0
    defect_types: Optional[str] = None
    defect_notes: Optional[str] = None
    corrective_action_required: bool = False
    corrective_action: Optional[str] = None
    action_taken_by: Optional[int] = None
    action_taken_date: Optional[datetime] = None
    inspection_notes: Optional[str] = None


class QualityControlResponse(BaseModel):
    id: int
    production_order_id: int
    inspection_date: datetime
    inspector_id: int
    inspection_type: str
    quantity_inspected: float
    quantity_passed: float
    quantity_failed: float
    pass_rate: float
    defect_rate: float
    defect_types: Optional[str] = None
    defect_notes: Optional[str] = None
    corrective_action_required: bool
    corrective_action: Optional[str] = None
    action_taken_by: Optional[int] = None
    action_taken_date: Optional[datetime] = None
    overall_result: str
    inspection_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DashboardStatsResponse(BaseModel):
    total_orders: int
    active_orders: int
    completed_orders_this_month: int
    total_boms: int
    approved_boms: int
    total_work_centers: int
    available_work_centers: int
    quality_records_this_month: int
    avg_pass_rate: float
    total_production_cost_this_month: float


class ProductionScheduleResponse(BaseModel):
    order_id: str
    product_name: str
    quantity: float
    start_date: date
    end_date: date
    status: str
    priority: str
    assigned_to: Optional[str] = None


# BOM endpoints
@router.post("/boms", response_model=BOMResponse)
def create_bom(
    request: BOMCreateRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Create a new Bill of Materials"""
    try:
        bom = manufacturing_service.create_bom(db, tenant_id, **request.dict())
        return bom
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/boms", response_model=List[BOMResponse])
def list_boms(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    product_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """List BOMs with optional filtering"""
    boms = manufacturing_service.list_boms(
        db, tenant_id, skip=skip, limit=limit,
        product_id=product_id, status=status, is_active=is_active
    )
    return boms


@router.get("/boms/{bom_id}", response_model=BOMResponse)
def get_bom(
    bom_id: str,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Get BOM by ID"""
    bom = manufacturing_service.get_bom(db, tenant_id, bom_id)
    if not bom:
        raise HTTPException(status_code=404, detail="BOM not found")
    return bom


@router.put("/boms/{bom_id}", response_model=BOMResponse)
def update_bom(
    bom_id: str,
    request: BOMUpdateRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Update BOM"""
    update_data = {k: v for k, v in request.dict().items() if v is not None}
    bom = manufacturing_service.update_bom(db, tenant_id, bom_id, **update_data)
    if not bom:
        raise HTTPException(status_code=404, detail="BOM not found")
    return bom


@router.post("/boms/{bom_id}/components", response_model=BOMComponentResponse)
def add_bom_component(
    bom_id: str,
    request: BOMComponentCreateRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Add component to BOM"""
    try:
        component = manufacturing_service.add_bom_component(db, tenant_id, bom_id, **request.dict())
        return component
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/boms/{bom_id}/cost")
def calculate_bom_cost(
    bom_id: str,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Calculate BOM cost"""
    try:
        cost = manufacturing_service.calculate_bom_cost(db, tenant_id, bom_id)
        return cost
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Production Order endpoints
@router.post("/production-orders", response_model=ProductionOrderResponse)
def create_production_order(
    request: ProductionOrderCreateRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Create a new production order"""
    try:
        order = manufacturing_service.create_production_order(db, tenant_id, **request.dict())
        return order
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/production-orders", response_model=List[ProductionOrderResponse])
def list_production_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """List production orders with optional filtering"""
    orders = manufacturing_service.list_production_orders(
        db, tenant_id, skip=skip, limit=limit,
        status=status, priority=priority,
        start_date=start_date, end_date=end_date
    )
    return orders


@router.get("/production-orders/{order_id}", response_model=ProductionOrderResponse)
def get_production_order(
    order_id: str,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Get production order by ID"""
    order = manufacturing_service.get_production_order(db, tenant_id, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")
    return order


@router.put("/production-orders/{order_id}", response_model=ProductionOrderResponse)
def update_production_order(
    order_id: str,
    request: ProductionOrderUpdateRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Update production order"""
    update_data = {k: v for k, v in request.dict().items() if v is not None}
    order = manufacturing_service.update_production_order(db, tenant_id, order_id, **update_data)
    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")
    return order


@router.post("/production-orders/{order_id}/steps", response_model=ProductionStepResponse)
def add_production_step(
    order_id: str,
    request: ProductionStepCreateRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Add production step to order"""
    try:
        step = manufacturing_service.add_production_step(db, tenant_id, order_id, **request.dict())
        return step
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/production-orders/{order_id}/material-consumption")
def record_material_consumption(
    order_id: str,
    product_id: int = Query(...),
    quantity: float = Query(...),
    consumed_by: int = Query(...),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Record material consumption"""
    try:
        consumption = manufacturing_service.record_material_consumption(
            db, tenant_id, order_id, product_id, quantity, consumed_by
        )
        return {"message": "Material consumption recorded", "consumption_id": consumption.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Work Center endpoints
@router.post("/work-centers", response_model=WorkCenterResponse)
def create_work_center(
    request: WorkCenterCreateRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Create work center"""
    try:
        work_center = manufacturing_service.create_work_center(db, tenant_id, **request.dict())
        return work_center
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/work-centers", response_model=List[WorkCenterResponse])
def list_work_centers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    is_available: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """List work centers with optional filtering"""
    work_centers = manufacturing_service.list_work_centers(
        db, tenant_id, skip=skip, limit=limit,
        is_active=is_active, is_available=is_available
    )
    return work_centers


# Quality Control endpoints
@router.post("/quality-control", response_model=QualityControlResponse)
def create_quality_control_record(
    request: QualityControlCreateRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Create quality control record"""
    try:
        qc = manufacturing_service.create_quality_control_record(db, tenant_id, **request.dict())
        return qc
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Dashboard endpoints
@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Get manufacturing dashboard statistics"""
    stats = manufacturing_service.get_production_dashboard_stats(db, tenant_id)
    return stats


@router.get("/production-schedule", response_model=List[ProductionScheduleResponse])
def get_production_schedule(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Get production schedule for date range"""
    schedule = manufacturing_service.get_production_schedule(db, tenant_id, start_date, end_date)
    return schedule
