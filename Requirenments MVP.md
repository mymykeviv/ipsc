Requirenments MVP

# Business Use case
we are a small scale manufacturer of industrial goods at a startup stage, most of the office activities are done on pen and paper like stock keeping, record maintenance of incoming and outgong stocks, bill of supplies and even sales invoices. We want to digitise the entire process and streamline our activities. This is an Indian legal enetity with valid GST registration. Our vendors are also GST registered firm. Some of our B2B customers are as well registered on GST. while some retail customer and some B2B customer do not hold any GST registration. We want to be able to handle the GST complaince in the invoices as well the get the necessary report for easier GST filings as per Indian GST law.  

**Customer & Vendor Account Data:** Tailored suggestions based on the customer’s account profile, such as industry and business type.
**Sales and Purchase with History and trends:** Create manage sales and purchase,management payments for them againt different accouting heads (cash, bank, funds,etc.), get insights derived from past transactions to identify patterns and preferences.
**Product-Specific Relevance:** Managing of products /items in the catalog and their stock on hand as well as uatomaing stock movemnet with sales and purchases , manual stock adjustments, Intelligent mapping of the products/services in our catalog, eliminating the need for technical terminology.
**GST Context Awareness:** Recognizing GST context-specific needs in the invoices, generating monhtly , quaterly reports ncessary for GST complaince as per industry standards.
**Income and expense tracking by financial year:** 

# User Journeys and User Personas

## User Journeys

### 1. Digital Stock Management
**User Persona:** Office Manager  
**Journey Steps:**
1. **Login:** Office Manager logs into the system.
2. **Access Stock Management:** Office Manager navigates to the stock management section.
3. **Add Stock:** Office Manager enters details for incoming stock including item name, quantity, supplier, and date of receipt.
4. **Update Stock:** Office Manager can edit existing stock details.
5. **View Stock:** Office Manager views current inventory levels to make reordering decisions.
6. **Record Outgoing Stock:** Office Manager records details for outgoing stock.
7. **Confirmation:** System displays a confirmation message for each successful action.

### 2. Digital Invoicing System
**User Persona:** Sales Representative  
**Journey Steps:**
1. **Login:** Sales Representative logs into the system.
2. **Access Invoice Management:** Sales Representative navigates to the invoice management section.
3. **Generate Invoice:** Sales Representative selects customer and enters details for the invoice including items, quantity, price, and GST status.
4. **Automated GST Calculation:** System calculates GST based on customer GST registration status.
5. **Email Invoice:** Sales Representative sends the invoice directly to the customer via email.
6. **Confirmation:** System displays a confirmation message for successful invoice generation and email delivery.

### 3. GST Reporting and Compliance
**User Persona:** Accountant  
**Journey Steps:**
1. **Login:** Accountant logs into the system.
2. **Access GST Reporting:** Accountant navigates to the GST reporting section.
3. **Generate Report:** Accountant selects date range and customer type filters to generate GST filing reports.
4. **View and Export Report:** Accountant views the generated report and exports it for official GST filing.
5. **Confirmation:** System displays a confirmation message for successful report generation.

### 4. Sales and Purchase Management
**User Persona:** Sales Representative  
**Journey Steps:**
1. **Login:** Sales Representative logs into the system.
2. **Access Sales Management:** Sales Representative navigates to the sales management section.
3. **Record Sale:** Sales Representative enters details of the sale including items, quantity, price, and payment method.
4. **Record Purchase:** Sales Representative enters details of the purchase including items, quantity, price, and payment method.
5. **View Transactions:** Sales Representative views past transactions and gets insights on trends and patterns.
6. **Confirmation:** System displays a confirmation message for successful recording of sales and purchases.

### 5. Product Catalog Management
**User Persona:** Office Manager  
**Journey Steps:**
1. **Login:** Office Manager logs into the system.
2. **Access Product Management:** Office Manager navigates to the product catalog management section.
3. **Add Product:** Office Manager enters details for new products including name, description, and initial stock.
4. **Update Product:** Office Manager can edit existing product details and stock levels.
5. **Automate Stock Adjustments:** System adjusts stock levels automatically based on sales and purchases.
6. **Manual Adjustments:** Office Manager can perform manual stock adjustments when necessary.
7. **Confirmation:** System displays a confirmation message for successful product and stock adjustments.

