"""
Dental Clinic Specific Models
Patient management, appointments, treatments, and dental-specific features
"""

from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Numeric, Text, Date
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, date
from ..db import Base
from ..tenant_models import Tenant


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
