# Changelog

All notable changes to CASHFLOW will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.43.0] - 2025-08-17

### Added
- **Enhanced Filter System UI**: Implemented collapsible filter sections with improved user experience
- **Advanced Filter Components**: Created EnhancedFilterBar and EnhancedFilterDropdown with better accessibility
- **Quick Action Buttons**: Added preset filter actions for common use cases (Low Stock, Active Only, etc.)
- **Filter Count Indicators**: Visual indicators showing number of active filters
- **Keyboard Navigation**: Full keyboard support for filter interactions
- **Screen Reader Support**: ARIA labels and proper semantic markup for accessibility
- **Missing Business Screens**: Added filter support for Stock History, Invoice Payments, Purchases, Purchase Payments, and Expenses
- **Comprehensive E2E Testing**: Full test coverage for filter system across all 8 business screens
- **TDD Implementation**: Test-driven development approach with comprehensive unit tests
- **Performance Monitoring**: Filter response time tracking and optimization

### Changed
- **Filter UI Design**: Redesigned filter interface with modern, accessible components
- **Filter Section Behavior**: Filter sections now collapse by default for cleaner interface
- **Component Architecture**: Enhanced reusability and maintainability of filter components
- **Testing Strategy**: Implemented comprehensive automated testing with TDD approach
- **User Experience**: Improved filter interactions with better visual feedback and animations

### Fixed
- **Accessibility Issues**: Fixed keyboard navigation and screen reader compatibility
- **Filter State Management**: Improved filter state persistence and synchronization
- **Performance Optimization**: Enhanced filter query performance and response times
- **Cross-browser Compatibility**: Ensured consistent behavior across Chrome and Firefox

## [1.42.0] - 2025-08-16

### Added
- **Comprehensive Filter System**: Implemented advanced filtering capabilities across all major screens
- **Reusable Filter Components**: Created DateFilter, FilterDropdown, and FilterBar components for consistent UI
- **Products Page Filters**: Added category, item type, GST rate, stock level, supplier, price range, and date filters
- **Invoices Page Filters**: Added customer, amount range, GST type, payment status, and date filters
- **Cashflow Transactions Filters**: Added transaction type, payment method, account head, amount range, and date filters
- **Backend API Enhancements**: Extended API endpoints to support comprehensive filtering parameters
- **Date Range Filtering**: Advanced date filtering with preset options and custom date ranges
- **Real-time Filter Updates**: Automatic data refresh when filters change
- **Filter Persistence**: URL-based filter state management for bookmarking and sharing

### Changed
- **Products Management**: Enhanced with comprehensive filtering options for better data exploration
- **Invoice Management**: Improved filtering capabilities for better invoice tracking and analysis
- **Cashflow Transactions**: Enhanced filtering for better financial data analysis
- **API Architecture**: Extended backend endpoints to support multiple filter parameters
- **User Experience**: Streamlined filtering interface with consistent design patterns

### Fixed
- **Filter Performance**: Optimized filter queries for better performance with large datasets
- **Type Safety**: Fixed TypeScript issues in filter component implementations
- **Data Consistency**: Ensured filter state synchronization across components

## [1.41.0] - 2025-08-16

### Added
- **Comprehensive UX/UI Improvements**: Enhanced user experience across all application modules
- **Dashboard Data Refresh**: Added manual refresh button and improved data loading for real-time updates
- **Cashflow Transactions Refresh**: Added refresh functionality for cashflow transaction table
- **Stock Movement Search & Pagination**: Added search functionality and pagination to stock movement history
- **Reporting Menu Section**: Added comprehensive reporting navigation with all report types
- **GST Toggle Dropdown**: Changed from checkbox to dropdown with GST/Non-GST/Exempted options
- **UX/UI Testing Framework**: Comprehensive testing script with 100% success rate validation
- **MVP Browser Support**: Limited to Chrome and Firefox (Desktop only) for streamlined development

### Changed
- **User Experience**: Improved data refresh mechanisms and navigation structure
- **GST Management**: Enhanced GST status management with dropdown options
- **Navigation**: Added dedicated Reporting section with organized report categories
- **Browser Support**: Simplified to Chrome and Firefox only for MVP development
- **Testing Framework**: Removed mobile and responsive design testing for MVP focus

### Fixed
- **Dashboard Summary**: Fixed data not updating with latest financial information
- **Cashflow Transactions**: Fixed table not refreshing with new transaction data
- **Stock Movement History**: Added missing search and pagination functionality
- **Navigation Menu**: Added missing Reporting section with all report types
- **GST Toggle**: Improved functionality with dropdown options
- **Stock Movement API**: Fixed 500 error in stock movement endpoint

## [1.40.0] - 2025-08-16