### 6. Customer and Vendor Profiles
**User Persona:** Sales Representative  
**Journey Steps:**
1. **Login:** Sales Representative logs into the system.
2. **Access Profiles Management:** Sales Representative navigates to the customer and vendor profiles section.
3. **Add Profile:** Sales Representative enters details for new customers and vendors including GST registration status.
4. **Update Profile:** Sales Representative can edit existing profiles.
5. **Tailor Invoices:** System uses profile information for tailoring invoices based on customer/vendor needs.
6. **Confirmation:** System displays a confirmation message for successful profile management.

## User Personas

### 1. Office Manager
**Role:** Manages daily office administration including stock and invoice management.  
**Goals:** Efficiently manage records, streamline invoicing, ensure GST compliance.  
**Pain Points:** Time-consuming manual processes, risk of human error, difficulty in maintaining correct GST compliance.  

### 2. Accountant
**Role:** Handles financial records and GST filing.  
**Goals:** Accurate and timely filing, easy access to financial reports.  
**Pain Points:** Complicated manual calculations, difficulty in consolidating data for GST filings.  

### 3. Sales Representative
**Role:** Engages with customers, processes sales orders.  
**Goals:** Create and manage customer invoices, ensure customer satisfaction.  
**Pain Points:** Time spent on invoice creation, risk of errors.  

By laying out these user journeys and personas, we can understand the needs and workflows of different users, ensuring that the digital system we develop caters to their requirements effectively.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
| ID | Title                         | Summary                                                                                                         | Self-Review                               |
|----|-------------------------------|-----------------------------------------------------------------------------------------------------------------|------------------------------------------|
| 1  | Digital Stock Management      | **As an Office Manager**, I want to digitize stock keeping so that I can efficiently track inventory levels and manage reordering tasks without manual errors. | ✅ Creates value, vertical slice, functional |
| 2  | Digital Invoicing System      | **As a Sales Representative**, I want to generate GST-compliant invoices digitally so that I can streamline the invoicing process and ensure legal compliance for all customer types. | ✅ Creates value, vertical slice, functional |
| 3  | GST Reporting and Compliance  | **As an Accountant**, I want to generate GST filing reports automatically so that I can easily comply with Indian GST laws and regulations without manual calculations. | ✅ Creates value, vertical slice, functional |
| 4  | Sales and Purchase Management | **As a Sales Representative**, I want to manage sales and purchase transactions digitally, including payment management across different accounting heads (cash, bank, funds, etc.) to streamline operations and track financial history. | ✅ Creates value, vertical slice, functional |
| 5  | Product Catalog Management    | **As an Office Manager**, I want to manage products/items in the catalog, automate stock adjustments based on sales and purchases, and manually adjust stock when necessary so that inventory reflects accurate levels without manual errors. | ✅ Creates value, vertical slice, functional |
| 6  | Customer and Vendor Profiles  | **As a Sales Representative**, I want to record and manage detailed profiles of customers and vendors, including GST registration status, to tailor invoices and transactions based on their specific needs. | ✅ Creates value, vertical slice, functional |
| 7  | Intelligent Product Mapping   | **As an Office Manager**, I want to map products/services in our catalog intelligently, making it easier to reference and sell them without using complex technical terminology. | 🤔 Sophisticated feature, needs a clearly defined user need |
| 8  | Cross-Functional Requirements | **As a Product Manager**, I want to ensure that cross-functional requirements like security, performance, usability, and reliability are integrated into all functional work packages to maintain a high-quality product consistently. | 🤔 Cross-functional, should be integrated within other functional packages |
| 9  | Email Integration for Invoices| **As a Sales Representative**, I want to send invoices directly via email from the system so that customers receive timely and accurate invoicing. | ✅ Adds value, vertical slice, functional    |
| 10 | Data Analysis and Insights    | **As a Sales Representative**, I want to get insights derived from past transactions to identify sales patterns and preferences so that I can make data-driven decisions for business growth. | ✅ Creates value, vertical slice, functional |

