"""
Recurring invoice management and automation
"""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from .models import (
    RecurringInvoiceTemplate, 
    RecurringInvoiceTemplateItem, 
    RecurringInvoice,
    Invoice, 
    InvoiceItem,
    Party,
    Product
)
from .currency import get_exchange_rate, convert_amount


class RecurringInvoiceService:
    """Service for managing recurring invoices"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_template(self, template_data: dict) -> RecurringInvoiceTemplate:
        """Create a new recurring invoice template"""
        template = RecurringInvoiceTemplate(**template_data)
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template
    
    def add_template_item(self, template_id: int, item_data: dict) -> RecurringInvoiceTemplateItem:
        """Add an item to a recurring invoice template"""
        item_data['template_id'] = template_id
        item = RecurringInvoiceTemplateItem(**item_data)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item
    
    def get_active_templates(self) -> List[RecurringInvoiceTemplate]:
        """Get all active recurring invoice templates"""
        return self.db.query(RecurringInvoiceTemplate).filter(
            RecurringInvoiceTemplate.is_active == True
        ).all()
    
    def get_template_by_id(self, template_id: int) -> Optional[RecurringInvoiceTemplate]:
        """Get a template by ID"""
        return self.db.query(RecurringInvoiceTemplate).filter(
            RecurringInvoiceTemplate.id == template_id
        ).first()
    
    def get_template_items(self, template_id: int) -> List[RecurringInvoiceTemplateItem]:
        """Get all items for a template"""
        return self.db.query(RecurringInvoiceTemplateItem).filter(
            RecurringInvoiceTemplateItem.template_id == template_id
        ).all()
    
    def update_template(self, template_id: int, update_data: dict) -> Optional[RecurringInvoiceTemplate]:
        """Update a recurring invoice template"""
        template = self.get_template_by_id(template_id)
        if not template:
            return None
        
        for key, value in update_data.items():
            if hasattr(template, key):
                setattr(template, key, value)
        
        template.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(template)
        return template
    
    def deactivate_template(self, template_id: int) -> bool:
        """Deactivate a recurring invoice template"""
        template = self.get_template_by_id(template_id)
        if not template:
            return False
        
        template.is_active = False
        template.updated_at = datetime.utcnow()
        self.db.commit()
        return True
    
    def generate_invoices(self) -> List[Invoice]:
        """Generate invoices for all due recurring templates"""
        generated_invoices = []
        
        # Get all active templates that are due for generation
        due_templates = self.db.query(RecurringInvoiceTemplate).filter(
            and_(
                RecurringInvoiceTemplate.is_active == True,
                RecurringInvoiceTemplate.next_generation_date <= datetime.utcnow(),
                (RecurringInvoiceTemplate.end_date.is_(None) | 
                 (RecurringInvoiceTemplate.end_date > datetime.utcnow()))
            )
        ).all()
        
        for template in due_templates:
            try:
                invoice = self._generate_invoice_from_template(template)
                if invoice:
                    generated_invoices.append(invoice)
                    self._update_template_next_generation_date(template)
            except Exception as e:
                print(f"Error generating invoice for template {template.id}: {e}")
                continue
        
        return generated_invoices
    
    def _generate_invoice_from_template(self, template: RecurringInvoiceTemplate) -> Optional[Invoice]:
        """Generate a single invoice from a template"""
        # Get template items
        template_items = self.get_template_items(template.id)
        if not template_items:
            return None
        
        # Calculate due date based on terms
        due_date = self._calculate_due_date(template.terms, datetime.utcnow())
        
        # Create invoice
        invoice_data = {
            'customer_id': template.customer_id,
            'supplier_id': template.supplier_id,
            'date': datetime.utcnow(),
            'due_date': due_date,
            'terms': template.terms,
            'currency': template.currency,
            'exchange_rate': template.exchange_rate,
            'place_of_supply': template.place_of_supply,
            'place_of_supply_state_code': template.place_of_supply_state_code,
            'bill_to_address': template.bill_to_address,
            'ship_to_address': template.ship_to_address,
            'notes': template.notes,
            'status': 'Draft'
        }
        
        # Generate invoice number
        invoice_data['invoice_no'] = self._generate_invoice_number()
        
        # Create invoice
        invoice = Invoice(**invoice_data)
        self.db.add(invoice)
        self.db.flush()  # Get the invoice ID
        
        # Add invoice items
        taxable_total = Decimal('0')
        discount_total = Decimal('0')
        cgst_total = Decimal('0')
        sgst_total = Decimal('0')
        igst_total = Decimal('0')
        utgst_total = Decimal('0')
        cess_total = Decimal('0')
        
        for template_item in template_items:
            product = self.db.query(Product).filter(Product.id == template_item.product_id).first()
            if not product:
                continue
            
            # Calculate item totals
            item_total = template_item.qty * template_item.rate
            discount_amount = Decimal('0')
            
            if template_item.discount_type == 'Percentage':
                discount_amount = item_total * (template_item.discount / Decimal('100'))
            else:
                discount_amount = template_item.discount
            
            taxable_value = item_total - discount_amount
            taxable_total += taxable_value
            discount_total += discount_amount
            
            # Calculate GST
            gst_amount = taxable_value * (template_item.gst_rate / Decimal('100'))
            
            # Determine GST type based on place of supply
            # This is a simplified logic - in production, use proper GST logic
            if template.place_of_supply_state_code == '27':  # Maharashtra
                cgst_total += gst_amount / Decimal('2')
                sgst_total += gst_amount / Decimal('2')
            else:
                igst_total += gst_amount
            
            # Create invoice item
            invoice_item = InvoiceItem(
                invoice_id=invoice.id,
                product_id=template_item.product_id,
                description=template_item.description,
                hsn_code=template_item.hsn_code or product.hsn,
                qty=template_item.qty,
                rate=template_item.rate,
                discount=template_item.discount,
                discount_type=template_item.discount_type,
                taxable_value=taxable_value,
                gst_rate=template_item.gst_rate,
                cgst=gst_amount / Decimal('2') if template.place_of_supply_state_code == '27' else Decimal('0'),
                sgst=gst_amount / Decimal('2') if template.place_of_supply_state_code == '27' else Decimal('0'),
                igst=gst_amount if template.place_of_supply_state_code != '27' else Decimal('0'),
                utgst=Decimal('0'),
                cess=Decimal('0'),
                amount=item_total
            )
            self.db.add(invoice_item)
        
        # Update invoice totals
        invoice.taxable_value = taxable_total
        invoice.total_discount = discount_total
        invoice.cgst = cgst_total
        invoice.sgst = sgst_total
        invoice.igst = igst_total
        invoice.utgst = utgst_total
        invoice.cess = cess_total
        invoice.round_off = Decimal('0')
        invoice.grand_total = taxable_total + cgst_total + sgst_total + igst_total + utgst_total + cess_total
        invoice.paid_amount = Decimal('0')
        invoice.balance_amount = invoice.grand_total
        
        # Create recurring invoice record
        recurring_invoice = RecurringInvoice(
            template_id=template.id,
            invoice_id=invoice.id,
            generation_date=datetime.utcnow(),
            due_date=due_date,
            status='Generated'
        )
        self.db.add(recurring_invoice)
        
        self.db.commit()
        self.db.refresh(invoice)
        return invoice
    
    def _calculate_due_date(self, terms: str, invoice_date: datetime) -> datetime:
        """Calculate due date based on payment terms"""
        if terms == "Due on Receipt":
            return invoice_date
        elif terms == "Net 15":
            return invoice_date + timedelta(days=15)
        elif terms == "Net 30":
            return invoice_date + timedelta(days=30)
        elif terms == "Net 45":
            return invoice_date + timedelta(days=45)
        elif terms == "Net 60":
            return invoice_date + timedelta(days=60)
        else:
            return invoice_date + timedelta(days=30)  # Default to 30 days
    
    def _generate_invoice_number(self) -> str:
        """Generate next invoice number"""
        from .routers import _next_invoice_no
        return _next_invoice_no(self.db)
    
    def _update_template_next_generation_date(self, template: RecurringInvoiceTemplate):
        """Update the next generation date for a template"""
        current_date = template.next_generation_date
        
        if template.recurrence_type == 'weekly':
            next_date = current_date + timedelta(weeks=template.recurrence_interval)
        elif template.recurrence_type == 'monthly':
            # Simple monthly calculation - in production, handle month boundaries properly
            next_date = current_date + timedelta(days=30 * template.recurrence_interval)
        elif template.recurrence_type == 'yearly':
            next_date = current_date + timedelta(days=365 * template.recurrence_interval)
        else:
            next_date = current_date + timedelta(days=30)  # Default to monthly
        
        template.next_generation_date = next_date
        self.db.commit()
    
    def get_recurring_invoices(self, template_id: Optional[int] = None) -> List[RecurringInvoice]:
        """Get recurring invoices, optionally filtered by template"""
        query = self.db.query(RecurringInvoice)
        if template_id:
            query = query.filter(RecurringInvoice.template_id == template_id)
        return query.order_by(RecurringInvoice.created_at.desc()).all()
    
    def update_recurring_invoice_status(self, recurring_invoice_id: int, status: str) -> bool:
        """Update status of a recurring invoice"""
        recurring_invoice = self.db.query(RecurringInvoice).filter(
            RecurringInvoice.id == recurring_invoice_id
        ).first()
        
        if not recurring_invoice:
            return False
        
        recurring_invoice.status = status
        self.db.commit()
        return True


def generate_recurring_invoices(db: Session) -> List[Invoice]:
    """Generate all due recurring invoices"""
    service = RecurringInvoiceService(db)
    return service.generate_invoices()
