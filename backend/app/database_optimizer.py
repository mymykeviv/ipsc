"""
Database Performance Optimizer
Handles database performance optimization, connection pooling, query optimization, and monitoring
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from sqlalchemy import text, create_engine, event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import SQLAlchemyError
import time
import psutil
from contextlib import asynccontextmanager
from .config import settings
from .tenant_config import tenant_config_manager

logger = logging.getLogger(__name__)


class DatabaseOptimizer:
    """Database performance optimization and monitoring"""
    
    def __init__(self):
        self.connection_pools: Dict[str, Any] = {}
        self.query_stats: Dict[str, List[Dict]] = {}
        self.performance_metrics: Dict[str, Dict] = {}
        self._lock = asyncio.Lock()
    
    async def optimize_tenant_database(self, tenant_id: str, database_url: str) -> bool:
        """Optimize database for specific tenant"""
        try:
            logger.info(f"Optimizing database for tenant: {tenant_id}")
            
            # Create optimized engine with connection pooling
            engine = await self._create_optimized_engine(tenant_id, database_url)
            
            # Run database optimizations
            await self._run_database_optimizations(engine, tenant_id)
            
            # Set up monitoring
            await self._setup_database_monitoring(engine, tenant_id)
            
            logger.info(f"Database optimization completed for tenant: {tenant_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to optimize database for tenant {tenant_id}: {e}")
            return False
    
    async def _create_optimized_engine(self, tenant_id: str, database_url: str) -> AsyncEngine:
        """Create optimized database engine with connection pooling"""
        
        # Calculate optimal pool size based on tenant size
        pool_size = await self._calculate_optimal_pool_size(tenant_id)
        
        engine = create_async_engine(
            database_url,
            poolclass=QueuePool,
            pool_size=pool_size,
            max_overflow=pool_size * 2,
            pool_timeout=30,
            pool_pre_ping=True,
            pool_recycle=3600,  # Recycle connections every hour
            echo=settings.debug,
            # Performance optimizations
            connect_args={
                "connect_timeout": 10,
                "application_name": f"ipsc_tenant_{tenant_id}",
                "options": "-c statement_timeout=30000"  # 30 second timeout
            }
        )
        
        # Store engine for monitoring
        self.connection_pools[tenant_id] = engine
        
        return engine
    
    async def _calculate_optimal_pool_size(self, tenant_id: str) -> int:
        """Calculate optimal connection pool size based on tenant characteristics"""
        try:
            # Get tenant configuration
            config = await tenant_config_manager.get_tenant_config(tenant_id)
            
            # Base pool size
            base_pool_size = 5
            
            # Adjust based on domain
            if config.domain == 'dental':
                # Dental clinics typically have moderate usage
                return min(base_pool_size + 3, 10)
            elif config.domain == 'manufacturing':
                # Manufacturing firms may have higher usage
                return min(base_pool_size + 5, 15)
            else:
                # Default tenant
                return min(base_pool_size + 2, 8)
                
        except Exception as e:
            logger.warning(f"Could not calculate optimal pool size for {tenant_id}: {e}")
            return 8  # Default fallback
    
    async def _run_database_optimizations(self, engine: AsyncEngine, tenant_id: str):
        """Run database performance optimizations"""
        try:
            async with engine.begin() as conn:
                # Analyze and update table statistics
                await conn.execute(text("ANALYZE"))
                
                # Optimize indexes for common query patterns
                await self._optimize_indexes(conn, tenant_id)
                
                # Set optimal database parameters
                await self._set_database_parameters(conn)
                
                # Vacuum and reindex if needed
                await self._maintenance_tasks(conn)
                
        except Exception as e:
            logger.error(f"Failed to run database optimizations for {tenant_id}: {e}")
    
    async def _optimize_indexes(self, conn, tenant_id: str):
        """Optimize database indexes for performance"""
        try:
            # Create composite indexes for common query patterns
            index_queries = [
                # Invoice queries
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_tenant_customer_date_status 
                ON invoices (tenant_id, customer_id, date, status)
                """,
                
                # Purchase queries
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchases_tenant_vendor_date_status 
                ON purchases (tenant_id, vendor_id, date, status)
                """,
                
                # Product queries
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_tenant_category_active 
                ON products (tenant_id, category, is_active)
                """,
                
                # Payment queries
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_tenant_invoice_date 
                ON payments (tenant_id, invoice_id, payment_date)
                """,
                
                # Stock ledger queries
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_ledger_tenant_product_date 
                ON stock_ledger (tenant_id, product_id, created_at)
                """,
                
                # Party queries
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parties_tenant_type_active 
                ON parties (tenant_id, type, is_active)
                """,
                
                # Expense queries
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_tenant_category_date 
                ON expenses (tenant_id, category, expense_date)
                """
            ]
            
            for query in index_queries:
                try:
                    await conn.execute(text(query))
                except Exception as e:
                    logger.warning(f"Could not create index for {tenant_id}: {e}")
                    
        except Exception as e:
            logger.error(f"Failed to optimize indexes for {tenant_id}: {e}")
    
    async def _set_database_parameters(self, conn):
        """Set optimal database parameters for performance"""
        try:
            # Set PostgreSQL parameters for better performance
            parameter_queries = [
                "SET work_mem = '16MB'",
                "SET maintenance_work_mem = '256MB'",
                "SET shared_buffers = '256MB'",
                "SET effective_cache_size = '1GB'",
                "SET random_page_cost = 1.1",
                "SET effective_io_concurrency = 200"
            ]
            
            for query in parameter_queries:
                try:
                    await conn.execute(text(query))
                except Exception as e:
                    logger.warning(f"Could not set database parameter: {e}")
                    
        except Exception as e:
            logger.error(f"Failed to set database parameters: {e}")
    
    async def _maintenance_tasks(self, conn):
        """Run database maintenance tasks"""
        try:
            # Vacuum analyze for better query planning
            await conn.execute(text("VACUUM ANALYZE"))
            
            # Update table statistics
            await conn.execute(text("ANALYZE"))
            
        except Exception as e:
            logger.error(f"Failed to run maintenance tasks: {e}")
    
    async def _setup_database_monitoring(self, engine: AsyncEngine, tenant_id: str):
        """Set up database monitoring and performance tracking"""
        try:
            # Initialize performance metrics
            self.performance_metrics[tenant_id] = {
                'query_count': 0,
                'slow_queries': 0,
                'connection_usage': 0,
                'last_optimization': time.time()
            }
            
            # Set up query monitoring
            @event.listens_for(engine.sync_engine, 'before_cursor_execute')
            def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
                context._query_start_time = time.time()
            
            @event.listens_for(engine.sync_engine, 'after_cursor_execute')
            def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
                total = time.time() - context._query_start_time
                
                # Track slow queries (> 1 second)
                if total > 1.0:
                    self.performance_metrics[tenant_id]['slow_queries'] += 1
                    logger.warning(f"Slow query detected for {tenant_id}: {total:.2f}s - {statement[:100]}...")
                
                self.performance_metrics[tenant_id]['query_count'] += 1
                
                # Store query stats for analysis
                if tenant_id not in self.query_stats:
                    self.query_stats[tenant_id] = []
                
                self.query_stats[tenant_id].append({
                    'statement': statement[:200],
                    'execution_time': total,
                    'timestamp': time.time()
                })
                
                # Keep only last 1000 queries
                if len(self.query_stats[tenant_id]) > 1000:
                    self.query_stats[tenant_id] = self.query_stats[tenant_id][-1000:]
            
        except Exception as e:
            logger.error(f"Failed to setup monitoring for {tenant_id}: {e}")
    
    async def get_performance_metrics(self, tenant_id: str) -> Dict[str, Any]:
        """Get performance metrics for a tenant"""
        try:
            metrics = self.performance_metrics.get(tenant_id, {})
            
            # Add current connection pool stats
            if tenant_id in self.connection_pools:
                engine = self.connection_pools[tenant_id]
                pool = engine.sync_engine.pool
                
                metrics.update({
                    'pool_size': pool.size(),
                    'checked_in': pool.checkedin(),
                    'checked_out': pool.checkedout(),
                    'overflow': pool.overflow(),
                    'invalid': pool.invalid()
                })
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to get performance metrics for {tenant_id}: {e}")
            return {}
    
    async def get_slow_queries(self, tenant_id: str, limit: int = 10) -> List[Dict]:
        """Get slow queries for a tenant"""
        try:
            queries = self.query_stats.get(tenant_id, [])
            
            # Filter slow queries (> 500ms) and sort by execution time
            slow_queries = [
                q for q in queries 
                if q['execution_time'] > 0.5
            ]
            
            slow_queries.sort(key=lambda x: x['execution_time'], reverse=True)
            
            return slow_queries[:limit]
            
        except Exception as e:
            logger.error(f"Failed to get slow queries for {tenant_id}: {e}")
            return []
    
    async def optimize_all_tenants(self) -> Dict[str, bool]:
        """Optimize databases for all tenants"""
        try:
            tenants = await tenant_config_manager.list_tenants()
            results = {}
            
            for tenant_id in tenants:
                config = await tenant_config_manager.get_tenant_config(tenant_id)
                if config:
                    results[tenant_id] = await self.optimize_tenant_database(
                        tenant_id, config.database_url
                    )
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to optimize all tenants: {e}")
            return {}
    
    async def cleanup_resources(self):
        """Clean up database resources"""
        try:
            for tenant_id, engine in self.connection_pools.items():
                try:
                    await engine.dispose()
                    logger.info(f"Disposed engine for tenant: {tenant_id}")
                except Exception as e:
                    logger.error(f"Failed to dispose engine for {tenant_id}: {e}")
            
            self.connection_pools.clear()
            self.query_stats.clear()
            self.performance_metrics.clear()
            
        except Exception as e:
            logger.error(f"Failed to cleanup resources: {e}")


# Global database optimizer instance
database_optimizer = DatabaseOptimizer()
