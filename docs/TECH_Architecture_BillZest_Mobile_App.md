# Technical Architecture – BillZest Mobile App

## 1. Overview

- **App type:** React Native CLI (iOS + Android)
- **Navigation:** React Navigation (Stack + Bottom Tabs + Drawer)
- **Backend:** Supabase (Auth, Postgres, RLS, Storage, Realtime)
- **Data Layer:** Supabase client + module-based service files
- **Logic Layer:** Dedicated logic modules (`invoiceLogic`, `billingLogic`, `stockLogic`, `customerLogic`)
- **State Management:** Combination of React state, React Context, and a query/cache layer (e.g. TanStack Query)
- **Theming:** Central theme provider using `dark.js` and `light.js` matching BillZest web

---

## 2. Navigation Architecture

### 2.1 Navigator Structure

- **Root Stack (`RootStack`)**
  - `AuthStack`
    - `LoginScreen`
    - (Optional) `ForgotPasswordScreen`, `OnboardingScreen`
  - `AppDrawer` (main application shell)
    - Contains `BottomTabNavigator` + secondary stacks

- **Bottom Tab Navigator (`MainTabs`)**
  - `DashboardTabStack`
    - `DashboardScreen`
  - `ProductsTabStack`
    - `ProductsListScreen`
    - `ProductDetailScreen`
    - `ProductFormScreen` (Add/Edit)
  - `CustomersTabStack`
    - `CustomersListScreen`
    - `CustomerDetailScreen`
    - `CustomerFormScreen` (Add/Edit)
  - `InvoicesTabStack`
    - `InvoicesListScreen`
    - `InvoiceDetailScreen`
    - `NewInvoiceScreen` (Billing/POS)

- **Drawer Navigator (`AppDrawer`)**
  - Wraps `MainTabs` and exposes routes via drawer items:
    - Dashboard → `DashboardTabStack` root
    - Products → `ProductsTabStack` root
    - Customers → `CustomersTabStack` root
    - Invoices → `InvoicesTabStack` root
    - Create Purchase → `PurchaseScreen` (own stack or inside Products stack)
    - CreditBook → `CreditBookScreen` + `CustomerCreditDetailScreen`
    - Reports → `ReportsScreen`
    - Business Info → `BusinessInfoScreen` (Settings sub)
    - Billing Templates → `BillingTemplatesScreen`
    - Plans → `PlansScreen`
    - Notifications → `NotificationsScreen`
    - Security → `SecuritySettingsScreen`
    - Integrations → `IntegrationsScreen`
    - Settings → `SettingsRootScreen`
    - Logout → triggers logout and returns to `AuthStack`

### 2.2 Navigation Data Flow

- `App.tsx`:
  - Wraps app with:
    - `ThemeProvider`
    - `SupabaseContext`
    - `OrganizationContext`
    - `QueryClientProvider`
    - `NavigationContainer`
  - Root stack decides between `AuthStack` or `AppDrawer` based on auth session.

- Screen-to-screen navigation:
  - Uses typed navigation params (TypeScript) for safety:
    - Example: `InvoiceDetailScreen` receives `invoiceId`.
    - Example: `ProductDetailScreen` receives `productId`.

---

## 3. Component Hierarchy

### 3.1 Top-Level Structure

- `App.tsx`
  - `Providers`:
    - `ThemeProvider` (light/dark + BillZest tokens)
    - `SupabaseProvider` (client + session)
    - `OrganizationProvider` (user, business, settings)
    - `QueryClientProvider`
  - `NavigationContainer`
    - `RootStack`

### 3.2 Shared Components (in `/src/components`)

- **Layout**
  - `ScreenContainer` (handles safe area, background, padding, scroll vs fixed)
  - `AppBar` / `Header` (title, back button, action buttons)
  - `TabBar` (custom bottom tab style, matched to web)
  - `DrawerContent` (custom drawer UI, matched to web sidebar)

- **UI Elements**
  - `Button` (primary/secondary/ghost, loading state)
  - `IconButton`
  - `Text` (themed text variants: title, subtitle, body, caption)
  - `Input` / `TextField` (with label, helper/error text)
  - `Select` / `Dropdown` (for category, status)
  - `Switch` / `Toggle`
  - `Checkbox`, `Radio` (as needed in settings)
  - `Card` (for dashboard KPIs, list items)
  - `Chip` / `Badge` (status badges)

