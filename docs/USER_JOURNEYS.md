# User Journeys - Cashflow Application

## Story #16: GST Toggle System

### User Journey: Enabling/Disabling GST for Individual Parties

**As a** business owner  
**I want to** enable or disable GST for individual customers/vendors  
**So that** I can handle both GST-registered and non-GST customers appropriately

#### Journey Steps:

1. **Access Party Management**
   - User navigates to Parties section
   - User clicks "Add New Party" or selects existing party

2. **Configure GST Settings**
   - User fills in party details (name, contact, address)
   - User sees "GST Enabled" checkbox (default: checked)
   - User can uncheck to disable GST for this party
   - If GST is enabled, GSTIN field becomes required
   - If GST is disabled, GSTIN field becomes optional

3. **GSTIN Validation**
   - If GST enabled and GSTIN provided, system validates format
   - Shows error if GSTIN format is invalid
   - Allows saving if GSTIN is valid or not provided

4. **Save Party**
   - User clicks "Save" button
   - System creates/updates party with GST settings
   - Confirmation message shown

5. **Invoice Creation Impact**
   - When creating invoice for GST-disabled party:
     - No GST calculations applied
     - Invoice shows only base amount
     - Tax fields show zero values
   - When creating invoice for GST-enabled party:
     - Normal GST calculations applied
     - CGST/SGST for intra-state
     - IGST for inter-state

### User Journey: System-Wide GST Settings

**As a** business owner  
**I want to** configure default GST behavior for the entire system  
**So that** I can set company-wide GST preferences

#### Journey Steps:

1. **Access Company Settings**
   - User navigates to Company Settings
   - User sees GST configuration section

2. **Configure Default Settings**
   - User sets "GST Enabled by Default" (default: true)
   - User sets "Require GSTIN Validation" (default: true)
   - User saves settings

3. **Impact on New Parties**
   - New parties inherit default GST settings
   - GSTIN validation follows system setting
   - Users can override per party

---

## Story #17: Enhanced GST Reports (GSTR-1 & GSTR-3B)

### User Journey: Generating GSTR-1 Report

**As a** business owner  
**I want to** generate GSTR-1 reports in exact GST portal format  
**So that** I can file GST returns without manual data entry

#### Journey Steps:

1. **Access Reports Section**
   - User navigates to Reports section
   - User selects "GST Reports" or "GSTR-1"

2. **Configure Report Parameters**
   - User selects start date (e.g., 2024-01-01)
   - User selects end date (e.g., 2024-01-31)
   - User chooses format (JSON or CSV)

3. **Generate Report**
   - User clicks "Generate Report" button
   - System validates data for the period
   - System processes all invoices in date range

4. **Review Report**
   - System shows report summary:
     - Total records generated
     - Period covered
     - Data validation status
   - User can preview sample data

5. **Download Report**
   - User clicks "Download CSV" button
   - File downloads with name: `gstr1_2024-01-01_to_2024-01-31.csv`
   - File contains all required GST portal fields

6. **Upload to GST Portal**
   - User opens GST portal
   - User uploads downloaded CSV file
   - Data populates automatically in portal

### User Journey: Generating GSTR-3B Report

**As a** business owner  
**I want to** generate GSTR-3B summary reports  
**So that** I can file monthly GST returns with accurate calculations

#### Journey Steps:

1. **Access GSTR-3B Report**
   - User navigates to Reports section
   - User selects "GSTR-3B Report"

2. **Select Period**
   - User selects month and year (e.g., January 2024)
   - System automatically sets start and end dates

3. **Generate Summary**
   - User clicks "Generate Report" button
   - System calculates:
     - Total taxable value
     - Total CGST, SGST, IGST
     - Input tax credit
     - Net tax payable

4. **Review Summary**
   - User sees summary table with:
     - Outward supplies summary
     - Input tax credit summary
     - Net tax payable calculation
   - User can drill down to transaction details

5. **Download Report**
   - User downloads CSV summary
   - File contains GSTR-3B format data
   - Ready for GST portal upload

### User Journey: GST Data Validation

**As a** business owner  
**I want to** validate GST data before generating reports  
**So that** I can ensure compliance and avoid filing errors

#### Journey Steps:

1. **Access Validation Tool**
   - User navigates to Reports section
   - User clicks "Validate GST Data"

2. **Select Validation Period**
   - User selects date range for validation
   - User clicks "Validate" button

3. **Review Validation Results**
   - System shows validation status:
     - ✅ GSTR-1 Valid: True/False
     - ✅ GSTR-3B Valid: True/False
   - If errors found, system lists specific issues:
     - Missing HSN codes
     - Invalid GSTIN formats
     - Missing required fields

4. **Fix Data Issues**
   - User addresses validation errors
   - User updates product HSN codes
   - User corrects party GSTIN information
   - User re-runs validation

5. **Proceed with Report Generation**
   - Once validation passes, user can generate reports
   - System ensures data quality for GST filing

