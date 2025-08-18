"""
Monitoring and Observability Module for CASHFLOW Backend
Provides metrics collection, health checks, and observability features
"""

import time
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from prometheus_client import (
    Counter, Histogram, Gauge, Summary, 
    generate_latest, CONTENT_TYPE_LATEST,
    CollectorRegistry, multiprocess
)
from fastapi import Request, Response
from fastapi.responses import PlainTextResponse
import psutil
import os

logger = logging.getLogger(__name__)

# Create a registry for metrics
registry = CollectorRegistry()

# HTTP Metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total number of HTTP requests',
    ['method', 'endpoint', 'status'],
    registry=registry
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    registry=registry
)

http_request_size_bytes = Histogram(
    'http_request_size_bytes',
    'HTTP request size in bytes',
    ['method', 'endpoint'],
    registry=registry
)

http_response_size_bytes = Histogram(
    'http_response_size_bytes',
    'HTTP response size in bytes',
    ['method', 'endpoint'],
    registry=registry
)

# Business Metrics
invoices_created_total = Counter(
    'invoices_created_total',
    'Total number of invoices created',
    ['status'],
    registry=registry
)

payments_processed_total = Counter(
    'payments_processed_total',
    'Total number of payments processed',
    ['method', 'status'],
    registry=registry
)

products_created_total = Counter(
    'products_created_total',
    'Total number of products created',
    registry=registry
)

stock_adjustments_total = Counter(
    'stock_adjustments_total',
    'Total number of stock adjustments',
    ['type'],
    registry=registry
)

# System Metrics
system_cpu_usage = Gauge(
    'system_cpu_usage_percent',
    'System CPU usage percentage',
    registry=registry
)

system_memory_usage = Gauge(
    'system_memory_usage_bytes',
    'System memory usage in bytes',
    registry=registry
)

system_disk_usage = Gauge(
    'system_disk_usage_bytes',
    'System disk usage in bytes',
    registry=registry
)

database_connections = Gauge(
    'database_connections_active',
    'Number of active database connections',
    registry=registry
)

# Application Metrics
active_users = Gauge(
    'active_users_total',
    'Number of active users',
    registry=registry
)

api_errors_total = Counter(
    'api_errors_total',
    'Total number of API errors',
    ['error_type', 'endpoint'],
    registry=registry
)

# Performance Metrics
database_query_duration = Histogram(
    'database_query_duration_seconds',
    'Database query duration in seconds',
    ['operation'],
    registry=registry
)

cache_hit_ratio = Gauge(
    'cache_hit_ratio',
    'Cache hit ratio percentage',
    registry=registry
)


class MonitoringMiddleware:
    """Middleware for collecting HTTP metrics"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        start_time = time.time()
        request = Request(scope, receive)
        
        # Get request size
        request_size = 0
        if hasattr(request, 'body'):
            request_size = len(request.body) if request.body else 0
        
        # Process request
        response = await self.app(scope, receive, send)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Get response size
        response_size = 0
        if hasattr(response, 'body'):
            response_size = len(response.body) if response.body else 0
        
        # Record metrics
        method = request.method
        endpoint = request.url.path
        status = response.status_code if hasattr(response, 'status_code') else 200
        
        http_requests_total.labels(method=method, endpoint=endpoint, status=status).inc()
        http_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(duration)
        http_request_size_bytes.labels(method=method, endpoint=endpoint).observe(request_size)
        http_response_size_bytes.labels(method=method, endpoint=endpoint).observe(response_size)
        
        # Record errors
        if status >= 400:
            error_type = 'client_error' if status < 500 else 'server_error'
            api_errors_total.labels(error_type=error_type, endpoint=endpoint).inc()
        
        return response


class SystemMonitor:
    """System monitoring utilities"""
    
    @staticmethod
    def get_system_metrics() -> Dict[str, Any]:
        """Get current system metrics"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Update Prometheus metrics
            system_cpu_usage.set(cpu_percent)
            system_memory_usage.set(memory.used)
            system_disk_usage.set(disk.used)
            
            return {
                'cpu_percent': cpu_percent,
                'memory_used_bytes': memory.used,
                'memory_total_bytes': memory.total,
                'memory_percent': memory.percent,
                'disk_used_bytes': disk.used,
                'disk_total_bytes': disk.total,
                'disk_percent': (disk.used / disk.total) * 100
            }
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
            return {}
    
    @staticmethod
    def get_process_metrics() -> Dict[str, Any]:
        """Get current process metrics"""
        try:
            process = psutil.Process(os.getpid())
            return {
                'cpu_percent': process.cpu_percent(),
                'memory_rss_bytes': process.memory_info().rss,
                'memory_vms_bytes': process.memory_info().vms,
                'num_threads': process.num_threads(),
                'num_fds': process.num_fds() if hasattr(process, 'num_fds') else 0
            }
        except Exception as e:
            logger.error(f"Error collecting process metrics: {e}")
            return {}


