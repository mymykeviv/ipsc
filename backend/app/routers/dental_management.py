from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, validator
from datetime import date, datetime
import re

from ..db import get_db
from ..dental_service import dental_service
from ..middleware.tenant_routing import get_current_tenant, get_current_tenant_id
from ..models import Patient, Appointment, Treatment, TreatmentItem, MedicalHistory, DentalSupply, TreatmentSupplyUsage

router = APIRouter(prefix="/api/dental", tags=["Dental Management"])


# Pydantic models for request/response
class PatientCreateRequest(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    phone: str
    email: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    dental_insurance: Optional[str] = None
    insurance_number: Optional[str] = None
    insurance_provider: Optional[str] = None
    occupation: Optional[str] = None
    referred_by: Optional[str] = None
    notes: Optional[str] = None

    @validator('phone')
    def validate_phone(cls, v):
        if not re.match(r'^\+?[\d\s\-\(\)]+$', v):
            raise ValueError('Invalid phone number format')
        return v

    @validator('email')
    def validate_email(cls, v):
        if v and not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
            raise ValueError('Invalid email format')
        return v


class PatientUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    dental_insurance: Optional[str] = None
    insurance_number: Optional[str] = None
    insurance_provider: Optional[str] = None
    occupation: Optional[str] = None
    referred_by: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class PatientResponse(BaseModel):
    id: int
    patient_id: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    phone: str
    email: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    dental_insurance: Optional[str] = None
    insurance_number: Optional[str] = None
    insurance_provider: Optional[str] = None
    is_active: bool
    registration_date: datetime
    last_visit_date: Optional[datetime] = None
    occupation: Optional[str] = None
    referred_by: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AppointmentCreateRequest(BaseModel):
    patient_id: str
    doctor_id: Optional[int] = None
    appointment_date: date
    start_time: datetime
    end_time: datetime
    duration_minutes: int = 30
    appointment_type: str
    treatment_type: Optional[str] = None
    patient_notes: Optional[str] = None
    doctor_notes: Optional[str] = None
    internal_notes: Optional[str] = None


class AppointmentUpdateRequest(BaseModel):
    appointment_date: Optional[date] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    appointment_type: Optional[str] = None
    treatment_type: Optional[str] = None
    status: Optional[str] = None
    confirmation_status: Optional[str] = None
    patient_notes: Optional[str] = None
    doctor_notes: Optional[str] = None
    internal_notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: int
    appointment_id: str
    patient_id: str
    doctor_id: Optional[int] = None
    appointment_date: date
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    appointment_type: str
    treatment_type: Optional[str] = None
    status: str
    confirmation_status: str
    patient_notes: Optional[str] = None
    doctor_notes: Optional[str] = None
    internal_notes: Optional[str] = None
    reminder_sent: bool
    reminder_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TreatmentCreateRequest(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    doctor_id: Optional[int] = None
    treatment_type: str
    treatment_category: str
    tooth_numbers: Optional[str] = None
    diagnosis: str
    treatment_plan: str
    procedure_notes: Optional[str] = None
    post_treatment_instructions: Optional[str] = None
    follow_up_required: bool = False
    follow_up_date: Optional[date] = None
    follow_up_notes: Optional[str] = None
    estimated_cost: float = 0
    insurance_coverage: float = 0
    patient_share: float = 0


class TreatmentUpdateRequest(BaseModel):
    treatment_type: Optional[str] = None
    treatment_category: Optional[str] = None
    tooth_numbers: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    procedure_notes: Optional[str] = None
    post_treatment_instructions: Optional[str] = None
    status: Optional[str] = None
    treatment_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[date] = None
    follow_up_notes: Optional[str] = None
    actual_cost: Optional[float] = None
    insurance_coverage: Optional[float] = None
    patient_share: Optional[float] = None


class TreatmentResponse(BaseModel):
    id: int
    treatment_id: str
    patient_id: str
    appointment_id: Optional[str] = None
    doctor_id: Optional[int] = None
    treatment_type: str
    treatment_category: str
    tooth_numbers: Optional[str] = None
    diagnosis: str
    treatment_plan: str
    procedure_notes: Optional[str] = None
    post_treatment_instructions: Optional[str] = None
    status: str
    treatment_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    follow_up_required: bool
    follow_up_date: Optional[date] = None
    follow_up_notes: Optional[str] = None
    estimated_cost: float
    actual_cost: Optional[float] = None
    insurance_coverage: float
    patient_share: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DentalSupplyCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    sku: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    size: Optional[str] = None
    current_stock: int = 0
    minimum_stock: int = 0
    maximum_stock: int = 1000
    unit: str = "Pieces"
    unit_cost: float = 0
    selling_price: float = 0
    supplier_name: Optional[str] = None
    supplier_contact: Optional[str] = None
    supplier_phone: Optional[str] = None
    is_sterile: bool = False
    requires_refrigeration: bool = False
    expiry_date: Optional[date] = None
    lot_number: Optional[str] = None
    notes: Optional[str] = None


class DentalSupplyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    sku: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    size: Optional[str] = None
    current_stock: int
    minimum_stock: int
    maximum_stock: int
    unit: str
    unit_cost: float
    selling_price: float
    supplier_name: Optional[str] = None
    supplier_contact: Optional[str] = None
    supplier_phone: Optional[str] = None
    is_active: bool
    is_sterile: bool
    requires_refrigeration: bool
    expiry_date: Optional[date] = None
    lot_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DashboardStatsResponse(BaseModel):
    total_patients: int
    new_patients_this_month: int
    today_appointments: int
    pending_appointments: int
    completed_treatments_this_month: int
    total_revenue_this_month: float
    low_stock_supplies: int


# Patient endpoints
@router.post("/patients", response_model=PatientResponse)
def create_patient(
    request: PatientCreateRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Create a new patient"""
    try:
        patient = dental_service.create_patient(db, tenant_id, **request.dict())
        return patient
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/patients", response_model=List[PatientResponse])
def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """List patients with optional filtering"""
    patients = dental_service.list_patients(
        db, tenant_id, skip=skip, limit=limit, 
        search=search, is_active=is_active
    )
    return patients


@router.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Get patient by ID"""
    patient = dental_service.get_patient(db, tenant_id, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.put("/patients/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: str,
    request: PatientUpdateRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Update patient information"""
    update_data = {k: v for k, v in request.dict().items() if v is not None}
    patient = dental_service.update_patient(db, tenant_id, patient_id, **update_data)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


# Appointment endpoints
@router.post("/appointments", response_model=AppointmentResponse)
def create_appointment(
    request: AppointmentCreateRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Create a new appointment"""
    try:
        appointment = dental_service.create_appointment(db, tenant_id, **request.dict())
        return appointment
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/appointments", response_model=List[AppointmentResponse])
def list_appointments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    patient_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """List appointments with optional filtering"""
    appointments = dental_service.list_appointments(
        db, tenant_id, skip=skip, limit=limit,
        start_date=start_date, end_date=end_date,
        patient_id=patient_id, status=status
    )
    return appointments


@router.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Get appointment by ID"""
    appointment = dental_service.get_appointment(db, tenant_id, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: str,
    request: AppointmentUpdateRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Update appointment"""
    update_data = {k: v for k, v in request.dict().items() if v is not None}
    appointment = dental_service.update_appointment(db, tenant_id, appointment_id, **update_data)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


# Treatment endpoints
@router.post("/treatments", response_model=TreatmentResponse)
def create_treatment(
    request: TreatmentCreateRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Create a new treatment"""
    try:
        treatment = dental_service.create_treatment(db, tenant_id, **request.dict())
        return treatment
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/treatments", response_model=List[TreatmentResponse])
def list_treatments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    patient_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """List treatments with optional filtering"""
    treatments = dental_service.list_treatments(
        db, tenant_id, skip=skip, limit=limit,
        patient_id=patient_id, status=status,
        start_date=start_date, end_date=end_date
    )
    return treatments


@router.get("/treatments/{treatment_id}", response_model=TreatmentResponse)
def get_treatment(
    treatment_id: str,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Get treatment by ID"""
    treatment = dental_service.get_treatment(db, tenant_id, treatment_id)
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    return treatment


@router.put("/treatments/{treatment_id}", response_model=TreatmentResponse)
def update_treatment(
    treatment_id: str,
    request: TreatmentUpdateRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Update treatment"""
    update_data = {k: v for k, v in request.dict().items() if v is not None}
    treatment = dental_service.update_treatment(db, tenant_id, treatment_id, **update_data)
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    return treatment


# Dental supply endpoints
@router.post("/supplies", response_model=DentalSupplyResponse)
def create_dental_supply(
    request: DentalSupplyCreateRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Create dental supply item"""
    try:
        supply = dental_service.create_dental_supply(db, tenant_id, **request.dict())
        return supply
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/supplies", response_model=List[DentalSupplyResponse])
def list_dental_supplies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[str] = Query(None),
    low_stock: bool = Query(False),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """List dental supplies with optional filtering"""
    supplies = dental_service.list_dental_supplies(
        db, tenant_id, skip=skip, limit=limit,
        category=category, low_stock=low_stock
    )
    return supplies


@router.put("/supplies/{supply_id}/stock")
def update_supply_stock(
    supply_id: int,
    quantity: int = Query(..., description="Quantity to add/subtract (negative for reduction)"),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Update supply stock"""
    supply = dental_service.update_supply_stock(db, tenant_id, supply_id, quantity)
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    return {"message": f"Stock updated by {quantity}", "current_stock": supply.current_stock}


# Dashboard endpoints
@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant_id)
):
    """Get dental clinic dashboard statistics"""
    stats = dental_service.get_dashboard_stats(db, tenant_id)
    return stats
