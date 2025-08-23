# GST Invoice Template Implementation

## Overview

This document describes the implementation of the new GST invoice template system that replaces the old customizable template system with 5 pre-defined templates based on the JSON schema provided.

## Changes Made

### Backend Changes

#### 1. New Model: `GSTInvoiceTemplate`
- **File**: `backend/app/models.py`
- **Purpose**: Replaces the old `InvoiceTemplate` model
- **Key Fields**:
  - `template_id`: Unique identifier (e.g., "GST_TABULAR_A4A5_V1")
  - `name`: Human-readable name
  - `description`: Template description
  - `requires_gst`: Boolean indicating if GST is required
  - `requires_hsn`: Boolean indicating if HSN/SAC codes are required
  - `title`: Invoice title (e.g., "Tax Invoice" or "Invoice")
  - `template_config`: JSON configuration string
  - `paper_sizes`: Comma-separated list of supported paper sizes
  - `sort_order`: Order for display
  - `is_default`: Boolean indicating if this is the default template

#### 2. Template Configurations
- **File**: `backend/app/template_configs.py`
- **Purpose**: Contains the 5 pre-defined templates as specified in the JSON schema
- **Templates**:
  1. **GST_TABULAR_A4A5_V1**: Standard GST tax invoice with detailed tabular format
  2. **GST_SIMPLE_A5A4_V1**: Compact GST invoice format, optimized for A5
  3. **GST_DETAILED_SECTION_A4_V1**: Comprehensive GST invoice with detailed tax breakdown
  4. **NONGST_SIMPLE_A5_V1**: Simple invoice format without GST requirements
  5. **NONGST_TABULAR_A4A5_V1**: Professional tabular invoice format without GST

#### 3. New API Endpoints
- **File**: `backend/app/routers.py`
- **Endpoints**:
  - `GET /api/gst-invoice-templates`: Get all GST templates
  - `GET /api/gst-invoice-templates/default`: Get default template
  - `GET /api/gst-invoice-templates/{id}`: Get specific template
  - `POST /api/gst-invoice-templates/{id}/set-default`: Set template as default
  - `GET /api/gst-invoice-templates/config/{template_id}`: Get template configuration

#### 4. Database Migration
- **File**: `backend/migrations/versions/999_replace_invoice_templates.py`
- **Purpose**: Drops old `invoice_templates` table and creates new `gst_invoice_templates` table

### Frontend Changes

#### 1. Updated API Types
- **File**: `frontend/src/lib/api.ts`
- **Changes**:
  - Replaced `InvoiceTemplate` with `GSTInvoiceTemplate`
  - Updated API functions to use new endpoints
  - Removed old template creation/update functions

#### 2. New GST Template Manager
- **File**: `frontend/src/components/GSTTemplateManager.tsx`
- **Purpose**: Displays the 5 pre-defined templates with options to set defaults
- **Features**:
  - Visual display of all templates with icons
  - GST/Non-GST badges
  - Default template indicator
  - Set default functionality
  - Template information display

#### 3. Updated PDF Viewer
- **File**: `frontend/src/components/PDFViewer.tsx`
- **Changes**:
  - Updated to use new GST template API
  - Enhanced template selection dropdown with GST indicators

#### 4. Updated Invoice Form
- **File**: `frontend/src/components/ComprehensiveInvoiceForm.tsx`
- **Changes**:
  - Updated to use new GST template API
  - Removed old template customization options

#### 5. Updated Invoices Page
- **File**: `frontend/src/pages/Invoices.tsx`
- **Changes**:
  - Added GST Template Manager button
  - Integrated GST template manager modal

## Template Features

### GST Templates (3 templates)
1. **GST Tabular (A4/A5)**
   - Standard GST tax invoice with detailed tabular format
   - Supports both A4 and A5 paper sizes
   - Includes all GST fields: CGST, SGST, IGST, HSN/SAC codes
   - Auto tax split based on supplier and place of supply

2. **GST Simple (A5/A4)**
   - Compact GST invoice format
   - Optimized for A5 with A4 fallback
   - Simplified layout while maintaining GST compliance
   - Ideal for quick invoices

3. **GST Detailed Section (A4)**
   - Comprehensive GST invoice with detailed tax breakdown section
   - A4 format only
   - Includes GST summary section with rate-wise breakdown
   - Enhanced declarations and compliance features

### Non-GST Templates (2 templates)
1. **Non-GST Simple (A5)**
   - Simple invoice format without GST requirements
   - Perfect for small businesses not registered under GST
   - Clean, minimal design

2. **Non-GST Tabular (A4/A5)**
   - Professional tabular invoice format without GST
   - Supports both A4 and A5 paper sizes
   - Suitable for businesses not requiring GST compliance

## User Flow

### Template Selection
1. User navigates to Invoices page
2. Clicks "Templates" button in header
3. GST Template Manager opens showing all 5 templates
4. User can view template details and set default
5. Template selection is available in PDF viewer

