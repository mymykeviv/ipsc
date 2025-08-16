"""
Advanced Inventory Management Service
Handles stock management, low stock alerts, and inventory analytics
"""
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from enum import Enum

from .models import Product, StockLedgerEntry, Invoice, InvoiceItem, Purchase, PurchaseItem


class StockValuationMethod(str, Enum):
    """Stock valuation methods"""
    FIFO = "fifo"  # First In, First Out
    LIFO = "lifo"  # Last In, First Out
    AVERAGE = "average"  # Weighted Average


class InventoryManager:
    """Service for advanced inventory management"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_inventory_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive inventory summary
        
        Returns:
            Dictionary with inventory summary data
        """
        # Get total products
        total_products = self.db.query(func.count(Product.id)).scalar()
        active_products = self.db.query(func.count(Product.id)).filter(Product.is_active == True).scalar()
        
        # Get stock summary
        stock_summary = self.db.query(
            func.sum(Product.stock).label('total_stock'),
            func.count(Product.id).filter(Product.stock > 0).label('in_stock'),
            func.count(Product.id).filter(Product.stock == 0).label('out_of_stock'),
            func.count(Product.id).filter(Product.stock < 10).label('low_stock')  # Default reorder level
        ).first()
        
        # Calculate total stock value
        total_value = self.db.query(
            func.sum(Product.stock * Product.purchase_price)
        ).scalar() or Decimal('0')
        
        return {
            "products": {
                "total": total_products,
                "active": active_products,
                "inactive": total_products - active_products
            },
            "stock": {
                "total_quantity": float(stock_summary.total_stock or 0),
                "in_stock_items": stock_summary.in_stock or 0,
                "out_of_stock_items": stock_summary.out_of_stock or 0,
                "low_stock_items": stock_summary.low_stock or 0
            },
            "value": {
                "total_stock_value": float(total_value),
                "average_item_value": float(total_value / total_products) if total_products > 0 else 0
            }
        }
    
    def get_low_stock_alerts(self, threshold: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get low stock alerts
        
        Args:
            threshold: Custom threshold for low stock (overrides product reorder_level)
        
        Returns:
            List of low stock products
        """
        query = self.db.query(Product).filter(Product.is_active == True)
        
        if threshold is not None:
            query = query.filter(Product.stock <= threshold)
        else:
            query = query.filter(Product.stock <= 10)  # Default reorder level
        
        low_stock_products = query.all()
        
        alerts = []
        for product in low_stock_products:
            alerts.append({
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "current_stock": product.stock,
                "reorder_level": 10,  # Default reorder level
                "reorder_quantity": 20,  # Default reorder quantity
                "unit": product.unit,
                "purchase_price": float(product.purchase_price or 0),
                "stock_value": float(product.stock * (product.purchase_price or 0)),
                "days_since_last_purchase": self._get_days_since_last_purchase(product.id),
                "urgency": self._calculate_urgency(product.stock, 10)  # Default reorder level
            })
        
        return alerts
    
    def get_stock_movements(self, 
                          product_id: Optional[int] = None,
                          start_date: Optional[date] = None,
                          end_date: Optional[date] = None,
                          movement_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get stock movement history
        
        Args:
            product_id: Filter by specific product
            start_date: Start date for filtering
            end_date: End date for filtering
            movement_type: Type of movement (in, out, adjust)
        
        Returns:
            List of stock movements
        """
        query = self.db.query(StockLedgerEntry).join(Product)
        
        if product_id:
            query = query.filter(StockLedgerEntry.product_id == product_id)
        
        if start_date:
            query = query.filter(StockLedgerEntry.created_at >= start_date)
        
        if end_date:
            query = query.filter(StockLedgerEntry.created_at <= end_date)
        
        if movement_type:
            query = query.filter(StockLedgerEntry.entry_type == movement_type)
        
        movements = query.order_by(desc(StockLedgerEntry.created_at)).all()
        
        result = []
        for movement in movements:
            # Get product details
            product = self.db.query(Product).filter(Product.id == movement.product_id).first()
            product_name = product.name if product else f"Product {movement.product_id}"
            product_sku = product.sku if product else ""
            
            result.append({
                "id": movement.id,
                "product_id": movement.product_id,
                "product_name": product_name,
                "product_sku": product_sku,
                "type": movement.entry_type,
                "quantity": movement.qty,
                "reference": movement.ref_type,
                "date": movement.created_at,
                "notes": None,  # StockLedgerEntry doesn't have notes field
                "running_balance": None  # StockLedgerEntry doesn't have running_balance field
            })
        
        return result
    
    def get_inventory_analytics(self, 
                              start_date: Optional[date] = None,
                              end_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Get inventory analytics
        
        Args:
            start_date: Start date for analytics
            end_date: End date for analytics
        
        Returns:
            Dictionary with inventory analytics
        """
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
        
        # Stock movements analytics
        movements = self.db.query(
            StockLedgerEntry.entry_type,
            func.sum(StockLedgerEntry.qty).label('total_quantity'),
            func.count(StockLedgerEntry.id).label('count')
        ).filter(
            and_(
                StockLedgerEntry.created_at >= start_date,
                StockLedgerEntry.created_at <= end_date
            )
        ).group_by(StockLedgerEntry.entry_type).all()
        
        movements_data = {}
        for movement in movements:
            movements_data[movement.entry_type] = {
                "quantity": float(movement.total_quantity),
                "count": movement.count
            }
        
        # Top selling products
        top_selling = self.db.query(
            Product.name,
            Product.sku,
            func.sum(InvoiceItem.qty).label('total_sold')
        ).join(InvoiceItem, Product.id == InvoiceItem.product_id)\
         .join(Invoice, InvoiceItem.invoice_id == Invoice.id)\
         .filter(
            and_(
                Invoice.date >= start_date,
                Invoice.date <= end_date
            )
         ).group_by(Product.id, Product.name, Product.sku)\
         .order_by(desc(func.sum(InvoiceItem.qty)))\
         .limit(10).all()
        
        top_selling_data = []
        for product in top_selling:
            top_selling_data.append({
                "name": product.name,
                "sku": product.sku,
                "total_sold": float(product.total_sold)
            })
        
        # Stock turnover analysis
        stock_turnover = self._calculate_stock_turnover(start_date, end_date)
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "movements": movements_data,
            "top_selling_products": top_selling_data,
            "stock_turnover": stock_turnover
        }
    
    def calculate_stock_value(self, valuation_method: StockValuationMethod = StockValuationMethod.FIFO) -> Dict[str, Any]:
        """
        Calculate stock value using specified valuation method
        
        Args:
            valuation_method: Method to use for valuation
        
        Returns:
            Dictionary with stock value calculations
        """
        products = self.db.query(Product).filter(Product.is_active == True).all()
        
        total_value = Decimal('0')
        product_values = []
        
        for product in products:
            if valuation_method == StockValuationMethod.FIFO:
                value = self._calculate_fifo_value(product.id)
            elif valuation_method == StockValuationMethod.LIFO:
                value = self._calculate_lifo_value(product.id)
            else:  # AVERAGE
                value = self._calculate_average_value(product.id)
            
            product_values.append({
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "stock_qty": product.stock,
                "unit_value": float(value or 0),
                "total_value": float(product.stock * (value or 0))
            })
            
            total_value += product.stock * (value or 0)
        
        return {
            "valuation_method": valuation_method,
            "total_stock_value": float(total_value),
            "products": product_values
        }
    
    def get_stock_aging_report(self) -> List[Dict[str, Any]]:
        """
        Get stock aging report to identify slow-moving inventory
        
        Returns:
            List of products with aging information
        """
        products = self.db.query(Product).filter(Product.is_active == True).all()
        
        aging_report = []
        for product in products:
            last_movement = self._get_last_stock_movement(product.id)
            days_since_last_movement = (date.today() - last_movement.created_at.date()).days if last_movement else 0
            
            aging_report.append({
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "current_stock": product.stock,
                "unit_value": float(product.purchase_price or 0),
                "total_value": float(product.stock * (product.purchase_price or 0)),
                "days_since_last_movement": days_since_last_movement,
                "aging_category": self._categorize_aging(days_since_last_movement),
                "last_movement_type": last_movement.entry_type if last_movement else None,
                "last_movement_date": last_movement.created_at if last_movement else None
            })
        
        return aging_report
    
    def _get_days_since_last_purchase(self, product_id: int) -> int:
        """Get days since last purchase for a product"""
        last_purchase = self.db.query(StockLedgerEntry)\
            .filter(
                and_(
                    StockLedgerEntry.product_id == product_id,
                    StockLedgerEntry.entry_type == "in"
                )
            )\
            .order_by(desc(StockLedgerEntry.created_at))\
            .first()
        
        if last_purchase:
            return (date.today() - last_purchase.created_at.date()).days
        return 999  # No purchase history
    
    def _calculate_urgency(self, current_stock: int, reorder_level: int) -> str:
        """Calculate urgency level for low stock"""
        if current_stock == 0:
            return "critical"
        elif current_stock <= reorder_level * 0.5:
            return "high"
        elif current_stock <= reorder_level:
            return "medium"
        else:
            return "low"
    
    def _get_last_stock_movement(self, product_id: int) -> Optional[StockLedgerEntry]:
        """Get last stock movement for a product"""
        return self.db.query(StockLedgerEntry)\
            .filter(StockLedgerEntry.product_id == product_id)\
            .order_by(desc(StockLedgerEntry.created_at))\
            .first()
    
    def _calculate_stock_turnover(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Calculate stock turnover ratio"""
        # Get total sales quantity
        total_sales = self.db.query(
            func.sum(InvoiceItem.qty)
        ).join(Invoice, InvoiceItem.invoice_id == Invoice.id)\
         .filter(
            and_(
                Invoice.date >= start_date,
                Invoice.date <= end_date
            )
         ).scalar() or 0
        
        # Get average stock
        avg_stock = self.db.query(
            func.avg(Product.stock)
        ).scalar() or 0
        
        # Calculate turnover ratio
        turnover_ratio = float(total_sales / avg_stock) if avg_stock > 0 else 0
        
        return {
            "total_sales_quantity": float(total_sales),
            "average_stock": float(avg_stock),
            "turnover_ratio": turnover_ratio,
            "days_to_turnover": 365 / turnover_ratio if turnover_ratio > 0 else 0
        }
    
    def _calculate_fifo_value(self, product_id: int) -> Decimal:
        """Calculate FIFO value for a product"""
        # For simplicity, using purchase price as FIFO value
        product = self.db.query(Product).filter(Product.id == product_id).first()
        return product.purchase_price if product and product.purchase_price else Decimal('0')
    
    def _calculate_lifo_value(self, product_id: int) -> Decimal:
        """Calculate LIFO value for a product"""
        # For simplicity, using purchase price as LIFO value
        product = self.db.query(Product).filter(Product.id == product_id).first()
        return product.purchase_price if product and product.purchase_price else Decimal('0')
    
    def _calculate_average_value(self, product_id: int) -> Decimal:
        """Calculate weighted average value for a product"""
        # For simplicity, using purchase price as average value
        product = self.db.query(Product).filter(Product.id == product_id).first()
        return product.purchase_price if product and product.purchase_price else Decimal('0')
    
    def _categorize_aging(self, days: int) -> str:
        """Categorize inventory aging"""
        if days <= 30:
            return "0-30 days"
        elif days <= 60:
            return "31-60 days"
        elif days <= 90:
            return "61-90 days"
        elif days <= 180:
            return "91-180 days"
        else:
            return "180+ days"
