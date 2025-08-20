# E2E Test Suite - Core User Journeys

This directory contains comprehensive end-to-end tests covering all core user journeys for the ProfitPath business management system.

## Test Structure

### 1. Authentication (`01-authentication.spec.ts`)
- **Login functionality**: Valid credentials, invalid credentials, empty credentials
- **Logout functionality**: Successful logout and redirect to login page
- **Form validation**: Error messages for invalid inputs

### 2. Dashboard (`02-dashboard.spec.ts`)
- **Dashboard display**: Main sections (Income, Expenses, Cashflow)
- **Data refresh**: Refresh button functionality and loading states
- **Period selection**: Different time periods (quarter, year)
- **Pending items**: Overdue invoices and due payments display
- **Navigation menu**: Collapse/expand functionality

### 3. Products Management (`03-products.spec.ts`)
- **Product listing**: Display products with search functionality
- **Add product**: Create new products with all required fields
- **Edit product**: Update existing product details
- **Activate/deactivate**: Toggle product status
- **Stock adjustment**: From products list and side menu navigation
- **Stock history**: View stock movement history
- **Search and filter**: Product search functionality

### 4. Suppliers/Vendors Management (`04-suppliers.spec.ts`)
- **Vendor listing**: Display vendors with search functionality
- **Add vendor**: Create new vendors with contact details
- **Edit vendor**: Update existing vendor information
- **Activate/deactivate**: Toggle vendor status
- **Search and filter**: Vendor search functionality
- **Table display**: Proper column headers and data

### 5. Purchases Management (`05-purchases.spec.ts`)
- **Purchase listing**: Display purchase orders
- **Add purchase**: Create new purchase orders with items
- **Edit purchase**: Update purchase order details
- **Cancel purchase**: Cancel purchase orders
- **Payment management**: Add payments from list and side menu
- **Payment history**: View payment history for purchases
- **Search and filter**: Purchase search functionality

### 6. Customers Management (`06-customers.spec.ts`)
- **Customer listing**: Display customers with search functionality
- **Add customer**: Create new customers with contact details
- **Edit customer**: Update existing customer information
- **Activate/deactivate**: Toggle customer status
- **Search and filter**: Customer search functionality
- **Table display**: Proper column headers and data

### 7. Invoices Management (`07-invoices.spec.ts`)
- **Invoice listing**: Display invoices with search functionality
- **Add invoice**: Create new invoices with items
- **Edit invoice**: Update invoice details
- **PDF generation**: Print invoices with preview
- **Email functionality**: Send invoices via email
- **Payment management**: Add payments from list and side menu
- **Payment history**: View payment history for invoices
- **Search and filter**: Invoice search functionality

### 8. Cashflow & Expenses (`08-cashflow-expenses.spec.ts`)
- **Cashflow transactions**: View all cashflow transactions
- **Expense listing**: Display expenses with search functionality
- **Add expense**: Create new expenses with categorization
- **Edit expense**: Update expense details
- **Delete expense**: Remove expenses with confirmation
- **Filter functionality**: Filter by transaction type and date range
- **Table display**: Proper column headers and data

### 9. Settings Management (`09-settings.spec.ts`)
- **Company details**: View and edit company information
- **Tax settings**: Configure GST rates and tax settings
- **User management**: View, add, edit, and manage users
- **Password management**: Change user passwords
- **User activation**: Activate/deactivate users
- **Navigation**: Tab navigation between settings sections

### 10. Reporting Management (`10-reporting.spec.ts`)
- **GST Reports**: GST Summary, GSTR-1, GSTR-3B generation and export
- **Financial Reports**: Profit & Loss, Balance Sheet, Cash Flow statements
- **Inventory Reports**: Inventory Valuation and Stock Ledger reports
- **Report filtering**: By period, category, product, and date range
- **Export functionality**: Excel and PDF export capabilities
- **Error handling**: Graceful handling of report generation errors
- **Loading states**: Proper loading indicators during report generation

## Running the Tests

### Run all tests:
```bash
npm run test:e2e
```

### Run specific test file:
```bash
npm run test:e2e -- tests/e2e/01-authentication.spec.ts
```

### Run tests with specific browser:
```bash
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=safari
```

### Run tests in headed mode (see browser):
```bash
npm run test:e2e -- --headed
```

### Run tests with debug mode:
```bash
npm run test:e2e -- --debug
```

## Test Data Requirements

The tests assume the following test data is available:
- Admin user with credentials: `admin` / `admin123`
- At least one product in the system
- At least one customer in the system
- At least one vendor in the system
- At least one invoice in the system
- At least one purchase order in the system

## Test Coverage

These tests cover **100% of the core user journeys** specified:

✅ **Login**: User can login to the system using their credentials  
✅ **Dashboard**: User can see the dashboard with all sections  
✅ **Products**: Complete product management including stock adjustments  
✅ **Suppliers**: Complete vendor/supplier management  
✅ **Purchase**: Complete purchase order management with payments  
✅ **Customers**: Complete customer management  
✅ **Invoices**: Complete invoice management with PDF and email  
✅ **Cashflow & Expenses**: Complete cashflow and expense management  
✅ **Company Details Settings**: Company information management  
✅ **Tax Settings**: Tax configuration management  
✅ **Users**: User management and administration  
✅ **Reporting**: GST, Financial, and Inventory reports with export functionality  

## Test Quality Features

- **Robust selectors**: Using semantic selectors that are less likely to break
- **Proper wait strategies**: Waiting for elements to be visible before interaction
- **Error handling**: Testing both success and error scenarios
- **Data validation**: Verifying that data is properly saved and displayed
- **Navigation testing**: Ensuring proper page transitions
- **Form validation**: Testing input validation and error messages
- **CRUD operations**: Complete Create, Read, Update, Delete testing
- **User experience**: Testing actual user workflows end-to-end

## Maintenance

When updating the application:
1. Update test selectors if UI elements change
2. Add new tests for new features
3. Update existing tests if business logic changes
4. Ensure all core user journeys remain covered
5. Run tests regularly to catch regressions early

## Reporting

Test results are available in:
- Console output during test execution
- HTML reports in `test-results/` directory
- Screenshots and videos for failed tests
- Detailed error context for debugging
