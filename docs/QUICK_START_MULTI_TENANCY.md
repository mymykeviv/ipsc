# 🚀 Quick Start: Multi-Tenancy Setup

**IPSC (Invoice & Purchase System for Cashflow) - Multi-Tenancy Quick Start Guide**

**Version:** 1.4.4  
**Time to Complete:** 10-15 minutes

---

## 📋 **Prerequisites**

- ✅ IPSC application running (see deployment guide)
- ✅ Admin access to create tenants
- ✅ Organization details ready

---

## ⚡ **Quick Setup (5 Steps)**

### **Step 1: Enable Multi-Tenancy**

Add these environment variables to your `backend/env.example`:

```bash
# Multi-Tenancy Settings
MULTI_TENANT_ENABLED=true
TENANT_DATABASE_PREFIX=tenant_
DEFAULT_TENANT_SLUG=default
MAX_TENANTS_PER_INSTANCE=100
```

### **Step 2: Restart Services**

```bash
cd deployment/docker
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### **Step 3: Verify Multi-Tenancy is Enabled**

```bash
curl http://localhost:8000/health
```

Look for `"multi_tenant_enabled": true` in the response.

### **Step 4: Create Your First Tenant**

**For Dental Clinics:**
```bash
curl -X POST "http://localhost:8000/api/tenants" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Dental Clinic",
    "slug": "your-dental",
    "organization_type": "dental_clinic",
    "contact_person": "Dr. Your Name",
    "contact_email": "dr@yourdental.com",
    "contact_phone": "+91-9876543210",
    "gstin": "27AABFS1234A1Z5",
    "industry": "Healthcare",
    "size": "small"
  }'
```

**For Manufacturing:**
```bash
curl -X POST "http://localhost:8000/api/tenants" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Manufacturing Co.",
    "slug": "your-mfg",
    "organization_type": "manufacturing",
    "contact_person": "Your Name",
    "contact_email": "contact@yourmfg.com",
    "contact_phone": "+91-9876543211",
    "gstin": "29AABPM5678B2Z9",
    "industry": "Manufacturing",
    "size": "medium"
  }'
```

### **Step 5: Access Your Tenant**

**Method 1: Subdomain (Recommended)**
- Dental Clinic: `http://your-dental.localhost:5173`
- Manufacturing: `http://your-mfg.localhost:5173`

**Method 2: Header-Based**
```bash
curl -H "X-Tenant-ID: your-dental" \
  "http://localhost:8000/api/products"
```

---

## 🎯 **Domain-Specific Features**

### **Dental Clinic Features**
- 🦷 Patient Management
- 📅 Appointment Scheduling
- 💊 Treatment Tracking
- 🏥 Dental Supplies Inventory

### **Manufacturing Features**
- 🏭 Bill of Materials (BOM) Management
- 📋 Production Orders
- ⚙️ Work Center Management
- ✅ Quality Control

### **General Business Features**
- 📄 Standard Invoicing
- 📦 Inventory Management
- 👥 Customer Management
- 📊 Financial Reporting

---

## 🔧 **Quick Commands**

### **List All Tenants**
```bash
curl "http://localhost:8000/api/tenants"
```

### **Get Tenant Details**
```bash
curl "http://localhost:8000/api/tenants/your-dental"
```

### **Update Tenant Branding**
```bash
curl -X PUT "http://localhost:8000/api/tenants/your-dental/branding" \
  -H "Content-Type: application/json" \
  -d '{
    "primary_color": "#2E86AB",
    "secondary_color": "#A23B72",
    "company_name": "Your Dental Clinic"
  }'
```

### **Add User to Tenant**
```bash
curl -X POST "http://localhost:8000/api/tenants/your-dental/users" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "role": "admin"
  }'
```

---

## 🔒 **Data Isolation Verification**

Test that your data is isolated:

```bash
# Create products for different tenants
curl -H "X-Tenant-ID: your-dental" \
  -X POST "http://localhost:8000/api/products" \
  -H "Content-Type: application/json" \
  -d '{"name": "Dental Product", "price": 100}'

curl -H "X-Tenant-ID: your-mfg" \
  -X POST "http://localhost:8000/api/products" \
  -H "Content-Type: application/json" \
  -d '{"name": "Manufacturing Product", "price": 200}'

# Verify isolation - each tenant sees only their products
curl -H "X-Tenant-ID: your-dental" "http://localhost:8000/api/products"
curl -H "X-Tenant-ID: your-mfg" "http://localhost:8000/api/products"
```

---

## 🎨 **Quick Branding Setup**

### **Set Custom Colors**
```bash
curl -X PUT "http://localhost:8000/api/tenants/your-dental/branding" \
  -H "Content-Type: application/json" \
  -d '{
    "primary_color": "#2E86AB",
    "secondary_color": "#A23B72",
    "accent_color": "#F18F01",
    "company_name": "Your Dental Clinic"
  }'
```

### **Get Branding Status**
```bash
curl "http://localhost:8000/api/tenants/your-dental/branding"
```

---

## 📊 **Monitoring Your Tenant**

### **Check Tenant Usage**
```bash
curl "http://localhost:8000/api/tenants/your-dental/usage"
```

### **Get Performance Metrics**
```bash
curl "http://localhost:8000/api/tenants/your-dental/performance"
```

### **Monitor System Health**
```bash
curl "http://localhost:8000/api/health"
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

**1. Tenant Not Found**
```bash
# Check if tenant exists
curl "http://localhost:8000/api/tenants"
```

**2. Multi-Tenancy Not Enabled**
```bash
# Check multi-tenancy status
curl "http://localhost:8000/api/health"
```

**3. Data Not Isolated**
```bash
# Verify tenant headers
curl -H "X-Tenant-ID: your-dental" \
  "http://localhost:8000/api/products"
```

---

## 📚 **Next Steps**

1. **Read the Full Guide**: Check `docs/MULTI_TENANCY_USER_GUIDE.md` for detailed instructions
2. **Explore Domain Features**: Try dental or manufacturing specific features
3. **Customize Branding**: Set up your organization's colors and branding
4. **Add Users**: Invite team members to your tenant
5. **Monitor Usage**: Track your tenant's performance and usage

---

## 📞 **Support**

- **Documentation**: `/docs` directory
- **API Reference**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`
- **Full Guide**: `docs/MULTI_TENANCY_USER_GUIDE.md`

---

## ✅ **Success Checklist**

- [ ] Multi-tenancy enabled
- [ ] First tenant created
- [ ] Tenant accessible via subdomain or headers
- [ ] Data isolation verified
- [ ] Branding customized
- [ ] Users added to tenant
- [ ] Domain-specific features tested

**🎉 Congratulations! Your multi-tenant IPSC system is ready to use!**