## Cross-Functional Requirements

1. **Security:** Ensure encryption of all sensitive data both in transit and at rest.
2. **Performance:** Ensure swift operation times for features, such as form submission within 2 seconds and report generation within 5 seconds.
3. **Usability:** Make interfaces intuitive and user-friendly to minimize training needs and enhance productivity.
4. **Reliability:** Ensure system up-time and data integrity, mitigating risks of data loss or system failure.
5. **Compliance:** Adhere strictly to Indian GST laws and regulations, ensuring all generated invoices and reports meet legal standards.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Requirements Analysis for Digitization and Streamlining

## Work Packages

### 1. Digital Stock Management
**ID:** 1  
**Title:** Digital Stock Management  
**Summary:**  
**As an Office Manager**, I want to digitize stock keeping so that I can efficiently track inventory levels and manage reordering tasks without manual errors.  

### 2. Digital Invoicing System
**ID:** 2  
**Title:** Digital Invoicing System  
**Summary:**  
**As a Sales Representative**, I want to generate GST-compliant invoices digitally so that I can streamline the invoicing process and ensure legal compliance for all customer types.  

### 3. GST Reporting and Compliance
**ID:** 3  
**Title:** GST Reporting and Compliance  
**Summary:**  
**As an Accountant**, I want to generate GST filing reports automatically so that I can easily comply with Indian GST laws and regulations without manual calculations.  

### 4. Sales and Purchase Management
**ID:** 4  
**Title:** Sales and Purchase Management  
**Summary:**  
**As a Sales Representative**, I want to manage sales and purchase transactions digitally, including payment management across different accounting heads (cash, bank, funds, etc.) to streamline operations and track financial history.  

### 5. Product Catalog Management
**ID:** 5  
**Title:** Product Catalog Management  
**Summary:**  
**As an Office Manager**, I want to manage products/items in the catalog, automate stock adjustments based on sales and purchases, and manually adjust stock when necessary so that inventory reflects accurate levels without manual errors.  

### 6. Customer and Vendor Profiles
**ID:** 6  
**Title:** Customer and Vendor Profiles  
**Summary:**  
**As a Sales Representative**, I want to record and manage detailed profiles of customers and vendors, including GST registration status, to tailor invoices and transactions based on their specific needs.  

### 7. Intelligent Product Mapping
**ID:** 7  
**Title:** Intelligent Product Mapping  
**Summary:**  
**As an Office Manager**, I want to map products/services in our catalog intelligently, making it easier to reference and sell them without using complex technical terminology.  

### 8. Cross-Functional Requirements
**ID:** 8  
**Title:** Cross-Functional Requirements  
**Summary:**  
**As a Product Manager**, I want to ensure that cross-functional requirements like security, performance, usability, and reliability are integrated into all functional work packages to maintain a high-quality product consistently.  

### 9. Email Integration for Invoices
**ID:** 9  
**Title:** Email Integration for Invoices  
**Summary:**  
**As a Sales Representative**, I want to send invoices directly via email from the system so that customers receive timely and accurate invoicing.  

### 10. Data Analysis and Insights
**ID:** 10  
**Title:** Data Analysis and Insights  
**Summary:**  
**As a Sales Representative**, I want to get insights derived from past transactions to identify sales patterns and preferences so that I can make data-driven decisions for business growth.  

---

## Cross-Functional Requirements

1. **Security:** Ensure encryption of all sensitive data both in transit and at rest.
2. **Performance:** Ensure swift operation times for features, such as form submission within 2 seconds and report generation within 5 seconds.
3. **Usability:** Make interfaces intuitive and user-friendly to minimize training needs and enhance productivity.
4. **Reliability:** Ensure system up-time and data integrity, mitigating risks of data loss or system failure.
5. **Compliance:** Adhere strictly to Indian GST laws and regulations, ensuring all generated invoices and reports meet legal standards.

These requirements should be integrated into the functional work packages above to maintain a consistently high-quality product.

## Questions for Clarification
1. Preferred Tech Stack:
Do you have a preferred language/framework (e.g., Python/Django, Node/Express, Electron, desktop app, etc.)? No, any is fine. Consider robustness and data integrity as major factors.
Should the UI be web-based, desktop GUI, or CLI? UI should be web based.