### Added
- **Systematic Migration Fixes**: Fixed broken Alembic migration chain and properly organized migration files
- **Enhanced Purchase Order Management**: Added missing GST fields (utgst, cess, round_off) to Purchase and PurchaseItem models
- **Improved Database Schema**: Added proper migration support for fresh deployments
- **Fixed Type Conversion Issues**: Resolved float/Decimal type mismatches in purchase order calculations
- **NEW**: CashflowService for consolidated financial data management
- **NEW**: Comprehensive integration tests for cashflow functionality
- **NEW**: Enhanced API endpoints for financial year summaries and expense history
- **NEW**: Advanced Payment Tracking System with scheduling and reminders
- **NEW**: Payment analytics and insights for collections and payments
- **NEW**: Comprehensive payment status tracking (pending, overdue, paid)
- **NEW**: Advanced Inventory Management with low stock alerts and analytics
- **NEW**: Stock valuation methods (FIFO, LIFO, Average) for accurate inventory value
- **NEW**: Stock aging reports for slow-moving inventory identification
- **NEW**: Comprehensive Financial Reports (P&L, Balance Sheet, Cash Flow)
- **NEW**: Real-time financial calculations with detailed breakdowns
- **NEW**: Financial summary with key metrics and insights

### Changed
- **Migration Structure**: Reorganized migrations into proper versions directory structure
- **Database Schema**: Enhanced Purchase and PurchaseItem models with complete GST compliance fields
- **Purchase Order Workflow**: Improved PO to Purchase conversion with proper GST calculations
- **BREAKING**: Consolidated cashflow data from redundant table to source tables
- **IMPROVED**: Cashflow API now provides better data consistency and performance

### Fixed
- **Migration Chain**: Fixed broken Alembic migration references and dependencies
- **Type Errors**: Resolved float/Decimal conversion issues in purchase order service
- **Missing Dependencies**: Added requests library to requirements.txt
- **Database Constraints**: Fixed missing required fields in Purchase model creation
- **FIXED**: Eliminated data redundancy in cashflow_transactions table
- **FIXED**: Ensured backward compatibility for all existing frontend functionality
- **FIXED**: Resolved SQL query issues in consolidated cashflow service
- **FIXED**: Resolved datetime/date comparison issues in payment calculations
- **FIXED**: Resolved field name mapping issues in financial reports

### Technical Improvements
- **Migration Management**: Created proper initial schema migration and fixed revision chain
- **Code Quality**: Improved error handling and type safety in purchase order operations
- **Deployment**: Ensured migrations work correctly in fresh deployments
- **Data Architecture**: Eliminated redundant cashflow_transactions table for better data consistency

## [1.39.0] - 2024-01-15

### Added
- **GST Toggle System Implementation**
  - **Individual Party GST Control**: Added ability to enable/disable GST for individual customers/vendors
  - **System-Wide GST Settings**: Added company-wide GST configuration options
  - **GSTIN Validation**: Enhanced GSTIN format validation when GST is enabled
  - **Conditional GST Calculations**: Invoice GST calculations now respect party GST settings
  - **Database Schema Updates**: Added gst_enabled_by_default, require_gstin_validation to CompanySettings
  - **Frontend UI Enhancement**: Added GST toggle checkbox in party creation/editing forms

- **Enhanced GST Reports (GSTR-1 & GSTR-3B)**
  - **GSTR-1 Report Generation**: Complete outward supplies report in exact GST portal format
  - **GSTR-3B Report Generation**: Monthly summary report with comprehensive tax calculations
  - **CSV Export Functionality**: Direct download of reports in GST portal-compatible format
  - **Data Validation System**: Comprehensive validation for GST compliance before report generation
  - **API Endpoints**: Added /api/reports/gstr1, /api/reports/gstr3b, /api/reports/gst-validation
  - **Test Data Seeding**: Comprehensive test data with realistic GST-compliant information

### Changed
- **Party Management**: Enhanced party creation/editing with GST toggle functionality
- **Invoice Processing**: GST calculations now conditional based on party GST settings
- **Report Generation**: New GST-compliant report generation system
- **Database Schema**: Updated with new GST-related fields and constraints

### Fixed
- **GST Compliance**: Ensured all GST calculations follow Indian GST law requirements
- **Data Validation**: Improved validation for HSN codes and GSTIN formats
- **Report Format**: Exact compliance with GST portal format requirements

## [1.6.9] - 2024-01-15

### Fixed
- **Invoice Form UI/UX Improvements**
  - **Due Date Auto-Calculation**: Due date now automatically updates when terms are changed
  - **Checkbox Functionality**: Fixed disabled checkboxes for Reverse Charge and Export Supply
  - **Discount Type Selection**: Added discount type dropdown (Percentage/Fixed) in item form
  - **HSN Code Display**: HSN codes now show in the items table after adding items
  - **Total in Words UI**: Changed from disabled text box to label for better UI
  - **Form Consistency**: Both Dashboard and Invoices screen now use the same comprehensive form

