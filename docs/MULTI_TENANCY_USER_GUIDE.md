# 🏢 Multi-Tenancy User Guide

## **IPSC (Invoice & Purchase System for Cashflow) - Multi-Tenancy Setup & Usage**

**Version:** 1.4.4  
**Date:** 2025-08-23  
**Status:** ✅ **FULLY IMPLEMENTED**

---

## 📋 **Table of Contents**

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Creating Your First Tenant](#creating-your-first-tenant)
4. [Managing Tenants](#managing-tenants)
5. [Domain-Specific Features](#domain-specific-features)
6. [Data Isolation](#data-isolation)
7. [Branding and Customization](#branding-and-customization)
8. [User Management](#user-management)
9. [API Usage](#api-usage)
10. [Troubleshooting](#troubleshooting)

---

## 📖 **Overview**

The IPSC (Invoice & Purchase System for Cashflow) now supports **multi-tenancy**, allowing multiple organizations to use the same application instance while maintaining complete data isolation. Each tenant (organization) gets their own:

- **Isolated Data**: Complete separation of invoices, products, customers, and transactions
- **Custom Branding**: Organization-specific colors, logos, and company information
- **Domain-Specific Features**: Tailored functionality based on business type
- **User Management**: Organization-specific user accounts and permissions
- **Performance Optimization**: Dedicated database connections and caching

### **Supported Organization Types**

1. **Dental Clinics** 🦷
   - Patient management
   - Appointment scheduling
   - Treatment tracking
   - Dental supplies inventory

2. **Manufacturing Companies** 🏭
   - Bill of Materials (BOM) management
   - Production orders
   - Work center management
   - Quality control

3. **General Businesses** 💼
   - Standard invoicing and inventory
   - Customer management
   - Financial reporting
   - GST compliance

---

## 🚀 **Getting Started**

### **Prerequisites**

- IPSC application running (see deployment guide)
- Admin access to create tenants
- Organization details ready

### **Enable Multi-Tenancy**

**Step 1: Update Environment Configuration**

Add these lines to your `backend/env.example` file:

```bash
# Multi-Tenancy Settings
MULTI_TENANT_ENABLED=true
TENANT_DATABASE_PREFIX=tenant_
DEFAULT_TENANT_SLUG=default
MAX_TENANTS_PER_INSTANCE=100
```

**Step 2: Update Docker Compose Environment**

Add the multi-tenancy environment variables to your `deployment/docker/docker-compose.dev.yml`:

```yaml
backend:
  environment:
    # ... existing environment variables ...
    MULTI_TENANT_ENABLED: "true"
    TENANT_DATABASE_PREFIX: "tenant_"
    DEFAULT_TENANT_SLUG: "default"
    MAX_TENANTS_PER_INSTANCE: "100"
```

**Step 3: Restart Services**

```bash
cd deployment/docker
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

**Step 4: Verify Multi-Tenancy is Enabled**

```bash
curl http://localhost:8000/health
```

Look for `"multi_tenant_enabled": true` in the response.

---

## 🏗️ **Creating Your First Tenant**

### **Method 1: Using the API (Recommended)**

**For Dental Clinics:**

```bash
curl -X POST "http://localhost:8000/api/tenants" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smile Dental Clinic",
    "slug": "smile-dental",
    "organization_type": "dental_clinic",
    "contact_person": "Dr. Sarah Johnson",
    "contact_email": "dr.sarah@smiledental.com",
    "contact_phone": "+91-9876543210",
    "gstin": "27AABFS1234A1Z5",
    "industry": "Healthcare",
    "size": "small",
    "address_line1": "123 Dental Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }'
```

**For Manufacturing Companies:**

```bash
curl -X POST "http://localhost:8000/api/tenants" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Precision Manufacturing Co.",
    "slug": "precision-mfg",
    "organization_type": "manufacturing",
    "contact_person": "Rajesh Kumar",
    "contact_email": "rajesh@precisionmfg.com",
    "contact_phone": "+91-9876543211",
    "gstin": "29AABPM5678B2Z9",
    "industry": "Manufacturing",
    "size": "medium",
    "address_line1": "456 Industrial Park",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001"
  }'
```

**For General Businesses:**

```bash
curl -X POST "http://localhost:8000/api/tenants" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC Trading Company",
    "slug": "abc-trading",
    "organization_type": "business",
    "contact_person": "Amit Patel",
    "contact_email": "amit@abctrading.com",
    "contact_phone": "+91-9876543212",
    "gstin": "24AABAT9876C3Z1",
    "industry": "Trading",
    "size": "small",
    "address_line1": "789 Business Avenue",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001"
  }'
```

### **Method 2: Using the Frontend (When Available)**

Navigate to `http://localhost:5173/tenant-setup` to use the web interface.

---

## 🔧 **Managing Tenants**

### **List All Tenants**

```bash
curl "http://localhost:8000/api/tenants"
```

### **Get Tenant Details**

```bash
curl "http://localhost:8000/api/tenants/smile-dental"
```

### **Update Tenant Configuration**

```bash
curl -X PUT "http://localhost:8000/api/tenants/smile-dental" \
  -H "Content-Type: application/json" \
  -d '{
    "contact_person": "Dr. Sarah Johnson (Updated)",
    "subscription_plan": "premium",
    "max_users": 10
  }'
```

### **Get Tenant Branding**

```bash
curl "http://localhost:8000/api/tenants/smile-dental/branding"
```

---

## 🎯 **Domain-Specific Features**

### **Dental Clinic Features**

For dental clinics, you get access to:

**Patient Management:**
```bash
# Create a patient
curl -X POST "http://localhost:8000/api/tenants/smile-dental/patients" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+91-9876543212",
    "email": "john.doe@email.com",
    "date_of_birth": "1990-01-01"
  }'

# List patients
curl "http://localhost:8000/api/tenants/smile-dental/patients"
```

**Appointment Scheduling:**
```bash
# Create an appointment
curl -X POST "http://localhost:8000/api/tenants/smile-dental/appointments" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "appointment_date": "2024-01-15T10:00:00",
    "treatment_type": "Regular Checkup",
    "notes": "Annual dental checkup"
  }'

# List appointments
curl "http://localhost:8000/api/tenants/smile-dental/appointments"
```

**Treatment Tracking:**
```bash
# Create a treatment record
curl -X POST "http://localhost:8000/api/tenants/smile-dental/treatments" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "treatment_date": "2024-01-15T10:00:00",
    "treatment_type": "Root Canal",
    "cost": 5000,
    "notes": "Completed root canal treatment"
  }'
```

### **Manufacturing Features**

For manufacturing companies, you get access to:

**Bill of Materials (BOM) Management:**
```bash
# Create a BOM
curl -X POST "http://localhost:8000/api/tenants/precision-mfg/boms" \
  -H "Content-Type: application/json" \
  -d '{
    "bom_id": "BOM-001",
    "product_id": 1,
    "description": "Main Assembly BOM",
    "version": "1.0"
  }'

# List BOMs
curl "http://localhost:8000/api/tenants/precision-mfg/boms"
```

**Production Orders:**
```bash
# Create a production order
curl -X POST "http://localhost:8000/api/tenants/precision-mfg/production-orders" \
  -H "Content-Type: application/json" \
  -d '{
    "order_number": "PO-001",
    "bom_id": 1,
    "quantity": 100,
    "start_date": "2024-01-15",
    "due_date": "2024-01-20"
  }'

# List production orders
curl "http://localhost:8000/api/tenants/precision-mfg/production-orders"
```

**Work Center Management:**
```bash
# Create a work center
curl -X POST "http://localhost:8000/api/tenants/precision-mfg/work-centers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Assembly Line 1",
    "description": "Main assembly line",
    "capacity": 100,
    "efficiency": 0.95
  }'
```

---

## 🔒 **Data Isolation**

### **Verify Data Isolation**

Each tenant's data is completely isolated. Test this by:

```bash
# Products for dental clinic
curl -H "X-Tenant-ID: smile-dental" \
  "http://localhost:8000/api/products"

# Products for manufacturing company
curl -H "X-Tenant-ID: precision-mfg" \
  "http://localhost:8000/api/products"
```

Each tenant will see only their own data.

### **Access Methods**

**1. Subdomain Routing (Recommended):**
- `http://smile-dental.localhost:5173` - Dental Clinic
- `http://precision-mfg.localhost:5173` - Manufacturing Company

**2. Header-Based Routing:**
```bash
curl -H "X-Tenant-ID: smile-dental" \
  "http://localhost:8000/api/products"
```

**3. URL Path Routing:**
```bash
curl "http://localhost:8000/api/tenants/smile-dental/products"
```

---

## 🎨 **Branding and Customization**

### **Update Tenant Branding**

```bash
curl -X PUT "http://localhost:8000/api/tenants/smile-dental/branding" \
  -H "Content-Type: application/json" \
  -d '{
    "primary_color": "#2E86AB",
    "secondary_color": "#A23B72",
    "accent_color": "#F18F01",
    "logo_url": "https://example.com/logo.png",
    "company_name": "Smile Dental Clinic"
  }'
```

### **Get Available Templates**

```bash
curl "http://localhost:8000/api/branding/templates"
```

### **Branding Status**

```bash
curl "http://localhost:8000/api/branding/status"
```

---

## 👥 **User Management**

### **Add User to Tenant**

```bash
curl -X POST "http://localhost:8000/api/tenants/smile-dental/users" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "role": "admin"
  }'
```

### **List Tenant Users**

```bash
curl "http://localhost:8000/api/tenants/smile-dental/users"
```

### **Update User Role**

```bash
curl -X PUT "http://localhost:8000/api/tenants/smile-dental/users/1" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "manager"
  }'
```

### **Remove User from Tenant**

```bash
curl -X DELETE "http://localhost:8000/api/tenants/smile-dental/users/1"
```

---

## 🔌 **API Usage**

### **Authentication**

All API calls require authentication. Include your access token:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "http://localhost:8000/api/tenants/smile-dental/products"
```

### **Common API Endpoints**

**Tenant Management:**
- `GET /api/tenants` - List all tenants
- `POST /api/tenants` - Create new tenant
- `GET /api/tenants/{slug}` - Get tenant details
- `PUT /api/tenants/{slug}` - Update tenant
- `DELETE /api/tenants/{slug}` - Delete tenant

**Tenant-Specific Data:**
- `GET /api/tenants/{slug}/products` - Get tenant products
- `GET /api/tenants/{slug}/invoices` - Get tenant invoices
- `GET /api/tenants/{slug}/customers` - Get tenant customers

**Domain-Specific Endpoints:**
- `GET /api/tenants/{slug}/patients` - Get dental patients
- `GET /api/tenants/{slug}/appointments` - Get dental appointments
- `GET /api/tenants/{slug}/boms` - Get manufacturing BOMs
- `GET /api/tenants/{slug}/production-orders` - Get production orders

### **Response Format**

All API responses follow this format:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

**1. Tenant Not Found**
```bash
# Check if tenant exists
curl "http://localhost:8000/api/tenants"

# Verify tenant slug
curl "http://localhost:8000/api/tenants/smile-dental"
```

**2. Data Not Isolated**
```bash
# Check multi-tenancy status
curl "http://localhost:8000/api/health"

# Verify tenant headers
curl -H "X-Tenant-ID: smile-dental" \
  "http://localhost:8000/api/products"
```

**3. API Errors**
```bash
# Check authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/tenants/smile-dental"

# Check permissions
curl "http://localhost:8000/api/tenants/smile-dental/users"
```

### **Debug Commands**

**Check Multi-Tenancy Status:**
```bash
curl "http://localhost:8000/api/health"
```

**Verify Tenant Creation:**
```bash
curl "http://localhost:8000/api/tenants"
```

**Check Tenant Database:**
```bash
curl "http://localhost:8000/api/tenants/smile-dental/config"
```

**Monitor Tenant Usage:**
```bash
curl "http://localhost:8000/api/tenants/smile-dental/usage"
```

### **Performance Monitoring**

**Get Tenant Performance Metrics:**
```bash
curl "http://localhost:8000/api/tenants/smile-dental/performance"
```

**Check Database Performance:**
```bash
curl "http://localhost:8000/api/database/performance/smile-dental"
```

**Get Slow Queries:**
```bash
curl "http://localhost:8000/api/database/slow-queries/smile-dental"
```

---

## 📊 **Monitoring and Analytics**

### **Tenant Usage Statistics**

```bash
# Get tenant usage
curl "http://localhost:8000/api/tenants/smile-dental/usage"

# Get tenant performance
curl "http://localhost:8000/api/tenants/smile-dental/performance"

# Get tenant security metrics
curl "http://localhost:8000/api/security/metrics/smile-dental"
```

### **System Health**

```bash
# Overall system health
curl "http://localhost:8000/api/health"

# Detailed health check
curl "http://localhost:8000/api/health/detailed"

# System metrics
curl "http://localhost:8000/api/system/status"
```

---

## 🚀 **Advanced Configuration**

### **Feature Toggles**

```bash
curl -X PUT "http://localhost:8000/api/tenants/smile-dental/features" \
  -H "Content-Type: application/json" \
  -d '{
    "dental_management": true,
    "inventory_management": true,
    "advanced_reporting": false,
    "api_access": true
  }'
```

### **Subscription Management**

```bash
curl -X PUT "http://localhost:8000/api/tenants/smile-dental/subscription" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "premium",
    "max_users": 10,
    "max_products": 1000,
    "max_transactions_per_month": 10000
  }'
```

---

## 📞 **Support**

For additional support:

1. **Documentation**: Check the main documentation at `/docs`
2. **API Reference**: Available at `http://localhost:8000/docs`
3. **Health Check**: Monitor system status at `http://localhost:8000/health`
4. **Logs**: Check application logs for detailed error information

---

## ✅ **Conclusion**

The multi-tenancy feature provides complete data isolation and organization-specific functionality while maintaining the core IPSC features. Each tenant gets their own:

- ✅ **Isolated Data Environment**
- ✅ **Custom Branding**
- ✅ **Domain-Specific Features**
- ✅ **User Management**
- ✅ **Performance Optimization**
- ✅ **Security Isolation**

This enables multiple organizations to use the same IPSC instance efficiently and securely.