2. Data Storage:

Is a local file-based DB (SQLite, JSON, etc.) acceptable, or do you require a specific DB?
Should data be portable (easy backup/restore)? for transactional data maintain relational databases with ACID complaince, for reporting and auditing use can use nosql db like elasticsearch etc
Email Integration: Yes, should be able to send invoices and reports over email if required, should be able to integreate existing email services like gmail and or outlook.com. 

Should the app use local SMTP settings for sending emails, or is manual export sufficient for MVP? BOTH are needed
GST Logic: follow Indian GST law for this

Do you have specific GST rules/tax slabs, or should we use standard Indian GST rates? Standard Indian GST rates
Any sample invoice/report formats to follow? Use Indian GST invoice format for MVP and same for reporting
User Authentication: basic local account management with RBAC

Is simple local authentication (username/password) sufficient for now?yes, with role based access
Platform: any

Should the app run on Windows/Mac/Linux, or only Mac (your current platform)? platform agnostic, thought it should be able to run on container like docker or kubernetes for scalibility

Change request
1. i want to have a single artificat for both front and backend and the database which can be easily deployed to any server and accessed and used by any system on the same network
    - include all dependencies in the package so that it can be deployed easily
    - should be able to work on linux as well as windows setup
2. I want the deployement artificat to be compatible with docker, i.e. it can be easily deployed in docker and used on the same system or another system in the network
3. Addtionally i want the deployment artificat for backend and frontend to be horizontally and vertically scalable 
    - it can be deployed on the kubernetes cluster
    - or any similar setup
Implement access control for users
        - i should be able to grant read, wrtie, update and delete access to users for individual functionality like transactions, accounts, categories, subcategories, tags and settings for access control as well
        - only root user
- Add the following modules to the app with RBAC
    1. Purchase management
        - users can add and manage bill of purchases done for items
        - ability to maintain the stock inventory of purchased items;
        - abilit to add paymnet made againt bill of purchases
            - these payments should be automatically be marked as expense transactions
        - show pending payments amount agaiant each bill of payment
        - ability to print the bills as pdf should be there
    2. Item management
        - ability to add and manage items
        - items have name, description, SKU, Unit, Sales Price, HSN code, GST tax rates (IGST/CGST,etc), purchase price, stock value and notes fields
        - items can be raw materials(i.e go againts COGS account), trading items (purchased and sold as is) or final products (to be sold post manfucturing or modifications)
    3. Vendor management
        - ability to add and manage vendors
        - vendors have name, business name, GSTIN (optional), contact details(address and number),notes fields.
        - ability to show pending payments for each vendors
    4. Customer Managament
        - ability to add and manage Customer
        - customers have name, business name, GSTIN (optional), contact details(address and number),notes fields.
        - ability to show pending payments for each customers
    5. Sales & Invoices
        - users can add and manage sales invoice done for items for customers
        - Invoice have Seller details and  buyer details - name, address and GSTIN details
        - invoice has bill to and ship address for buyer
        - invoice has invoice date, invoice number (autogenerated for a fincial year, user can modify this manully)
        - ewaybill number and place of supply is also include in invoice
        - invoice are GST complaint (India)
        - users cam multiple items in an invoice, add/modify the qunatities and rate in invoice for each items.
        - gross amount (exclusing tax) is shown 
        - discount can be added at either line item or at total 
        - total taxable amount is to be shown 
        - tax amount and tax rate detail to be shown
        - add ability to do a retail sale as well
        - abilit to add paymnet made for agaisnt invoice
            - these payments should be automatically be marked as income transactions
        - show pending payments amount agaiant each invoice
        - ability to print the invoice as pdf should be there
            - original , duplicate and triplicate tags can be added to the prints
## more info and QnA
You're absolutely right! Before I continue implementing audit trail and TDD, let me ask some relevant questions to ensure I'm implementing features correctly:

## Audit Trail Questions:

