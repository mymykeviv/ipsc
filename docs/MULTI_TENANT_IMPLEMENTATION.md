# Multi-Tenant Architecture Implementation

## Overview

This document outlines the comprehensive multi-tenant architecture implementation for the ProfitPath application, addressing Issue #73 - Multi-Tenant Database Architecture.

## 🏗️ Architecture Components

### 1. Database Models

#### Core Tenant Models
- **`Tenant`**: Main tenant organization model
- **`TenantUser`**: User-tenant relationship model
- **`TenantSettings`**: Tenant-specific configuration settings
- **`TenantBranding`**: Tenant branding and customization
- **`TenantDomain`**: Custom domain management

#### Updated Existing Models
All existing models have been updated to include `tenant_id` field:
- `User`, `CompanySettings`, `Party`, `Product`, `StockLedgerEntry`
- `Invoice`, `InvoiceItem`, `Payment`, `Purchase`, `PurchaseItem`
- `PurchasePayment`, `Expense`, `AuditTrail`, `RecurringInvoiceTemplate`
- `RecurringInvoiceTemplateItem`, `RecurringInvoice`, `PurchaseOrder`
- `PurchaseOrderItem`, `InvoiceTemplate`

### 2. Tenant Management Service

**File**: `backend/app/tenant_service.py`

#### Key Features:
- **Tenant Creation**: Complete tenant setup with default settings
- **Tenant Management**: CRUD operations for tenants
- **User Management**: Add/remove users from tenants
- **Settings Management**: Tenant-specific configuration
- **Branding Management**: Custom branding and themes
- **Usage Limits**: Monitor tenant usage against limits

#### Core Methods:
```python
# Tenant Management
create_tenant(db, name, slug, organization_type, ...)
get_tenant_by_slug(db, slug)
update_tenant(db, tenant_id, updates)
delete_tenant(db, tenant_id)

# User Management
add_user_to_tenant(db, tenant_id, user_id, role)
remove_user_from_tenant(db, tenant_id, user_id)
get_tenant_users(db, tenant_id)

# Settings Management
update_tenant_setting(db, tenant_id, category, key, value)
get_tenant_setting(db, tenant_id, category, key)
get_tenant_settings(db, tenant_id, category)

# Branding Management
update_tenant_branding(db, tenant_id, branding_updates)
get_tenant_branding(db, tenant_id)

# Usage Monitoring
check_tenant_limits(db, tenant_id)
```

### 3. Tenant Routing Middleware

**File**: `backend/app/middleware/tenant_routing.py`

#### Components:
- **`TenantRoutingMiddleware`**: Extracts tenant ID and sets context
- **`TenantDataIsolationMiddleware`**: Ensures data isolation
- **`TenantFeatureAccessMiddleware`**: Controls feature access

#### Tenant ID Extraction Methods:
1. **Subdomain**: `tenant.example.com`
2. **Header**: `X-Tenant-ID` or `X-Tenant-Slug`
3. **Query Parameter**: `?tenant_id=tenant-slug`
4. **Path Parameter**: `/api/tenant-slug/...`

#### Dependency Functions:
```python
get_current_tenant(request) -> Tenant
get_current_tenant_id(request) -> int
require_tenant_feature(feature: str) -> dependency
```

### 4. Tenant Management API

**File**: `backend/app/routers/tenant_management.py`

#### Endpoints:
```
POST   /api/tenants/create              # Create new tenant
GET    /api/tenants/validate-slug/{slug} # Validate tenant slug
GET    /api/tenants/list                # List all tenants
GET    /api/tenants/{tenant_id}         # Get tenant details
PUT    /api/tenants/{tenant_id}         # Update tenant
DELETE /api/tenants/{tenant_id}         # Delete tenant

POST   /api/tenants/{tenant_id}/users   # Add user to tenant
DELETE /api/tenants/{tenant_id}/users/{user_id} # Remove user
GET    /api/tenants/{tenant_id}/users   # List tenant users

GET    /api/tenants/{tenant_id}/settings # Get tenant settings
PUT    /api/tenants/{tenant_id}/settings/{category}/{key} # Update setting

GET    /api/tenants/{tenant_id}/branding # Get tenant branding
PUT    /api/tenants/{tenant_id}/branding # Update tenant branding

GET    /api/tenants/{tenant_id}/limits  # Get usage limits

GET    /api/tenants/current             # Get current tenant
GET    /api/tenants/current/limits      # Get current tenant limits
```

