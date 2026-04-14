# Product Requirements Document (PRD)

**Product:** BillZest Mobile Application (Version 1)
**Platforms:** iOS & Android (React Native CLI)

---

## 1. High-Level Overview

BillZest Mobile V1 is the essential native companion for retail businesses, designed for speed and real-time reliability. It focuses on the core daily operations: creating invoices (billing), managing a unified directory of parties (customers & vendors), tracking the "Credit Book" (udhar/jama), managing product inventory with barcode scanning, and recording business expenses.

The app mirrors the BillZest Web "Credit Management" approach by treating Customers and Vendors as "Parties" and integrates seamless syncing with Supabase.

---

## 2. User Personas

- **Shop Owner (Admin)**
  - Needs a dashboard for daily sales, expenses, and outstanding balances.
  - Manages master data (Products, Parties).
  - Tracks inventory cost and purchase orders.
- **Sales Staff / Cashier**
  - Fast billing (Invoice creation).
  - Quick product lookup and scanning.
  - Collecting payments and sharing invoices.

---

## 3. Feature Breakdown (V1 Features Only)

### 3.1 Authentication

- **Login**:
  - Secure login using email & Password.
  - Session persistence using long-lived tokens for seamless access.

### 3.2 Dashboard

- **Sales Report**: View total sales summary (Today/Weekly/Monthly).
- **Purchase Report**: View total purchases summary.
- **Inventory Cost**: Display total value of current inventory.
- **Expenses Summary**: View total expenses incurred.

### 3.3 Parties (Customers & Vendors)

- **Unified Management**:
  - Create, Update, and Delete Parties.
  - **Party Type**: Toggle/Select between "Customer" or "Vendor" during creation.
- **Balance Management**:
  - **Receive Balance**: Record payments received from customers (settling dues).
  - Track outstanding balance (receivable vs. payable).

### 3.4 Products

- **CRUD Operations**:
  - Create, Update, and Delete products.
- **Fields**: Name, Price, Cost, Stock, SKU, Barcode.
- **Barcode Scanning**:
  - Scan physical barcodes to lookup products during billing or inventory checks.
  - Support for standard code-based scanning.

### 3.5 Invoices (Billing)

- **Operations**:
  - **Create**: Generate new sales invoices.
    - Select Party (Customer).
    - Add Products (Search or Scan).
    - Calculate Totals (Tax, Disc).
  - **Update**: Edit existing invoices (if within editable window/permissions).
  - **Delete**: Soft delete or cancel invoices.
- **Sharing**:
  - Share Invoice PDF via system share sheet (WhatsApp, Email, etc.).
- **Reporting**:
  - View specific sale details/report associated with invoices.

### 3.6 Purchase Orders

- **Operations**:
  - **Create**: Generate new Purchase Orders for Vendors.
  - **View**: List and view details of Purchase Orders.
  - **Share**: Share POs with vendors via PDF/Link.

### 3.7 Credit Book

- **Ledger View**:
  - Receivables list (You Will Get).
  - Payables list (You Will Give).
- **Transactions**:
  - View transaction history for each party.
  - Add credit/debit entry.
  - Receive payment / Record payment.

### 3.9 Expenses

- **Management**:
  - **Add Expense**: Record a new expense (Amount, Category/Description, Date).
  - **Update/Delete**: Modify or remove expense records.

### 3.10 Settings

- **Business Info**:
  - Manage store details (Name, Address, Phone, etc.).
- **Printers & Devices**:
  - UI placeholder indicating "Launching Soon".

---

## 4. Workflow Diagrams

### 4.1 Invoice Creation (Billing)

1.  **Start**: User taps "New Bill" or "+" on Dashboard/Invoices tab.
2.  **Select Party**: Search & select "Customer" (or create new).
3.  **Add Items**:
    - Tap "Scan" to scan barcode -> Item added.
    - OR Search by name -> Tap to add.
    - Adjust Quantity/Price.
4.  **Review**: Check Total, discount, tax.
5.  **Save**: Tap "Save" / "Generate Invoice".
6.  **Post-Action**: Auto-redirect to "Share" options or "New Bill".

### 4.2 Purchase Order Flow

1.  **Start**: Navigate to Purchase Orders -> "Create PO".
2.  **Select Vendor**: Pick from "Parties" (filtered by Vendor type).
3.  **Add Items**: Select products to order.
4.  **Save**: Create the PO.
5.  **Share**: Send to Vendor via WhatsApp/Email.

### 4.3 Party & Credit Flow

1.  **Add Party**: Go to Parties -> Add -> Select "Customer" or "Vendor" -> Enter Details -> Save.
2.  **Record Payment**:
    - Go to Credit Book/Party Detail.
    - Tap "Receive Payment".
    - Enter Amount -> Save.
    - Balance updates immediately.

---

## 5. Acceptance Criteria (V1)

- **Cloud Sync**:
  - All data operations rely on direct synchronization with the Supabase backend. Data changes must reflect in real-time.
- **Data Accuracy**:
  - Dashboard KPIs (Sales, Purchase, Expenses) must match the sum of individual records.
  - Inventory Cost must reflect (Stock Qty \* Cost Price).
- **Performance**:
  - Barcode scanner must recognize standard EAN/UPC codes < 1 sec.
  - App launch to Dashboard < 3 secs.

---

## 6. Non-Functional Requirements

- **Data Integrity**: Ensure consistent transactions across all service modules.
- **UI/UX**: Clean, large tap targets for "Fat Finger" usage in busy shops. Dark/Light mode support.

---

## 7. Out of Scope Features (Future Releases)

/\* OUT OF SCOPE FOR V1 — retained for future planning

### Reports Module

- Visualizations: Sales Trend Charts (Weekly/Monthly).
- Quick Exports: GST Summary, Sales Register, Inventory Aging.
- Actions: Download Full Report.

### Settings Module

- Billing Templates: Select/Configure invoice layouts.
- Plans: View subscription status.
- Notifications: Preference controls.
- Appearance: Dark/Light mode toggle.
- Printers & Devices: Bluetooth printer management.
- Security: App lock/security settings.
- Integrations: Manage external connections (Tally, UPI, etc.).

### Advanced Inventory

- Stock Adjustment: Dedicated flow to Increase/Decrease stock levels with reference IDs.
- Stock Audits / Physical Verification flow.
- Low stock push notifications.

### CRM & Staff

- Customer Loyalty Points system.
- Staff Management (Roles/Permissions).

### Advanced Invoice Features

- Recurring Invoices.
- Proforma Invoices.
  \*/
