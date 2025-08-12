# Changelog

All notable changes to CASHFLOW will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2024-01-15

### Added
- **Enhanced Purchase Management System (Issue #6)**
  - Complete purchase management with GST compliance
  - Auto-generated purchase numbers (PUR-001, PUR-002, etc.)
  - Purchase items with HSN codes, GST rates, and discount support
  - Purchase status tracking (Draft, Received, Paid, Partially Paid)
  - Purchase edit, delete, and list functionality
  - GST calculations (CGST/SGST/IGST) based on place of supply
  - Purchase payment tracking and outstanding calculations

- **Sales and Purchase Payment Management (Issue #5)**
  - Enhanced payment system with account heads (Cash, Bank, UPI, etc.)
  - Purchase payment management with payment history
  - Payment status tracking and partial payment support
  - Account head-based transaction categorization
  - Payment reference numbers and notes support
  - Outstanding payment calculations for both invoices and purchases

- **Cashflow View and Management (Issue #7)**
  - Complete expense management system
  - Expense categorization (Direct/COGS, Indirect/Operating)
  - GST support for expenses with vendor tracking
  - Cashflow summary with income vs expense analysis
  - Date range filtering for cashflow reports
  - Account head-based expense tracking

- **Cross-Functional Requirements (Issue #8)**
  - Enhanced security with proper payment validation
  - Performance optimizations for large datasets
  - Improved usability with comprehensive form validation
  - Reliability improvements with proper error handling

### Changed
- Updated application version to 1.6.0
- Enhanced database schema with new tables and fields
- Improved API consistency across all payment endpoints
- Updated frontend API client with new type definitions

### Fixed
- Payment model field naming consistency
- Database migration support for new schema changes
- API response format standardization

## [1.5.3] - 2024-01-15
### Fixed
- **Invoice Creation Error**
  - Fixed HTTP 500 error when creating invoices due to invoice number length exceeding 16 characters
  - Updated `_next_invoice_no` function to ensure generated invoice numbers stay within GST law limits
  - Changed default invoice series from "FY24-25/INV/" to "INV-" to prevent length issues
  - Added intelligent truncation and padding logic for invoice number generation

- **Customer & Vendor Profiles Enhancement**
  - Added support for displaying inactive entries in Customer & Vendor Profiles
  - Added "Show Inactive" filter checkbox to toggle visibility of inactive parties
  - Updated backend API endpoints to support `include_inactive` parameter
  - Updated frontend API functions to pass the `include_inactive` parameter
  - All parties (active and inactive) are now visible with proper filtering options

## [1.5.2] - 2024-01-15
### Fixed
- **Login Screen and Sidebar Branding Alignment**
  - Fixed application name text centering on login screen
  - Added `centered` prop to Logo component for proper alignment
  - Fixed sidebar branding text wrapping issues
  - "CASHFLOW" now displays on single line with `whitespace-nowrap`
  - "Financial Management System" displays as single subtitle line
  - Added missing CSS utility classes (whitespace-nowrap)

## [1.5.1] - 2024-01-15
### Fixed
- **Login Screen UI Issue**
  - Fixed application branding text display on login screen
  - "CASHFLOW Financial Management System" now displays properly on two lines
  - Added missing CSS utility classes (flex-col, leading-none, leading-tight)
  - Improved text hierarchy and readability in login interface

## [1.5.0] - 2024-01-15
### Added
- **Complete Audit Trail System**
  - Comprehensive audit logging for all user actions (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
  - Audit trail database table with proper indexing for performance
  - Audit trail API endpoints with filtering and pagination
  - CSV export functionality for audit trail data
  - IP address and user agent tracking for security
  - JSON storage of old and new values for detailed change tracking

### Changed
- Updated application version to 1.5.0
- Enhanced error handling for database constraint violations
- Improved stock summary calculation to use product.stock field directly
- Fixed test expectations to match actual error messages

### Fixed
- **Critical Bug Fixes:**
  - Database error in product creation (SKU constraint violation handling)
  - Stock adjustment calculation errors and stock summary accuracy
  - Test failures due to incorrect error message expectations
  - Stock summary not reflecting actual product stock levels

## [1.4.5] - 2024-01-15
### Added
- **UX/UI Improvements from GitHub Issue #4**
  - Session timer now resets on user activity (mouse, keyboard, touch, scroll)
  - Modal improvements with 80% screen sizing and close buttons
  - Form validation improvements with disabled submit buttons for invalid forms

### Changed
- Updated application version to 1.4.5
- Removed "Sales" from sidebar menu as requested
- Increased sidebar menu font size for better readability
- Fixed customer and vendor profile loading issues
- Enhanced modal accessibility with proper close buttons

### Fixed
- Session timer continuously reducing instead of resetting on user actions
- Customer and vendor profile screen showing "Failed to load parties" error
- Modal sizing not following 80% screen width/height requirement
- Missing close buttons on modal popups
- Submit buttons not disabled when forms have validation errors

## [1.4.4] - 2024-01-15
### Added
- **Enhanced Digital Invoicing System**
  - Complete implementation of all requirements from GitHub Issue #3
  - "Total in Words" calculation with proper Indian Rupee formatting
  - Improved total summary display with accurate discount calculations
  - Backend sorting support for all invoice table columns
  - Fixed missing API imports for invoice operations (edit, delete, email)

### Changed
- Updated application version to 1.4.4
- Enhanced invoice form with proper total calculations
- Improved sorting functionality with backend integration
- Fixed total discount calculation to show actual discount amounts

### Fixed
- Missing imports for `apiUpdateInvoice`, `apiDeleteInvoice`, `apiEmailInvoice`, and `apiGetInvoice`
- Incorrect total discount calculation in invoice forms
- Frontend sorting not connected to backend sorting
- "Total in Words" display showing incorrect format

## [1.2.0] - 2024-01-15
### Added
- **Enhanced Stock Adjustment with Reduce Option**
  - Support for reducing stock (consumption tracking)
  - Item type classification (tradable, consumable, manufactured)
  - Comprehensive form validations for all fields
  - Close buttons on all modal popups
  - Modal sizing to 80% of screen width/height

### Changed
- Updated Product model with item type classification
- Enhanced validation rules for all forms
- Improved modal UI with better accessibility
- Updated stock adjustment to support both add and reduce operations
- Added "Composite Scheme" option to GST registration status

### Fixed
- Layout issues in Customer and Vendor Profiles table
- Horizontal scrolling for wide tables
- Add button accessibility in modals

## [1.1.1] - 2024-01-15
### Added
- **Sorting and Pagination for Customer and Vendor Profiles**
  - Clickable column headers for sorting (ascending/descending)
  - Pagination controls with page numbers
  - Items per page display (10 items per page)
  - Sort indicators (↑/↓) showing current sort direction
  - Page navigation with Previous/Next buttons
  - Current page highlighting

### Changed
- Updated application version to 1.1.1
- Enhanced table functionality with sorting and pagination
- Improved user experience with better data navigation

## [1.1.0] - 2024-01-15
### Added
- **Enhanced Customer and Vendor Profiles**
  - Complete CRUD operations for customer and vendor profiles
  - Comprehensive profile fields: contact person, phone, email, GST details
  - Full address management (billing and shipping addresses)
  - GST registration status tracking
  - Advanced search and filtering capabilities
  - Separate endpoints for customers and vendors
  - Professional UI with modal forms and tabular display
  - Copy billing address to shipping address functionality
  - Status toggle (active/inactive) instead of deletion
  - Comprehensive validation and error handling

- **Backend Enhancements**
  - Enhanced Party model with all required fields
  - New API endpoints: `/api/parties/customers` and `/api/parties/vendors`
  - Advanced search functionality across all party fields
  - Improved error handling and validation
  - Updated seed data with comprehensive party information

- **Frontend Enhancements**
  - Updated API client with new Party functions
  - Enhanced Party type definitions
  - Improved error handling in API calls

### Changed
- Updated application version to 1.1.0
- Enhanced Party model schema with comprehensive fields
- Improved API error handling and validation
- Updated seed data with realistic party information

### Fixed
- Database schema compatibility issues
- API endpoint consistency
- Error handling in party operations

## [1.0.0] - 2024-01-15

### Added
- **Product Management System**
  - Complete CRUD operations for products
  - HSN and GST details integration
  - Product categories and suppliers
  - Stock tracking and management
  - Product status toggle (active/inactive)

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (RBAC)
  - User management with roles (Admin, Sales, Accountant, Store)

- **Stock Management**
  - Real-time stock tracking
  - Stock adjustments and movements
  - Stock summary reports
  - Purchase and sales integration

- **GST Compliance**
  - Indian GST calculation (CGST/SGST/IGST)
  - HSN code management
  - GST rate configuration (0%, 5%, 12%, 18%, 28%)
  - GST summary reports

- **Invoice Management**
  - Invoice generation with GST calculation
  - PDF invoice generation
  - Email integration for invoices
  - Invoice numbering system

- **Party Management**
  - Customer and vendor management
  - GSTIN validation and storage
  - State-wise party categorization

- **Purchase Management**
  - Vendor purchase tracking
  - Purchase order management
  - Stock updates on purchases

- **Reports**
  - GST summary reports (JSON/CSV)
  - Stock summary reports
  - Transaction history

- **Modern UI/UX**
  - React-based frontend with TypeScript
  - Responsive design with CSS variables
  - Modal forms for data entry
  - Sortable and searchable tables
  - Themed components (Card, Button)

- **Backend Infrastructure**
  - FastAPI with async support
  - PostgreSQL database with SQLAlchemy ORM
  - Docker containerization
  - Comprehensive API documentation

- **Development Tools**
  - TDD approach with comprehensive testing
  - Docker Compose for local development
  - Version tracking and deployment scripts
  - Health checks and monitoring

### Technical Features
- **Database**: PostgreSQL with ACID compliance
- **Backend**: FastAPI with automatic API documentation
- **Frontend**: React 18 with TypeScript and Vite
- **Authentication**: JWT with secure password hashing
- **PDF Generation**: ReportLab for invoice generation
- **Email**: SMTP with OAuth2 support
- **Testing**: Pytest (backend) and Vitest (frontend)
- **Deployment**: Docker with version tracking

### Security
- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- Secure API endpoints

### Performance
- Async/await support in backend
- Optimized database queries
- Efficient frontend rendering
- Docker containerization for scalability

---

## Version Tracking

### How to Update Versions

1. **Backend Version**: Update `VERSION` in `backend/app/main.py`
2. **Frontend Version**: Update `version` in `frontend/package.json`
3. **Deployment Script**: Update `VERSION` in `deploy.sh`
4. **Version File**: Update `VERSION` file
5. **Changelog**: Add new version entry in `CHANGELOG.md`

### Version Format
- **Major.Minor.Patch** (e.g., 1.0.0)
- **Major**: Breaking changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible

### Deployment Tracking
- Each deployment creates a `build-info.json` file
- Contains version, build date, git commit, and service versions
- Health endpoints return version information
- Frontend logs version on startup
