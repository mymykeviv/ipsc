"""
Multi-Tenant Configuration Management System
Handles tenant-specific database connections, branding, and feature configurations
"""

import os
import json
import asyncio
from typing import Dict, Any, Optional, List
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
import logging
from .config import settings

logger = logging.getLogger(__name__)


class TenantConfig:
    """Configuration for a single tenant"""
    
    def __init__(self, tenant_id: str, config: Dict[str, Any]):
        self.tenant_id = tenant_id
        self.database_url = config.get('database_url')
        self.domain = config.get('domain', 'default')
        self.branding = config.get('branding', {})
        self.features = config.get('features', [])
        self.gst_number = config.get('gst_number', '')
        self.contact_info = config.get('contact_info', {})
        self.is_active = config.get('is_active', True)
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary"""
        return {
            'tenant_id': self.tenant_id,
            'database_url': self.database_url,
            'domain': self.domain,
            'branding': self.branding,
            'features': self.features,
            'gst_number': self.gst_number,
            'contact_info': self.contact_info,
            'is_active': self.is_active
        }


class TenantConfigManager:
    """Manages tenant configurations and database connections"""
    
    def __init__(self):
        self.tenant_configs: Dict[str, TenantConfig] = {}
        self.engines: Dict[str, Any] = {}
        self.sessions: Dict[str, Any] = {}
        self._lock = asyncio.Lock()
        self._load_tenant_configs()
    
    def _load_tenant_configs(self):
        """Load tenant configurations from environment or config file"""
        # Default tenant configurations for MVP
        default_configs = {
            'dental_clinic_abc': {
                'database_url': f"postgresql+psycopg://postgres:postgres@localhost:5432/dental_clinic_abc",
                'domain': 'dental',
                'branding': {
                    'logo_url': '/assets/branding/dental_clinic_abc/logo.png',
                    'company_name': 'ABC Dental Clinic',
                    'primary_color': '#2E86AB',
                    'secondary_color': '#A23B72',
                    'address': '123 Dental Street, City, State 12345'
                },
                'features': ['patient_management', 'treatment_tracking', 'dental_supplies'],
                'gst_number': 'GST123456789',
                'contact_info': {
                    'phone': '+91-9876543210',
                    'email': 'info@abcdental.com',
                    'website': 'www.abcdental.com'
                },
                'is_active': True
            },
            'manufacturing_xyz': {
                'database_url': f"postgresql+psycopg://postgres:postgres@localhost:5432/manufacturing_xyz",
                'domain': 'manufacturing',
                'branding': {
                    'logo_url': '/assets/branding/manufacturing_xyz/logo.png',
                    'company_name': 'XYZ Manufacturing',
                    'primary_color': '#A23B72',
                    'secondary_color': '#F18F01',
                    'address': '456 Industrial Park, City, State 12345'
                },
                'features': ['bom_management', 'production_tracking', 'material_management'],
                'gst_number': 'GST987654321',
                'contact_info': {
                    'phone': '+91-1234567890',
                    'email': 'info@xyzmanufacturing.com',
                    'website': 'www.xyzmanufacturing.com'
                },
                'is_active': True
            }
        }
        
        # Load from environment if available
        tenant_configs_env = os.getenv('TENANT_CONFIGS')
        if tenant_configs_env:
            try:
                env_configs = json.loads(tenant_configs_env)
                default_configs.update(env_configs)
            except json.JSONDecodeError:
                logger.warning("Invalid TENANT_CONFIGS environment variable")
        
        # Initialize tenant configs
        for tenant_id, config in default_configs.items():
            self.tenant_configs[tenant_id] = TenantConfig(tenant_id, config)
    
    async def get_tenant_config(self, tenant_id: str) -> Optional[TenantConfig]:
        """Get tenant configuration"""
        return self.tenant_configs.get(tenant_id)
    
    async def get_database_url(self, tenant_id: str) -> Optional[str]:
        """Get database URL for tenant"""
        config = await self.get_tenant_config(tenant_id)
        return config.database_url if config else None
    
    async def get_engine(self, tenant_id: str):
        """Get database engine for tenant"""
        async with self._lock:
            if tenant_id not in self.engines:
                config = await self.get_tenant_config(tenant_id)
                if not config:
                    raise ValueError(f"Tenant {tenant_id} not found")
                
                # Create async engine for tenant
                engine = create_async_engine(
                    config.database_url,
                    pool_size=settings.database_pool_size,
                    max_overflow=settings.database_max_overflow,
                    pool_timeout=settings.database_pool_timeout,
                    pool_pre_ping=True,
                    echo=settings.debug
                )
                self.engines[tenant_id] = engine
                
                # Create session factory
                session_factory = sessionmaker(
                    engine, class_=AsyncSession, expire_on_commit=False
                )
                self.sessions[tenant_id] = session_factory
            
            return self.engines[tenant_id]
    
    async def get_session(self, tenant_id: str) -> AsyncSession:
        """Get database session for tenant"""
        if tenant_id not in self.sessions:
            await self.get_engine(tenant_id)
        return self.sessions[tenant_id]()
    
    async def has_feature(self, tenant_id: str, feature: str) -> bool:
        """Check if tenant has access to specific feature"""
        config = await self.get_tenant_config(tenant_id)
        if not config:
            return False
        return feature in config.features
    
    async def get_branding(self, tenant_id: str) -> Dict[str, Any]:
        """Get branding configuration for tenant"""
        config = await self.get_tenant_config(tenant_id)
        return config.branding if config else {}
    
    async def get_company_info(self, tenant_id: str) -> Dict[str, Any]:
        """Get company information for tenant"""
        config = await self.get_tenant_config(tenant_id)
        if not config:
            return {}
        
        return {
            'name': config.branding.get('company_name', ''),
            'gst_number': config.gst_number,
            'address': config.branding.get('address', ''),
            'contact': config.contact_info
        }
    
    async def list_tenants(self) -> List[str]:
        """List all active tenant IDs"""
        return [tid for tid, config in self.tenant_configs.items() if config.is_active]
    
    async def add_tenant(self, tenant_id: str, config: Dict[str, Any]):
        """Add new tenant configuration"""
        async with self._lock:
            self.tenant_configs[tenant_id] = TenantConfig(tenant_id, config)
            logger.info(f"Added tenant configuration for {tenant_id}")
    
    async def update_tenant(self, tenant_id: str, config_updates: Dict[str, Any]):
        """Update tenant configuration"""
        async with self._lock:
            if tenant_id not in self.tenant_configs:
                raise ValueError(f"Tenant {tenant_id} not found")
            
            current_config = self.tenant_configs[tenant_id]
            updated_config = {**current_config.to_dict(), **config_updates}
            self.tenant_configs[tenant_id] = TenantConfig(tenant_id, updated_config)
            logger.info(f"Updated tenant configuration for {tenant_id}")
    
    async def remove_tenant(self, tenant_id: str):
        """Remove tenant configuration"""
        async with self._lock:
            if tenant_id in self.tenant_configs:
                del self.tenant_configs[tenant_id]
                logger.info(f"Removed tenant configuration for {tenant_id}")


# Global tenant config manager instance
tenant_config_manager = TenantConfigManager()
