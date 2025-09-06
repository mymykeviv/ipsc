"""
Security Manager for Multi-Tenant Architecture
Handles data encryption, audit logging, access controls, and security monitoring
"""

import asyncio
import logging
import hashlib
import hmac
import secrets
import base64
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import jwt
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from .config import settings
from .tenant_config import tenant_config_manager

logger = logging.getLogger(__name__)


class SecurityManager:
    """Comprehensive security management for multi-tenant architecture"""
    
    def __init__(self):
        self.encryption_keys: Dict[str, bytes] = {}
        self.audit_logs: List[Dict] = []
        self.security_events: List[Dict] = []
        self.rate_limiters: Dict[str, Dict] = {}
        self._lock = asyncio.Lock()
        
        # Initialize encryption keys
        self._initialize_encryption_keys()
    
    def _initialize_encryption_keys(self):
        """Initialize encryption keys for data protection"""
        try:
            # Generate or load encryption keys
            if hasattr(settings, 'encryption_key') and settings.encryption_key:
                self.master_key = base64.urlsafe_b64decode(settings.encryption_key)
            else:
                # Generate new master key
                self.master_key = Fernet.generate_key()
                logger.warning("Generated new encryption key. Store this securely!")
            
            self.cipher_suite = Fernet(self.master_key)
            
        except Exception as e:
            logger.error(f"Failed to initialize encryption keys: {e}")
            raise
    
    async def generate_tenant_key(self, tenant_id: str) -> str:
        """Generate encryption key for specific tenant"""
        try:
            # Generate tenant-specific key
            salt = secrets.token_bytes(16)
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
                backend=default_backend()
            )
            
            key = base64.urlsafe_b64encode(kdf.derive(tenant_id.encode()))
            self.encryption_keys[tenant_id] = key
            
            return key.decode()
            
        except Exception as e:
            logger.error(f"Failed to generate key for tenant {tenant_id}: {e}")
            raise
    
    def encrypt_sensitive_data(self, data: str, tenant_id: str) -> str:
        """Encrypt sensitive data for a tenant"""
        try:
            if tenant_id not in self.encryption_keys:
                raise ValueError(f"No encryption key found for tenant {tenant_id}")
            
            key = self.encryption_keys[tenant_id]
            cipher = Fernet(key)
            
            encrypted_data = cipher.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted_data).decode()
            
        except Exception as e:
            logger.error(f"Failed to encrypt data for tenant {tenant_id}: {e}")
            raise
    
    def decrypt_sensitive_data(self, encrypted_data: str, tenant_id: str) -> str:
        """Decrypt sensitive data for a tenant"""
        try:
            if tenant_id not in self.encryption_keys:
                raise ValueError(f"No encryption key found for tenant {tenant_id}")
            
            key = self.encryption_keys[tenant_id]
            cipher = Fernet(key)
            
            decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_data = cipher.decrypt(decoded_data)
            return decrypted_data.decode()
            
        except Exception as e:
            logger.error(f"Failed to decrypt data for tenant {tenant_id}: {e}")
            raise
    
    async def log_security_event(self, event_type: str, tenant_id: str, user_id: Optional[str] = None, 
                                details: Optional[Dict] = None, severity: str = "INFO"):
        """Log security events for monitoring and audit"""
        try:
            event = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': event_type,
                'tenant_id': tenant_id,
                'user_id': user_id,
                'details': details or {},
                'severity': severity,
                'ip_address': None,  # Will be set by middleware
                'user_agent': None,  # Will be set by middleware
                'session_id': None   # Will be set by middleware
            }
            
            self.security_events.append(event)
            
            # Log to file for persistence
            logger.info(f"Security Event: {event_type} for tenant {tenant_id} - {severity}")
            
            # Store in database for audit trail
            await self._store_audit_log(event)
            
        except Exception as e:
            logger.error(f"Failed to log security event: {e}")
    
    async def _store_audit_log(self, event: Dict):
        """Store audit log in database"""
        try:
            # Get tenant database session
            session = await tenant_config_manager.get_session(event['tenant_id'])
            
            audit_query = text("""
                INSERT INTO audit_trail (
                    tenant_id, event_type, user_id, details, severity, 
                    ip_address, user_agent, session_id, created_at
                ) VALUES (
                    :tenant_id, :event_type, :user_id, :details, :severity,
                    :ip_address, :user_agent, :session_id, :created_at
                )
            """)
            
            await session.execute(audit_query, {
                'tenant_id': event['tenant_id'],
                'event_type': event['event_type'],
                'user_id': event['user_id'],
                'details': str(event['details']),
                'severity': event['severity'],
                'ip_address': event['ip_address'],
                'user_agent': event['user_agent'],
                'session_id': event['session_id'],
                'created_at': datetime.utcnow()
            })
            
            await session.commit()
            
        except Exception as e:
            logger.error(f"Failed to store audit log: {e}")
    
    async def check_rate_limit(self, tenant_id: str, user_id: Optional[str] = None, 
                              action: str = "api_call") -> bool:
        """Check rate limiting for tenant/user/action"""
        try:
            current_time = datetime.utcnow()
            key = f"{tenant_id}:{user_id}:{action}" if user_id else f"{tenant_id}:{action}"
            
            if key not in self.rate_limiters:
                self.rate_limiters[key] = {
                    'requests': [],
                    'limit': self._get_rate_limit(tenant_id, action)
                }
            
            limiter = self.rate_limiters[key]
            
            # Remove old requests (older than 1 minute)
            limiter['requests'] = [
                req_time for req_time in limiter['requests']
                if current_time - req_time < timedelta(minutes=1)
            ]
            
            # Check if limit exceeded
            if len(limiter['requests']) >= limiter['limit']:
                await self.log_security_event(
                    'RATE_LIMIT_EXCEEDED', tenant_id, user_id,
                    {'action': action, 'limit': limiter['limit']}, 'WARNING'
                )
                return False
            
            # Add current request
            limiter['requests'].append(current_time)
            return True
            
        except Exception as e:
            logger.error(f"Failed to check rate limit: {e}")
            return True  # Allow if rate limiting fails
    
    def _get_rate_limit(self, tenant_id: str, action: str) -> int:
        """Get rate limit for tenant and action"""
        try:
            # Base rate limits
            base_limits = {
                'api_call': 100,      # 100 API calls per minute
                'login': 5,           # 5 login attempts per minute
                'password_reset': 3,  # 3 password reset attempts per minute
                'file_upload': 20,    # 20 file uploads per minute
                'report_generation': 10  # 10 reports per minute
            }
            
            limit = base_limits.get(action, 50)
            
            # Adjust based on tenant domain
            config = asyncio.run(tenant_config_manager.get_tenant_config(tenant_id))
            if config:
                if config.domain == 'manufacturing':
                    # Manufacturing firms may have higher usage
                    limit = int(limit * 1.5)
                elif config.domain == 'dental':
                    # Dental clinics have moderate usage
                    limit = int(limit * 1.2)
            
            return limit
            
        except Exception as e:
            logger.error(f"Failed to get rate limit: {e}")
            return 50  # Default fallback
    
    async def validate_data_access(self, tenant_id: str, user_id: str, 
                                  resource_type: str, resource_id: str) -> bool:
        """Validate data access permissions"""
        try:
            # Get user permissions
            session = await tenant_config_manager.get_session(tenant_id)
            
            # Check user role and permissions
            user_query = text("""
                SELECT u.role_id, r.permissions 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE u.id = :user_id AND u.tenant_id = :tenant_id
            """)
            
            result = await session.execute(user_query, {
                'user_id': user_id,
                'tenant_id': tenant_id
            })
            
            user_data = result.fetchone()
            if not user_data:
                await self.log_security_event(
                    'UNAUTHORIZED_ACCESS', tenant_id, user_id,
                    {'resource_type': resource_type, 'resource_id': resource_id}, 'WARNING'
                )
                return False
            
            # Check if user has permission for resource type
            permissions = user_data.permissions or []
            if resource_type not in permissions:
                await self.log_security_event(
                    'INSUFFICIENT_PERMISSIONS', tenant_id, user_id,
                    {'resource_type': resource_type, 'resource_id': resource_id}, 'WARNING'
                )
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to validate data access: {e}")
            return False
    
    async def sanitize_input(self, data: Union[str, Dict, List]) -> Union[str, Dict, List]:
        """Sanitize user input to prevent injection attacks"""
        try:
            if isinstance(data, str):
                return self._sanitize_string(data)
            elif isinstance(data, dict):
                return {k: await self.sanitize_input(v) for k, v in data.items()}
            elif isinstance(data, list):
                return [await self.sanitize_input(item) for item in data]
            else:
                return data
                
        except Exception as e:
            logger.error(f"Failed to sanitize input: {e}")
            return data
    
    def _sanitize_string(self, text: str) -> str:
        """Sanitize string input"""
        try:
            # Remove potentially dangerous characters
            dangerous_chars = ['<', '>', '"', "'", '&', ';', '(', ')', '{', '}']
            for char in dangerous_chars:
                text = text.replace(char, '')
            
            # Remove SQL injection patterns
            sql_patterns = [
                'DROP TABLE', 'DELETE FROM', 'INSERT INTO', 'UPDATE SET',
                'SELECT *', 'UNION SELECT', 'OR 1=1', 'AND 1=1'
            ]
            
            text_upper = text.upper()
            for pattern in sql_patterns:
                if pattern in text_upper:
                    text = text.replace(pattern, '')
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Failed to sanitize string: {e}")
            return text
    
    async def generate_secure_token(self, tenant_id: str, user_id: str, 
                                   expires_in: int | None = None) -> str:
        """Generate secure JWT token for user"""
        try:
            exp_seconds = expires_in if expires_in is not None else settings.access_token_expire_minutes * 60
            payload = {
                'tenant_id': tenant_id,
                'user_id': user_id,
                'exp': datetime.utcnow() + timedelta(seconds=exp_seconds),
                'iat': datetime.utcnow(),
                'jti': secrets.token_urlsafe(32)  # JWT ID for uniqueness
            }
            
            # Get tenant-specific secret
            config = await tenant_config_manager.get_tenant_config(tenant_id)
            secret = config.gst_number if config and config.gst_number else settings.secret_key
            
            token = jwt.encode(payload, secret, algorithm='HS256')
            
            await self.log_security_event(
                'TOKEN_GENERATED', tenant_id, user_id,
                {'expires_in': exp_seconds}, 'INFO'
            )
            
            return token
            
        except Exception as e:
            logger.error(f"Failed to generate token: {e}")
            raise
    
    async def validate_token(self, token: str, tenant_id: str) -> Optional[Dict]:
        """Validate JWT token"""
        try:
            # Get tenant-specific secret
            config = await tenant_config_manager.get_tenant_config(tenant_id)
            secret = config.gst_number if config and config.gst_number else settings.secret_key
            
            payload = jwt.decode(token, secret, algorithms=['HS256'])
            
            # Check if token is for correct tenant
            if payload.get('tenant_id') != tenant_id:
                await self.log_security_event(
                    'INVALID_TOKEN_TENANT', tenant_id, payload.get('user_id'),
                    {'expected_tenant': tenant_id, 'token_tenant': payload.get('tenant_id')}, 'WARNING'
                )
                return None
            
            return payload
            
        except jwt.ExpiredSignatureError:
            await self.log_security_event(
                'TOKEN_EXPIRED', tenant_id, None, {}, 'INFO'
            )
            return None
        except jwt.InvalidTokenError as e:
            await self.log_security_event(
                'INVALID_TOKEN', tenant_id, None, {'error': str(e)}, 'WARNING'
            )
            return None
        except Exception as e:
            logger.error(f"Failed to validate token: {e}")
            return None
    
    async def get_security_metrics(self, tenant_id: str) -> Dict[str, Any]:
        """Get security metrics for tenant"""
        try:
            # Get recent security events
            recent_events = [
                event for event in self.security_events
                if event['tenant_id'] == tenant_id and
                datetime.fromisoformat(event['timestamp']) > datetime.utcnow() - timedelta(hours=24)
            ]
            
            # Calculate metrics
            metrics = {
                'total_events_24h': len(recent_events),
                'warning_events': len([e for e in recent_events if e['severity'] == 'WARNING']),
                'error_events': len([e for e in recent_events if e['severity'] == 'ERROR']),
                'rate_limit_violations': len([e for e in recent_events if e['event_type'] == 'RATE_LIMIT_EXCEEDED']),
                'unauthorized_access': len([e for e in recent_events if e['event_type'] == 'UNAUTHORIZED_ACCESS']),
                'last_security_event': recent_events[-1]['timestamp'] if recent_events else None
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to get security metrics for {tenant_id}: {e}")
            return {}
    
    async def cleanup_old_logs(self, days: int = 30):
        """Clean up old security logs"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Clean up in-memory logs
            self.security_events = [
                event for event in self.security_events
                if datetime.fromisoformat(event['timestamp']) > cutoff_date
            ]
            
            # Clean up rate limiters
            current_time = datetime.utcnow()
            for key, limiter in list(self.rate_limiters.items()):
                limiter['requests'] = [
                    req_time for req_time in limiter['requests']
                    if current_time - req_time < timedelta(minutes=1)
                ]
                if not limiter['requests']:
                    del self.rate_limiters[key]
            
            logger.info(f"Cleaned up security logs older than {days} days")
            
        except Exception as e:
            logger.error(f"Failed to cleanup old logs: {e}")


# Global security manager instance
security_manager = SecurityManager()
