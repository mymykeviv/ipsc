# Epic 3: Client Branding & Customization

## Overview

Epic 3 implements comprehensive client branding and customization features for the multi-tenant CashFlow application, enabling each tenant to have unique branding, custom styling, and branded document generation.

## Key Features Implemented

### 🎨 **Client Branding System**

#### **1. Tenant-Specific Branding**
- **Company Information**: Custom company names, addresses, contact details
- **Color Schemes**: Primary, secondary, and accent colors per tenant
- **Logo Management**: Upload and manage company logos and favicons
- **Font Customization**: Custom font families and sizes
- **Domain-Specific Defaults**: Pre-configured branding for dental and manufacturing domains

#### **2. Branded Document Generation**
- **PDF Invoice Generation**: Branded invoices with tenant-specific styling
- **PDF Report Generation**: Branded reports with company branding
- **QR Code Generation**: Tenant-branded QR codes for documents
- **Template Management**: Customizable document templates per tenant

#### **3. UI Customization**
- **Dynamic Styling**: Real-time UI updates based on tenant branding
- **Custom CSS**: Tenant-specific CSS for advanced customization
- **Header/Footer Customization**: Custom headers and footers for documents
- **Watermark Support**: Optional watermarks with custom text and positioning

## Implementation Details

### **Branding Manager** (`backend/app/branding_manager.py`)

The core branding management system that handles:

```python
class BrandingManager:
    """Comprehensive branding management for multi-tenant architecture"""
    
    async def get_tenant_branding(self, tenant_id: str) -> Dict[str, Any]:
        """Get complete branding configuration for a tenant"""
        
    async def generate_branded_invoice(self, tenant_id: str, invoice_data: Dict) -> bytes:
        """Generate branded invoice PDF"""
        
    async def generate_branded_report(self, tenant_id: str, report_data: Dict, report_type: str) -> bytes:
        """Generate branded report PDF"""
        
    async def generate_qr_code(self, tenant_id: str, data: str) -> str:
        """Generate QR code with tenant branding"""
        
    async def get_ui_branding(self, tenant_id: str) -> Dict[str, Any]:
        """Get UI branding configuration for frontend"""
```

### **Branding API Router** (`backend/app/branding.py`)

RESTful API endpoints for branding operations:

```python
@router.get("/{tenant_id}")
async def get_tenant_branding(tenant_id: str):
    """Get complete branding configuration for a tenant"""

@router.put("/{tenant_id}")
async def update_tenant_branding(tenant_id: str, branding_updates: Dict[str, Any]):
    """Update tenant branding configuration"""

@router.post("/{tenant_id}/invoice")
async def generate_branded_invoice(tenant_id: str, invoice_data: Dict[str, Any]):
    """Generate branded invoice PDF"""

@router.post("/{tenant_id}/report/{report_type}")
async def generate_branded_report(tenant_id: str, report_type: str, report_data: Dict[str, Any]):
    """Generate branded report PDF"""

@router.post("/{tenant_id}/qr-code")
async def generate_qr_code(tenant_id: str, data: str):
    """Generate QR code with tenant branding"""
```

## Database Schema Enhancements

### **Branding Tables**

#### **branding_assets**
```sql
CREATE TABLE branding_assets (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,  -- logo, favicon, watermark, etc.
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### **branding_templates**
```sql
CREATE TABLE branding_templates (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) NOT NULL,  -- invoice, report, email, etc.
    template_config JSONB NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### **branding_preferences**
