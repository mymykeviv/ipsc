import logging
from typing import Dict, Any, Optional, List, Union
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, date, timedelta
import json
from . import models
from .db import get_db

logger = logging.getLogger(__name__)


class DentalService:
    """Service for managing dental clinic operations"""
    
    def create_patient(self, db: Session, tenant_id: int, **patient_data) -> models.Patient:
        """Create a new patient"""
        try:
            # Generate patient ID
            patient_id = self._generate_patient_id(db, tenant_id)
            
            patient = models.models.models.Patient(
                tenant_id=tenant_id,
                patient_id=patient_id,
                **patient_data
            )
            
            db.add(patient)
            db.commit()
            db.refresh(patient)
            
            logger.info(f"Created patient {patient_id} for tenant {tenant_id}")
            return patient
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating patient: {str(e)}")
            raise
    
    def get_patient(self, db: Session, tenant_id: int, patient_id: str) -> Optional[models.Patient]:
        """Get patient by ID"""
        return db.query(models.Patient).filter(
            and_(
                models.models.models.Patient.tenant_id == tenant_id,
                models.models.models.Patient.patient_id == patient_id
            )
        ).first()
    
    def list_patients(self, db: Session, tenant_id: int, skip: int = 0, limit: int = 100, 
                     search: str = None, is_active: bool = None) -> List[models.Patient]:
        """List patients with optional filtering"""
        query = db.query(models.Patient).filter(models.models.models.Patient.tenant_id == tenant_id)
        
        if search:
            query = query.filter(
                or_(
                    models.models.models.Patient.first_name.ilike(f"%{search}%"),
                    models.models.models.Patient.last_name.ilike(f"%{search}%"),
                    models.models.models.Patient.patient_id.ilike(f"%{search}%"),
                    models.models.models.Patient.phone.ilike(f"%{search}%")
                )
            )
        
        if is_active is not None:
            query = query.filter(models.models.models.Patient.is_active == is_active)
        
        return query.offset(skip).limit(limit).all()
    
    def update_patient(self, db: Session, tenant_id: int, patient_id: str, **update_data) -> Optional[models.Patient]:
        """Update patient information"""
        patient = self.get_patient(db, tenant_id, patient_id)
        if not patient:
            return None
        
        for field, value in update_data.items():
            if hasattr(patient, field):
                setattr(patient, field, value)
        
        patient.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(patient)
        
        logger.info(f"Updated patient {patient_id} for tenant {tenant_id}")
        return patient
    
    def create_appointment(self, db: Session, tenant_id: int, **appointment_data) -> models.Appointment:
        """Create a new appointment"""
        try:
            # Generate appointment ID
            appointment_id = self._generate_appointment_id(db, tenant_id)
            
            appointment = models.models.Appointment(
                tenant_id=tenant_id,
                appointment_id=appointment_id,
                **appointment_data
            )
            
            db.add(appointment)
            db.commit()
            db.refresh(appointment)
            
            logger.info(f"Created appointment {appointment_id} for tenant {tenant_id}")
            return appointment
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating appointment: {str(e)}")
            raise
    
    def get_appointment(self, db: Session, tenant_id: int, appointment_id: str) -> Optional[models.Appointment]:
        """Get appointment by ID"""
        return db.query(models.Appointment).filter(
            and_(
                models.models.Appointment.tenant_id == tenant_id,
                models.models.Appointment.appointment_id == appointment_id
            )
        ).first()
    
    def list_appointments(self, db: Session, tenant_id: int, skip: int = 0, limit: int = 100,
                         start_date: date = None, end_date: date = None, 
                         patient_id: str = None, status: str = None) -> List[models.Appointment]:
        """List appointments with optional filtering"""
        query = db.query(models.Appointment).filter(models.models.Appointment.tenant_id == tenant_id)
        
        if start_date:
            query = query.filter(models.models.Appointment.appointment_date >= start_date)
        
        if end_date:
            query = query.filter(models.models.Appointment.appointment_date <= end_date)
        
        if patient_id:
            query = query.join(Patient).filter(models.models.Patient.patient_id == patient_id)
        
        if status:
            query = query.filter(models.models.Appointment.status == status)
        
        return query.order_by(models.models.Appointment.appointment_date, models.models.Appointment.start_time).offset(skip).limit(limit).all()
    
    def update_appointment(self, db: Session, tenant_id: int, appointment_id: str, **update_data) -> Optional[models.Appointment]:
        """Update appointment"""
        appointment = self.get_appointment(db, tenant_id, appointment_id)
        if not appointment:
            return None
        
        for field, value in update_data.items():
            if hasattr(appointment, field):
                setattr(appointment, field, value)
        
        appointment.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(appointment)
        
        logger.info(f"Updated appointment {appointment_id} for tenant {tenant_id}")
        return appointment
    
    def create_treatment(self, db: Session, tenant_id: int, **treatment_data) -> models.Treatment:
        """Create a new treatment"""
        try:
            # Generate treatment ID
            treatment_id = self._generate_treatment_id(db, tenant_id)
            
            treatment = models.models.Treatment(
                tenant_id=tenant_id,
                treatment_id=treatment_id,
                **treatment_data
            )
            
            db.add(treatment)
            db.commit()
            db.refresh(treatment)
            
            logger.info(f"Created treatment {treatment_id} for tenant {tenant_id}")
            return treatment
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating treatment: {str(e)}")
            raise
    
    def get_treatment(self, db: Session, tenant_id: int, treatment_id: str) -> Optional[models.Treatment]:
        """Get treatment by ID"""
        return db.query(models.Treatment).filter(
            and_(
                models.models.Treatment.tenant_id == tenant_id,
                models.models.Treatment.treatment_id == treatment_id
            )
        ).first()
    
    def list_treatments(self, db: Session, tenant_id: int, skip: int = 0, limit: int = 100,
                       patient_id: str = None, status: str = None, 
                       start_date: date = None, end_date: date = None) -> List[models.Treatment]:
        """List treatments with optional filtering"""
        query = db.query(models.Treatment).filter(models.models.Treatment.tenant_id == tenant_id)
        
        if patient_id:
            query = query.join(Patient).filter(models.models.Patient.patient_id == patient_id)
        
        if status:
            query = query.filter(models.models.Treatment.status == status)
        
        if start_date:
            query = query.filter(models.models.Treatment.treatment_date >= start_date)
        
        if end_date:
            query = query.filter(models.models.Treatment.treatment_date <= end_date)
        
        return query.order_by(desc(models.models.Treatment.treatment_date)).offset(skip).limit(limit).all()
    
    def add_treatment_item(self, db: Session, tenant_id: int, treatment_id: str, **item_data) -> models.TreatmentItem:
        """Add item to treatment"""
        treatment = self.get_treatment(db, tenant_id, treatment_id)
        if not treatment:
            raise ValueError(f"Treatment {treatment_id} not found")
        
        item = models.models.TreatmentItem(
            tenant_id=tenant_id,
            treatment_id=treatment.id,
            **item_data
        )
        
        db.add(item)
        db.commit()
        db.refresh(item)
        
        logger.info(f"Added treatment item to treatment {treatment_id}")
        return item
    
    def add_medical_history(self, db: Session, tenant_id: int, patient_id: str, **history_data) -> models.MedicalHistory:
        """Add medical history record"""
        patient = self.get_patient(db, tenant_id, patient_id)
        if not patient:
            raise ValueError(f"Patient {patient_id} not found")
        
        history = models.models.MedicalHistory(
            tenant_id=tenant_id,
            patient_id=patient.id,
            **history_data
        )
        
        db.add(history)
        db.commit()
        db.refresh(history)
        
        logger.info(f"Added medical history for patient {patient_id}")
        return history
    
    def create_dental_supply(self, db: Session, tenant_id: int, **supply_data) -> models.DentalSupply:
        """Create dental supply item"""
        supply = models.models.DentalSupply(
            tenant_id=tenant_id,
            **supply_data
        )
        
        db.add(supply)
        db.commit()
        db.refresh(supply)
        
        logger.info(f"Created dental supply {supply.name} for tenant {tenant_id}")
        return supply
    
    def list_dental_supplies(self, db: Session, tenant_id: int, skip: int = 0, limit: int = 100,
                           category: str = None, low_stock: bool = False) -> List[models.DentalSupply]:
        """List dental supplies with optional filtering"""
        query = db.query(models.DentalSupply).filter(models.models.DentalSupply.tenant_id == tenant_id)
        
        if category:
            query = query.filter(models.models.DentalSupply.category == category)
        
        if low_stock:
            query = query.filter(models.models.DentalSupply.current_stock <= models.models.DentalSupply.minimum_stock)
        
        return query.offset(skip).limit(limit).all()
    
    def update_supply_stock(self, db: Session, tenant_id: int, supply_id: int, quantity: int) -> Optional[models.DentalSupply]:
        """Update supply stock"""
        supply = db.query(models.DentalSupply).filter(
            and_(
                models.models.DentalSupply.tenant_id == tenant_id,
                models.models.DentalSupply.id == supply_id
            )
        ).first()
        
        if not supply:
            return None
        
        supply.current_stock += quantity
        supply.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(supply)
        
        logger.info(f"Updated stock for supply {supply.name} by {quantity}")
        return supply
    
    def record_supply_usage(self, db: Session, tenant_id: int, treatment_id: str, 
                          supply_id: int, quantity: int, used_by: int) -> models.TreatmentSupplyUsage:
        """Record supply usage in treatment"""
        treatment = self.get_treatment(db, tenant_id, treatment_id)
        if not treatment:
            raise ValueError(f"Treatment {treatment_id} not found")
        
        supply = db.query(models.DentalSupply).filter(
            and_(
                models.models.DentalSupply.tenant_id == tenant_id,
                models.models.DentalSupply.id == supply_id
            )
        ).first()
        
        if not supply:
            raise ValueError(f"Supply {supply_id} not found")
        
        # Create usage record
        usage = models.models.TreatmentSupplyUsage(
            tenant_id=tenant_id,
            treatment_id=treatment.id,
            supply_id=supply_id,
            quantity_used=quantity,
            unit_cost=supply.unit_cost,
            total_cost=supply.unit_cost * quantity,
            usage_date=datetime.utcnow(),
            used_by=used_by
        )
        
        # Update supply stock
        supply.current_stock -= quantity
        
        db.add(usage)
        db.commit()
        db.refresh(usage)
        
        logger.info(f"Recorded supply usage: {quantity} of {supply.name} in treatment {treatment_id}")
        return usage
    
    def get_dashboard_stats(self, db: Session, tenant_id: int) -> Dict[str, Any]:
        """Get dental clinic dashboard statistics"""
        today = date.today()
        start_of_month = today.replace(day=1)
        
        # Patient statistics
        total_patients = db.query(models.Patient).filter(
            and_(
                models.models.Patient.tenant_id == tenant_id,
                models.models.Patient.is_active == True
            )
        ).count()
        
        new_patients_this_month = db.query(models.Patient).filter(
            and_(
                models.models.Patient.tenant_id == tenant_id,
                models.models.Patient.registration_date >= start_of_month
            )
        ).count()
        
        # Appointment statistics
        today_appointments = db.query(models.Appointment).filter(
            and_(
                models.models.Appointment.tenant_id == tenant_id,
                models.models.Appointment.appointment_date == today
            )
        ).count()
        
        pending_appointments = db.query(models.Appointment).filter(
            and_(
                models.models.Appointment.tenant_id == tenant_id,
                models.models.Appointment.status == 'Scheduled'
            )
        ).count()
        
        # Treatment statistics
        completed_treatments_this_month = db.query(models.Treatment).filter(
            and_(
                models.models.Treatment.tenant_id == tenant_id,
                models.models.Treatment.status == 'Completed',
                models.models.Treatment.completion_date >= start_of_month
            )
        ).count()
        
        total_revenue_this_month = db.query(func.sum(models.models.Treatment.actual_cost)).filter(
            and_(
                models.models.Treatment.tenant_id == tenant_id,
                models.models.Treatment.status == 'Completed',
                models.models.Treatment.completion_date >= start_of_month
            )
        ).scalar() or 0
        
        # Supply statistics
        low_stock_supplies = db.query(models.DentalSupply).filter(
            and_(
                models.models.DentalSupply.tenant_id == tenant_id,
                models.models.DentalSupply.current_stock <= models.models.DentalSupply.minimum_stock
            )
        ).count()
        
        return {
            'total_patients': total_patients,
            'new_patients_this_month': new_patients_this_month,
            'today_appointments': today_appointments,
            'pending_appointments': pending_appointments,
            'completed_treatments_this_month': completed_treatments_this_month,
            'total_revenue_this_month': float(total_revenue_this_month),
            'low_stock_supplies': low_stock_supplies
        }
    
    def _generate_patient_id(self, db: Session, tenant_id: int) -> str:
        """Generate unique patient ID"""
        # Get tenant info for prefix
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        prefix = tenant.slug.upper()[:3] if tenant else "PAT"
        
        # Get last patient number
        last_patient = db.query(models.Patient).filter(
            models.models.Patient.tenant_id == tenant_id
        ).order_by(desc(models.models.Patient.id)).first()
        
        if last_patient:
            try:
                last_number = int(last_patient.patient_id.split('-')[-1])
                new_number = last_number + 1
            except (ValueError, IndexError):
                new_number = 1
        else:
            new_number = 1
        
        return f"{prefix}-{new_number:06d}"
    
    def _generate_appointment_id(self, db: Session, tenant_id: int) -> str:
        """Generate unique appointment ID"""
        prefix = "APT"
        
        # Get last appointment number
        last_appointment = db.query(models.Appointment).filter(
            models.models.Appointment.tenant_id == tenant_id
        ).order_by(desc(models.models.Appointment.id)).first()
        
        if last_appointment:
            try:
                last_number = int(last_appointment.appointment_id.split('-')[-1])
                new_number = last_number + 1
            except (ValueError, IndexError):
                new_number = 1
        else:
            new_number = 1
        
        return f"{prefix}-{new_number:06d}"
    
    def _generate_treatment_id(self, db: Session, tenant_id: int) -> str:
        """Generate unique treatment ID"""
        prefix = "TRT"
        
        # Get last treatment number
        last_treatment = db.query(models.Treatment).filter(
            models.models.Treatment.tenant_id == tenant_id
        ).order_by(desc(models.models.Treatment.id)).first()
        
        if last_treatment:
            try:
                last_number = int(last_treatment.treatment_id.split('-')[-1])
                new_number = last_number + 1
            except (ValueError, IndexError):
                new_number = 1
        else:
            new_number = 1
        
        return f"{prefix}-{new_number:06d}"


# Global instance
dental_service = DentalService()