1. **Audit Trail Scope**: 
   - Should audit trail capture ALL field changes or only specific sensitive fields? All fields
   - Do you want to track login/logout events in audit trail? Yes
   - Should we audit read operations (GET requests) or only write operations (CREATE/UPDATE/DELETE)? Only write operations (CREATE/UPDATE/DELETE)

2. **Audit Trail Data Retention**:
   - How long should audit entries be retained? Should there be automatic cleanup? 1 year
   - Do you need audit trail export functionality (CSV, PDF)? Yes , CSV only

3. **Audit Trail UI**:
   - Should audit trail show changes in a diff format (old value → new value)? Yes
   - Do you want filtering by user, action type, date range, table? Yes
   - Should there be real-time notifications for critical audit events? No

## TDD Implementation Questions:

4. **Test Coverage Requirements**:
   - What level of test coverage are you targeting (unit, integration, e2e)? Unit and integration
   - Should I focus on testing business logic, API endpoints, or both? Both
   - Do you want performance tests for database operations? No

5. **Test Database**:
   - Should tests use a separate test database or in-memory database? Separate test database
   - Do you want tests to clean up data after each test or use transactions? clean up data after each test

## Business Logic Questions:

6. **Stock Management**:
   - How should stock be handled when items are deleted? Set to zero or prevent deletion? prevent deletion and allow marking items as inactive
   - Should low stock alerts be sent via email/notifications or just UI indicators? No, just UI indicators
   - What stock valuation method should be default (FIFO, LIFO, Average)? FIFO, should be configurable in settings by admins

7. **Invoice/Purchase Numbering**:
   - Should invoice numbers be sequential across all customers or per customer? sequential across all customers
   - How should the system handle number gaps if invoices are deleted? dont allow deletion of invoices which are marked as paid
   - Should there be different number series for different invoice types? No, one series for all invoice types

8. **GST Compliance**:
   - Do you need specific GST report formats (GSTR-1, GSTR-3B)? Yes, GSTR-1 and GSTR-3B are must for MVP
   - Should the system auto-detect intra-state vs inter-state based on customer/vendor GST numbers? Yes

9. **User Session & Security**:
   - Should session timeout be configurable per user role? No
   - Do you want to force logout on password change? No
   - Should there be concurrent session limits per user? No

10. **Dashboard & Reports**:
    - What specific visualizations do you want on the dashboard? Dashboard should have a summary of all the important metrics like total sales, sales trend, total purchases, purchases trend, total profit, low stock items, total pending payments, total pending expenses, total cashflow, balance by accounts, monthly income and expense trend, top selling items
    - Should reports be generated in real-time or pre-calculated? pre-calculated, should be able to generate reports for any date range. use separate report module for this. and preferabley separate database for reports. so as no impact on main database.for transactions.
    - Do you need scheduled report generation and email delivery? No

Please let me know your preferences for these questions so I can implement the features exactly as you need them!

  ## Seed Data

  ### Account types
- **Assets**: Current Assets (Cash and Cash Equivalents, Accounts Receivable, Inventory — Raw Materials, WIP, Finished Goods, Prepaid Expenses); Non-Current Assets (PP&E — Land, Buildings, Machinery, Vehicles; Intangible Assets — Patents, Trademarks, Goodwill)
- **Liabilities**: Current Liabilities (Accounts Payable, Short-Term Loans/OD/CC, Taxes Payable, Wages Payable); Non-Current Liabilities (Long-Term Loans, Deferred Tax Liabilities, Pension Liabilities)
- **Equity**: Owner’s Capital, Retained Earnings, Additional Paid-In Capital
- **Revenue (Income)**: Product Sales Revenue, Service/Job-Work Income, Scrap Sales, Export Sales (Zero-Rated), Interest Income, Rental/Other Operating Income
- **Expenses**: Direct Expenses (COGS — Raw Materials, Direct Labor, Manufacturing Overhead), Indirect Expenses (Admin, Marketing, Depreciation, Utilities, IT/Software, Professional Fees, Bank Charges)

