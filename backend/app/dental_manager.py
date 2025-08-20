"""
Dental Clinic Domain Manager
Handles dental clinic specific features including patient management, treatment tracking, and dental supplies
"""
import asyncio
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from decimal import Decimal
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, or_, func
from sqlalchemy.orm import selectinload

from .models import (
    User, Party, Product, StockLedgerEntry, Invoice, InvoiceItem,
    Purchase, PurchaseItem, Expense, AuditTrail
)
from .tenant_config import tenant_config_manager
from .security_manager import security_manager
from .branding_manager import branding_manager

logger = logging.getLogger(__name__)

class DentalManager:
    """Comprehensive dental clinic domain management"""
    
    def __init__(self):
        self.patient_cache: Dict[str, Dict] = {}
        self.treatment_cache: Dict[str, Dict] = {}
        self.supplies_cache: Dict[str, Dict] = {}
        self._lock = asyncio.Lock()
    
    async def get_patient_profile(self, tenant_id: str, patient_id: str, session: AsyncSession) -> Optional[Dict]:
        """Get comprehensive patient profile with treatment history"""
        try:
            # Check cache first
            cache_key = f"{tenant_id}_{patient_id}"
            if cache_key in self.patient_cache:
                return self.patient_cache[cache_key]
            
            # Get patient from parties table (patients are stored as parties with type 'patient')
            patient_query = select(Party).where(
                and_(
                    Party.tenant_id == tenant_id,
                    Party.id == patient_id,
                    Party.party_type == 'patient'
                )
            )
            patient_result = await session.execute(patient_query)
            patient = patient_result.scalar_one_or_none()
            
            if not patient:
                return None
            
            # Get treatment history
            treatments = await self._get_patient_treatments(tenant_id, patient_id, session)
            
            # Get appointment history
            appointments = await self._get_patient_appointments(tenant_id, patient_id, session)
            
            # Get billing history
            billing_history = await self._get_patient_billing_history(tenant_id, patient_id, session)
            
            # Get medical notes
            medical_notes = await self._get_patient_medical_notes(tenant_id, patient_id, session)
            
            patient_profile = {
                'patient_id': patient.id,
                'name': patient.name,
                'phone': patient.phone,
                'email': patient.email,
                'address': patient.address,
                'date_of_birth': patient.date_of_birth,
                'gender': patient.gender,
                'emergency_contact': patient.emergency_contact,
                'medical_history': patient.medical_history,
                'allergies': patient.allergies,
                'insurance_info': patient.insurance_info,
                'registration_date': patient.created_at,
                'last_visit': patient.last_visit,
                'treatments': treatments,
                'appointments': appointments,
                'billing_history': billing_history,
                'medical_notes': medical_notes,
                'total_spent': sum(bill['amount'] for bill in billing_history),
                'treatment_count': len(treatments),
                'appointment_count': len(appointments)
            }
            
            # Cache the result
            self.patient_cache[cache_key] = patient_profile
            
            return patient_profile
            
        except Exception as e:
            logger.error(f"Error getting patient profile for {patient_id}: {e}")
            return None
    
    async def create_patient(self, tenant_id: str, patient_data: Dict, session: AsyncSession) -> Optional[Dict]:
        """Create a new patient"""
        try:
            # Validate required fields
            required_fields = ['name', 'phone']
            for field in required_fields:
                if field not in patient_data or not patient_data[field]:
                    raise ValueError(f"Required field '{field}' is missing")
            
            # Create patient record
            patient = Party(
                tenant_id=tenant_id,
                name=patient_data['name'],
                phone=patient_data['phone'],
                email=patient_data.get('email'),
                address=patient_data.get('address'),
                party_type='patient',
                date_of_birth=patient_data.get('date_of_birth'),
                gender=patient_data.get('gender'),
                emergency_contact=patient_data.get('emergency_contact'),
                medical_history=patient_data.get('medical_history'),
                allergies=patient_data.get('allergies'),
                insurance_info=patient_data.get('insurance_info'),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            session.add(patient)
            await session.commit()
            await session.refresh(patient)
            
            # Log the creation
            await security_manager.log_security_event(
                'PATIENT_CREATED', tenant_id, 
                details={'patient_id': patient.id, 'patient_name': patient.name}
            )
            
            return {
                'patient_id': patient.id,
                'name': patient.name,
                'phone': patient.phone,
                'email': patient.email,
                'registration_date': patient.created_at,
                'message': 'Patient created successfully'
            }
            
        except Exception as e:
            logger.error(f"Error creating patient: {e}")
            await session.rollback()
            return None
    
    async def update_patient(self, tenant_id: str, patient_id: str, updates: Dict, session: AsyncSession) -> bool:
        """Update patient information"""
        try:
            # Get existing patient
            patient_query = select(Party).where(
                and_(
                    Party.tenant_id == tenant_id,
                    Party.id == patient_id,
                    Party.party_type == 'patient'
                )
            )
            patient_result = await session.execute(patient_query)
            patient = patient_result.scalar_one_or_none()
            
            if not patient:
                return False
            
            # Update fields
            for field, value in updates.items():
                if hasattr(patient, field):
                    setattr(patient, field, value)
            
            patient.updated_at = datetime.utcnow()
            
            await session.commit()
            
            # Clear cache
            cache_key = f"{tenant_id}_{patient_id}"
            if cache_key in self.patient_cache:
                del self.patient_cache[cache_key]
            
            # Log the update
            await security_manager.log_security_event(
                'PATIENT_UPDATED', tenant_id,
                details={'patient_id': patient_id, 'updates': updates}
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating patient {patient_id}: {e}")
            await session.rollback()
            return False
    
    async def create_treatment_record(self, tenant_id: str, treatment_data: Dict, session: AsyncSession) -> Optional[Dict]:
        """Create a new treatment record"""
        try:
            # Validate required fields
            required_fields = ['patient_id', 'treatment_type', 'description']
            for field in required_fields:
                if field not in treatment_data or not treatment_data[field]:
                    raise ValueError(f"Required field '{field}' is missing")
            
            # Create treatment record (stored as expense with type 'treatment')
            treatment = Expense(
                tenant_id=tenant_id,
                patient_id=treatment_data['patient_id'],
                treatment_type=treatment_data['treatment_type'],
                description=treatment_data['description'],
                amount=treatment_data.get('amount', 0),
                treatment_date=treatment_data.get('treatment_date', datetime.utcnow()),
                next_appointment=treatment_data.get('next_appointment'),
                dentist_id=treatment_data.get('dentist_id'),
                treatment_notes=treatment_data.get('treatment_notes'),
                follow_up_required=treatment_data.get('follow_up_required', False),
                follow_up_date=treatment_data.get('follow_up_date'),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            session.add(treatment)
            await session.commit()
            await session.refresh(treatment)
            
            # Log the creation
            await security_manager.log_security_event(
                'TREATMENT_CREATED', tenant_id,
                details={
                    'treatment_id': treatment.id,
                    'patient_id': treatment.patient_id,
                    'treatment_type': treatment.treatment_type
                }
            )
            
            return {
                'treatment_id': treatment.id,
                'patient_id': treatment.patient_id,
                'treatment_type': treatment.treatment_type,
                'description': treatment.description,
                'amount': treatment.amount,
                'treatment_date': treatment.treatment_date,
                'message': 'Treatment record created successfully'
            }
            
        except Exception as e:
            logger.error(f"Error creating treatment record: {e}")
            await session.rollback()
            return None
    
    async def get_dental_supplies(self, tenant_id: str, session: AsyncSession) -> List[Dict]:
        """Get dental supplies inventory"""
        try:
            # Get dental supplies (products with category 'dental_supplies')
            supplies_query = select(Product).where(
                and_(
                    Product.tenant_id == tenant_id,
                    Product.category == 'dental_supplies'
                )
            )
            supplies_result = await session.execute(supplies_query)
            supplies = supplies_result.scalars().all()
            
            supplies_list = []
            for supply in supplies:
                # Get current stock level
                stock_query = select(func.sum(StockLedgerEntry.quantity)).where(
                    and_(
                        StockLedgerEntry.tenant_id == tenant_id,
                        StockLedgerEntry.product_id == supply.id
                    )
                )
                stock_result = await session.execute(stock_query)
                current_stock = stock_result.scalar() or 0
                
                supplies_list.append({
                    'supply_id': supply.id,
                    'name': supply.name,
                    'description': supply.description,
                    'category': supply.category,
                    'unit': supply.unit,
                    'current_stock': current_stock,
                    'reorder_level': supply.reorder_level,
                    'cost_price': supply.cost_price,
                    'selling_price': supply.selling_price,
                    'supplier': supply.supplier,
                    'last_restocked': supply.last_restocked,
                    'expiry_date': supply.expiry_date,
                    'is_active': supply.is_active
                })
            
            return supplies_list
            
        except Exception as e:
            logger.error(f"Error getting dental supplies: {e}")
            return []
    
    async def create_dental_supply_order(self, tenant_id: str, order_data: Dict, session: AsyncSession) -> Optional[Dict]:
        """Create a dental supply order"""
        try:
            # Validate required fields
            if 'items' not in order_data or not order_data['items']:
                raise ValueError("Order must contain at least one item")
            
            # Create purchase order
            purchase = Purchase(
                tenant_id=tenant_id,
                supplier_id=order_data.get('supplier_id'),
                order_date=datetime.utcnow(),
                expected_delivery=order_data.get('expected_delivery'),
                status='ordered',
                notes=order_data.get('notes'),
                total_amount=0,  # Will be calculated
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            session.add(purchase)
            await session.flush()  # Get the ID
            
            # Add purchase items
            total_amount = 0
            for item in order_data['items']:
                purchase_item = PurchaseItem(
                    tenant_id=tenant_id,
                    purchase_id=purchase.id,
                    product_id=item['product_id'],
                    quantity=item['quantity'],
                    unit_price=item['unit_price'],
                    total_price=item['quantity'] * item['unit_price']
                )
                session.add(purchase_item)
                total_amount += purchase_item.total_price
            
            # Update total amount
            purchase.total_amount = total_amount
            
            await session.commit()
            await session.refresh(purchase)
            
            # Log the order
            await security_manager.log_security_event(
                'DENTAL_SUPPLY_ORDERED', tenant_id,
                details={
                    'order_id': purchase.id,
                    'supplier_id': purchase.supplier_id,
                    'total_amount': total_amount,
                    'item_count': len(order_data['items'])
                }
            )
            
            return {
                'order_id': purchase.id,
                'supplier_id': purchase.supplier_id,
                'order_date': purchase.order_date,
                'total_amount': total_amount,
                'status': purchase.status,
                'message': 'Dental supply order created successfully'
            }
            
        except Exception as e:
            logger.error(f"Error creating dental supply order: {e}")
            await session.rollback()
            return None
    
    async def get_appointment_schedule(self, tenant_id: str, date: Optional[datetime] = None, session: AsyncSession = None) -> List[Dict]:
        """Get appointment schedule for a specific date or today"""
        try:
            if not date:
                date = datetime.utcnow().date()
            
            # Get appointments for the date (stored as expenses with type 'appointment')
            appointment_query = select(Expense).where(
                and_(
                    Expense.tenant_id == tenant_id,
                    Expense.expense_type == 'appointment',
                    func.date(Expense.appointment_date) == date
                )
            ).order_by(Expense.appointment_time)
            
            appointment_result = await session.execute(appointment_query)
            appointments = appointment_result.scalars().all()
            
            schedule = []
            for appointment in appointments:
                # Get patient details
                patient = await self._get_patient_by_id(tenant_id, appointment.patient_id, session)
                
                schedule.append({
                    'appointment_id': appointment.id,
                    'patient_id': appointment.patient_id,
                    'patient_name': patient['name'] if patient else 'Unknown',
                    'appointment_time': appointment.appointment_time,
                    'duration': appointment.duration,
                    'treatment_type': appointment.treatment_type,
                    'dentist_id': appointment.dentist_id,
                    'status': appointment.status,
                    'notes': appointment.notes
                })
            
            return schedule
            
        except Exception as e:
            logger.error(f"Error getting appointment schedule: {e}")
            return []
    
    async def create_appointment(self, tenant_id: str, appointment_data: Dict, session: AsyncSession) -> Optional[Dict]:
        """Create a new appointment"""
        try:
            # Validate required fields
            required_fields = ['patient_id', 'appointment_time', 'treatment_type']
            for field in required_fields:
                if field not in appointment_data or not appointment_data[field]:
                    raise ValueError(f"Required field '{field}' is missing")
            
            # Create appointment (stored as expense with type 'appointment')
            appointment = Expense(
                tenant_id=tenant_id,
                patient_id=appointment_data['patient_id'],
                appointment_time=appointment_data['appointment_time'],
                appointment_date=appointment_data['appointment_time'].date(),
                treatment_type=appointment_data['treatment_type'],
                duration=appointment_data.get('duration', 60),  # Default 60 minutes
                dentist_id=appointment_data.get('dentist_id'),
                status='scheduled',
                notes=appointment_data.get('notes'),
                expense_type='appointment',
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            session.add(appointment)
            await session.commit()
            await session.refresh(appointment)
            
            # Log the creation
            await security_manager.log_security_event(
                'APPOINTMENT_CREATED', tenant_id,
                details={
                    'appointment_id': appointment.id,
                    'patient_id': appointment.patient_id,
                    'appointment_time': appointment.appointment_time.isoformat(),
                    'treatment_type': appointment.treatment_type
                }
            )
            
            return {
                'appointment_id': appointment.id,
                'patient_id': appointment.patient_id,
                'appointment_time': appointment.appointment_time,
                'treatment_type': appointment.treatment_type,
                'status': appointment.status,
                'message': 'Appointment created successfully'
            }
            
        except Exception as e:
            logger.error(f"Error creating appointment: {e}")
            await session.rollback()
            return None
    
    async def get_dental_analytics(self, tenant_id: str, session: AsyncSession) -> Dict:
        """Get dental clinic analytics and insights"""
        try:
            # Get total patients
            patient_count_query = select(func.count(Party.id)).where(
                and_(
                    Party.tenant_id == tenant_id,
                    Party.party_type == 'patient'
                )
            )
            patient_count_result = await session.execute(patient_count_query)
            total_patients = patient_count_result.scalar() or 0
            
            # Get treatments this month
            current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            treatments_this_month_query = select(func.count(Expense.id)).where(
                and_(
                    Expense.tenant_id == tenant_id,
                    Expense.expense_type == 'treatment',
                    Expense.treatment_date >= current_month
                )
            )
            treatments_result = await session.execute(treatments_this_month_query)
            treatments_this_month = treatments_result.scalar() or 0
            
            # Get appointments today
            today = datetime.utcnow().date()
            appointments_today_query = select(func.count(Expense.id)).where(
                and_(
                    Expense.tenant_id == tenant_id,
                    Expense.expense_type == 'appointment',
                    func.date(Expense.appointment_date) == today
                )
            )
            appointments_result = await session.execute(appointments_today_query)
            appointments_today = appointments_result.scalar() or 0
            
            # Get revenue this month
            revenue_query = select(func.sum(Expense.amount)).where(
                and_(
                    Expense.tenant_id == tenant_id,
                    Expense.expense_type == 'treatment',
                    Expense.treatment_date >= current_month
                )
            )
            revenue_result = await session.execute(revenue_query)
            revenue_this_month = revenue_result.scalar() or 0
            
            # Get low stock supplies
            low_stock_query = select(Product).where(
                and_(
                    Product.tenant_id == tenant_id,
                    Product.category == 'dental_supplies',
                    Product.is_active == True
                )
            )
            supplies_result = await session.execute(low_stock_query)
            supplies = supplies_result.scalars().all()
            
            low_stock_supplies = []
            for supply in supplies:
                stock_query = select(func.sum(StockLedgerEntry.quantity)).where(
                    and_(
                        StockLedgerEntry.tenant_id == tenant_id,
                        StockLedgerEntry.product_id == supply.id
                    )
                )
                stock_result = await session.execute(stock_query)
                current_stock = stock_result.scalar() or 0
                
                if current_stock <= supply.reorder_level:
                    low_stock_supplies.append({
                        'supply_id': supply.id,
                        'name': supply.name,
                        'current_stock': current_stock,
                        'reorder_level': supply.reorder_level
                    })
            
            return {
                'total_patients': total_patients,
                'treatments_this_month': treatments_this_month,
                'appointments_today': appointments_today,
                'revenue_this_month': float(revenue_this_month),
                'low_stock_supplies': low_stock_supplies,
                'low_stock_count': len(low_stock_supplies),
                'analytics_date': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting dental analytics: {e}")
            return {}
    
    # Helper methods
    async def _get_patient_treatments(self, tenant_id: str, patient_id: str, session: AsyncSession) -> List[Dict]:
        """Get treatment history for a patient"""
        try:
            treatments_query = select(Expense).where(
                and_(
                    Expense.tenant_id == tenant_id,
                    Expense.patient_id == patient_id,
                    Expense.expense_type == 'treatment'
                )
            ).order_by(Expense.treatment_date.desc())
            
            treatments_result = await session.execute(treatments_query)
            treatments = treatments_result.scalars().all()
            
            return [{
                'treatment_id': t.id,
                'treatment_type': t.treatment_type,
                'description': t.description,
                'treatment_date': t.treatment_date,
                'amount': float(t.amount),
                'dentist_id': t.dentist_id,
                'treatment_notes': t.treatment_notes,
                'follow_up_required': t.follow_up_required,
                'follow_up_date': t.follow_up_date
            } for t in treatments]
            
        except Exception as e:
            logger.error(f"Error getting patient treatments: {e}")
            return []
    
    async def _get_patient_appointments(self, tenant_id: str, patient_id: str, session: AsyncSession) -> List[Dict]:
        """Get appointment history for a patient"""
        try:
            appointments_query = select(Expense).where(
                and_(
                    Expense.tenant_id == tenant_id,
                    Expense.patient_id == patient_id,
                    Expense.expense_type == 'appointment'
                )
            ).order_by(Expense.appointment_date.desc())
            
            appointments_result = await session.execute(appointments_query)
            appointments = appointments_result.scalars().all()
            
            return [{
                'appointment_id': a.id,
                'appointment_date': a.appointment_date,
                'appointment_time': a.appointment_time,
                'treatment_type': a.treatment_type,
                'status': a.status,
                'notes': a.notes
            } for a in appointments]
            
        except Exception as e:
            logger.error(f"Error getting patient appointments: {e}")
            return []
    
    async def _get_patient_billing_history(self, tenant_id: str, patient_id: str, session: AsyncSession) -> List[Dict]:
        """Get billing history for a patient"""
        try:
            # Get invoices for the patient
            invoices_query = select(Invoice).where(
                and_(
                    Invoice.tenant_id == tenant_id,
                    Invoice.customer_id == patient_id
                )
            ).order_by(Invoice.invoice_date.desc())
            
            invoices_result = await session.execute(invoices_query)
            invoices = invoices_result.scalars().all()
            
            return [{
                'invoice_id': inv.id,
                'invoice_number': inv.invoice_number,
                'invoice_date': inv.invoice_date,
                'amount': float(inv.total_amount),
                'status': inv.status,
                'due_date': inv.due_date
            } for inv in invoices]
            
        except Exception as e:
            logger.error(f"Error getting patient billing history: {e}")
            return []
    
    async def _get_patient_medical_notes(self, tenant_id: str, patient_id: str, session: AsyncSession) -> List[Dict]:
        """Get medical notes for a patient"""
        try:
            # Get medical notes (stored as expenses with type 'medical_note')
            notes_query = select(Expense).where(
                and_(
                    Expense.tenant_id == tenant_id,
                    Expense.patient_id == patient_id,
                    Expense.expense_type == 'medical_note'
                )
            ).order_by(Expense.created_at.desc())
            
            notes_result = await session.execute(notes_query)
            notes = notes_result.scalars().all()
            
            return [{
                'note_id': n.id,
                'note_date': n.created_at,
                'notes': n.notes,
                'dentist_id': n.dentist_id
            } for n in notes]
            
        except Exception as e:
            logger.error(f"Error getting patient medical notes: {e}")
            return []
    
    async def _get_patient_by_id(self, tenant_id: str, patient_id: str, session: AsyncSession) -> Optional[Dict]:
        """Get basic patient information by ID"""
        try:
            patient_query = select(Party).where(
                and_(
                    Party.tenant_id == tenant_id,
                    Party.id == patient_id,
                    Party.party_type == 'patient'
                )
            )
            patient_result = await session.execute(patient_query)
            patient = patient_result.scalar_one_or_none()
            
            if patient:
                return {
                    'id': patient.id,
                    'name': patient.name,
                    'phone': patient.phone,
                    'email': patient.email
                }
            return None
            
        except Exception as e:
            logger.error(f"Error getting patient by ID: {e}")
            return None

# Global instance
dental_manager = DentalManager()
