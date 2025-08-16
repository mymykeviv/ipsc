"""
Purchase Order management and workflow
"""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from .models import (
    PurchaseOrder, 
    PurchaseOrderItem, 
    Purchase, 
    PurchaseItem,
    Party,
    Product,
    User
)
from .gst import money, split_gst


class PurchaseOrderService:
    """Service for managing purchase orders"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_purchase_order(self, po_data: dict) -> PurchaseOrder:
        """Create a new purchase order"""
        # Generate PO number if not provided
        if 'po_number' not in po_data or not po_data['po_number']:
            po_data['po_number'] = self._generate_po_number()
        
        po = PurchaseOrder(**po_data)
        self.db.add(po)
        self.db.commit()
        self.db.refresh(po)
        return po
    
    def add_po_item(self, po_id: int, item_data: dict) -> PurchaseOrderItem:
        """Add an item to a purchase order"""
        item_data['purchase_order_id'] = po_id
        
        # Calculate item amount
        qty = Decimal(str(item_data['qty']))
        rate = item_data['expected_rate']
        discount = item_data.get('discount', Decimal('0'))
        discount_type = item_data.get('discount_type', 'Percentage')
        
        if discount_type == 'Percentage':
            discount_amount = (qty * rate) * (discount / Decimal('100'))
        else:
            discount_amount = discount
        
        item_amount = (qty * rate) - discount_amount
        item_data['amount'] = item_amount
        
        item = PurchaseOrderItem(**item_data)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        
        # Update PO totals
        self._update_po_totals(po_id)
        
        return item
    
    def get_purchase_order(self, po_id: int) -> Optional[PurchaseOrder]:
        """Get a purchase order by ID"""
        return self.db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    
    def get_po_items(self, po_id: int) -> List[PurchaseOrderItem]:
        """Get all items for a purchase order"""
        return self.db.query(PurchaseOrderItem).filter(
            PurchaseOrderItem.purchase_order_id == po_id
        ).all()
    
    def get_purchase_orders(self, status: Optional[str] = None) -> List[PurchaseOrder]:
        """Get purchase orders, optionally filtered by status"""
        query = self.db.query(PurchaseOrder)
        if status:
            query = query.filter(PurchaseOrder.status == status)
        return query.order_by(PurchaseOrder.created_at.desc()).all()
    
    def update_po_status(self, po_id: int, new_status: str, user_id: Optional[int] = None) -> bool:
        """Update purchase order status"""
        po = self.get_purchase_order(po_id)
        if not po:
            return False
        
        # Validate status transition
        if not self._is_valid_status_transition(po.status, new_status):
            return False
        
        po.status = new_status
        po.updated_at = datetime.utcnow()
        
        # Update workflow timestamps
        if new_status == 'Approved':
            po.approved_by = user_id
            po.approved_at = datetime.utcnow()
        elif new_status == 'Sent':
            po.sent_at = datetime.utcnow()
        elif new_status == 'Received':
            po.received_at = datetime.utcnow()
        elif new_status == 'Closed':
            po.closed_at = datetime.utcnow()
        
        self.db.commit()
        return True
    
    def convert_po_to_purchase(self, po_id: int) -> Optional[Purchase]:
        """Convert a purchase order to a purchase invoice"""
        po = self.get_purchase_order(po_id)
        if not po or po.status != 'Approved':
            return None
        
        # Create purchase
        purchase_data = {
            'vendor_id': po.vendor_id,
            'purchase_no': self._generate_purchase_number(),
            'date': datetime.utcnow(),
            'due_date': self._calculate_due_date(po.terms, datetime.utcnow()),
            'terms': po.terms,
            'place_of_supply': po.place_of_supply,
            'place_of_supply_state_code': po.place_of_supply_state_code,
            'reverse_charge': po.reverse_charge,
            'export_supply': False,  # PO to purchase is typically domestic
            'eway_bill_number': None,
            'bill_from_address': po.ship_from_address,  # Use PO ship_from_address as bill_from_address
            'ship_from_address': po.ship_from_address,
            'status': 'Draft'
        }
        
        # Set default values for required fields
        purchase_data.update({
            'taxable_value': Decimal('0'),
            'total_discount': Decimal('0'),
            'cgst': Decimal('0'),
            'sgst': Decimal('0'),
            'igst': Decimal('0'),
            'utgst': Decimal('0'),
            'cess': Decimal('0'),
            'round_off': Decimal('0'),
            'grand_total': Decimal('0'),
            'paid_amount': Decimal('0'),
            'balance_amount': Decimal('0')
        })
        
        purchase = Purchase(**purchase_data)
        self.db.add(purchase)
        self.db.flush()  # Get the purchase ID
        
        # Add purchase items
        po_items = self.get_po_items(po_id)
        for po_item in po_items:
            product = self.db.query(Product).filter(Product.id == po_item.product_id).first()
            if not product:
                continue
            
            # Calculate GST
            taxable_value = po_item.amount
            gst_amount = taxable_value * (Decimal(str(po_item.gst_rate)) / Decimal('100'))
            
            # Determine GST type based on place of supply
            if po.place_of_supply_state_code == '27':  # Maharashtra
                cgst = gst_amount / Decimal('2')
                sgst = gst_amount / Decimal('2')
                igst = Decimal('0')
            else:
                cgst = Decimal('0')
                sgst = Decimal('0')
                igst = gst_amount
            
            purchase_item = PurchaseItem(
                purchase_id=purchase.id,
                product_id=po_item.product_id,
                description=po_item.description,
                hsn_code=po_item.hsn_code or product.hsn,
                qty=po_item.qty,
                rate=po_item.expected_rate,
                discount=po_item.discount,
                discount_type=po_item.discount_type,
                taxable_value=taxable_value,
                gst_rate=po_item.gst_rate,
                cgst=cgst,
                sgst=sgst,
                igst=igst,
                utgst=Decimal('0'),
                cess=Decimal('0'),
                amount=po_item.amount
            )
            self.db.add(purchase_item)
        
        # Update purchase totals
        self._update_purchase_totals(purchase.id)
        
        # Update PO status to Closed
        po.status = 'Closed'
        po.closed_at = datetime.utcnow()
        po.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(purchase)
        return purchase
    
    def _generate_po_number(self) -> str:
        """Generate next PO number"""
        from datetime import datetime
        
        # Get current financial year (April to March)
        current_date = datetime.now()
        if current_date.month >= 4:
            fy_year = current_date.year
        else:
            fy_year = current_date.year - 1
        
        fy_prefix = f"FY{fy_year}"
        
        # Find the last PO number for this financial year
        last_po = self.db.query(PurchaseOrder).filter(
            PurchaseOrder.po_number.like(f"{fy_prefix}/PO-%")
        ).order_by(PurchaseOrder.po_number.desc()).first()
        
        if last_po:
            # Extract sequence number from last PO
            try:
                last_seq = int(last_po.po_number.split('-')[-1])
                seq = last_seq + 1
            except (ValueError, IndexError):
                seq = 1
        else:
            seq = 1
        
        # Format as FY<year>/PO-<4 digit sequence>
        po_number = f"{fy_prefix}/PO-{seq:04d}"
        
        # Ensure total length doesn't exceed 16 characters
        if len(po_number) > 16:
            po_number = po_number[:16]
        
        return po_number
    
    def _generate_purchase_number(self) -> str:
        """Generate next purchase number"""
        from datetime import datetime
        
        # Get current financial year (April to March)
        current_date = datetime.now()
        if current_date.month >= 4:
            fy_year = current_date.year
        else:
            fy_year = current_date.year - 1
        
        fy_prefix = f"FY{fy_year}"
        
        # Find the last purchase number for this financial year
        last_purchase = self.db.query(Purchase).filter(
            Purchase.purchase_no.like(f"{fy_prefix}/PUR-%")
        ).order_by(Purchase.purchase_no.desc()).first()
        
        if last_purchase:
            # Extract sequence number from last purchase
            try:
                last_seq = int(last_purchase.purchase_no.split('-')[-1])
                seq = last_seq + 1
            except (ValueError, IndexError):
                seq = 1
        else:
            seq = 1
        
        # Format as FY<year>/PUR-<4 digit sequence>
        purchase_no = f"{fy_prefix}/PUR-{seq:04d}"
        
        # Ensure total length doesn't exceed 16 characters
        if len(purchase_no) > 16:
            purchase_no = purchase_no[:16]
        
        return purchase_no
    
    def _calculate_due_date(self, terms: str, purchase_date: datetime) -> datetime:
        """Calculate due date based on payment terms"""
        if terms == "Due on Receipt":
            return purchase_date
        elif terms == "Net 15":
            return purchase_date + timedelta(days=15)
        elif terms == "Net 30":
            return purchase_date + timedelta(days=30)
        elif terms == "Net 45":
            return purchase_date + timedelta(days=45)
        elif terms == "Net 60":
            return purchase_date + timedelta(days=60)
        else:
            return purchase_date + timedelta(days=30)  # Default to 30 days
    
    def _is_valid_status_transition(self, current_status: str, new_status: str) -> bool:
        """Validate status transition"""
        valid_transitions = {
            'Draft': ['Approved', 'Cancelled'],
            'Approved': ['Sent', 'Cancelled'],
            'Sent': ['Received', 'Cancelled'],
            'Received': ['Closed', 'Cancelled'],
            'Closed': [],  # No further transitions
            'Cancelled': []  # No further transitions
        }
        
        return new_status in valid_transitions.get(current_status, [])
    
    def _update_po_totals(self, po_id: int):
        """Update purchase order totals"""
        po = self.get_purchase_order(po_id)
        if not po:
            return
        
        items = self.get_po_items(po_id)
        
        subtotal = sum(item.amount for item in items)
        total_discount = sum(
            item.discount if item.discount_type == 'Fixed' 
            else (item.amount * item.discount / Decimal('100'))
            for item in items
        )
        
        # Calculate GST totals
        cgst_total = Decimal('0')
        sgst_total = Decimal('0')
        igst_total = Decimal('0')
        
        for item in items:
            gst_amount = item.amount * (Decimal(str(item.gst_rate)) / Decimal('100'))
            if po.place_of_supply_state_code == '27':  # Maharashtra
                cgst_total += gst_amount / Decimal('2')
                sgst_total += gst_amount / Decimal('2')
            else:
                igst_total += gst_amount
        
        # Calculate grand total with round off
        grand_total = subtotal + cgst_total + sgst_total + igst_total
        round_off = Decimal(str(round(grand_total, 2))) - grand_total
        grand_total = Decimal(str(round(grand_total, 2)))
        
        po.subtotal = subtotal
        po.total_discount = total_discount
        po.cgst = cgst_total
        po.sgst = sgst_total
        po.igst = igst_total
        po.utgst = Decimal('0')
        po.cess = Decimal('0')
        po.round_off = round_off
        po.grand_total = grand_total
        
        self.db.commit()
    
    def _update_purchase_totals(self, purchase_id: int):
        """Update purchase totals"""
        from .models import Purchase, PurchaseItem
        
        purchase = self.db.query(Purchase).filter(Purchase.id == purchase_id).first()
        if not purchase:
            return
        
        items = self.db.query(PurchaseItem).filter(PurchaseItem.purchase_id == purchase_id).all()
        
        taxable_value = sum(item.taxable_value for item in items)
        total_discount = sum(
            item.discount if item.discount_type == 'Fixed' 
            else (item.taxable_value * item.discount / Decimal('100'))
            for item in items
        )
        cgst_total = sum(item.cgst for item in items)
        sgst_total = sum(item.sgst for item in items)
        igst_total = sum(item.igst for item in items)
        utgst_total = sum(item.utgst for item in items)
        cess_total = sum(item.cess for item in items)
        
        purchase.taxable_value = taxable_value
        purchase.total_discount = total_discount
        purchase.cgst = cgst_total
        purchase.sgst = sgst_total
        purchase.igst = igst_total
        # Calculate grand total with round off
        grand_total = taxable_value + cgst_total + sgst_total + igst_total + utgst_total + cess_total
        round_off = Decimal(str(round(grand_total, 2))) - grand_total
        grand_total = Decimal(str(round(grand_total, 2)))
        
        purchase.utgst = utgst_total
        purchase.cess = cess_total
        purchase.round_off = round_off
        purchase.grand_total = grand_total
        purchase.paid_amount = Decimal('0')
        purchase.balance_amount = purchase.grand_total
        
        self.db.commit()


def convert_po_to_purchase(db: Session, po_id: int) -> Optional[Purchase]:
    """Convert a purchase order to a purchase invoice"""
    service = PurchaseOrderService(db)
    return service.convert_po_to_purchase(po_id)
