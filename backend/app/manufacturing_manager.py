"""
Manufacturing Domain Manager
Handles manufacturing domain-specific features including BOM management, production tracking, and material cost analysis
"""
import asyncio
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta, date
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

class ManufacturingManager:
    """Comprehensive manufacturing domain management"""
    
    def __init__(self):
        self.bom_cache: Dict[str, Dict] = {}
        self.production_cache: Dict[str, Dict] = {}
        self.material_cache: Dict[str, Dict] = {}
        self._lock = asyncio.Lock()
    
    async def create_bom(self, tenant_id: str, bom_data: Dict, session: AsyncSession) -> Optional[Dict]:
        """Create a new Bill of Materials (BOM)"""
        try:
            # Validate required fields
            required_fields = ['product_id', 'name', 'version', 'components']
            for field in required_fields:
                if field not in bom_data or not bom_data[field]:
                    raise ValueError(f"Required field '{field}' is missing")
            
            # Create BOM record (stored as product with category 'bom')
            bom = Product(
                tenant_id=tenant_id,
                name=bom_data['name'],
                description=bom_data.get('description', ''),
                category='bom',
                sku=f"BOM-{bom_data['product_id']}-{bom_data['version']}",
                bom_version=bom_data['version'],
                bom_product_id=bom_data['product_id'],
                bom_components=json.dumps(bom_data['components']),
                bom_total_cost=0,  # Will be calculated
                bom_labor_cost=bom_data.get('labor_cost', 0),
                bom_overhead_cost=bom_data.get('overhead_cost', 0),
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            # Calculate total BOM cost
            total_cost = await self._calculate_bom_cost(tenant_id, bom_data['components'], session)
            bom.bom_total_cost = total_cost
            
            session.add(bom)
            await session.commit()
            await session.refresh(bom)
            
            # Log the creation
            await security_manager.log_security_event(
                'BOM_CREATED', tenant_id, 
                details={'bom_id': bom.id, 'product_id': bom_data['product_id'], 'version': bom_data['version']}
            )
            
            return {
                'bom_id': bom.id,
                'name': bom.name,
                'product_id': bom_data['product_id'],
                'version': bom_data['version'],
                'total_cost': float(total_cost),
                'components': bom_data['components'],
                'message': 'BOM created successfully'
            }
            
        except Exception as e:
            logger.error(f"Error creating BOM: {e}")
            await session.rollback()
            return None
    
    async def get_bom(self, tenant_id: str, bom_id: str, session: AsyncSession) -> Optional[Dict]:
        """Get BOM details with component information"""
        try:
            # Check cache first
            cache_key = f"{tenant_id}_{bom_id}"
            if cache_key in self.bom_cache:
                return self.bom_cache[cache_key]
            
            # Get BOM from products table
            bom_query = select(Product).where(
                and_(
                    Product.tenant_id == tenant_id,
                    Product.id == bom_id,
                    Product.category == 'bom'
                )
            )
            bom_result = await session.execute(bom_query)
            bom = bom_result.scalar_one_or_none()
            
            if not bom:
                return None
            
            # Parse components
            components = json.loads(bom.bom_components) if bom.bom_components else []
            
            # Get component details
            component_details = []
            for component in components:
                component_product = await self._get_product_by_id(tenant_id, component['product_id'], session)
                if component_product:
                    component_details.append({
                        'product_id': component['product_id'],
                        'product_name': component_product['name'],
                        'quantity': component['quantity'],
                        'unit': component.get('unit', 'pcs'),
                        'cost_per_unit': component.get('cost_per_unit', 0),
                        'total_cost': component['quantity'] * component.get('cost_per_unit', 0)
                    })
            
            bom_details = {
                'bom_id': bom.id,
                'name': bom.name,
                'description': bom.description,
                'product_id': bom.bom_product_id,
                'version': bom.bom_version,
                'components': component_details,
                'total_cost': float(bom.bom_total_cost),
                'labor_cost': float(bom.bom_labor_cost),
                'overhead_cost': float(bom.bom_overhead_cost),
                'total_with_overhead': float(bom.bom_total_cost + bom.bom_labor_cost + bom.bom_overhead_cost),
                'is_active': bom.is_active,
                'created_at': bom.created_at,
                'updated_at': bom.updated_at
            }
            
            # Cache the result
            self.bom_cache[cache_key] = bom_details
            
            return bom_details
            
        except Exception as e:
            logger.error(f"Error getting BOM {bom_id}: {e}")
            return None
    
    async def create_production_order(self, tenant_id: str, order_data: Dict, session: AsyncSession) -> Optional[Dict]:
        """Create a new production order"""
        try:
            # Validate required fields
            required_fields = ['product_id', 'quantity', 'bom_id', 'due_date']
            for field in required_fields:
                if field not in order_data or not order_data[field]:
                    raise ValueError(f"Required field '{field}' is missing")
            
            # Create production order (stored as purchase with type 'production')
            production_order = Purchase(
                tenant_id=tenant_id,
                product_id=order_data['product_id'],
                bom_id=order_data['bom_id'],
                quantity=order_data['quantity'],
                due_date=order_data['due_date'],
                status='planned',
                priority=order_data.get('priority', 'normal'),
                notes=order_data.get('notes', ''),
                estimated_cost=0,  # Will be calculated
                actual_cost=0,
                start_date=order_data.get('start_date'),
                completion_date=None,
                quality_check_passed=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            # Calculate estimated cost from BOM
            bom = await self.get_bom(tenant_id, order_data['bom_id'], session)
            if bom:
                production_order.estimated_cost = bom['total_with_overhead'] * order_data['quantity']
            
            session.add(production_order)
            await session.commit()
            await session.refresh(production_order)
            
            # Log the creation
            await security_manager.log_security_event(
                'PRODUCTION_ORDER_CREATED', tenant_id,
                details={
                    'order_id': production_order.id,
                    'product_id': production_order.product_id,
                    'quantity': production_order.quantity,
                    'estimated_cost': float(production_order.estimated_cost)
                }
            )
            
            return {
                'order_id': production_order.id,
                'product_id': production_order.product_id,
                'quantity': production_order.quantity,
                'due_date': production_order.due_date,
                'status': production_order.status,
                'estimated_cost': float(production_order.estimated_cost),
                'message': 'Production order created successfully'
            }
            
        except Exception as e:
            logger.error(f"Error creating production order: {e}")
            await session.rollback()
            return None
    
    async def update_production_status(self, tenant_id: str, order_id: str, status_updates: Dict, session: AsyncSession) -> bool:
        """Update production order status"""
        try:
            # Get existing production order
            order_query = select(Purchase).where(
                and_(
                    Purchase.tenant_id == tenant_id,
                    Purchase.id == order_id,
                    Purchase.purchase_type == 'production'
                )
            )
            order_result = await session.execute(order_query)
            production_order = order_result.scalar_one_or_none()
            
            if not production_order:
                return False
            
            # Update fields
            for field, value in status_updates.items():
                if hasattr(production_order, field):
                    setattr(production_order, field, value)
            
            production_order.updated_at = datetime.utcnow()
            
            # If completed, update completion date
            if status_updates.get('status') == 'completed':
                production_order.completion_date = datetime.utcnow()
            
            await session.commit()
            
            # Clear cache
            cache_key = f"{tenant_id}_{order_id}"
            if cache_key in self.production_cache:
                del self.production_cache[cache_key]
            
            # Log the update
            await security_manager.log_security_event(
                'PRODUCTION_STATUS_UPDATED', tenant_id,
                details={'order_id': order_id, 'status_updates': status_updates}
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating production status for order {order_id}: {e}")
            await session.rollback()
            return False
    
    async def get_production_schedule(self, tenant_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None, session: AsyncSession = None) -> List[Dict]:
        """Get production schedule for a date range"""
        try:
            if not start_date:
                start_date = datetime.utcnow().date()
            if not end_date:
                end_date = start_date + timedelta(days=30)
            
            # Get production orders in the date range
            schedule_query = select(Purchase).where(
                and_(
                    Purchase.tenant_id == tenant_id,
                    Purchase.purchase_type == 'production',
                    Purchase.due_date >= start_date,
                    Purchase.due_date <= end_date
                )
            ).order_by(Purchase.due_date, Purchase.priority)
            
            schedule_result = await session.execute(schedule_query)
            production_orders = schedule_result.scalars().all()
            
            schedule = []
            for order in production_orders:
                # Get product details
                product = await self._get_product_by_id(tenant_id, order.product_id, session)
                
                schedule.append({
                    'order_id': order.id,
                    'product_id': order.product_id,
                    'product_name': product['name'] if product else 'Unknown',
                    'quantity': order.quantity,
                    'due_date': order.due_date,
                    'start_date': order.start_date,
                    'status': order.status,
                    'priority': order.priority,
                    'estimated_cost': float(order.estimated_cost),
                    'actual_cost': float(order.actual_cost),
                    'completion_percentage': order.completion_percentage or 0
                })
            
            return schedule
            
        except Exception as e:
            logger.error(f"Error getting production schedule: {e}")
            return []
    
    async def get_material_requirements(self, tenant_id: str, bom_id: str, quantity: int, session: AsyncSession) -> List[Dict]:
        """Calculate material requirements for production"""
        try:
            # Get BOM details
            bom = await self.get_bom(tenant_id, bom_id, session)
            if not bom:
                return []
            
            material_requirements = []
            for component in bom['components']:
                # Calculate required quantity
                required_quantity = component['quantity'] * quantity
                
                # Get current stock
                current_stock = await self._get_product_stock(tenant_id, component['product_id'], session)
                
                # Calculate shortage
                shortage = max(0, required_quantity - current_stock)
                
                material_requirements.append({
                    'product_id': component['product_id'],
                    'product_name': component['product_name'],
                    'required_quantity': required_quantity,
                    'current_stock': current_stock,
                    'shortage': shortage,
                    'unit': component['unit'],
                    'cost_per_unit': component['cost_per_unit'],
                    'total_cost': required_quantity * component['cost_per_unit']
                })
            
            return material_requirements
            
        except Exception as e:
            logger.error(f"Error calculating material requirements: {e}")
            return []
    
    async def get_production_analytics(self, tenant_id: str, session: AsyncSession) -> Dict:
        """Get manufacturing analytics and insights"""
        try:
            # Get total production orders
            total_orders_query = select(func.count(Purchase.id)).where(
                and_(
                    Purchase.tenant_id == tenant_id,
                    Purchase.purchase_type == 'production'
                )
            )
            total_orders_result = await session.execute(total_orders_query)
            total_orders = total_orders_result.scalar() or 0
            
            # Get orders this month
            current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            orders_this_month_query = select(func.count(Purchase.id)).where(
                and_(
                    Purchase.tenant_id == tenant_id,
                    Purchase.purchase_type == 'production',
                    Purchase.created_at >= current_month
                )
            )
            orders_result = await session.execute(orders_this_month_query)
            orders_this_month = orders_result.scalar() or 0
            
            # Get completed orders this month
            completed_orders_query = select(func.count(Purchase.id)).where(
                and_(
                    Purchase.tenant_id == tenant_id,
                    Purchase.purchase_type == 'production',
                    Purchase.status == 'completed',
                    Purchase.completion_date >= current_month
                )
            )
            completed_result = await session.execute(completed_orders_query)
            completed_orders = completed_result.scalar() or 0
            
            # Get total production value
            production_value_query = select(func.sum(Purchase.actual_cost)).where(
                and_(
                    Purchase.tenant_id == tenant_id,
                    Purchase.purchase_type == 'production',
                    Purchase.status == 'completed',
                    Purchase.completion_date >= current_month
                )
            )
            value_result = await session.execute(production_value_query)
            production_value = value_result.scalar() or 0
            
            # Get pending orders
            pending_orders_query = select(func.count(Purchase.id)).where(
                and_(
                    Purchase.tenant_id == tenant_id,
                    Purchase.purchase_type == 'production',
                    Purchase.status.in_(['planned', 'in_progress'])
                )
            )
            pending_result = await session.execute(pending_orders_query)
            pending_orders = pending_result.scalar() or 0
            
            # Get overdue orders
            overdue_orders_query = select(func.count(Purchase.id)).where(
                and_(
                    Purchase.tenant_id == tenant_id,
                    Purchase.purchase_type == 'production',
                    Purchase.status.in_(['planned', 'in_progress']),
                    Purchase.due_date < datetime.utcnow().date()
                )
            )
            overdue_result = await session.execute(overdue_orders_query)
            overdue_orders = overdue_result.scalar() or 0
            
            # Get low stock materials
            low_stock_materials = await self._get_low_stock_materials(tenant_id, session)
            
            return {
                'total_orders': total_orders,
                'orders_this_month': orders_this_month,
                'completed_orders': completed_orders,
                'completion_rate': (completed_orders / orders_this_month * 100) if orders_this_month > 0 else 0,
                'production_value': float(production_value),
                'pending_orders': pending_orders,
                'overdue_orders': overdue_orders,
                'low_stock_materials': low_stock_materials,
                'low_stock_count': len(low_stock_materials),
                'analytics_date': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting production analytics: {e}")
            return {}
    
    async def get_cost_analysis(self, tenant_id: str, product_id: str, session: AsyncSession) -> Dict:
        """Get detailed cost analysis for a product"""
        try:
            # Get product details
            product = await self._get_product_by_id(tenant_id, product_id, session)
            if not product:
                return {}
            
            # Get BOM for the product
            bom_query = select(Product).where(
                and_(
                    Product.tenant_id == tenant_id,
                    Product.category == 'bom',
                    Product.bom_product_id == product_id,
                    Product.is_active == True
                )
            ).order_by(Product.bom_version.desc())
            
            bom_result = await session.execute(bom_query)
            latest_bom = bom_result.scalar_one_or_none()
            
            if not latest_bom:
                return {
                    'product_id': product_id,
                    'product_name': product['name'],
                    'has_bom': False,
                    'message': 'No BOM found for this product'
                }
            
            # Get BOM details
            bom_details = await self.get_bom(tenant_id, latest_bom.id, session)
            
            # Get production history
            production_history = await self._get_production_history(tenant_id, product_id, session)
            
            # Calculate cost trends
            cost_trends = await self._calculate_cost_trends(tenant_id, product_id, session)
            
            return {
                'product_id': product_id,
                'product_name': product['name'],
                'has_bom': True,
                'current_bom': bom_details,
                'production_history': production_history,
                'cost_trends': cost_trends,
                'average_cost': float(sum(p['actual_cost'] for p in production_history) / len(production_history)) if production_history else 0,
                'total_production_quantity': sum(p['quantity'] for p in production_history),
                'analysis_date': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting cost analysis for product {product_id}: {e}")
            return {}
    
    # Helper methods
    async def _calculate_bom_cost(self, tenant_id: str, components: List[Dict], session: AsyncSession) -> Decimal:
        """Calculate total cost for BOM components"""
        try:
            total_cost = Decimal('0')
            for component in components:
                cost_per_unit = Decimal(str(component.get('cost_per_unit', 0)))
                quantity = Decimal(str(component['quantity']))
                total_cost += cost_per_unit * quantity
            return total_cost
        except Exception as e:
            logger.error(f"Error calculating BOM cost: {e}")
            return Decimal('0')
    
    async def _get_product_by_id(self, tenant_id: str, product_id: str, session: AsyncSession) -> Optional[Dict]:
        """Get basic product information by ID"""
        try:
            product_query = select(Product).where(
                and_(
                    Product.tenant_id == tenant_id,
                    Product.id == product_id
                )
            )
            product_result = await session.execute(product_query)
            product = product_result.scalar_one_or_none()
            
            if product:
                return {
                    'id': product.id,
                    'name': product.name,
                    'description': product.description,
                    'category': product.category,
                    'cost_price': float(product.cost_price) if product.cost_price else 0,
                    'selling_price': float(product.selling_price) if product.selling_price else 0
                }
            return None
            
        except Exception as e:
            logger.error(f"Error getting product by ID: {e}")
            return None
    
    async def _get_product_stock(self, tenant_id: str, product_id: str, session: AsyncSession) -> int:
        """Get current stock level for a product"""
        try:
            stock_query = select(func.sum(StockLedgerEntry.quantity)).where(
                and_(
                    StockLedgerEntry.tenant_id == tenant_id,
                    StockLedgerEntry.product_id == product_id
                )
            )
            stock_result = await session.execute(stock_query)
            current_stock = stock_result.scalar() or 0
            return current_stock
        except Exception as e:
            logger.error(f"Error getting product stock: {e}")
            return 0
    
    async def _get_low_stock_materials(self, tenant_id: str, session: AsyncSession) -> List[Dict]:
        """Get materials with low stock levels"""
        try:
            # Get products with reorder levels
            materials_query = select(Product).where(
                and_(
                    Product.tenant_id == tenant_id,
                    Product.category.in_(['raw_material', 'component']),
                    Product.is_active == True
                )
            )
            materials_result = await session.execute(materials_query)
            materials = materials_result.scalars().all()
            
            low_stock_materials = []
            for material in materials:
                current_stock = await self._get_product_stock(tenant_id, material.id, session)
                if current_stock <= material.reorder_level:
                    low_stock_materials.append({
                        'product_id': material.id,
                        'name': material.name,
                        'current_stock': current_stock,
                        'reorder_level': material.reorder_level,
                        'supplier': material.supplier
                    })
            
            return low_stock_materials
            
        except Exception as e:
            logger.error(f"Error getting low stock materials: {e}")
            return []
    
    async def _get_production_history(self, tenant_id: str, product_id: str, session: AsyncSession) -> List[Dict]:
        """Get production history for a product"""
        try:
            history_query = select(Purchase).where(
                and_(
                    Purchase.tenant_id == tenant_id,
                    Purchase.product_id == product_id,
                    Purchase.purchase_type == 'production',
                    Purchase.status == 'completed'
                )
            ).order_by(Purchase.completion_date.desc())
            
            history_result = await session.execute(history_query)
            production_orders = history_result.scalars().all()
            
            return [{
                'order_id': order.id,
                'quantity': order.quantity,
                'actual_cost': float(order.actual_cost),
                'completion_date': order.completion_date,
                'quality_check_passed': order.quality_check_passed
            } for order in production_orders]
            
        except Exception as e:
            logger.error(f"Error getting production history: {e}")
            return []
    
    async def _calculate_cost_trends(self, tenant_id: str, product_id: str, session: AsyncSession) -> List[Dict]:
        """Calculate cost trends for a product"""
        try:
            # Get production orders for the last 6 months
            six_months_ago = datetime.utcnow() - timedelta(days=180)
            
            trends_query = select(Purchase).where(
                and_(
                    Purchase.tenant_id == tenant_id,
                    Purchase.product_id == product_id,
                    Purchase.purchase_type == 'production',
                    Purchase.status == 'completed',
                    Purchase.completion_date >= six_months_ago
                )
            ).order_by(Purchase.completion_date)
            
            trends_result = await session.execute(trends_query)
            production_orders = trends_result.scalars().all()
            
            # Group by month
            monthly_costs = {}
            for order in production_orders:
                month_key = order.completion_date.strftime('%Y-%m')
                if month_key not in monthly_costs:
                    monthly_costs[month_key] = {
                        'month': month_key,
                        'total_cost': 0,
                        'total_quantity': 0,
                        'average_cost': 0
                    }
                
                monthly_costs[month_key]['total_cost'] += float(order.actual_cost)
                monthly_costs[month_key]['total_quantity'] += order.quantity
            
            # Calculate averages
            for month_data in monthly_costs.values():
                if month_data['total_quantity'] > 0:
                    month_data['average_cost'] = month_data['total_cost'] / month_data['total_quantity']
            
            return list(monthly_costs.values())
            
        except Exception as e:
            logger.error(f"Error calculating cost trends: {e}")
            return []

# Global instance
manufacturing_manager = ManufacturingManager()