---

## Story #18: Advanced Invoice Features (Not Yet Implemented)

### User Journey: Multi-Currency Invoices

**As a** business owner  
**I want to** create invoices in multiple currencies  
**So that** I can serve international customers

#### Journey Steps:

1. **Create New Invoice**
   - User starts new invoice creation
   - User selects customer

2. **Choose Currency**
   - User selects currency from dropdown (USD, EUR, GBP, etc.)
   - System shows exchange rate (if configured)
   - User can override exchange rate

3. **Add Items and Calculate**
   - User adds products/services
   - System calculates in selected currency
   - GST calculations adjust for currency

4. **Review and Send**
   - User reviews invoice in foreign currency
   - User sends invoice to customer
   - System tracks currency conversion

### User Journey: Recurring Invoices

**As a** business owner  
**I want to** set up recurring invoices  
**So that** I can automate billing for subscription services

#### Journey Steps:

1. **Create Recurring Template**
   - User creates invoice template
   - User sets recurrence pattern (weekly, monthly, yearly)
   - User sets start and end dates

2. **Configure Items**
   - User adds products/services to template
   - User sets quantities and rates
   - User configures any discounts

3. **Activate Recurring Invoice**
   - User activates the recurring invoice
   - System automatically generates invoices
   - System sends invoices to customers

4. **Monitor and Manage**
   - User views all recurring invoices
   - User can pause or modify templates
   - User tracks payment status

---

## Story #19: Purchase Order Management (Not Yet Implemented)

### User Journey: Creating Purchase Orders

**As a** business owner  
**I want to** create and manage purchase orders  
**So that** I can track inventory procurement

#### Journey Steps:

1. **Create Purchase Order**
   - User navigates to Purchase Orders
   - User clicks "New Purchase Order"
   - User selects vendor

2. **Add Items**
   - User adds products to purchase order
   - User specifies quantities and expected prices
   - User sets delivery dates

3. **Review and Approve**
   - User reviews purchase order details
   - User approves the order
   - System sends to vendor

4. **Track Delivery**
   - User tracks delivery status
   - User receives goods
   - User converts PO to purchase invoice

---

## Story #20: Advanced Payment Tracking (Not Yet Implemented)

### User Journey: Payment Scheduling

**As a** business owner  
**I want to** schedule and track payments  
**So that** I can manage cash flow effectively

#### Journey Steps:

1. **Schedule Payment**
   - User creates payment schedule
   - User sets payment dates and amounts
   - User links to specific invoices

2. **Payment Reminders**
   - System sends payment reminders
   - User receives notifications
   - User can reschedule if needed

3. **Payment Processing**
   - User processes payments
   - System updates invoice status
   - System generates receipts

---

## Story #21: Inventory Management (Not Yet Implemented)

### User Journey: Stock Management

**As a** business owner  
**I want to** track inventory levels  
**So that** I can manage stock efficiently

#### Journey Steps:

1. **View Inventory**
   - User navigates to Inventory section
   - User sees current stock levels
   - User views low stock alerts

2. **Update Stock**
   - User receives goods (purchase)
   - User sells goods (invoice)
   - System automatically updates stock

3. **Stock Adjustments**
   - User makes manual adjustments
   - User records damages/losses
   - User conducts stock counts

---

## Story #22: Financial Reports (Not Yet Implemented)

### User Journey: Generating Financial Reports

**As a** business owner  
**I want to** generate comprehensive financial reports  
**So that** I can analyze business performance

#### Journey Steps:

1. **Select Report Type**
   - User chooses report (P&L, Balance Sheet, Cash Flow)
   - User selects date range
   - User configures report parameters

2. **Generate Report**
   - System processes financial data
   - System calculates totals and summaries
   - System formats report

3. **Review and Export**
   - User reviews report data
   - User exports to PDF/Excel
   - User shares with stakeholders

---

## Common User Journey Patterns

### Authentication Journey
1. User enters username/password
2. System validates credentials
3. System generates access token
4. User accesses protected features

### Error Handling Journey
1. User encounters error
2. System shows clear error message
3. User understands the issue
4. User takes corrective action
5. User retries operation

### Data Export Journey
1. User selects data to export
2. User chooses export format
3. System generates file
4. User downloads file
5. User uses file as needed

### Search and Filter Journey
1. User enters search criteria
2. System filters data
3. User reviews results
4. User refines search if needed
5. User selects desired item

---

## User Experience Principles

### Simplicity
- Clean, intuitive interface
- Minimal clicks to complete tasks
- Clear navigation structure

### Consistency
- Uniform design patterns
- Consistent terminology
- Standardized workflows

### Efficiency
- Quick access to common tasks
- Keyboard shortcuts where appropriate
- Bulk operations for multiple items

### Reliability
- Data validation before saving
- Clear error messages
- Confirmation for important actions

### Accessibility
- Responsive design for mobile devices
- Clear contrast and readable fonts
- Keyboard navigation support