## 🔧 Implementation Details

### Database Migration

**File**: `backend/migrations/versions/002_add_multi_tenant_support.py`

#### Changes:
1. **Create Tenant Tables**:
   - `tenants` - Main tenant information
   - `tenant_users` - User-tenant relationships
   - `tenant_settings` - Tenant configuration
   - `tenant_branding` - Branding and customization

2. **Add Tenant ID to Existing Tables**:
   - Add `tenant_id` column to all existing tables
   - Create foreign key constraints
   - Create indexes for performance

3. **Data Isolation**:
   - All queries must include tenant_id filter
   - Automatic tenant context injection

### Tenant Creation Process

1. **Validate Input**: Check slug format and uniqueness
2. **Create Tenant**: Insert tenant record
3. **Setup Branding**: Create default branding configuration
4. **Setup Settings**: Create organization-specific settings
5. **Setup Company**: Create default company settings

### Default Settings by Organization Type

#### Dental Clinic Settings:
```python
dental_settings = [
    ("dental", "patient_management_enabled", "true"),
    ("dental", "appointment_scheduling", "true"),
    ("dental", "treatment_tracking", "true"),
]
```

#### Manufacturing Settings:
```python
manufacturing_settings = [
    ("manufacturing", "bom_management", "true"),
    ("manufacturing", "production_tracking", "true"),
    ("manufacturing", "material_management", "true"),
]
```

### Usage Limits and Quotas

#### Default Limits:
- **Users**: 5 users per tenant
- **Products**: 1,000 products per tenant
- **Transactions**: 10,000 transactions per month
- **Storage**: 10GB storage limit

#### Monitoring:
```python
limits = {
    'users': {
        'current': user_count,
        'limit': tenant.max_users,
        'usage_percent': (user_count / tenant.max_users) * 100
    },
    'products': {
        'current': product_count,
        'limit': tenant.max_products,
        'usage_percent': (product_count / tenant.max_products) * 100
    },
    'transactions': {
        'current': total_transactions,
        'limit': tenant.max_transactions_per_month,
        'usage_percent': (total_transactions / tenant.max_transactions_per_month) * 100
    }
}
```

## 🚀 Usage Examples

### Creating a New Tenant

```python
# Using the tenant service
tenant = tenant_service.create_tenant(
    db=db,
    name="ABC Dental Clinic",
    slug="abc-dental",
    organization_type="dental_clinic",
    contact_person="Dr. Priya Sharma",
    contact_email="info@abcdental.com",
    contact_phone="+91-9876543210",
    gstin="GST123456789"
)
```

### Adding User to Tenant

```python
# Add user with specific role
tenant_user = tenant_service.add_user_to_tenant(
    db=db,
    tenant_id=tenant.id,
    user_id=user.id,
    role="admin",
    is_primary_contact=True
)
```

### Updating Tenant Settings

```python
# Update GST setting
tenant_service.update_tenant_setting(
    db=db,
    tenant_id=tenant.id,
    category="gst",
    key="gst_enabled",
    value="true"
)
```

### Using Tenant Context in API Routes

```python
@router.get("/products")
def get_products(
    tenant_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    # Automatically filtered by tenant_id
    products = db.query(Product).filter(Product.tenant_id == tenant_id).all()
    return products
```

## 🔒 Security and Data Isolation

### Data Isolation Strategies

1. **Row-Level Security**: All queries include tenant_id filter
2. **Middleware Enforcement**: Automatic tenant context injection
3. **API Validation**: All endpoints validate tenant access
4. **Audit Trail**: All actions logged with tenant context

### Security Features

