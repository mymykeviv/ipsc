"""
Security Monitoring API Router

This module provides API endpoints for security monitoring, audit logs,
and security configuration management.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import logging

from ..db import get_db
from ..services.security_service import get_security_service, SecurityLevel
from ..middleware.tenant_routing import get_current_tenant_id
from ..models import User, AuditTrail

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/security", tags=["Security Monitoring"])


@router.get("/audit-logs")
async def get_audit_logs(
    request: Request,
    db: Session = Depends(get_db),
    tenant_id: Optional[int] = Depends(get_current_tenant_id),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip")
):
    """
    Get audit logs with filtering and pagination.
    """
    try:
        security_service = get_security_service(db)
        
        # Build query
        query = db.query(AuditTrail)
        
        # Apply tenant filter
        if tenant_id:
            query = query.filter(AuditTrail.tenant_id == tenant_id)
        
        # Apply date filters
        if start_date:
            query = query.filter(AuditTrail.timestamp >= start_date)
        if end_date:
            query = query.filter(AuditTrail.timestamp <= end_date + " 23:59:59")
        
        # Apply other filters
        if action:
            query = query.filter(AuditTrail.action == action)
        if user_id:
            query = query.filter(AuditTrail.user_id == user_id)
        if resource_type:
            query = query.filter(AuditTrail.resource_type == resource_type)
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination and ordering
        audit_logs = query.order_by(AuditTrail.timestamp.desc()).offset(offset).limit(limit).all()
        
        # Convert to response format
        logs = []
        for log in audit_logs:
            log_data = {
                'id': log.id,
                'user_id': log.user_id,
                'action': log.action,
                'resource_type': log.resource_type,
                'resource_id': log.resource_id,
                'details': log.details,
                'ip_address': log.ip_address,
                'user_agent': log.user_agent,
                'timestamp': log.timestamp.isoformat(),
                'tenant_id': log.tenant_id
            }
            logs.append(log_data)
        
        # Log security event
        security_service.log_security_event(
            event_type="audit_log_access",
            user_identifier=f"user_id_{request.headers.get('user_id', 'unknown')}",
            details=f"Accessed audit logs with filters: action={action}, user_id={user_id}",
            security_level=SecurityLevel.LOW,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get('user-agent')
        )
        
        return {
            'audit_logs': logs,
            'total_count': total_count,
            'limit': limit,
            'offset': offset,
            'has_more': offset + limit < total_count
        }
        
    except Exception as e:
        logger.error(f"Error getting audit logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to get audit logs")


@router.get("/security-report")
async def get_security_report(
    request: Request,
    db: Session = Depends(get_db),
    tenant_id: Optional[int] = Depends(get_current_tenant_id)
):
    """
    Get comprehensive security report.
    """
    try:
        security_service = get_security_service(db)
        report = security_service.get_security_report(tenant_id)
        
        # Log security event
        security_service.log_security_event(
            event_type="security_report_access",
            user_identifier=f"user_id_{request.headers.get('user_id', 'unknown')}",
            details="Accessed security report",
            security_level=SecurityLevel.MEDIUM,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get('user-agent')
        )
        
        return report
        
    except Exception as e:
        logger.error(f"Error getting security report: {e}")
        raise HTTPException(status_code=500, detail="Failed to get security report")


@router.get("/failed-logins")
async def get_failed_logins(
    request: Request,
    db: Session = Depends(get_db),
    tenant_id: Optional[int] = Depends(get_current_tenant_id),
    days: int = Query(7, ge=1, le=30, description="Number of days to look back")
):
    """
    Get failed login attempts for the specified period.
    """
    try:
        security_service = get_security_service(db)
        
        # Get failed login events from audit trail
        start_date = datetime.utcnow() - timedelta(days=days)
        
        query = db.query(AuditTrail).filter(
            AuditTrail.action == 'failed_login',
            AuditTrail.timestamp >= start_date
        )
        
        if tenant_id:
            query = query.filter(AuditTrail.tenant_id == tenant_id)
        
        failed_logins = query.order_by(AuditTrail.timestamp.desc()).all()
        
        # Group by user identifier
        login_attempts = {}
        for login in failed_logins:
            user_identifier = login.details.split(' - ')[0] if ' - ' in login.details else 'unknown'
            if user_identifier not in login_attempts:
                login_attempts[user_identifier] = []
            
            login_attempts[user_identifier].append({
                'timestamp': login.timestamp.isoformat(),
                'ip_address': login.ip_address,
                'user_agent': login.user_agent,
                'details': login.details
            })
        
        # Calculate statistics
        total_attempts = len(failed_logins)
        unique_users = len(login_attempts)
        
        # Get most frequent attempts
        most_frequent = sorted(
            login_attempts.items(),
            key=lambda x: len(x[1]),
            reverse=True
        )[:10]
        
        return {
            'total_attempts': total_attempts,
            'unique_users': unique_users,
            'period_days': days,
            'most_frequent_attempts': [
                {
                    'user_identifier': user,
                    'attempt_count': len(attempts),
                    'last_attempt': attempts[0]['timestamp'] if attempts else None
                }
                for user, attempts in most_frequent
            ],
            'attempts_by_user': login_attempts
        }
        
    except Exception as e:
        logger.error(f"Error getting failed logins: {e}")
        raise HTTPException(status_code=500, detail="Failed to get failed logins")


@router.get("/suspicious-activity")
async def get_suspicious_activity(
    request: Request,
    db: Session = Depends(get_db),
    tenant_id: Optional[int] = Depends(get_current_tenant_id),
    days: int = Query(7, ge=1, le=30, description="Number of days to look back")
):
    """
    Get suspicious activity patterns.
    """
    try:
        security_service = get_security_service(db)
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get suspicious activity events
        query = db.query(AuditTrail).filter(
            AuditTrail.action.in_(['suspicious_activity', 'permission_denied', 'rate_limit_exceeded']),
            AuditTrail.timestamp >= start_date
        )
        
        if tenant_id:
            query = query.filter(AuditTrail.tenant_id == tenant_id)
        
        suspicious_events = query.order_by(AuditTrail.timestamp.desc()).all()
        
        # Analyze patterns
        patterns = {
            'rate_limit_violations': [],
            'permission_denials': [],
            'unusual_access_patterns': [],
            'potential_attacks': []
        }
        
        for event in suspicious_events:
            event_data = {
                'timestamp': event.timestamp.isoformat(),
                'action': event.action,
                'details': event.details,
                'ip_address': event.ip_address,
                'user_agent': event.user_agent
            }
            
            if event.action == 'rate_limit_exceeded':
                patterns['rate_limit_violations'].append(event_data)
            elif event.action == 'permission_denied':
                patterns['permission_denials'].append(event_data)
            elif 'suspicious' in event.details.lower():
                patterns['unusual_access_patterns'].append(event_data)
            elif any(keyword in event.details.lower() for keyword in ['attack', 'injection', 'exploit']):
                patterns['potential_attacks'].append(event_data)
        
        return {
            'total_suspicious_events': len(suspicious_events),
            'period_days': days,
            'patterns': patterns,
            'summary': {
                'rate_limit_violations': len(patterns['rate_limit_violations']),
                'permission_denials': len(patterns['permission_denials']),
                'unusual_patterns': len(patterns['unusual_access_patterns']),
                'potential_attacks': len(patterns['potential_attacks'])
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting suspicious activity: {e}")
        raise HTTPException(status_code=500, detail="Failed to get suspicious activity")


@router.get("/active-sessions")
async def get_active_sessions(
    request: Request,
    db: Session = Depends(get_db),
    tenant_id: Optional[int] = Depends(get_current_tenant_id)
):
    """
    Get active user sessions.
    """
    try:
        security_service = get_security_service(db)
        
        # Get active sessions from security service
        active_sessions = security_service.session_cache
        
        # Filter by tenant if specified
        if tenant_id:
            filtered_sessions = {
                session_id: session_data
                for session_id, session_data in active_sessions.items()
                if session_data.get('tenant_id') == tenant_id
            }
        else:
            filtered_sessions = active_sessions
        
        # Convert to response format
        sessions = []
        for session_id, session_data in filtered_sessions.items():
            session_info = {
                'session_id': session_id,
                'user_id': session_data.get('user_id'),
                'tenant_id': session_data.get('tenant_id'),
                'created_at': session_data.get('created_at').isoformat() if session_data.get('created_at') else None,
                'last_activity': session_data.get('last_activity').isoformat() if session_data.get('last_activity') else None,
                'duration_minutes': int((session_data.get('last_activity', datetime.utcnow()) - session_data.get('created_at', datetime.utcnow())).total_seconds() / 60) if session_data.get('created_at') and session_data.get('last_activity') else 0
            }
            sessions.append(session_info)
        
        # Sort by last activity
        sessions.sort(key=lambda x: x['last_activity'], reverse=True)
        
        return {
            'active_sessions': sessions,
            'total_count': len(sessions),
            'session_timeout_minutes': security_service.config.session_timeout // 60
        }
        
    except Exception as e:
        logger.error(f"Error getting active sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get active sessions")


@router.post("/sessions/revoke")
async def revoke_session(
    session_id: str,
    request: Request,
    db: Session = Depends(get_db),
    tenant_id: Optional[int] = Depends(get_current_tenant_id)
):
    """
    Revoke a specific user session.
    """
    try:
        security_service = get_security_service(db)
        
        # Check if session exists
        if session_id not in security_service.session_cache:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Check if user has permission to revoke this session
        session_data = security_service.session_cache[session_id]
        if tenant_id and session_data.get('tenant_id') != tenant_id:
            raise HTTPException(status_code=403, detail="Not authorized to revoke this session")
        
        # Remove session
        del security_service.session_cache[session_id]
        
        # Log security event
        security_service.log_security_event(
            event_type="session_revoked",
            user_identifier=f"user_id_{session_data.get('user_id', 'unknown')}",
            details=f"Session {session_id} revoked by admin",
            security_level=SecurityLevel.MEDIUM,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get('user-agent')
        )
        
        return {"message": "Session revoked successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error revoking session: {e}")
        raise HTTPException(status_code=500, detail="Failed to revoke session")


@router.post("/sessions/revoke-all")
async def revoke_all_sessions(
    request: Request,
    db: Session = Depends(get_db),
    tenant_id: Optional[int] = Depends(get_current_tenant_id)
):
    """
    Revoke all active sessions for the tenant.
    """
    try:
        security_service = get_security_service(db)
        
        # Count sessions before revocation
        sessions_to_revoke = []
        for session_id, session_data in security_service.session_cache.items():
            if tenant_id is None or session_data.get('tenant_id') == tenant_id:
                sessions_to_revoke.append(session_id)
        
        # Revoke sessions
        for session_id in sessions_to_revoke:
            del security_service.session_cache[session_id]
        
        # Log security event
        security_service.log_security_event(
            event_type="all_sessions_revoked",
            user_identifier=f"tenant_id_{tenant_id}" if tenant_id else "all_tenants",
            details=f"Revoked {len(sessions_to_revoke)} sessions",
            security_level=SecurityLevel.HIGH,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get('user-agent')
        )
        
        return {
            "message": f"Revoked {len(sessions_to_revoke)} sessions successfully",
            "revoked_count": len(sessions_to_revoke)
        }
        
    except Exception as e:
        logger.error(f"Error revoking all sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to revoke sessions")


@router.get("/security-config")
async def get_security_config(
    request: Request,
    db: Session = Depends(get_db),
    tenant_id: Optional[int] = Depends(get_current_tenant_id)
):
    """
    Get current security configuration.
    """
    try:
        security_service = get_security_service(db)
        
        config = {
            'max_login_attempts': security_service.config.max_login_attempts,
            'lockout_duration_minutes': security_service.config.lockout_duration // 60,
            'session_timeout_minutes': security_service.config.session_timeout // 60,
            'password_requirements': {
                'min_length': security_service.config.password_min_length,
                'require_uppercase': security_service.config.password_require_uppercase,
                'require_lowercase': security_service.config.password_require_lowercase,
                'require_numbers': security_service.config.password_require_numbers,
                'require_special': security_service.config.password_require_special
            },
            'rate_limiting': {
                'requests_per_hour': security_service.config.rate_limit_requests,
                'window_hours': security_service.config.rate_limit_window // 3600
            },
            'file_upload': {
                'max_file_size_mb': security_service.config.max_file_size // (1024 * 1024),
                'allowed_file_types': security_service.config.allowed_file_types
            },
            'two_factor_auth': {
                'enabled': security_service.config.enable_2fa,
                'required_for_admin': security_service.config.require_2fa_for_admin
            },
            'audit_log_retention_days': security_service.config.audit_log_retention_days
        }
        
        return config
        
    except Exception as e:
        logger.error(f"Error getting security config: {e}")
        raise HTTPException(status_code=500, detail="Failed to get security configuration")
