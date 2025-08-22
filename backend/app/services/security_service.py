"""
Security Service

This module provides comprehensive security measures including authentication,
authorization, rate limiting, input validation, and audit logging.
"""

import logging
import hashlib
import secrets
import time
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
import jwt
import bcrypt
import re
from dataclasses import dataclass
from enum import Enum

from ..models import User, AuditTrail, Tenant, TenantUser
from ..db import get_db

logger = logging.getLogger(__name__)


class SecurityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class SecurityConfig:
    """Security configuration settings."""
    max_login_attempts: int = 5
    lockout_duration: int = 900  # 15 minutes
    session_timeout: int = 3600  # 1 hour
    password_min_length: int = 8
    password_require_uppercase: bool = True
    password_require_lowercase: bool = True
    password_require_numbers: bool = True
    password_require_special: bool = True
    rate_limit_requests: int = 100
    rate_limit_window: int = 3600  # 1 hour
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: List[str] = None
    enable_2fa: bool = True
    require_2fa_for_admin: bool = True
    audit_log_retention_days: int = 90


class SecurityService:
    """
    Comprehensive security service for authentication, authorization, and monitoring.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.config = SecurityConfig()
        self.failed_login_attempts: Dict[str, List[float]] = {}
        self.rate_limit_cache: Dict[str, List[float]] = {}
        self.session_cache: Dict[str, Dict[str, Any]] = {}
        
        if self.config.allowed_file_types is None:
            self.config.allowed_file_types = [
                'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx'
            ]
    
    def hash_password(self, password: str) -> str:
        """
        Hash password using bcrypt with salt.
        """
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """
        Verify password against hash.
        """
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def validate_password_strength(self, password: str) -> Tuple[bool, List[str]]:
        """
        Validate password strength and return issues.
        """
        issues = []
        
        if len(password) < self.config.password_min_length:
            issues.append(f"Password must be at least {self.config.password_min_length} characters")
        
        if self.config.password_require_uppercase and not re.search(r'[A-Z]', password):
            issues.append("Password must contain at least one uppercase letter")
        
        if self.config.password_require_lowercase and not re.search(r'[a-z]', password):
            issues.append("Password must contain at least one lowercase letter")
        
        if self.config.password_require_numbers and not re.search(r'\d', password):
            issues.append("Password must contain at least one number")
        
        if self.config.password_require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            issues.append("Password must contain at least one special character")
        
        return len(issues) == 0, issues
    
    def generate_secure_token(self, user_id: int, tenant_id: Optional[int] = None) -> str:
        """
        Generate JWT token with security claims.
        """
        payload = {
            'user_id': user_id,
            'tenant_id': tenant_id,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(seconds=self.config.session_timeout),
            'jti': secrets.token_urlsafe(32)  # JWT ID for uniqueness
        }
        
        # In production, use a secure secret key from environment
        secret_key = "your-secret-key-here"  # TODO: Move to environment variable
        token = jwt.encode(payload, secret_key, algorithm='HS256')
        
        # Store session in cache
        session_id = payload['jti']
        self.session_cache[session_id] = {
            'user_id': user_id,
            'tenant_id': tenant_id,
            'created_at': datetime.utcnow(),
            'last_activity': datetime.utcnow()
        }
        
        return token
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify JWT token and return payload.
        """
        try:
            secret_key = "your-secret-key-here"  # TODO: Move to environment variable
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            
            # Check if session exists in cache
            session_id = payload.get('jti')
            if session_id not in self.session_cache:
                return None
            
            # Update last activity
            self.session_cache[session_id]['last_activity'] = datetime.utcnow()
            
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            return None
    
    def check_rate_limit(self, identifier: str, limit: Optional[int] = None) -> bool:
        """
        Check rate limiting for given identifier.
        """
        if limit is None:
            limit = self.config.rate_limit_requests
        
        current_time = time.time()
        window_start = current_time - self.config.rate_limit_window
        
        # Clean old entries
        if identifier in self.rate_limit_cache:
            self.rate_limit_cache[identifier] = [
                timestamp for timestamp in self.rate_limit_cache[identifier]
                if timestamp > window_start
            ]
        else:
            self.rate_limit_cache[identifier] = []
        
        # Check if limit exceeded
        if len(self.rate_limit_cache[identifier]) >= limit:
            return False
        
        # Add current request
        self.rate_limit_cache[identifier].append(current_time)
        return True
    
    def check_login_attempts(self, username: str) -> bool:
        """
        Check if user is locked out due to failed login attempts.
        """
        current_time = time.time()
        lockout_threshold = current_time - self.config.lockout_duration
        
        if username in self.failed_login_attempts:
            # Clean old attempts
            self.failed_login_attempts[username] = [
                timestamp for timestamp in self.failed_login_attempts[username]
                if timestamp > lockout_threshold
            ]
            
            # Check if too many recent attempts
            if len(self.failed_login_attempts[username]) >= self.config.max_login_attempts:
                return False
        
        return True
    
    def record_failed_login(self, username: str):
        """
        Record a failed login attempt.
        """
        if username not in self.failed_login_attempts:
            self.failed_login_attempts[username] = []
        
        self.failed_login_attempts[username].append(time.time())
        
        # Log security event
        self.log_security_event(
            event_type="failed_login",
            user_identifier=username,
            details=f"Failed login attempt. Total attempts: {len(self.failed_login_attempts[username])}",
            security_level=SecurityLevel.MEDIUM
        )
    
    def clear_failed_logins(self, username: str):
        """
        Clear failed login attempts for user.
        """
        if username in self.failed_login_attempts:
            del self.failed_login_attempts[username]
    
    def validate_input(self, data: Any, input_type: str) -> Tuple[bool, List[str]]:
        """
        Validate input data for security.
        """
        issues = []
        
        if input_type == "email":
            if not isinstance(data, str):
                issues.append("Email must be a string")
            elif not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', data):
                issues.append("Invalid email format")
            elif len(data) > 254:  # RFC 5321 limit
                issues.append("Email too long")
        
        elif input_type == "username":
            if not isinstance(data, str):
                issues.append("Username must be a string")
            elif len(data) < 3 or len(data) > 50:
                issues.append("Username must be between 3 and 50 characters")
            elif not re.match(r'^[a-zA-Z0-9_-]+$', data):
                issues.append("Username can only contain letters, numbers, underscores, and hyphens")
        
        elif input_type == "phone":
            if not isinstance(data, str):
                issues.append("Phone must be a string")
            elif not re.match(r'^\+?[\d\s\-\(\)]+$', data):
                issues.append("Invalid phone number format")
        
        elif input_type == "file":
            if not isinstance(data, dict):
                issues.append("File data must be an object")
            else:
                filename = data.get('filename', '')
                file_size = data.get('size', 0)
                file_type = data.get('type', '')
                
                if file_size > self.config.max_file_size:
                    issues.append(f"File size exceeds maximum of {self.config.max_file_size} bytes")
                
                if filename:
                    extension = filename.split('.')[-1].lower()
                    if extension not in self.config.allowed_file_types:
                        issues.append(f"File type {extension} not allowed")
                
                if file_type and not file_type.startswith(('image/', 'application/pdf', 'application/msword')):
                    issues.append("File type not allowed")
        
        elif input_type == "sql_injection":
            # Basic SQL injection prevention
            dangerous_patterns = [
                r'(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)',
                r'(\b(or|and)\b\s+\d+\s*=\s*\d+)',
                r'(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)',
                r'(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)',
                r'(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)',
                r'(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)',
                r'(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)',
                r'(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)',
                r'(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)',
                r'(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)',
                r'(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)',
            ]
            
            data_str = str(data).lower()
            for pattern in dangerous_patterns:
                if re.search(pattern, data_str, re.IGNORECASE):
                    issues.append("Potential SQL injection detected")
                    break
        
        return len(issues) == 0, issues
    
    def check_permission(self, user_id: int, resource: str, action: str, tenant_id: Optional[int] = None) -> bool:
        """
        Check if user has permission for specific resource and action.
        """
        try:
            # Get user with roles
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            
            # Super admin has all permissions
            if user.role.name == 'super_admin':
                return True
            
            # Check tenant-specific permissions
            if tenant_id:
                tenant_user = self.db.query(TenantUser).filter(
                    and_(
                        TenantUser.user_id == user_id,
                        TenantUser.tenant_id == tenant_id
                    )
                ).first()
                
                if not tenant_user:
                    return False
                
                # Admin role has all permissions within tenant
                if tenant_user.role == 'admin':
                    return True
            
            # Define permission matrix
            permissions = {
                'user': {
                    'invoice': ['read', 'create', 'update_own'],
                    'purchase': ['read', 'create', 'update_own'],
                    'product': ['read', 'create', 'update_own'],
                    'party': ['read', 'create', 'update_own'],
                    'payment': ['read', 'create_own'],
                    'report': ['read_own'],
                    'settings': ['read_own']
                },
                'manager': {
                    'invoice': ['read', 'create', 'update', 'delete'],
                    'purchase': ['read', 'create', 'update', 'delete'],
                    'product': ['read', 'create', 'update', 'delete'],
                    'party': ['read', 'create', 'update', 'delete'],
                    'payment': ['read', 'create', 'update'],
                    'report': ['read'],
                    'settings': ['read', 'update']
                },
                'admin': {
                    'invoice': ['read', 'create', 'update', 'delete'],
                    'purchase': ['read', 'create', 'update', 'delete'],
                    'product': ['read', 'create', 'update', 'delete'],
                    'party': ['read', 'create', 'update', 'delete'],
                    'payment': ['read', 'create', 'update', 'delete'],
                    'report': ['read', 'create'],
                    'settings': ['read', 'update', 'delete'],
                    'user': ['read', 'create', 'update', 'delete'],
                    'tenant': ['read', 'update']
                }
            }
            
            # Get user's effective role
            effective_role = tenant_user.role if tenant_id and tenant_user else user.role.name
            
            if effective_role not in permissions:
                return False
            
            if resource not in permissions[effective_role]:
                return False
            
            return action in permissions[effective_role][resource]
            
        except Exception as e:
            logger.error(f"Error checking permission: {e}")
            return False
    
    def log_security_event(self, event_type: str, user_identifier: str, 
                          details: str, security_level: SecurityLevel,
                          ip_address: Optional[str] = None,
                          user_agent: Optional[str] = None):
        """
        Log security event to audit trail.
        """
        try:
            audit_entry = AuditTrail(
                user_id=None,  # Will be set if user is authenticated
                action=event_type,
                resource_type="security",
                resource_id=None,
                details=details,
                ip_address=ip_address,
                user_agent=user_agent,
                timestamp=datetime.utcnow(),
                tenant_id=None  # Will be set if tenant context is available
            )
            
            self.db.add(audit_entry)
            self.db.commit()
            
            # Log to application log based on security level
            if security_level == SecurityLevel.CRITICAL:
                logger.critical(f"SECURITY CRITICAL: {event_type} - {details}")
            elif security_level == SecurityLevel.HIGH:
                logger.error(f"SECURITY HIGH: {event_type} - {details}")
            elif security_level == SecurityLevel.MEDIUM:
                logger.warning(f"SECURITY MEDIUM: {event_type} - {details}")
            else:
                logger.info(f"SECURITY LOW: {event_type} - {details}")
                
        except Exception as e:
            logger.error(f"Error logging security event: {e}")
    
    def cleanup_expired_sessions(self):
        """
        Clean up expired sessions from cache.
        """
        current_time = datetime.utcnow()
        expired_sessions = []
        
        for session_id, session_data in self.session_cache.items():
            if current_time - session_data['last_activity'] > timedelta(seconds=self.config.session_timeout):
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            del self.session_cache[session_id]
        
        if expired_sessions:
            logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")
    
    def get_security_report(self, tenant_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Generate security report for monitoring.
        """
        try:
            # Get recent security events
            recent_events = self.db.query(AuditTrail).filter(
                and_(
                    AuditTrail.action.in_(['failed_login', 'suspicious_activity', 'permission_denied']),
                    AuditTrail.timestamp >= datetime.utcnow() - timedelta(days=7)
                )
            )
            
            if tenant_id:
                recent_events = recent_events.filter(AuditTrail.tenant_id == tenant_id)
            
            recent_events = recent_events.order_by(AuditTrail.timestamp.desc()).limit(100).all()
            
            # Count events by type
            event_counts = {}
            for event in recent_events:
                event_counts[event.action] = event_counts.get(event.action, 0) + 1
            
            # Get failed login attempts
            failed_logins = len([event for event in recent_events if event.action == 'failed_login'])
            
            # Get active sessions
            active_sessions = len(self.session_cache)
            
            # Get rate limit violations
            rate_limit_violations = sum(1 for attempts in self.rate_limit_cache.values() 
                                      if len(attempts) >= self.config.rate_limit_requests)
            
            return {
                'recent_security_events': len(recent_events),
                'event_counts': event_counts,
                'failed_logins_7_days': failed_logins,
                'active_sessions': active_sessions,
                'rate_limit_violations': rate_limit_violations,
                'security_score': self._calculate_security_score(failed_logins, rate_limit_violations),
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating security report: {e}")
            return {}
    
    def _calculate_security_score(self, failed_logins: int, rate_limit_violations: int) -> int:
        """
        Calculate security score (0-100).
        """
        score = 100
        
        # Deduct points for failed logins
        if failed_logins > 10:
            score -= 20
        elif failed_logins > 5:
            score -= 10
        elif failed_logins > 0:
            score -= 5
        
        # Deduct points for rate limit violations
        if rate_limit_violations > 5:
            score -= 15
        elif rate_limit_violations > 0:
            score -= 5
        
        return max(0, score)


def get_security_service(db: Session) -> SecurityService:
    """
    Factory function to create SecurityService instance.
    """
    return SecurityService(db)