1. **Tenant Validation**: Verify tenant exists and is active
2. **Trial Management**: Handle trial expiration
3. **Feature Access Control**: Role-based feature access
4. **Usage Monitoring**: Prevent quota violations

## 📊 Performance Considerations

### Database Optimization

1. **Indexes**: Created on all tenant_id columns
2. **Partitioning**: Future consideration for large datasets
3. **Caching**: Tenant-specific caching strategies
4. **Query Optimization**: Efficient tenant-aware queries

### Scalability Features

1. **Horizontal Scaling**: Support for multiple database instances
2. **Load Balancing**: Tenant-aware load balancing
3. **Resource Limits**: Prevent resource abuse
4. **Monitoring**: Comprehensive usage tracking

## 🧪 Testing Strategy

### Unit Tests

1. **Tenant Service Tests**: Test all service methods
2. **Middleware Tests**: Test tenant routing and isolation
3. **API Tests**: Test all tenant management endpoints
4. **Integration Tests**: Test complete tenant workflows

### Test Data

```python
# Sample test tenant
test_tenant = {
    "name": "Test Dental Clinic",
    "slug": "test-dental",
    "organization_type": "dental_clinic",
    "contact_email": "test@example.com"
}

# Sample test user
test_user = {
    "username": "testuser",
    "password": "testpass123",
    "role": "admin"
}
```

## 🔄 Migration Strategy

### Existing Data Migration

1. **Create Default Tenant**: Create a default tenant for existing data
2. **Update Records**: Set tenant_id for all existing records
3. **Validate Data**: Ensure data integrity after migration
4. **Test Functionality**: Verify all features work with multi-tenancy

### Migration Script

```python
def migrate_existing_data(db: Session):
    # Create default tenant
    default_tenant = tenant_service.create_tenant(
        db=db,
        name="Default Organization",
        slug="default",
        organization_type="business"
    )
    
    # Update all existing records
    db.query(User).update({User.tenant_id: default_tenant.id})
    db.query(Product).update({Product.tenant_id: default_tenant.id})
    # ... update all other tables
    
    db.commit()
```

## 📈 Monitoring and Analytics

### Tenant Metrics

1. **Usage Tracking**: Monitor resource usage per tenant
2. **Performance Metrics**: Track response times per tenant
3. **Error Monitoring**: Monitor errors per tenant
4. **Business Metrics**: Track business KPIs per tenant

### Dashboard Features

1. **Tenant Overview**: Summary of all tenants
2. **Usage Analytics**: Detailed usage reports
3. **Performance Monitoring**: Real-time performance metrics
4. **Billing Integration**: Usage-based billing support

## 🎯 Next Steps

### Phase 1 Completion Checklist

- [x] **Database Models**: All tenant models created
- [x] **Migration Script**: Database migration ready
- [x] **Tenant Service**: Complete service implementation
- [x] **Middleware**: Tenant routing and isolation
- [x] **API Endpoints**: Tenant management API
- [ ] **Database Migration**: Run migration on production
- [ ] **Testing**: Comprehensive test suite
- [ ] **Documentation**: User and developer documentation

### Phase 2 Integration

1. **Update Existing APIs**: Modify all existing endpoints for tenant context
2. **Frontend Integration**: Update frontend for multi-tenancy
3. **Authentication**: Integrate tenant-aware authentication
4. **Branding**: Implement tenant-specific branding

### Phase 3 Advanced Features

1. **Custom Domains**: Support for custom tenant domains
2. **Advanced Analytics**: Tenant-specific analytics
3. **API Rate Limiting**: Tenant-aware rate limiting
4. **Backup and Recovery**: Tenant-specific backup strategies

## 📚 References

- **Issue #73**: Multi-Tenant Database Architecture
- **Issue #74**: Tenant Routing Middleware
- **Issue #75**: Database Performance Optimization
- **Issue #76**: Comprehensive Security Measures

## 🔗 Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Security Guidelines](./SECURITY.md)
- [Performance Guidelines](./PERFORMANCE.md)
