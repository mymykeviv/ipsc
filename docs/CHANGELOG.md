# Changelog

All notable changes to this project will be documented in this file.

## [1.48.7] - 2025-08-21

### 🐛 Fixed
- **Database Schema**: Fixed missing `gst_enabled_by_default` column in `company_settings` table
- **CI/CD Pipeline**: Fixed Python path issues (python3 vs python)
- **Frontend Tests**: Fixed Vitest configuration and removed deprecated `--watchAll` flag
- **Test Dependencies**: Added missing vitest global installation in CI
- **Migration Scripts**: Created automated database schema fix script

### 🔧 Changed
- **CI Configuration**: Updated all Python commands to use `python3`
- **Frontend Test Script**: Updated package.json test command to use `vitest run`
- **Test Runner**: Fixed comprehensive test runner to use correct Python path

### 🧪 Testing
- **Database Migration**: Added verification script to ensure schema fixes are applied correctly
- **CI/CD Validation**: All CI/CD pipeline issues addressed and tested

## [1.48.6] - 2025-08-21

### 🐛 Fixed
- **Invoice Number Validation**: Fixed validation regex to allow forward slashes for format 'FY2025/INV-1344'
- **Invoice Creation Test**: Updated test to include all required fields (customer_id, supplier_id, place_of_supply, etc.)
- **Test Data Structure**: Fixed invoice item structure to include required product_id and qty fields
- **CI/CD Pipeline**: All tests now passing with 100% success rate
- **Invoice Status Update**: Fixed missing apiUpdateInvoiceStatus function causing 422 errors when marking invoices as sent
- **INR Symbol Rendering**: Fixed currency symbol display in PDF generation (black square issue)
- **Payment Submission**: Fixed missing payment_date field causing 422 errors when adding payments
- **Filter Clear All**: Fixed Clear All filter functionality not properly clearing date filters
- **Invoice Status Logic**: Fixed status field showing payment information instead of invoice state
- **Invoice Payments Display**: Fixed missing API functions causing payments not to display after submission
- **API Compilation**: Fixed duplicate function declarations causing esbuild transform errors
- **Payment Display**: Fixed backend PaymentOut model validation errors preventing payment history display
- **Invoice Payments UI**: Fixed date filter always active causing payments to not display despite successful API response
- **Cashflow Transactions**: Fixed missing payment_method filter and date comparison issues preventing invoice payments from appearing
- **Filter Behavior**: Fixed automatic filter application when navigating to Cashflow and Payments pages - now shows all data by default
- **Dashboard Calculations**: Fixed missing cashflow API functions causing incorrect dashboard display values
- **Purchase Payment Failure**: Fixed 422 error due to incorrect field names (amount/method vs payment_amount/payment_method)
- **API Compilation Errors**: Fixed duplicate function declarations and missing TypeScript types
- **Duplicate Function Declarations**: Removed duplicate apiAddPayment and apiAddPurchasePayment functions causing esbuild errors
- **Stock Movement History**: Fixed missing API functions preventing all products from being displayed
- **Purchase Payment Amount**: Fixed incorrect pending amount calculation causing payment failures
- **Stock Movement Functions**: Removed duplicate function declarations causing esbuild compilation errors
- **Purchase Display**: Fixed Amount Due column to show correct balance amounts
- **Purchase Actions**: Disabled Add Payment option for fully paid purchases

### ✨ Enhanced
- **Currency Display**: Updated invoice PDFs to show ₹ symbol instead of INR code
- **Professional Appearance**: Invoice PDFs now display proper currency symbols for better presentation

### 🧪 Testing
- **Test Suite Validation**: Comprehensive test suite validation successful
- **Automated Deployment**: CI/CD pipeline tests passing consistently
- **API Endpoint Testing**: All critical endpoints responding correctly
- **PDF Generation**: Verified PDF generation with proper currency formatting
- **Payment Functionality**: Verified payment submission works correctly for invoices and purchases
- **Currency Formatting**: Verified ₹ symbol displays correctly in all formats

### 📚 Documentation
- **Test Results**: Updated test results documentation with latest successful runs
- **Change Management**: Proper documentation of validation fixes and test improvements

## [1.48.5] - 2025-08-20

### 🚀 Added
- **Consolidated Deployment System**: Unified deployment for dev, UAT, and production environments
- **Automatic Cache Cleaning**: All deployments now automatically clean caches and JS files
- **Kubernetes Production Support**: Full Kubernetes deployment configuration for production
- **Enhanced Docker Compose**: Separate configurations for dev, UAT, and production
- **Comprehensive Cache Cleaning Script**: Unified script that cleans all types of caches

### 🔧 Changed
- **Deployment Architecture**: Streamlined from 7 deployment methods to 3 unified environments
- **Environment Structure**: 
  - Development: Docker Compose with hot reloading
  - UAT: Docker Compose with production-like settings
  - Production: Kubernetes with high availability
- **Cache Management**: Automatic cache cleaning integrated into all deployment processes
- **Documentation**: Complete rewrite of deployment documentation

### 🗑️ Removed
- **Redundant Deployment Scripts**: Removed 7 overlapping deployment scripts
- **Old Docker Compose Files**: Consolidated into 3 environment-specific configurations
- **Manual Cache Cleaning**: Replaced with automatic cache cleaning in all deployments

### 🐛 Fixed
- **Cache Issues**: Automatic cleaning prevents stale JS files from interfering with TypeScript
- **Deployment Complexity**: Simplified deployment process with single command per environment
- **Environment Conflicts**: Separate configurations prevent port and resource conflicts

