# Multi-Tenant Architecture Implementation

## Overview

This document describes the multi-tenant architecture implementation for the CashFlow application, enabling multiple clients to use the same application instance with complete data isolation and domain-specific features.

## Architecture Design

### Key Principles

1. **Complete Data Isolation**: Each tenant has its own database instance
2. **Feature Access Control**: Domain-specific features are controlled per tenant
3. **Branding Customization**: Each tenant can have custom branding and organization details
4. **Backward Compatibility**: Existing single-tenant deployments continue to work
5. **Scalable Design**: Easy addition of new tenants and domains

### Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Multi-Tenant Application                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Tenant A      │  │   Tenant B      │  │   Tenant C   │ │
│  │ (Dental Clinic) │  │(Manufacturing)  │  │   (Default)  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Tenant Middleware                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Tenant Routing  │  │ Feature Access  │  │ Branding     │ │
│  │   Middleware    │  │   Middleware    │  │   Service    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Database Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Database A     │  │  Database B     │  │  Database C  │ │
│  │(dental_clinic)  │  │(manufacturing)  │  │   (default)  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Tenant Configuration Management

**File**: `backend/app/tenant_config.py`

The tenant configuration system manages:
- Tenant-specific database connections
- Domain-specific feature access
- Branding and organization details
- Tenant status and activation

```python
# Example tenant configuration
{
    'dental_clinic_abc': {
        'database_url': 'postgresql://user:pass@host:5432/dental_clinic_abc',
        'domain': 'dental',
        'branding': {
            'company_name': 'ABC Dental Clinic',
            'primary_color': '#2E86AB',
            'logo_url': '/assets/branding/dental_clinic_abc/logo.png'
        },
        'features': ['patient_management', 'treatment_tracking', 'dental_supplies'],
        'gst_number': 'GST123456789',
        'contact_info': {
            'phone': '+91-9876543210',
            'email': 'info@abcdental.com'
        },
        'is_active': True
    }
}
```

### 2. Tenant Routing Middleware

**File**: `backend/app/middleware/tenant.py`

The tenant middleware handles:
- Tenant identification from subdomain, headers, or query parameters
- Tenant validation and context injection
- Feature access control
- Response header injection for debugging

#### Tenant Identification Methods

1. **Subdomain**: `dental-clinic-abc.app.com`
2. **Header**: `X-Tenant-ID: dental_clinic_abc`
3. **Query Parameter**: `?tenant_id=dental_clinic_abc`

### 3. Database Isolation

**File**: `backend/app/db.py`

Each tenant gets:
- Separate database instance
- Isolated connection pool
- Tenant-specific session management
- Backward compatibility with single-tenant mode

### 4. Feature Access Control

Domain-specific features are controlled through the feature access middleware:

- **Dental Features**: `patient_management`, `treatment_tracking`, `dental_supplies`
- **Manufacturing Features**: `bom_management`, `production_tracking`, `material_management`
- **Common Features**: Available to all tenants

## Configuration

### Environment Variables

```bash
# Enable multi-tenant architecture
MULTI_TENANT_ENABLED=true

# Tenant configurations (optional, can be loaded from file)
TENANT_CONFIGS='{"tenant_id": {"database_url": "...", "domain": "..."}}'
```

### Tenant Configuration File

Tenants can be configured through:
1. Environment variables
2. Configuration files
3. Database storage (future enhancement)

## Database Schema

### Tenant Configuration Table