### Changed
- **Terms Default**: Changed default terms from "Immediate" to "Due on Receipt"
- **Item Table Layout**: Added HSN code column to items table
- **Discount Handling**: Improved discount type selection and display

## [1.6.8] - 2024-01-15

### Added
- **Comprehensive Invoice Form Implementation**
  - **Unified Form Component**: Both Dashboard and Invoices screen now use the same comprehensive invoice form
  - **Invoice Details Section**: Invoice number, date, due date, status, type, currency, terms
  - **Supplier Details Section**: Supplier name, address, GSTIN, email with auto-population
  - **GST Compliance Section**: Place of supply, e-way bill number, reverse charge, export supply
  - **Customer Details Section**: Customer name, bill/ship addresses, GSTIN, email with auto-population
  - **Invoice Items Section**: Product selection, quantity, rate, discount, GST rate, HSN code
  - **Invoice Totals Section**: Subtotal, discount, GST, round-off, grand total, total in words
  - **Other Details Section**: Invoice notes with character limits

### Changed
- **Form Consistency**: Standardized invoice form across all screens
- **Enhanced Validation**: Comprehensive field validation and error handling
- **Auto-population**: Customer and supplier details auto-populate from selected parties
- **Calculations**: Real-time calculation of totals, GST, and amounts

### Fixed
- **Form Discrepancy**: Resolved differences between Dashboard and Invoices screen forms
- **User Experience**: Consistent interface and functionality across all invoice creation points

## [1.6.7] - 2024-01-15

### Added
- **Database Migration System Implementation**
  - **Alembic Integration**: Added Alembic as the database migration tool
  - **Migration Configuration**: Created `alembic.ini` with proper database configuration
  - **Environment Setup**: Created `env.py` for Alembic environment configuration
  - **Migration Scripts**: Created comprehensive migration scripts for all database changes
  - **Migration Management**: Added `migrate.py` script for easy migration management
  - **Documentation**: Created comprehensive README for migration system usage

### Changed
- **Database Schema Management**
  - Replaced manual database changes with proper migration scripts
  - Added version control for all database schema changes
  - Implemented rollback capability for database changes
  - Enhanced database change tracking and documentation

### Fixed
- **Dashboard Error Resolution**
  - Fixed HTTP 500 error caused by missing database columns
  - Applied all pending database migrations properly
  - Ensured database schema matches application models
  - Resolved compatibility issues between frontend and backend

## [1.6.6] - 2024-01-15

### Added
- **Enhanced Invoice Form Implementation**
  - **Backend Model Updates**: Added new fields to Invoice and InvoiceItem models including supplier_id, invoice_type, currency, utgst, cess, round_off
  - **Database Migration**: Created migration for enhanced invoice model with new columns and constraints
  - **API Enhancements**: Updated invoice creation API to support new fields and enhanced validation
  - **Invoice Number Generation**: Implemented FY-based invoice numbering system (FY2024/INV-0001 format)
  - **Frontend Form Updates**: Enhanced InvoiceForm component with supplier selection, invoice type, currency, and improved terms handling

### Changed
- **Invoice Form Structure**
  - Added supplier selection field (mandatory)
  - Added invoice type dropdown (Invoice, Credit Note, Debit Note)
  - Added currency selection (INR, USD, EUR, GBP)
  - Enhanced terms selection with predefined options (15, 30, 45, 60, 90 days, Due on Receipt, Immediate)
  - Updated place of supply default to "Uttar Pradesh"
  - Added due date field with auto-calculation based on terms
  - Improved form validation and error handling

### Fixed
- **Invoice Numbering System**
  - Fixed invoice number generation to follow FY format
  - Ensured proper sequence numbering within financial year
  - Added validation for 16-character limit as per GST law
  - Implemented proper alphanumeric validation

## [1.6.5] - 2024-01-15

### Added
- **Embedded Quick Action Forms**
  - **ExpenseForm Component**: Complete expense creation form with all fields (date, amount, category, type, description, payment method, account head, vendor, GST rate, reference number, notes)
  - **InvoiceForm Component**: Full invoice creation form with customer selection, items management, and GST compliance fields
  - **PurchaseForm Component**: Comprehensive purchase order form with vendor selection, items management, and GST calculations
  - **Form Integration**: All forms are now embedded directly in dashboard modals instead of redirecting to separate pages

### Changed
- **Dashboard Quick Actions Enhancement**
  - Replaced redirect modals with actual functional forms
  - Increased modal sizes to accommodate full forms (800px-900px width)
  - Enhanced modal styling with better padding and typography
  - Forms automatically refresh dashboard data upon successful submission
  - Improved user experience with seamless form completion without page navigation