### 📚 Documentation
- **New Deployment Guide**: Comprehensive guide for all three environments
- **Migration Guide**: Instructions for migrating from old deployment system
- **Troubleshooting**: Enhanced troubleshooting section with common issues and solutions

### 🔒 Security
- **Secrets Management**: Kubernetes secrets for production deployments
- **Environment Isolation**: Proper separation between dev, UAT, and production
- **Resource Limits**: Kubernetes resource limits and requests for production

### 🧪 Testing
- **Deployment Testing**: All deployment methods tested and validated
- **Cache Cleaning Validation**: Verified cache cleaning works across all environments
- **Rollback Testing**: Tested rollback procedures for all environments

## [1.48.4] - 2025-08-20

### 🎨 Added
- **Invoice Template System**: Comprehensive template system with customization options
- **Enhanced Parties Management**: Complete UX overhaul with improved navigation and filtering
- **Contextual Action Buttons**: Widget-specific action buttons for better user experience
- **Dashboard Layout Improvements**: Standardized 2-column grid layout across all sections

### 🔧 Changed
- **Parties Navigation**: Renamed side menu to 'Parties' with simplified structure
- **Filter System**: Enhanced with 10 visual quick filters and consistent labels
- **Visual Design**: Comprehensive improvements with better colors, spacing, and typography
- **Action Button Patterns**: Converted to kebab menu for cleaner interface

### 🐛 Fixed
- **Layout Issues**: Fixed SessionTimer and header layout problems
- **Table Overflow**: Prevented kebab menu dropdown clipping
- **Modal Positioning**: Enhanced Modal z-index to appear above sidebar
- **Dashboard Alignment**: Fixed alignment issues for larger screens

## [1.48.3] - 2025-08-19

### 🎨 Added
- **Enhanced Filter System**: Advanced filtering across all screens with improved UX
- **Dashboard Quick Actions**: Working quick action buttons with proper functionality
- **Comprehensive Error Handling**: Robust error handling and user feedback
- **Loading States**: Comprehensive loading states for better user experience

### 🔧 Changed
- **Filter UX**: Improved filter system with better visual design and organization
- **Dashboard Layout**: Optimized layout with proper alignment and spacing
- **Error Messages**: Enhanced error messages with retry options
- **Component Structure**: Improved component hierarchy and positioning

### 🐛 Fixed
- **Filter Functionality**: Fixed filter system bugs and improved reliability
- **Dashboard Buttons**: Fixed quick action button layout and styling issues
- **Error Handling**: Improved error handling across all components
- **Layout Consistency**: Fixed layout issues across different screen sizes

## [1.48.2] - 2025-08-18

### 🎨 Added
- **GST Compliance**: Indian GST calculation and reporting features
- **Stock Management**: Real-time stock tracking and adjustments
- **Payment Management**: Enhanced payment system with multiple methods
- **Reports**: GST summary reports with portal-compatible export

### 🔧 Changed
- **Invoice Management**: Enhanced invoice generation and email functionality
- **Purchase Management**: Complete purchase system with GST compliance
- **Expense Management**: Comprehensive expense tracking with categorization
- **Cashflow Management**: Income vs expense analysis with date range filtering

### 🐛 Fixed
- **GST Calculations**: Fixed GST calculation accuracy and compliance
- **Stock Tracking**: Improved stock adjustment functionality
- **Payment Processing**: Enhanced payment tracking and reconciliation
- **Report Generation**: Fixed report formatting and export functionality

## [1.48.1] - 2025-08-17

### 🎨 Added
- **Product Management**: Complete CRUD with enhanced error handling
- **Authentication**: JWT-based with role-based access control
- **Party Management**: Customer and vendor management with GST toggle
- **Audit Trail**: Comprehensive logging of all user actions

### 🔧 Changed
- **User Interface**: Enhanced UI with better error handling and loading states
- **Data Validation**: Improved input validation and error messages
- **Performance**: Optimized database queries and frontend rendering
- **Security**: Enhanced authentication and authorization

### 🐛 Fixed
- **Authentication Issues**: Fixed login and session management
- **Data Validation**: Improved form validation and error handling
- **Performance Issues**: Optimized slow queries and rendering
- **Security Vulnerabilities**: Fixed authentication and authorization bugs

## [1.48.0] - 2025-08-16

### 🎨 Added
- **Dashboard**: Cashflow summary with working quick action buttons
- **Core Application**: Basic application structure and navigation
- **Database Integration**: PostgreSQL database with SQLAlchemy ORM
- **API Framework**: FastAPI backend with comprehensive endpoints

### 🔧 Changed
- **Project Structure**: Organized codebase with proper separation of concerns
- **Development Environment**: Docker-based development setup
- **Testing Framework**: Comprehensive testing setup with pytest and vitest
- **Documentation**: Initial documentation structure and guides

### 🐛 Fixed
- **Setup Issues**: Fixed initial project setup and configuration
- **Development Environment**: Resolved Docker and development environment issues
- **Testing**: Fixed test configuration and execution
- **Documentation**: Corrected documentation errors and inconsistencies

---

## Version History

### Version Numbering
- **Major.Minor.Patch** format (e.g., 1.48.5)
- **Major**: Breaking changes or major feature releases
- **Minor**: New features or significant improvements
- **Patch**: Bug fixes and minor improvements

### Release Types
- **Feature Release**: New functionality and improvements
- **Bug Fix Release**: Critical bug fixes and stability improvements
- **Security Release**: Security patches and vulnerability fixes
- **Documentation Release**: Documentation updates and clarifications

### Deployment Notes
- All releases include comprehensive testing
- Production deployments require approval and rollback plan
- Documentation is updated with each release
- Migration guides provided for breaking changes
