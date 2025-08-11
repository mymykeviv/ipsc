# Changelog

All notable changes to CASHFLOW will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