### PDF Generation
1. User views/downloads invoice PDF
2. PDF viewer shows template selection dropdown
3. User can choose from available templates
4. PDF is generated using selected template configuration

## Technical Implementation

### Template Configuration Structure
Each template configuration includes:
- **requires**: Template requirements (GST, HSN, title)
- **validation**: Validation rules (invoice number length, HSN digits)
- **tax_logic**: Tax calculation rules (CGST/SGST vs IGST)
- **layout**: PDF layout configuration with sections and fields

### PDF Generation System
The new system uses HTML-based PDF generation with the following components:

#### Design Tokens (`backend/app/pdf_design_tokens.py`)
- **Colors**: Consistent color palette for all templates
- **Typography**: Font families, sizes for A4/A5 paper sizes
- **Spacing**: Standardized spacing values in millimeters
- **Table Columns**: Template-specific column configurations

#### CSS Styling (`backend/app/pdf_css.py`)
- **Responsive Design**: A4 and A5 paper size adaptations
- **Component Styles**: Header, tables, totals, signatures
- **Print Optimization**: Page breaks, color adjustments
- **Grid Layout**: CSS Grid for modern layout structure

#### PDF Generator (`backend/app/pdf_generator.py`)
- **HTML Generation**: Creates semantic HTML for each template
- **Data Processing**: Formats invoice data for template rendering
- **Tax Calculations**: Handles GST calculations (CGST/SGST/IGST)
- **Template Selection**: Routes to appropriate template generator

#### HTML to PDF Converter (`backend/app/html_to_pdf.py`)
- **Multiple Backends**: WeasyPrint (primary) and pdfkit (fallback)
- **Font Support**: Unicode and Indian Rupee symbol support
- **Quality Output**: High-quality PDF generation
- **Error Handling**: Graceful fallbacks and error reporting

### Data Model Compatibility
The new system maintains compatibility with existing invoice data:
- Existing invoices continue to work
- PDF generation uses new template system
- No data migration required for existing invoices

### Database Schema
```sql
CREATE TABLE gst_invoice_templates (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    template_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    requires_gst BOOLEAN NOT NULL DEFAULT TRUE,
    requires_hsn BOOLEAN NOT NULL DEFAULT TRUE,
    title VARCHAR(50) NOT NULL DEFAULT 'Tax Invoice',
    template_config TEXT NOT NULL,
    paper_sizes VARCHAR(50) NOT NULL DEFAULT 'A4,A5',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Testing

### Test Coverage
- **File**: `tests/backend/test_gst_templates.py`
- **Tests**:
  - Getting all GST templates
  - Getting default template
  - Getting template configuration
  - Setting default template

- **File**: `tests/backend/test_pdf_generation.py`
- **Tests**:
  - PDF generator initialization
  - HTML generation for all template types
  - Address formatting
  - Discount calculations
  - Tax calculations
  - Design tokens functionality
  - CSS generation

### Manual Testing
1. Start the application
2. Navigate to Invoices page
3. Click "Templates" button
4. Verify all 5 templates are displayed
5. Test setting different templates as default
6. Test PDF generation with different templates
7. Verify PDF output quality and formatting

## Migration Notes

### For Existing Users
- Old template system is completely removed
- Users will see the new 5 pre-defined templates
- Default template is automatically set to first template
- No data loss - existing invoices remain intact

### For Developers
- Old template API endpoints are removed
- New GST template endpoints are available
- Template customization is no longer supported
- PDF generation logic updated to use new templates

## Future Enhancements

### Potential Improvements
1. **Template Customization**: Allow limited customization of pre-defined templates
2. **Additional Templates**: Add more specialized templates (export, e-commerce, etc.)
3. **Template Preview**: Add preview functionality in template manager
4. **Bulk Operations**: Allow bulk template operations
5. **Template Analytics**: Track template usage and performance
6. **PDF Quality**: Enhanced font rendering and image support
7. **Multi-language**: Support for multiple languages in templates

### Compliance Updates
1. **GST Rule Changes**: Update templates for new GST regulations
2. **E-invoicing**: Enhanced e-invoicing template support
3. **QR Code Integration**: Improved QR code generation
4. **Digital Signatures**: Add digital signature support
5. **Barcode Support**: Add barcode generation for products

### Technical Improvements
1. **Performance**: Optimize PDF generation speed
2. **Caching**: Implement PDF caching for frequently accessed invoices
3. **Batch Processing**: Support for bulk PDF generation
4. **Cloud Storage**: Integration with cloud storage for PDFs
5. **API Enhancements**: RESTful API for PDF generation

## Conclusion

The new GST invoice template system provides a standardized, compliant, and user-friendly approach to invoice generation. The 5 pre-defined templates cover all common use cases while ensuring GST compliance and professional presentation.
