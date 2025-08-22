import logging
from typing import Dict, Any, Optional, List, Union
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, date, timedelta
import json
from . import models
from .models import User, Product
from .db import get_db

logger = logging.getLogger(__name__)


class ManufacturingService:
    """Service for managing manufacturing operations"""
    
    def create_bom(self, db: Session, tenant_id: int, **bom_data) -> models.BillOfMaterials:
        """Create a new Bill of Materials"""
        try:
            # Generate BOM ID
            bom_id = self._generate_bom_id(db, tenant_id)
            
            bom = models.BillOfMaterials(
                tenant_id=tenant_id,
                bom_id=bom_id,
                **bom_data
            )
            
            db.add(bom)
            db.commit()
            db.refresh(bom)
            
            logger.info(f"Created BOM {bom_id} for tenant {tenant_id}")
            return bom
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating BOM: {str(e)}")
            raise
    
    def get_bom(self, db: Session, tenant_id: int, bom_id: str) -> Optional[models.BillOfMaterials]:
        """Get BOM by ID"""
        return db.query(models.BillOfMaterials).filter(
            and_(
                models.BillOfMaterials.tenant_id == tenant_id,
                models.BillOfMaterials.bom_id == bom_id
            )
        ).first()
    
    def list_boms(self, db: Session, tenant_id: int, skip: int = 0, limit: int = 100,
                 product_id: int = None, status: str = None, is_active: bool = None) -> List[models.BillOfMaterials]:
        """List BOMs with optional filtering"""
        query = db.query(models.BillOfMaterials).filter(models.BillOfMaterials.tenant_id == tenant_id)
        
        if product_id:
            query = query.filter(models.BillOfMaterials.product_id == product_id)
        
        if status:
            query = query.filter(models.BillOfMaterials.status == status)
        
        if is_active is not None:
            query = query.filter(models.BillOfMaterials.is_active == is_active)
        
        return query.order_by(desc(models.BillOfMaterials.created_at)).offset(skip).limit(limit).all()
    
    def update_bom(self, db: Session, tenant_id: int, bom_id: str, **update_data) -> Optional[models.BillOfMaterials]:
        """Update BOM"""
        bom = self.get_bom(db, tenant_id, bom_id)
        if not bom:
            return None
        
        for field, value in update_data.items():
            if hasattr(bom, field):
                setattr(bom, field, value)
        
        bom.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(bom)
        
        logger.info(f"Updated BOM {bom_id} for tenant {tenant_id}")
        return bom
    
    def add_bom_component(self, db: Session, tenant_id: int, bom_id: str, **component_data) -> models.BOMComponent:
        """Add component to BOM"""
        bom = self.get_bom(db, tenant_id, bom_id)
        if not bom:
            raise ValueError(f"BOM {bom_id} not found")
        
        component = models.BOMComponent(
            tenant_id=tenant_id,
            bom_id=bom.id,
            **component_data
        )
        
        db.add(component)
        db.commit()
        db.refresh(component)
        
        logger.info(f"Added component to BOM {bom_id}")
        return component
    
    def calculate_bom_cost(self, db: Session, tenant_id: int, bom_id: str) -> Dict[str, float]:
        """Calculate total cost of BOM"""
        bom = self.get_bom(db, tenant_id, bom_id)
        if not bom:
            raise ValueError(f"BOM {bom_id} not found")
        
        components = db.query(models.BOMComponent).filter(
            and_(
                models.BOMComponent.tenant_id == tenant_id,
                models.BOMComponent.bom_id == bom.id
            )
        ).all()
        
        material_cost = sum(comp.total_cost for comp in components)
        labor_cost = bom.labor_cost or 0
        overhead_cost = bom.overhead_cost or 0
        total_cost = material_cost + labor_cost + overhead_cost
        
        return {
            'material_cost': float(material_cost),
            'labor_cost': float(labor_cost),
            'overhead_cost': float(overhead_cost),
            'total_cost': float(total_cost)
        }
    
    def create_production_order(self, db: Session, tenant_id: int, **order_data) -> models.ProductionOrder:
        """Create a new production order"""
        try:
            # Generate production order ID
            order_id = self._generate_production_order_id(db, tenant_id)
            
            order = models.ProductionOrder(
                tenant_id=tenant_id,
                production_order_id=order_id,
                **order_data
            )
            
            db.add(order)
            db.commit()
            db.refresh(order)
            
            logger.info(f"Created production order {order_id} for tenant {tenant_id}")
            return order
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating production order: {str(e)}")
            raise
    
    def get_production_order(self, db: Session, tenant_id: int, order_id: str) -> Optional[models.ProductionOrder]:
        """Get production order by ID"""
        return db.query(models.ProductionOrder).filter(
            and_(
                models.ProductionOrder.tenant_id == tenant_id,
                models.ProductionOrder.production_order_id == order_id
            )
        ).first()
    
    def list_production_orders(self, db: Session, tenant_id: int, skip: int = 0, limit: int = 100,
                             status: str = None, priority: str = None, 
                             start_date: date = None, end_date: date = None) -> List[models.ProductionOrder]:
        """List production orders with optional filtering"""
        query = db.query(models.ProductionOrder).filter(models.ProductionOrder.tenant_id == tenant_id)
        
        if status:
            query = query.filter(models.ProductionOrder.status == status)
        
        if priority:
            query = query.filter(models.ProductionOrder.priority == priority)
        
        if start_date:
            query = query.filter(models.ProductionOrder.planned_start_date >= start_date)
        
        if end_date:
            query = query.filter(models.ProductionOrder.planned_end_date <= end_date)
        
        return query.order_by(desc(models.ProductionOrder.created_at)).offset(skip).limit(limit).all()
    
    def update_production_order(self, db: Session, tenant_id: int, order_id: str, **update_data) -> Optional[models.ProductionOrder]:
        """Update production order"""
        order = self.get_production_order(db, tenant_id, order_id)
        if not order:
            return None
        
        for field, value in update_data.items():
            if hasattr(order, field):
                setattr(order, field, value)
        
        order.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(order)
        
        logger.info(f"Updated production order {order_id} for tenant {tenant_id}")
        return order
    
    def add_production_step(self, db: Session, tenant_id: int, order_id: str, **step_data) -> models.ProductionStep:
        """Add production step to order"""
        order = self.get_production_order(db, tenant_id, order_id)
        if not order:
            raise ValueError(f"Production order {order_id} not found")
        
        step = models.ProductionStep(
            tenant_id=tenant_id,
            production_order_id=order.id,
            **step_data
        )
        
        db.add(step)
        db.commit()
        db.refresh(step)
        
        logger.info(f"Added production step to order {order_id}")
        return step
    
    def record_material_consumption(self, db: Session, tenant_id: int, order_id: str,
                                  product_id: int, quantity: float, consumed_by: int) -> models.MaterialConsumption:
        """Record material consumption"""
        order = self.get_production_order(db, tenant_id, order_id)
        if not order:
            raise ValueError(f"Production order {order_id} not found")
        
        # Get product for cost calculation
        product = db.query(Product).filter(
            and_(
                Product.tenant_id == tenant_id,
                Product.id == product_id
            )
        ).first()
        
        if not product:
            raise ValueError(f"Product {product_id} not found")
        
        consumption = models.MaterialConsumption(
            tenant_id=tenant_id,
            production_order_id=order.id,
            product_id=product_id,
            quantity_consumed=quantity,
            unit_cost=product.cost_price or 0,
            total_cost=(product.cost_price or 0) * quantity,
            consumption_date=datetime.utcnow(),
            consumed_by=consumed_by
        )
        
        db.add(consumption)
        db.commit()
        db.refresh(consumption)
        
        logger.info(f"Recorded material consumption: {quantity} of product {product_id} in order {order_id}")
        return consumption
    
    def create_work_center(self, db: Session, tenant_id: int, **work_center_data) -> models.WorkCenter:
        """Create work center"""
        work_center = models.WorkCenter(
            tenant_id=tenant_id,
            **work_center_data
        )
        
        db.add(work_center)
        db.commit()
        db.refresh(work_center)
        
        logger.info(f"Created work center {work_center.name} for tenant {tenant_id}")
        return work_center
    
    def list_work_centers(self, db: Session, tenant_id: int, skip: int = 0, limit: int = 100,
                         is_active: bool = None, is_available: bool = None) -> List[models.WorkCenter]:
        """List work centers with optional filtering"""
        query = db.query(models.WorkCenter).filter(models.WorkCenter.tenant_id == tenant_id)
        
        if is_active is not None:
            query = query.filter(models.WorkCenter.is_active == is_active)
        
        if is_available is not None:
            query = query.filter(models.WorkCenter.is_available == is_available)
        
        return query.offset(skip).limit(limit).all()
    
    def create_quality_control_record(self, db: Session, tenant_id: int, **qc_data) -> models.QualityControl:
        """Create quality control record"""
        qc = models.QualityControl(
            tenant_id=tenant_id,
            **qc_data
        )
        
        # Calculate pass rate and defect rate
        if qc.quantity_inspected > 0:
            qc.pass_rate = (qc.quantity_passed / qc.quantity_inspected) * 100
            qc.defect_rate = (qc.quantity_failed / qc.quantity_inspected) * 100
        
        db.add(qc)
        db.commit()
        db.refresh(qc)
        
        logger.info(f"Created quality control record for production order {qc.production_order_id}")
        return qc
    
    def get_production_dashboard_stats(self, db: Session, tenant_id: int) -> Dict[str, Any]:
        """Get manufacturing dashboard statistics"""
        today = date.today()
        start_of_month = today.replace(day=1)
        
        # Production order statistics
        total_orders = db.query(models.ProductionOrder).filter(
            models.ProductionOrder.tenant_id == tenant_id
        ).count()
        
        active_orders = db.query(models.ProductionOrder).filter(
            and_(
                models.ProductionOrder.tenant_id == tenant_id,
                models.ProductionOrder.status.in_(['In Progress', 'Planned'])
            )
        ).count()
        
        completed_orders_this_month = db.query(models.ProductionOrder).filter(
            and_(
                models.ProductionOrder.tenant_id == tenant_id,
                models.ProductionOrder.status == 'Completed',
                models.ProductionOrder.actual_end_date >= start_of_month
            )
        ).count()
        
        # BOM statistics
        total_boms = db.query(models.BillOfMaterials).filter(
            and_(
                models.BillOfMaterials.tenant_id == tenant_id,
                models.BillOfMaterials.is_active == True
            )
        ).count()
        
        approved_boms = db.query(models.BillOfMaterials).filter(
            and_(
                models.BillOfMaterials.tenant_id == tenant_id,
                models.BillOfMaterials.status == 'Approved'
            )
        ).count()
        
        # Work center statistics
        total_work_centers = db.query(models.WorkCenter).filter(
            and_(
                models.WorkCenter.tenant_id == tenant_id,
                models.WorkCenter.is_active == True
            )
        ).count()
        
        available_work_centers = db.query(models.WorkCenter).filter(
            and_(
                models.WorkCenter.tenant_id == tenant_id,
                models.WorkCenter.is_active == True,
                models.WorkCenter.is_available == True
            )
        ).count()
        
        # Quality statistics
        quality_records_this_month = db.query(models.QualityControl).filter(
            and_(
                models.QualityControl.tenant_id == tenant_id,
                models.QualityControl.inspection_date >= start_of_month
            )
        ).count()
        
        avg_pass_rate = db.query(func.avg(models.QualityControl.pass_rate)).filter(
            and_(
                models.QualityControl.tenant_id == tenant_id,
                models.QualityControl.inspection_date >= start_of_month
            )
        ).scalar() or 0
        
        # Cost statistics
        total_production_cost_this_month = db.query(func.sum(models.ProductionOrder.actual_cost)).filter(
            and_(
                models.ProductionOrder.tenant_id == tenant_id,
                models.ProductionOrder.status == 'Completed',
                models.ProductionOrder.actual_end_date >= start_of_month
            )
        ).scalar() or 0
        
        return {
            'total_orders': total_orders,
            'active_orders': active_orders,
            'completed_orders_this_month': completed_orders_this_month,
            'total_boms': total_boms,
            'approved_boms': approved_boms,
            'total_work_centers': total_work_centers,
            'available_work_centers': available_work_centers,
            'quality_records_this_month': quality_records_this_month,
            'avg_pass_rate': float(avg_pass_rate),
            'total_production_cost_this_month': float(total_production_cost_this_month)
        }
    
    def get_production_schedule(self, db: Session, tenant_id: int, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get production schedule for date range"""
        orders = db.query(models.ProductionOrder).filter(
            and_(
                models.ProductionOrder.tenant_id == tenant_id,
                models.ProductionOrder.planned_start_date >= start_date,
                models.ProductionOrder.planned_end_date <= end_date
            )
        ).order_by(models.ProductionOrder.planned_start_date).all()
        
        schedule = []
        for order in orders:
            schedule.append({
                'order_id': order.production_order_id,
                'product_name': order.product.name if order.product else 'Unknown',
                'quantity': order.quantity_to_produce,
                'start_date': order.planned_start_date,
                'end_date': order.planned_end_date,
                'status': order.status,
                'priority': order.priority,
                'assigned_to': order.assigned_to_user.username if order.assigned_to_user else None
            })
        
        return schedule
    
    def _generate_bom_id(self, db: Session, tenant_id: int) -> str:
        """Generate unique BOM ID"""
        prefix = "BOM"
        
        # Get last BOM number
        last_bom = db.query(models.BillOfMaterials).filter(
            models.BillOfMaterials.tenant_id == tenant_id
        ).order_by(desc(models.BillOfMaterials.id)).first()
        
        if last_bom:
            try:
                last_number = int(last_bom.bom_id.split('-')[-1])
                new_number = last_number + 1
            except (ValueError, IndexError):
                new_number = 1
        else:
            new_number = 1
        
        return f"{prefix}-{new_number:06d}"
    
    def _generate_production_order_id(self, db: Session, tenant_id: int) -> str:
        """Generate unique production order ID"""
        prefix = "PO"
        
        # Get last production order number
        last_order = db.query(models.ProductionOrder).filter(
            models.ProductionOrder.tenant_id == tenant_id
        ).order_by(desc(models.ProductionOrder.id)).first()
        
        if last_order:
            try:
                last_number = int(last_order.production_order_id.split('-')[-1])
                new_number = last_number + 1
            except (ValueError, IndexError):
                new_number = 1
        else:
            new_number = 1
        
        return f"{prefix}-{new_number:06d}"


# Global instance
manufacturing_service = ManufacturingService()
