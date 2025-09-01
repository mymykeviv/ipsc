# Detailed User Stories for ProfitPath

---

## Epic 1: Product & Item Management

### Story ID: ITEM-001  
**Title:** Manage Product and Raw Material Catalog  
**Narrative:** As a warehouse manager, I want to add, update, and delete product and raw material records with SKU, batch tracking, units of measure, and categories to maintain accurate inventory.  
**Acceptance Criteria:**  
- SKU auto-generation and barcode support.  
- Batch/lot tracking with manufacture and expiry dates.  
- Multiple units of measure and conversions.  
- Categorization by item types.

---

## Epic 2: Purchase Management

### Story ID: PURCHASE-001  
**Title:** Create and Manage Purchase Orders  
**Narrative:** As a procurement officer, I want to record purchase orders, receive goods, and update stock while ensuring GST compliance and supplier details.  
**Acceptance Criteria:**  
- PO lifecycle management with statuses (draft, confirmed, received, billed, paid).  
- GST auto-calculation per supplier location.  
- Attach scanned documents.  
- Supplier credit and payment terms linkage.

---

## Epic 3: Sales Management

### Story ID: SALES-001  
**Title:** Generate GST-Compliant Sales Invoices  
**Narrative:** As a sales agent, I want to create, update, and send GST-compliant invoices with pricing, discounts, payment terms, and advance payments.  
**Acceptance Criteria:**  
- Multiple invoice types (proforma, tax, credit/debit notes).  
- Customer-specific pricing and discounts.  
- GST auto-calculation and HSN/SAC code inclusion.

---

## Epic 4: Inventory Tracking

### Story ID: INVENTORY-001  
**Title:** Track Inventory Levels and Stock Valuation  
**Narrative:** As inventory staff, I want real-time stock updates, stock alerts, and support for FIFO/LIFO stock valuation methods.  
**Acceptance Criteria:**  
- Accurate stock quantities after purchases, sales, and production.  
- Reorder notifications.  
- Choice of stock valuation method.

---

## Epic 5: Production & Consumption

### Story ID: PRODUCTION-001  
**Title:** Define Bill of Materials and Record Production  
**Narrative:** As a production manager, I want to set up BOMs and log production batches, consuming raw materials accordingly.  
**Acceptance Criteria:**  
- Ability to create, edit BOMs.  
- Production batch tracking with consumption and scrap recording.

---

## Epic 6: Payment Tracking

### Story ID: PAYMENT-001  
**Title:** Record Payments for Purchases and Sales  
**Narrative:** As finance staff, I want to log payments with details like mode, amount, and status, track advances and pending dues.  
**Acceptance Criteria:**  
- Support multiple payment modes.  
- Link payments to invoices and purchase orders.  
- Generate aging reports and payment reminders.

---

## Epic 7: Expense & Accounting

### Story ID: EXPENSE-001  
**Title:** Categorize and Record Expenses  
**Narrative:** As an accountant, I want to log various expenses under accounting heads to maintain accurate financial records.  
**Acceptance Criteria:**  
- Define expense categories (DIRECT, COGS, OPERATING, OTHER).  
- Attach supporting documents to expenses.

---

### Story ID: EXPENSE-002  
**Title:** Generate Financial Reports  
**Narrative:** As a business owner, I want to view Profit & Loss statements, cash flow, and balance sheets to make informed decisions.  
**Acceptance Criteria:**  
- Reports with date filters and export options.  
- Accurate reflection of incomes, expenses, and balances.
