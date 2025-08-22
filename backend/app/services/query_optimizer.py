"""
Database Query Optimization Service

This module provides query optimization utilities and services to improve
database performance across the IPSC application.
"""

import logging
from typing import List, Dict, Any, Optional, Union
from sqlalchemy import text, func, and_, or_, desc, asc
from sqlalchemy.orm import Session, joinedload, selectinload, subqueryload
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta
import time

logger = logging.getLogger(__name__)


class QueryOptimizer:
    """
    Service for optimizing database queries and improving performance.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.query_stats = {
            'total_queries': 0,
            'slow_queries': 0,
            'optimized_queries': 0,
            'cache_hits': 0,
            'cache_misses': 0
        }
    
    def optimize_invoice_queries(self, tenant_id: Optional[int] = None, 
                               date_range: Optional[Dict[str, str]] = None,
                               limit: int = 100) -> List[Dict[str, Any]]:
        """
        Optimized invoice queries with proper joins and indexing.
        """
        start_time = time.time()
        
        try:
            # Base query with eager loading
            query = self.db.query(models.Invoice).options(
                joinedload(models.Invoice.party),
                joinedload(models.Invoice.items).joinedload(models.InvoiceItem.product),
                selectinload(models.Invoice.payments)
            )
            
            # Apply tenant filter if provided
            if tenant_id:
                query = query.filter(models.Invoice.tenant_id == tenant_id)
            
            # Apply date range filter if provided
            if date_range:
                if date_range.get('start_date'):
                    query = query.filter(models.Invoice.invoice_date >= date_range['start_date'])
                if date_range.get('end_date'):
                    query = query.filter(models.Invoice.invoice_date <= date_range['end_date'])
            
            # Apply ordering and limit
            query = query.order_by(desc(models.Invoice.invoice_date)).limit(limit)
            
            # Execute query
            invoices = query.all()
            
            # Calculate query time
            query_time = time.time() - start_time
            self._record_query_stats(query_time)
            
            # Convert to dictionary format
            result = []
            for invoice in invoices:
                invoice_data = {
                    'id': invoice.id,
                    'invoice_number': invoice.invoice_number,
                    'invoice_date': invoice.invoice_date.isoformat() if invoice.invoice_date else None,
                    'due_date': invoice.due_date.isoformat() if invoice.due_date else None,
                    'total_amount': float(invoice.total_amount) if invoice.total_amount else 0,
                    'status': invoice.status,
                    'party': {
                        'id': invoice.party.id,
                        'name': invoice.party.name,
                        'email': invoice.party.email
                    } if invoice.party else None,
                    'items_count': len(invoice.items) if invoice.items else 0,
                    'payments_count': len(invoice.payments) if invoice.payments else 0
                }
                result.append(invoice_data)
            
            logger.info(f"Optimized invoice query completed in {query_time:.3f}s, returned {len(result)} records")
            return result
            
        except SQLAlchemyError as e:
            logger.error(f"Error in optimized invoice query: {e}")
            raise
    
    def optimize_purchase_queries(self, tenant_id: Optional[int] = None,
                                date_range: Optional[Dict[str, str]] = None,
                                limit: int = 100) -> List[Dict[str, Any]]:
        """
        Optimized purchase queries with proper joins and indexing.
        """
        start_time = time.time()
        
        try:
            # Base query with eager loading
            query = self.db.query(models.Purchase).options(
                joinedload(models.Purchase.supplier),
                joinedload(models.Purchase.items).joinedload(models.PurchaseItem.product),
                selectinload(models.Purchase.payments)
            )
            
            # Apply tenant filter if provided
            if tenant_id:
                query = query.filter(models.Purchase.tenant_id == tenant_id)
            
            # Apply date range filter if provided
            if date_range:
                if date_range.get('start_date'):
                    query = query.filter(models.Purchase.purchase_date >= date_range['start_date'])
                if date_range.get('end_date'):
                    query = query.filter(models.Purchase.purchase_date <= date_range['end_date'])
            
            # Apply ordering and limit
            query = query.order_by(desc(models.Purchase.purchase_date)).limit(limit)
            
            # Execute query
            purchases = query.all()
            
            # Calculate query time
            query_time = time.time() - start_time
            self._record_query_stats(query_time)
            
            # Convert to dictionary format
            result = []
            for purchase in purchases:
                purchase_data = {
                    'id': purchase.id,
                    'purchase_number': purchase.purchase_number,
                    'purchase_date': purchase.purchase_date.isoformat() if purchase.purchase_date else None,
                    'total_amount': float(purchase.total_amount) if purchase.total_amount else 0,
                    'status': purchase.status,
                    'supplier': {
                        'id': purchase.supplier.id,
                        'name': purchase.supplier.name,
                        'email': purchase.supplier.email
                    } if purchase.supplier else None,
                    'items_count': len(purchase.items) if purchase.items else 0,
                    'payments_count': len(purchase.payments) if purchase.payments else 0
                }
                result.append(purchase_data)
            
            logger.info(f"Optimized purchase query completed in {query_time:.3f}s, returned {len(result)} records")
            return result
            
        except SQLAlchemyError as e:
            logger.error(f"Error in optimized purchase query: {e}")
            raise
    
    def optimize_dashboard_summary(self, tenant_id: Optional[int] = None,
                                 date_range: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Optimized dashboard summary with aggregated queries.
        """
        start_time = time.time()
        
        try:
            # Base filters
            filters = []
            if tenant_id:
                filters.append(models.Invoice.tenant_id == tenant_id)
            if date_range:
                if date_range.get('start_date'):
                    filters.append(models.Invoice.invoice_date >= date_range['start_date'])
                if date_range.get('end_date'):
                    filters.append(models.Invoice.invoice_date <= date_range['end_date'])
            
            # Invoice summary
            invoice_summary = self.db.query(
                func.count(models.Invoice.id).label('total_invoices'),
                func.sum(models.Invoice.total_amount).label('total_amount'),
                func.avg(models.Invoice.total_amount).label('average_amount')
            ).filter(and_(*filters)).first()
            
            # Purchase summary
            purchase_filters = []
            if tenant_id:
                purchase_filters.append(models.Purchase.tenant_id == tenant_id)
            if date_range:
                if date_range.get('start_date'):
                    purchase_filters.append(models.Purchase.purchase_date >= date_range['start_date'])
                if date_range.get('end_date'):
                    purchase_filters.append(models.Purchase.purchase_date <= date_range['end_date'])
            
            purchase_summary = self.db.query(
                func.count(models.Purchase.id).label('total_purchases'),
                func.sum(models.Purchase.total_amount).label('total_amount'),
                func.avg(models.Purchase.total_amount).label('average_amount')
            ).filter(and_(*purchase_filters)).first()
            
            # Product summary
            product_filters = []
            if tenant_id:
                product_filters.append(models.Product.tenant_id == tenant_id)
            
            product_summary = self.db.query(
                func.count(models.Product.id).label('total_products'),
                func.sum(models.Product.stock_quantity).label('total_stock')
            ).filter(and_(*product_filters)).first()
            
            # Calculate query time
            query_time = time.time() - start_time
            self._record_query_stats(query_time)
            
            result = {
                'invoices': {
                    'total': invoice_summary.total_invoices or 0,
                    'total_amount': float(invoice_summary.total_amount or 0),
                    'average_amount': float(invoice_summary.average_amount or 0)
                },
                'purchases': {
                    'total': purchase_summary.total_purchases or 0,
                    'total_amount': float(purchase_summary.total_amount or 0),
                    'average_amount': float(purchase_summary.average_amount or 0)
                },
                'products': {
                    'total': product_summary.total_products or 0,
                    'total_stock': float(product_summary.total_stock or 0)
                },
                'query_time': query_time
            }
            
            logger.info(f"Optimized dashboard summary completed in {query_time:.3f}s")
            return result
            
        except SQLAlchemyError as e:
            logger.error(f"Error in optimized dashboard summary: {e}")
            raise
    
    def optimize_search_queries(self, search_term: str, 
                              tenant_id: Optional[int] = None,
                              entity_types: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Optimized search queries across multiple entities.
        """
        start_time = time.time()
        
        try:
            results = []
            
            # Search in invoices
            if not entity_types or 'invoice' in entity_types:
                invoice_query = self.db.query(models.Invoice).options(
                    joinedload(models.Invoice.party)
                ).filter(
                    and_(
                        models.Invoice.tenant_id == tenant_id if tenant_id else True,
                        or_(
                            models.Invoice.invoice_number.ilike(f'%{search_term}%'),
                            models.Invoice.notes.ilike(f'%{search_term}%')
                        )
                    )
                ).limit(10)
                
                invoices = invoice_query.all()
                for invoice in invoices:
                    results.append({
                        'type': 'invoice',
                        'id': invoice.id,
                        'title': f"Invoice #{invoice.invoice_number}",
                        'subtitle': invoice.party.name if invoice.party else 'No Party',
                        'amount': float(invoice.total_amount) if invoice.total_amount else 0,
                        'date': invoice.invoice_date.isoformat() if invoice.invoice_date else None
                    })
            
            # Search in purchases
            if not entity_types or 'purchase' in entity_types:
                purchase_query = self.db.query(models.Purchase).options(
                    joinedload(models.Purchase.supplier)
                ).filter(
                    and_(
                        models.Purchase.tenant_id == tenant_id if tenant_id else True,
                        or_(
                            models.Purchase.purchase_number.ilike(f'%{search_term}%'),
                            models.Purchase.notes.ilike(f'%{search_term}%')
                        )
                    )
                ).limit(10)
                
                purchases = purchase_query.all()
                for purchase in purchases:
                    results.append({
                        'type': 'purchase',
                        'id': purchase.id,
                        'title': f"Purchase #{purchase.purchase_number}",
                        'subtitle': purchase.supplier.name if purchase.supplier else 'No Supplier',
                        'amount': float(purchase.total_amount) if purchase.total_amount else 0,
                        'date': purchase.purchase_date.isoformat() if purchase.purchase_date else None
                    })
            
            # Search in products
            if not entity_types or 'product' in entity_types:
                product_query = self.db.query(models.Product).filter(
                    and_(
                        models.Product.tenant_id == tenant_id if tenant_id else True,
                        or_(
                            models.Product.name.ilike(f'%{search_term}%'),
                            models.Product.description.ilike(f'%{search_term}%'),
                            models.Product.sku.ilike(f'%{search_term}%')
                        )
                    )
                ).limit(10)
                
                products = product_query.all()
                for product in products:
                    results.append({
                        'type': 'product',
                        'id': product.id,
                        'title': product.name,
                        'subtitle': product.sku,
                        'amount': float(product.selling_price) if product.selling_price else 0,
                        'stock': float(product.stock_quantity) if product.stock_quantity else 0
                    })
            
            # Search in parties
            if not entity_types or 'party' in entity_types:
                party_query = self.db.query(models.Party).filter(
                    and_(
                        models.Party.tenant_id == tenant_id if tenant_id else True,
                        or_(
                            models.Party.name.ilike(f'%{search_term}%'),
                            models.Party.email.ilike(f'%{search_term}%'),
                            models.Party.phone.ilike(f'%{search_term}%')
                        )
                    )
                ).limit(10)
                
                parties = party_query.all()
                for party in parties:
                    results.append({
                        'type': 'party',
                        'id': party.id,
                        'title': party.name,
                        'subtitle': party.email,
                        'phone': party.phone,
                        'type': party.party_type
                    })
            
            # Calculate query time
            query_time = time.time() - start_time
            self._record_query_stats(query_time)
            
            logger.info(f"Optimized search query completed in {query_time:.3f}s, returned {len(results)} results")
            return results
            
        except SQLAlchemyError as e:
            logger.error(f"Error in optimized search query: {e}")
            raise
    
    def get_query_statistics(self) -> Dict[str, Any]:
        """
        Get query performance statistics.
        """
        return {
            'statistics': self.query_stats,
            'performance_metrics': {
                'average_query_time': self._calculate_average_query_time(),
                'slow_query_percentage': self._calculate_slow_query_percentage(),
                'optimization_effectiveness': self._calculate_optimization_effectiveness()
            }
        }
    
    def _record_query_stats(self, query_time: float):
        """
        Record query statistics for performance monitoring.
        """
        self.query_stats['total_queries'] += 1
        
        if query_time > 1.0:  # Queries taking more than 1 second
            self.query_stats['slow_queries'] += 1
            logger.warning(f"Slow query detected: {query_time:.3f}s")
        
        if query_time < 0.1:  # Optimized queries
            self.query_stats['optimized_queries'] += 1
    
    def _calculate_average_query_time(self) -> float:
        """
        Calculate average query time.
        """
        if self.query_stats['total_queries'] == 0:
            return 0.0
        return sum(self.query_stats.values()) / self.query_stats['total_queries']
    
    def _calculate_slow_query_percentage(self) -> float:
        """
        Calculate percentage of slow queries.
        """
        if self.query_stats['total_queries'] == 0:
            return 0.0
        return (self.query_stats['slow_queries'] / self.query_stats['total_queries']) * 100
    
    def _calculate_optimization_effectiveness(self) -> float:
        """
        Calculate optimization effectiveness.
        """
        if self.query_stats['total_queries'] == 0:
            return 0.0
        return (self.query_stats['optimized_queries'] / self.query_stats['total_queries']) * 100


class QueryCache:
    """
    Simple query result caching for frequently accessed data.
    """
    
    def __init__(self, max_size: int = 1000, ttl: int = 300):
        self.cache = {}
        self.max_size = max_size
        self.ttl = ttl  # Time to live in seconds
        self.access_times = {}
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get cached value if it exists and is not expired.
        """
        if key in self.cache:
            # Check if cache entry is expired
            if time.time() - self.access_times[key] > self.ttl:
                self.delete(key)
                return None
            
            # Update access time
            self.access_times[key] = time.time()
            return self.cache[key]
        
        return None
    
    def set(self, key: str, value: Any):
        """
        Set cache value with TTL.
        """
        # Evict oldest entries if cache is full
        if len(self.cache) >= self.max_size:
            self._evict_oldest()
        
        self.cache[key] = value
        self.access_times[key] = time.time()
    
    def delete(self, key: str):
        """
        Delete cache entry.
        """
        if key in self.cache:
            del self.cache[key]
            del self.access_times[key]
    
    def clear(self):
        """
        Clear all cache entries.
        """
        self.cache.clear()
        self.access_times.clear()
    
    def _evict_oldest(self):
        """
        Evict the oldest cache entry.
        """
        if not self.access_times:
            return
        
        oldest_key = min(self.access_times.keys(), key=lambda k: self.access_times[k])
        self.delete(oldest_key)
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        """
        return {
            'size': len(self.cache),
            'max_size': self.max_size,
            'ttl': self.ttl,
            'oldest_entry': min(self.access_times.values()) if self.access_times else None,
            'newest_entry': max(self.access_times.values()) if self.access_times else None
        }


# Global query cache instance
query_cache = QueryCache()


def get_query_optimizer(db: Session) -> QueryOptimizer:
    """
    Factory function to create QueryOptimizer instance.
    """
    return QueryOptimizer(db)