### Fixed
- **Quick Action Functionality**
  - Fixed issue where quick action buttons were not opening actual forms
  - Implemented proper form validation and error handling
  - Added automatic data refresh after successful form submissions
  - Ensured all form fields are properly connected to backend APIs

## [1.6.4] - 2024-01-15

### Changed
- **Dashboard Layout Optimization**
  - Significantly reduced white space between sections for better content density
  - Compact header layout with title and period selector on same line
  - Reduced padding and margins throughout all dashboard components
  - Optimized button sizes and spacing for more efficient use of screen real estate
  - Integrated period label into quick actions section to save vertical space
  - Smaller font sizes and tighter spacing in all dashboard sections
  - Reduced modal sizes and padding for more compact popup dialogs
  - Improved overall content-to-space ratio for better information density

### Fixed
- **UI Efficiency**
  - Eliminated excessive vertical spacing between major dashboard sections
  - Reduced internal padding within dashboard cards and components
  - Optimized grid gaps and component spacing for better screen utilization
  - Streamlined modal dialogs with more compact layouts

## [1.6.3] - 2024-01-15

### Added
- **Dashboard Improvements (Issue #10)**
  - Quick action buttons now open modal popups for Add Expense, New Invoice, and New Purchase
  - Period selector dropdown with options: This Month, This Quarter, This Year, Custom Range
  - Cashflow period label integrated with period selector
  - Refresh button moved to quick actions section
  - Dashboard title positioned above quick actions
  - Reduced white space for better content display
  - Modal popups with redirect functionality to respective pages

- **Standardized Search Bar Component**
  - Created reusable SearchBar component with consistent styling
  - Enhanced search functionality with better placeholder text
  - Improved visual design with focus states and icons
  - Consistent search bar size and UI across all application screens

- **Session Management Enhancement**
  - Fixed session expiration handling to properly redirect to login screen
  - Automatic logout and redirect when session expires
  - Improved user experience with proper session state management

- **Product Page Enhancements**
  - Added Stock History button for each product in the grid
  - Integrated standardized SearchBar component
  - Improved search functionality with comprehensive field coverage

### Changed
- **Dashboard Layout**
  - Reorganized quick actions section with better spacing
  - Improved period selector positioning and functionality
  - Enhanced visual hierarchy and user experience
  - Better responsive design for different screen sizes

- **Search Functionality**
  - Standardized search bar appearance across all pages
  - Enhanced search capabilities with better field coverage
  - Improved search placeholder text for better user guidance

### Fixed
- **Session Management**
  - Fixed issue where users were not logged out when session expired
  - Proper redirect to login screen on session expiration
  - Improved session timer functionality

- **UI Consistency**
  - Standardized search bar styling across all pages
  - Consistent button styling and spacing
  - Improved modal positioning and sizing

## [1.6.2] - 2024-01-15

### Added
- **GST Reporting and Compliance System (Issue #9)**
  - Comprehensive GST filing reports compliant with Indian GST portal requirements
  - Support for GSTR-1 (Outward Supplies), GSTR-2 (Inward Supplies), and GSTR-3B (Summary) reports
  - Multiple period types: Monthly, Quarterly, and Yearly reporting
  - Multiple export formats: JSON, CSV, and Excel
  - Detailed transaction-level reporting with customer/vendor GSTIN tracking
  - Rate-wise summary with CGST/SGST/IGST breakdown
  - Net tax liability calculations for GSTR-3B
  - B2B vs B2C categorization based on GSTIN presence
  - Excel export with proper formatting and styling

### Changed
- **Navigation Cleanup**
  - Removed duplicate "Cashflow" link from sidebar navigation
  - Cashflow functionality now integrated into main Dashboard
  - Streamlined navigation with better organization

- **Reports Page Enhancement**
  - Complete redesign with tabbed interface
  - GST Filing Reports tab with comprehensive configuration options
  - Summary Reports tab for basic GST summary
  - Modern UI with better user experience
  - Interactive period selection with dynamic options

### Fixed
- **API Integration**
  - Enhanced backend GST reporting endpoints
  - Proper date range calculations for different period types
  - Excel export functionality with openpyxl integration
  - CSV export with proper formatting for GST portal compatibility

## [1.6.1] - 2024-01-15

### Changed
- **Dashboard Enhancement**
  - Moved cashflow summary to be the main dashboard screen
  - Added quick action buttons in the top left corner for easy access to key functions
  - Quick actions include: Add Expense, New Invoice, New Purchase, Manage Products
  - Improved user experience with immediate access to common tasks
  - Dashboard now serves as a comprehensive financial overview with actionable shortcuts

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