### Categories and subcategories
- **Income**
  - **Domestic Sales**
    - GST 5% / 12% / 18% / 28%
    - Exempt/Nil Rated
  - **Export Sales**
    - LUT/Bond
    - With IGST
  - **Job Work/Service Income**
    - Processing Charges
    - Contract Manufacturing
  - **Scrap Sales**
    - Metal Scrap
    - Packaging Scrap
  - **Other Income**
    - Interest Income
    - Rental Income
    - Miscellaneous Receipts

- **Expense (Direct/COGS)**
  - **Raw Materials**
    - Metals (e.g., Steel, Aluminum)
    - Plastics/Polymers
    - Chemicals/Adhesives
  - **Packing Materials**
    - Primary Packaging
    - Secondary Packaging
  - **Consumables & Stores**
    - Oils/Lubricants
    - Cutting Tools
  - **Power & Fuel**
    - Electricity
    - Gas/Diesel
  - **Direct Labor**
    - Wages
    - Overtime/Incentives
  - **Subcontracting/Job Work**
    - Processing Charges
    - Heat Treatment/Plating
  - **Freight Inward**
    - Transportation Inward
    - Loading/Unloading
  - **Repairs & Maintenance (Plant & Machinery)**
    - Spares
    - AMC/Service
  - **Quality Control**
    - Testing/Calibration
    - Lab Consumables
  - **Factory Expenses**
    - Factory Rent/Lease
    - Factory Insurance
    - Safety & PPE
  - **Inventory Adjustments**
    - WIP Adjustment
    - Stock Loss/Obsolescence

- **Expense (Indirect/Operating)**
  - **Salaries & Wages (Admin)**
  - **Office Rent & Utilities**
    - Rent
    - Electricity/Water/Internet
  - **Communication**
    - Mobile
    - Landline/Data
  - **Travel & Conveyance**
    - Local Travel
    - Outstation Travel
  - **Professional Fees**
    - Audit/Consulting
    - Legal
  - **IT & Software**
    - SaaS Subscriptions
    - Licenses/AMC
  - **Marketing & Advertising**
    - Digital Ads
    - Events/Exhibitions
  - **Bank & Finance Charges**
    - Bank Charges
    - Interest on Loans/CC
    - Processing Fees
  - **Taxes & Duties**
    - GST Paid (Input CGST/SGST/IGST)
    - TDS Paid
    - ROC/Statutory Fees
  - **Insurance (Non-Factory)**
    - Office/Vehicle
  - **Training & Welfare**
    - Staff Training
    - Canteen/Welfare
  - **Depreciation**
    - Plant & Machinery
    - Buildings/Vehicles
  - **Miscellaneous Expenses**

### Tags
- **Product lines**: e.g., Automotive Parts, Consumer Electronics, Industrial Components
- **HSN/SAC codes**: e.g., HSN 7308, HSN 8501
- **GST specifics**
  - GST Rate: GST 0% / 5% / 12% / 18% / 28%
  - Nature: Intra-state (CGST+SGST), Inter-state (IGST), Export (Zero-Rated), SEZ, RCM (Reverse Charge)
  - E-way Bill: Required/Not Required, EWB-<number>
- **Customer/Vendor type**: B2B, B2C, SEZ, Export, MSME, Composition Dealer
- **Departments/Cost centers**: Production, Maintenance, Quality, Stores, Purchase, Sales, Finance, HR, R&D, IT
- **Projects/Jobs**: Project A, Project B, Job No. ####
- **Locations/Plants**: Mumbai Plant, Pune Plant, Delhi Office
- **Payment mode**: NEFT, RTGS, IMPS, UPI, Cash, Cheque, Card
- **Sales channels**: Direct, Distributor, OEM, Online Marketplace
- **Logistics**: Transporter, Vehicle No., LR No., Delivery Terms (FOB/Ex-Works/CIF)
- **Compliance**: TDS Section 194C/194H/194J, LUT/Bond, E-invoice IRN
- **Manufacturing ops**: Machine ID, Line No., Shift (A/B/C), Batch/Lot No., Heat No.
- **Document references**: PO No., SO No., WO No., GRN No.

- Ensures accurate classification for reporting, GST compliance, costing, and operational analytics.
- You can seed the app’s master data using these headings; map Income/Expense to category “type,” and apply tags for GST, operations, and analytics.
  