```sql
CREATE TABLE tenant_configs (
    tenant_id VARCHAR(50) PRIMARY KEY,
    database_url VARCHAR(255) NOT NULL,
    domain VARCHAR(20) NOT NULL DEFAULT 'default',
    branding_config JSONB,
    features JSONB,
    gst_number VARCHAR(15),
    contact_info JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Tenant-Aware Tables

All existing tables have been extended with a `tenant_id` column:

```sql
-- Example: Products table
ALTER TABLE products ADD COLUMN tenant_id VARCHAR(50);
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_tenant_active ON products(tenant_id, is_active);
```

## API Endpoints

### Multi-Tenant Specific Endpoints

- `GET /api/tenants` - List all available tenants
- `GET /api/tenants/{tenant_id}/config` - Get tenant configuration
- `GET /api/tenants/{tenant_id}/branding` - Get tenant branding

### Tenant Context in Existing Endpoints

All existing endpoints automatically work with tenant context when multi-tenant is enabled.

## Deployment

### Single-Tenant Mode (Default)

```bash
# Run in single-tenant mode (backward compatibility)
MULTI_TENANT_ENABLED=false python -m uvicorn app.main:app
```

### Multi-Tenant Mode

```bash
# Run in multi-tenant mode
MULTI_TENANT_ENABLED=true python -m uvicorn app.main:app
```

### Database Setup

```bash
# Set up tenant databases
cd backend
python scripts/setup_tenant_databases.py
```

## Testing

### Running Tests

```bash
# Run multi-tenant tests
cd backend
pytest tests/test_multi_tenant.py -v
```

### Test Coverage

The test suite covers:
- Tenant configuration management
- Tenant routing middleware
- Feature access control
- Database isolation
- API endpoint functionality

## Migration Strategy

### From Single-Tenant to Multi-Tenant

1. **Backup existing data**
2. **Run database migration**
3. **Configure tenant settings**
4. **Enable multi-tenant mode**
5. **Test thoroughly**

### Database Migration

```bash
# Run tenant support migration
cd backend
alembic upgrade head
```

## Security Considerations

### Data Isolation

- Complete database separation per tenant
- No cross-tenant data access possible
- Tenant validation on every request

### Access Control

- Feature-based access control
- Tenant-specific authentication (future enhancement)
- Audit logging per tenant

### Configuration Security

- Secure storage of database credentials
- Environment-based configuration
- No sensitive data in code

## Performance Considerations

### Database Performance

- Separate connection pools per tenant
- Optimized indexes for tenant queries
- Connection pooling and reuse

### Caching Strategy

- Tenant-specific caching
- Branding configuration caching
- Feature access caching

### Scalability

- Horizontal scaling per tenant
- Load balancing support
- Resource isolation

## Monitoring and Observability

### Health Checks

- Tenant-specific health checks
- Database connectivity monitoring
- Feature availability monitoring

### Metrics

- Per-tenant usage metrics
- Performance metrics per tenant
- Error rates per tenant

### Logging

- Tenant context in all logs
- Structured logging for analysis
- Audit trail per tenant

## Future Enhancements

### Planned Features

1. **Dynamic Tenant Creation**: API for creating new tenants
2. **Tenant Management UI**: Web interface for tenant management
3. **Advanced Branding**: More customization options
4. **Tenant Analytics**: Usage analytics per tenant
5. **Multi-Region Support**: Geographic distribution

### Technical Improvements

1. **Database Sharding**: For very large tenants
2. **Caching Layer**: Redis-based caching
3. **Message Queues**: Async processing per tenant
4. **API Gateway**: Advanced routing and rate limiting

## Troubleshooting

### Common Issues

1. **Tenant Not Found**: Check tenant configuration
2. **Database Connection Issues**: Verify database URLs
3. **Feature Access Denied**: Check tenant feature configuration
4. **Performance Issues**: Monitor connection pools

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=DEBUG MULTI_TENANT_ENABLED=true python -m uvicorn app.main:app
```

## Support and Maintenance

### Regular Maintenance

1. **Database Backups**: Per-tenant backups
2. **Configuration Updates**: Tenant configuration management
3. **Performance Monitoring**: Regular performance checks
4. **Security Updates**: Regular security audits

### Support Procedures

1. **Tenant Issues**: Isolate and resolve per tenant
2. **System Issues**: Check all tenants
3. **Performance Issues**: Monitor resource usage
4. **Security Issues**: Immediate isolation and investigation

## Conclusion

The multi-tenant architecture provides a robust, scalable solution for serving multiple clients while maintaining complete data isolation and domain-specific functionality. The implementation is backward compatible and can be gradually adopted without disrupting existing deployments.