```sql
CREATE TABLE branding_preferences (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL UNIQUE,
    primary_color VARCHAR(7),  -- Hex color code
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    font_family VARCHAR(100),
    font_size INTEGER,
    header_style VARCHAR(50),
    footer_text VARCHAR(500),
    custom_css TEXT,
    watermark_enabled BOOLEAN NOT NULL DEFAULT false,
    watermark_text VARCHAR(200),
    watermark_position VARCHAR(50),
    qr_code_enabled BOOLEAN NOT NULL DEFAULT true,
    qr_code_position VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### **branded_documents**
```sql
CREATE TABLE branded_documents (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    document_type VARCHAR(50) NOT NULL,  -- invoice, report, etc.
    document_id INTEGER NOT NULL,  -- Reference to original document
    branded_file_path VARCHAR(500) NOT NULL,
    branding_config_used JSONB,
    generated_by VARCHAR(50),
    file_size INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### **branding_analytics**
```sql
CREATE TABLE branding_analytics (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,  -- template_applied, document_generated, etc.
    event_data JSONB,
    user_id VARCHAR(50),
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### **Enhanced Existing Tables**

#### **company_settings**
```sql
ALTER TABLE company_settings ADD COLUMN logo_url VARCHAR(500);
ALTER TABLE company_settings ADD COLUMN favicon_url VARCHAR(500);
ALTER TABLE company_settings ADD COLUMN primary_color VARCHAR(7);
ALTER TABLE company_settings ADD COLUMN secondary_color VARCHAR(7);
ALTER TABLE company_settings ADD COLUMN accent_color VARCHAR(7);
ALTER TABLE company_settings ADD COLUMN custom_css TEXT;
```

#### **invoice_templates**
```sql
ALTER TABLE invoice_templates ADD COLUMN tenant_id VARCHAR(50);
ALTER TABLE invoice_templates ADD COLUMN branding_config JSONB;
ALTER TABLE invoice_templates ADD COLUMN custom_header TEXT;
ALTER TABLE invoice_templates ADD COLUMN custom_footer TEXT;
```

## API Endpoints

### **Branding Management Endpoints**

#### **GET /api/branding/{tenant_id}**
Get complete branding configuration for a tenant.

**Response:**
```json
{
    "company_name": "ABC Dental Clinic",
    "primary_color": "#2E86AB",
    "secondary_color": "#A23B72",
    "accent_color": "#F18F01",
    "logo_url": "https://example.com/logo.png",
    "font_family": "Helvetica",
    "font_size": 12,
    "header_style": "modern",
    "footer_text": "Thank you for your business",
    "custom_css": "body { font-family: Arial; }",
    "domain": "dental",
    "templates": {
        "invoice": {"name": "Default Invoice", "config": {}},
        "report": {"name": "Default Report", "config": {}}
    }
}
```

#### **PUT /api/branding/{tenant_id}**
Update tenant branding configuration.

**Request:**
```json
{
    "primary_color": "#FF0000",
    "company_name": "Updated Company Name",
    "custom_css": "body { background-color: #f0f0f0; }"
}
```

#### **POST /api/branding/{tenant_id}/invoice**
Generate branded invoice PDF.

**Request:**
```json
{
    "invoice_number": "INV-001",
    "customer_name": "John Doe",
    "total_amount": 100.00,
    "items": [
        {"name": "Item 1", "quantity": 1, "price": 100.00}
    ]
}
```

#### **POST /api/branding/{tenant_id}/report/{report_type}**
Generate branded report PDF.

**Request:**
```json
{
    "title": "Sales Report",
    "period": "Q1 2024",
    "data": [
        {"month": "Jan", "sales": 1000},
        {"month": "Feb", "sales": 1200}
    ]
}
```

#### **POST /api/branding/{tenant_id}/qr-code**
Generate QR code with tenant branding.

**Request:**
```json
{
    "data": "https://example.com/invoice/123"
}
```

### **System Status Endpoints**

#### **GET /api/branding/status**
Get branding system status.

**Response:**
```json
{
    "branding_enabled": true,
    "templates_available": true,
    "pdf_generation_enabled": true,
    "qr_code_generation_enabled": true,
    "timestamp": "2024-01-20T12:00:00Z"
}
```

#### **GET /api/branding/templates**
Get available branding templates.

**Response:**
```json
{
    "templates": {
        "dental": {
            "name": "Dental Clinic",
            "description": "Professional medical branding for dental clinics",
            "colors": {
                "primary": "#2E86AB",
                "secondary": "#A23B72",
                "accent": "#F18F01"
            }
        },
        "manufacturing": {
            "name": "Manufacturing",
            "description": "Industrial branding for manufacturing companies",
            "colors": {
                "primary": "#1B4332",
                "secondary": "#2D3748",
                "accent": "#E53E3E"
            }
        }
    },
    "timestamp": "2024-01-20T12:00:00Z"
}
```

## Configuration

### **Environment Variables**
```bash
# Branding Configuration
BRANDING_ENABLED=true
PDF_GENERATION_ENABLED=true
QR_CODE_GENERATION_ENABLED=true
BRANDING_CACHE_TTL=3600  # Cache TTL in seconds

# File Storage
BRANDING_ASSETS_PATH=/app/branding_assets
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_IMAGE_TYPES=image/png,image/jpeg,image/gif

# PDF Generation
PDF_TEMP_DIR=/tmp/pdf_generation
PDF_TIMEOUT=30  # seconds
```

### **Domain-Specific Branding Defaults**

#### **Dental Clinic Domain**
```json
{
    "primary_color": "#2E86AB",
    "secondary_color": "#A23B72",
    "accent_color": "#F18F01",
    "font_family": "Helvetica",
    "header_style": "medical",
    "footer_text": "Professional dental care for your family"
}
```

#### **Manufacturing Domain**
```json
{
    "primary_color": "#1B4332",
    "secondary_color": "#2D3748",
    "accent_color": "#E53E3E",
    "font_family": "Arial",
    "header_style": "industrial",
    "footer_text": "Quality manufacturing solutions"
}
```

## Testing

### **Running Tests**
```bash
# Run Epic 3 branding tests
pytest backend/tests/test_epic3_branding.py -v

# Run with coverage
pytest backend/tests/test_epic3_branding.py --cov=app.branding_manager --cov=app.branding -v

# Run specific test classes
pytest backend/tests/test_epic3_branding.py::TestBrandingManager -v
pytest backend/tests/test_epic3_branding.py::TestBrandingAPI -v
pytest backend/tests/test_epic3_branding.py::TestEpic3Integration -v
```

### **Test Coverage**
- **BrandingManager**: Unit tests for all branding operations
- **Branding API**: Endpoint testing with mocked dependencies
- **Integration Tests**: Full application integration testing
- **Error Handling**: Comprehensive error scenario testing
- **Performance Tests**: Caching and concurrent request testing

## Deployment

### **Database Migration**
```bash
# Run branding migration
alembic upgrade head

# Verify migration
alembic current
alembic history
```

### **File Storage Setup**
```bash
# Create branding assets directory
mkdir -p /app/branding_assets
chmod 755 /app/branding_assets

# Create PDF temp directory
mkdir -p /tmp/pdf_generation
chmod 755 /tmp/pdf_generation
```

### **Dependencies Installation**
```bash
# Install PDF generation dependencies
pip install reportlab pillow qrcode

# Install image processing dependencies
pip install Pillow
```

## Security Considerations

### **File Upload Security**
- **File Type Validation**: Only allowed image types (PNG, JPEG, GIF)
- **File Size Limits**: Maximum 10MB per file
- **Virus Scanning**: Optional virus scanning for uploaded files
- **Secure Storage**: Files stored outside web root

### **Access Control**
- **Tenant Isolation**: Branding data isolated per tenant
- **Authentication Required**: All branding endpoints require authentication
- **Authorization**: Users can only access their tenant's branding

### **Data Protection**
- **Input Validation**: All branding data validated before storage
- **XSS Prevention**: Custom CSS sanitized to prevent XSS attacks
- **SQL Injection Prevention**: Parameterized queries for all database operations

## Performance Benefits

### **Caching Strategy**
- **Branding Cache**: Tenant branding configurations cached in memory
- **Template Cache**: Document templates cached for faster generation
- **Asset Cache**: Frequently used assets cached for quick access

### **Optimization Features**
- **Async Operations**: All branding operations are asynchronous
- **Lazy Loading**: Branding assets loaded only when needed
- **Compression**: Generated PDFs compressed for faster transmission

### **Scalability**
- **Horizontal Scaling**: Branding system supports multiple instances
- **Database Optimization**: Proper indexing for branding queries
- **Resource Management**: Efficient memory and CPU usage

## Future Enhancements

### **Planned Features**
- **Advanced Templates**: Drag-and-drop template builder
- **Branding Analytics**: Usage analytics and insights
- **Bulk Operations**: Bulk branding updates across tenants
- **API Rate Limiting**: Rate limiting for branding endpoints

### **Technical Improvements**
- **CDN Integration**: Branding assets served via CDN
- **Image Optimization**: Automatic image optimization and resizing
- **Template Versioning**: Version control for branding templates
- **Real-time Updates**: WebSocket support for real-time branding updates

## Troubleshooting

### **Common Issues**

#### **PDF Generation Fails**
```bash
# Check PDF generation dependencies
pip list | grep reportlab

# Check temp directory permissions
ls -la /tmp/pdf_generation

# Check application logs
tail -f /var/log/app.log | grep branding
```

#### **Branding Cache Issues**
```bash
# Clear branding cache
curl -X POST http://localhost:8000/api/branding/clear-cache

# Check cache status
curl http://localhost:8000/api/branding/status
```

#### **File Upload Issues**
```bash
# Check file storage permissions
ls -la /app/branding_assets

# Check file size limits
grep MAX_FILE_SIZE .env

# Check allowed file types
grep ALLOWED_IMAGE_TYPES .env
```

### **Debug Mode**
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Enable branding debug mode
export BRANDING_DEBUG=true

# Restart application
docker-compose restart app
```

## Support and Maintenance

### **Regular Maintenance**
- **Cache Cleanup**: Regular cleanup of expired branding cache
- **File Cleanup**: Cleanup of orphaned branding assets
- **Database Maintenance**: Regular optimization of branding tables
- **Security Updates**: Regular updates of branding dependencies

### **Monitoring**
- **Branding Metrics**: Monitor branding API usage and performance
- **Error Tracking**: Track and alert on branding-related errors
- **Resource Usage**: Monitor memory and CPU usage for branding operations
- **User Feedback**: Collect and analyze user feedback on branding features

### **Documentation Updates**
- **API Documentation**: Keep API documentation updated
- **User Guides**: Maintain user guides for branding features
- **Developer Guides**: Update developer documentation
- **Migration Guides**: Document any breaking changes

## Conclusion

Epic 3 successfully implements a comprehensive client branding and customization system that provides:

- **Complete Branding Control**: Each tenant can fully customize their branding
- **Professional Document Generation**: High-quality branded PDFs and QR codes
- **Scalable Architecture**: Efficient caching and resource management
- **Security and Performance**: Secure file handling and optimized operations
- **Future-Ready Design**: Extensible architecture for future enhancements

The implementation maintains backward compatibility while providing powerful new branding capabilities that enhance the user experience and professional appearance of the application for each tenant.