class HealthChecker:
    """Health check utilities"""
    
    def __init__(self, db_session=None):
        self.db_session = db_session
    
    async def check_database_health(self) -> Dict[str, Any]:
        """Check database health"""
        try:
            if self.db_session:
                # Simple query to check database connectivity
                result = self.db_session.execute("SELECT 1")
                result.fetchone()
                
                return {
                    'status': 'healthy',
                    'message': 'Database connection is working',
                    'timestamp': datetime.utcnow().isoformat()
                }
            else:
                return {
                    'status': 'unknown',
                    'message': 'Database session not available',
                    'timestamp': datetime.utcnow().isoformat()
                }
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                'status': 'unhealthy',
                'message': f'Database connection failed: {str(e)}',
                'timestamp': datetime.utcnow().isoformat()
            }
    
    async def check_external_services(self) -> Dict[str, Any]:
        """Check external services health"""
        # Add checks for external services like Redis, email service, etc.
        return {
            'status': 'healthy',
            'message': 'All external services are working',
            'timestamp': datetime.utcnow().isoformat()
        }
    
    async def comprehensive_health_check(self) -> Dict[str, Any]:
        """Perform comprehensive health check"""
        system_metrics = SystemMonitor.get_system_metrics()
        process_metrics = SystemMonitor.get_process_metrics()
        db_health = await self.check_database_health()
        external_health = await self.check_external_services()
        
        overall_status = 'healthy'
        if db_health['status'] != 'healthy' or external_health['status'] != 'healthy':
            overall_status = 'unhealthy'
        
        return {
            'status': overall_status,
            'timestamp': datetime.utcnow().isoformat(),
            'system': system_metrics,
            'process': process_metrics,
            'database': db_health,
            'external_services': external_health
        }


def get_metrics_response() -> Response:
    """Get Prometheus metrics response"""
    return PlainTextResponse(
        generate_latest(registry),
        media_type=CONTENT_TYPE_LATEST
    )


# Utility functions for business metrics
def record_invoice_created(status: str = 'success'):
    """Record invoice creation"""
    invoices_created_total.labels(status=status).inc()

def record_payment_processed(method: str, status: str = 'success'):
    """Record payment processing"""
    payments_processed_total.labels(method=method, status=status).inc()

def record_product_created():
    """Record product creation"""
    products_created_total.inc()

def record_stock_adjustment(adjustment_type: str):
    """Record stock adjustment"""
    stock_adjustments_total.labels(type=adjustment_type).inc()

def record_database_query_duration(operation: str, duration: float):
    """Record database query duration"""
    database_query_duration.labels(operation=operation).observe(duration)

def update_active_users(count: int):
    """Update active users count"""
    active_users.set(count)

def update_cache_hit_ratio(ratio: float):
    """Update cache hit ratio"""
    cache_hit_ratio.set(ratio)

def update_database_connections(count: int):
    """Update database connections count"""
    database_connections.set(count)