- **Data / Lists**
  - `ListItem` (generic)
  - `ProductListItem`
  - `CustomerListItem`
  - `InvoiceListItem`
  - `EmptyStateView`
  - `LoadingStateView`
  - `ErrorStateView`

- **Feedback**
  - `Toast` / Snackbar wrapper
  - `Modal` / `BottomSheet` (for payments, confirmations)

These components will be fully theme-aware (no hard-coded colors/fonts).

### 3.3 Screen Containers (in `/src/screens`)

Each screen:
- Uses shared components for layout and visuals.
- Delegates data fetching/mutations to:
  - Logic modules (`/logic`)
  - Or service modules (`/supabase`) indirectly via logic.

Example:
- `ProductsListScreen`
  - Calls `productLogic.useProductsList()` hook or uses `productService.list()` through query.
  - Renders list with `ProductListItem` inside `ScreenContainer`.

---

## 4. State Management Strategy

### 4.1 Types of State

- **Server State** (data from Supabase):
  - Products, Customers, Invoices, Purchases, Credit entries, Settings, etc.
- **Local-Only State:**
  - UI state (modals open, current tab filter, search text).
  - Theme preference override.
  - App lock (PIN/biometric) state.

### 4.2 Tools

- **React State / Hooks**
  - For local UI state within components/screens.

- **React Context / Zustand**
  - `ThemeContext`: active theme (light/dark/system) + toggle.
  - `AuthContext`: current user/session, login/logout actions.
  - `OrganizationContext`: business selection, settings.
  - `useAppSettingsStore` (Zustand): for client-side settings.

- **TanStack Query**
  - For server state fetching and caching.

---

## 5. Database Schemas (Supabase – High Level)

The mobile app **shares the exact same Supabase project and core schema** as the BillZest web app.

### 5.1 Existing Core Tables (Shared Web + Mobile)

**`bill_config`**  
- Configuration settings for billing generation.

**`clients`** (Parties) 
- Customer/Vendor information.

**`products`**  
- Inventory items.

**`invoices`**  
- Sales records.

**`invoice_items`**  
- Line items for each invoice.

**`payments`**  
- Payment records for invoices.

**`profiles`**  
- User profile information.

---

## 6. API Contract Definitions (Service Layer)

Located in `/src/supabase`. Each module exposes typed functions that interact directly with the Supabase client.

### 6.1 Supabase Client

- `supabaseClient.ts`
  - Exports configured Supabase client (URL + anon key).

### 6.2 Module Service Files

Each module exposes typed functions.

**`/src/supabase/productsService.ts`**
- `getProducts()`, `getProductById()`, `createProduct()`, `updateProduct()`, `deleteProduct()`.

**`/src/supabase/ordersService.ts`**
- `listOrders()`, `getOrderById()`, `createOrder()`, `updateOrder()`, `cancelOrder()`.

---

## 7. Error-Handling Model

### 7.1 Error Types

The system uses a standardized `AppError` type:
- `type`: `'server' | 'auth' | 'validation' | 'unknown'`
- `code`: string (e.g., Supabase error code)
- `message`: user-friendly message

### 7.2 Handling Strategy

- Service functions catch raw Supabase errors and convert to `AppError` using `toAppError()`.
- UI:
  - Uses generic `EmptyState` with retry for screen-level failures.
  - Uses inline error messages for forms.

---

## 8. Logic Layer Interactions

Located in `/src/logic`. Coordinates between UI screens and Supabase services.

---

## 9. Folder Structure

Within `BillZest_Mobile` project:

```text
BillZest_Mobile/
  App.tsx
  /src
    /screens
      /Dashboard
      /Products
      /Customers
      /Invoices
      /Purchase
      /CreditBook
      /Reports
      /Settings
      /Auth
    /components
    /navigation
    /theme
    /supabase
      supabaseClient.ts
      productsService.ts
      ...
    /logic
    /stores (Zustand)
    /types
    /utils
```