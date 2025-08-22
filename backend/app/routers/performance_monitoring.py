"""
Performance Monitoring API Router

This module provides API endpoints for monitoring application performance,
query statistics, and system health.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import psutil
import time
import logging

from ..db import get_db
from ..services.query_optimizer import get_query_optimizer, query_cache
from ..middleware.tenant_routing import get_current_tenant_id
from ..models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/performance", tags=["Performance Monitoring"])


@router.get("/health")
async def get_system_health():
    """
    Get system health metrics including CPU, memory, and disk usage.
    """
    try:
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()
        
        # Memory usage
        memory = psutil.virtual_memory()
        memory_info = {
            'total': memory.total,
            'available': memory.available,
            'used': memory.used,
            'percent': memory.percent,
            'free': memory.free
        }
        
        # Disk usage
        disk = psutil.disk_usage('/')
        disk_info = {
            'total': disk.total,
            'used': disk.used,
            'free': disk.free,
            'percent': (disk.used / disk.total) * 100
        }
        
        # Network I/O
        network = psutil.net_io_counters()
        network_info = {
            'bytes_sent': network.bytes_sent,
            'bytes_recv': network.bytes_recv,
            'packets_sent': network.packets_sent,
            'packets_recv': network.packets_recv
        }
        
        # Process information
        process = psutil.Process()
        process_info = {
            'cpu_percent': process.cpu_percent(),
            'memory_percent': process.memory_percent(),
            'memory_info': process.memory_info()._asdict(),
            'num_threads': process.num_threads(),
            'create_time': datetime.fromtimestamp(process.create_time()).isoformat()
        }
        
        return {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'system': {
                'cpu': {
                    'percent': cpu_percent,
                    'count': cpu_count
                },
                'memory': memory_info,
                'disk': disk_info,
                'network': network_info
            },
            'process': process_info
        }
        
    except Exception as e:
        logger.error(f"Error getting system health: {e}")
        raise HTTPException(status_code=500, detail="Failed to get system health")


@router.get("/query-stats")
async def get_query_statistics(
    db: Session = Depends(get_db),
    tenant_id: Optional[int] = Depends(get_current_tenant_id)
):
    """
    Get database query performance statistics.
    """
    try:
        optimizer = get_query_optimizer(db)
        stats = optimizer.get_query_statistics()
        
        # Add cache statistics
        cache_stats = query_cache.get_stats()
        
        return {
            'query_statistics': stats,
            'cache_statistics': cache_stats,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting query statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get query statistics")


@router.get("/slow-queries")
async def get_slow_queries(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=100),
    tenant_id: Optional[int] = Depends(get_current_tenant_id)
):
    """
    Get list of slow queries for analysis.
    """
    try:
        # This would typically query a slow query log or performance schema
        # For now, we'll return a placeholder structure
        slow_queries = [
            {
                'query': 'SELECT * FROM invoices WHERE tenant_id = ? AND invoice_date >= ?',
                'execution_time': 2.5,
                'timestamp': datetime.utcnow().isoformat(),
                'tenant_id': tenant_id,
                'suggestions': [
                    'Add index on (tenant_id, invoice_date)',
                    'Use LIMIT clause',
                    'Consider pagination'
                ]
            }
        ]
        
        return {
            'slow_queries': slow_queries[:limit],
            'total_count': len(slow_queries),
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting slow queries: {e}")
        raise HTTPException(status_code=500, detail="Failed to get slow queries")


@router.get("/cache-stats")
async def get_cache_statistics():
    """
    Get cache performance statistics.
    """
    try:
        cache_stats = query_cache.get_stats()
        
        return {
            'cache_statistics': cache_stats,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting cache statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get cache statistics")


@router.post("/cache/clear")
async def clear_cache(
    tenant_id: Optional[int] = Depends(get_current_tenant_id)
):
    """
    Clear the query cache.
    """
    try:
        query_cache.clear()
        logger.info(f"Cache cleared by tenant {tenant_id}")
        
        return {
            'message': 'Cache cleared successfully',
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear cache")


@router.get("/optimization-suggestions")
async def get_optimization_suggestions(
    db: Session = Depends(get_db),
    tenant_id: Optional[int] = Depends(get_current_tenant_id)
):
    """
    Get performance optimization suggestions based on current metrics.
    """
    try:
        optimizer = get_query_optimizer(db)
        stats = optimizer.get_query_statistics()
        
        suggestions = []
        
        # Analyze query statistics
        if stats['performance_metrics']['slow_query_percentage'] > 10:
            suggestions.append({
                'type': 'warning',
                'category': 'query_performance',
                'title': 'High percentage of slow queries',
                'description': f"{stats['performance_metrics']['slow_query_percentage']:.1f}% of queries are taking more than 1 second",
                'recommendations': [
                    'Review and optimize slow queries',
                    'Add appropriate database indexes',
                    'Consider query result caching',
                    'Implement database connection pooling'
                ]
            })
        
        if stats['performance_metrics']['average_query_time'] > 0.5:
            suggestions.append({
                'type': 'warning',
                'category': 'query_performance',
                'title': 'High average query time',
                'description': f"Average query time is {stats['performance_metrics']['average_query_time']:.3f}s",
                'recommendations': [
                    'Optimize database queries',
                    'Add database indexes',
                    'Consider read replicas for heavy queries',
                    'Implement query result caching'
                ]
            })
        
        # Check cache statistics
        cache_stats = query_cache.get_stats()
        if cache_stats['size'] > cache_stats['max_size'] * 0.8:
            suggestions.append({
                'type': 'info',
                'category': 'cache',
                'title': 'Cache nearly full',
                'description': f"Cache is {cache_stats['size']}/{cache_stats['max_size']} entries",
                'recommendations': [
                    'Consider increasing cache size',
                    'Review cache TTL settings',
                    'Implement cache eviction policies'
                ]
            })
        
        # System health suggestions
        try:
            memory = psutil.virtual_memory()
            if memory.percent > 80:
                suggestions.append({
                    'type': 'warning',
                    'category': 'system',
                    'title': 'High memory usage',
                    'description': f"Memory usage is {memory.percent:.1f}%",
                    'recommendations': [
                        'Monitor memory usage',
                        'Consider increasing server memory',
                        'Review memory-intensive operations',
                        'Implement memory-efficient data structures'
                    ]
                })
            
            cpu_percent = psutil.cpu_percent(interval=1)
            if cpu_percent > 80:
                suggestions.append({
                    'type': 'warning',
                    'category': 'system',
                    'title': 'High CPU usage',
                    'description': f"CPU usage is {cpu_percent:.1f}%",
                    'recommendations': [
                        'Monitor CPU usage',
                        'Consider horizontal scaling',
                        'Optimize CPU-intensive operations',
                        'Implement background job processing'
                    ]
                })
        except Exception as e:
            logger.warning(f"Could not get system metrics: {e}")
        
        return {
            'suggestions': suggestions,
            'total_count': len(suggestions),
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting optimization suggestions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get optimization suggestions")


@router.get("/metrics")
async def get_performance_metrics(
    db: Session = Depends(get_db),
    tenant_id: Optional[int] = Depends(get_current_tenant_id)
):
    """
    Get comprehensive performance metrics.
    """
    try:
        # Get all performance data
        optimizer = get_query_optimizer(db)
        query_stats = optimizer.get_query_statistics()
        cache_stats = query_cache.get_stats()
        
        # Get system health
        system_health = await get_system_health()
        
        # Calculate performance score (0-100)
        performance_score = 100
        
        # Deduct points for slow queries
        slow_query_percentage = query_stats['performance_metrics']['slow_query_percentage']
        if slow_query_percentage > 0:
            performance_score -= min(slow_query_percentage * 2, 30)
        
        # Deduct points for high average query time
        avg_query_time = query_stats['performance_metrics']['average_query_time']
        if avg_query_time > 0.5:
            performance_score -= min((avg_query_time - 0.5) * 20, 20)
        
        # Deduct points for high system resource usage
        if system_health['system']['memory']['percent'] > 80:
            performance_score -= 10
        if system_health['system']['cpu']['percent'] > 80:
            performance_score -= 10
        
        performance_score = max(0, performance_score)
        
        return {
            'performance_score': performance_score,
            'query_statistics': query_stats,
            'cache_statistics': cache_stats,
            'system_health': system_health,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting performance metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get performance metrics")
