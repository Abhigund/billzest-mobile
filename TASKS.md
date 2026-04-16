# Cursor/Antigravity/Claude Agent Task List

**Agent Instructions:**
- **DATABASE DEPENDENT TASKS ARE CURRENTLY OUT OF SCOPE. Please completely ignore tasks involving RPC or SQL modifications.**
- You have access to the full codebase in IDE.
- Execute ONE task at a time. Do not combine multiple tasks into a single run.
- Stop and ask for review after completing each task.
- Each task corresponds to exactly one finding from the audit and is designed to fit a 15-30 minute session.
- When you pick task to work on move them to inprogress mode by [] => [/] before proceeding.
- When marking a task `[/]`, simultaneously add `locked-by: <session-id> | <timestamp>`
  on the same line before doing any code work.
- Before picking a task, if `[/]` is present, check the timestamp.
  If under 30 min, skip it. If over 30 min, it is stale — you may claim it.
  - If any task is pending then avoid picking any task related to it which might cause conflict between two agents.
- Before marking a task `[x]`, run in order:
1. `npx tsc --noEmit` — fix any type errors first
2. `npx expo lint` — fix all lint warnings/errors
- When committing, stage ONLY files directly modified by the current task.
  Do not stage unrelated files even if they show as modified in git status.
  Commit message format: `task(N): <one line description of what was done>`
  Example: `task(5): extract useInvoiceFlow hook from AddSaleScreen`
- When committing, include ONLY the specific task line(s) that were modified (e.g., status change [ ] → [/] → [x]) from tasks.md.
- Do NOT include the entire tasks.md file in the commit.
- Use partial staging (e.g., `git add -p`) to ensure only relevant task lines are committed.
Only after both pass, mark `[x]` and ask for review.
*Note: The tasks are strictly ordered by Priority (Critical -> High -> Medium -> Low), and then grouped by file to minimize context switching. If a High priority task has dependencies on a lower priority task (e.g., calling an SQL RPC that must be created first), take care of the dependency first if possible.*

---

## 🟥 High Priority

### `src/supabase/ordersService.ts`
- [ ] **Task 1** (Audit 2.3): Modify `createOrder` (L183–L226). Replace the read-then-write stock loop with a call to `supabase.rpc('adjust_stock', { p_product_id, p_delta: -qty })` for each product. Remove the manual `select` + `update` loop. *(Note: Requires `adjust_stock` RPC from Task 6)*
- [ ] **Task 2** (Audit 2.4): Modify `cancelOrder` (L309–L343). Replace the manual stock restoration loop with a call to `supabase.rpc('cancel_order_restore_stock', { p_order_id: id })`. *(Note: Requires `cancel_order_restore_stock` RPC from Task 7)*

---

## 🟧 Medium Priority

### Supabase SQL Editor *(Out of Scope — DB tasks)*
- [ ] **Task 6** (Audit 2.1): Create and test the `adjust_stock` RPC function.
- [ ] **Task 7** (Audit 2.2): Create and test the `cancel_order_restore_stock` RPC function.

### `src/screens/Invoices/AddSaleScreen.tsx`
- [ ] **Task 18** (Audit 8.2): Replace `'#fff'` with `tokens.white` (or `tokens.primaryForeground`), `'#1a1a2e'` with `tokens.shadowColor`.
- [ ] **Task 19** (Audit 8.4): Add `accessibilityLabel` to: back button, party selector row, each stepper `−`/`+` button, Generate Bill button, Save Draft button.
- [ ] **Task 20** (Audit 8.7): Add `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` to all stepper buttons (L609, L628).

### `src/screens/Invoices/AddItemsScreen.tsx`
- [ ] **Task 21** (Audit 6.3): Wrap content in `KeyboardAvoidingView` (same pattern as `AddSaleScreen`).
- [ ] **Task 24** (Audit 8.5): Add `accessibilityLabel` and `hitSlop` to stepper −/+ buttons, back button, "Add to Invoice" button, mic button (L215, L240).

### `src/screens/Invoices/InvoicesListScreen.tsx`
- [/] **Task 72** (Audit Invoices): Implement `onEndReached` + incremental fetching inside `useOrders` instead of exhaustive load. locked-by: antigravity-session | 2026-04-14 23:25:00 +05:30
- [/] **Task 73** (Audit Invoices): Replace `useNavigation<any>()` / `useRoute<any>()` with explicit typed generics in `InvoicesListScreen.tsx`, `InvoiceDetailScreen.tsx`, and `AddSaleScreen.tsx`. locked-by: antigravity-session | 2026-04-14 23:25:00 +05:30

---

## 🟨 Low Priority

### `src/utils/validation.ts` & `src/utils/validators.ts`
- [ ] **Task 29** (Audit 7.5): Determine which is in use. If one is dead, rename/delete. If both are used, merge into one with both sets of exports.

### `src/screens/Dashboard/DashboardScreen.tsx`
- [ ] **Task 31** (Audit 8.6): Add `accessibilityLabel` to date range pills and refresh button.
- [ ] **Task 32** (Audit 11.5): Reduce `paddingBottom` from `100` to `80` (L483).

### UI / UX — Products Module
- [ ] **Task 53** (Audit): Enforce the Stitch "No-Line Rule" across `ProductsListScreen`, `ProductFormScreen`, `ProductDetailScreen`, `StockSummaryScreen`, `CategoriesListScreen`, and `ProductCard` — eliminate all `borderWidth: 1` occurrences, replace with tonal surface backgrounds.
- [ ] **Task 54** (Audit): Remove hardcoded `rgba()` strings in `ProductsListScreen.tsx` and `ProductCard.tsx` (e.g. `rgba(254,176,77,0.18)`), replace with token + opacity.
- [ ] **Task 55** (Audit): Add `hitSlop` to functional action icons (`EyeOff`, `Edit`, `Trash2`) in `CategoriesListScreen.tsx`.
- [ ] **Task 56** (Audit): Remove `Platform.OS === 'ios'` padding hack in `CategoryFormSheet.tsx`, use proper modal layout instead.

### UI / UX — Customers Module
- [ ] **Task 65** (Audit 3.1): `CustomerFormScreen.tsx` — replace generic `Alert.alert` validation with inline field-specific errors; disable save button while submitting.
- [ ] **Task 66** (Audit 3.2): `CustomerCard.tsx` — remove `borderWidth: 1` and hardcoded `rgba(...)`, switch to token-driven tonal surfaces and shadows.
- [ ] **Task 67** (Audit 3.3): `PartyDropdown.tsx` — remove hard 1px borders, replace with theme surface styling on modal and trigger row.

### UI / UX — Invoices Module
- [ ] **Task 74** (Audit Invoices): Remove all `borderWidth: 1` from `InvoicesListScreen.tsx` and `InvoiceDetailScreen.tsx` (Stitch "No-Line Rule").
- [ ] **Task 75** (Audit Invoices): Replace hardcoded `#fff` / `rgba(0,0,0,0.15)` in `InvoicesListScreen.tsx` and `InvoiceDetailScreen.tsx` with `tokens.*` mappings.
- [ ] **Task 76** (Audit Invoices): Add `hitSlop` to standalone icon actions (Filter, Search, Scan, etc.) in `InvoicesListScreen.tsx` and `InvoiceDetailScreen.tsx`.
- [ ] **Task 77** (Audit Invoices): `ordersService.ts` `createOrder` — replace split `orders` + `order_items` writes with a single `create_order` RPC-backed transactional write. *(DB dependency; keep service-side fallback guard until RPC available)*

---

## 🎨 Stitch Design Integration — Create Invoice Flow
*Execute alongside or after component extractions (Tasks 35–38).*

- [/] **Task 42** (Stitch UI - Base Layout): Integrate **"Create Invoice (Green)"** design into `AddSaleScreen`. Apply "Architectural Editor" base with `tokens.background`, "No-Line" rule, tonal surface layers. locked-by: antigravity-session | 2026-04-14 23:25:00 +05:30
- [ ] **Task 43** (Stitch UI - Party Selector): Integrate **"Select Party (Green)"** design into `BillToCard` and party selection list. Apply deep green `primary` tokens and Manrope typography.
- [ ] **Task 44** (Stitch UI - Adjustments): Integrate **"Edit Adjustments Bottom Sheet"** design — glassmorphism, ambient shadows on floating sheet, soft `on_surface_variant` labels.
- [ ] **Task 45** (Stitch UI - CTAs): Integrate **"Updated Invoice Summary Buttons"** into `InvoiceBottomBar`. Build sticky HUD footer with `surface_container_lowest` at 80% opacity + backdrop-blur.

---

## 🟧 Medium Priority (Products Audit)

### `src/screens/Products/ProductStockAdjustScreen.tsx`
- [ ] **Task 94** (Audit 4.1): Uncomment and wire the commented stock adjustment UI (L73–152) to backend. Call `supabase.from('stock_ledger').insert()` with `movement_type: 'ADJUSTMENT'` and sync `products.stock_quantity`.

### `src/screens/Products/ProductsListScreen.tsx`
- [ ] **Task 95** (Audit 5.1): Add pagination — replace `getProducts()` with paginated `.range(from, to)` query; add `onEndReached` infinite scroll to FlatList.

### `src/logic/productLogic.ts`
- [ ] **Task 96** (Audit 3.1): Add realtime sync subscription. `useEffect` with `supabase.channel('products-realtime')` subscribing to `postgres_changes`, invalidating `['products', orgId]` on changes.
- [ ] **Task 97** (Audit 3.2): Create `useInventoryStats()` hook returning `{ totalProducts, totalInventory, purchaseValue, saleValue, potentialProfit, profitMargin, lowStockCount, outOfStockCount }`.

### `src/screens/Products/StockSummaryScreen.tsx`
- [ ] **Task 98** (Audit 5.2): Wire up "Show stock as on Date" Switch, Filter pill, and Header Export buttons to actual implementations (or hide if not available).

### Design System — No-Line (Products)
- [ ] **Task 99** (Audit 1.1): Remove hardcoded borders from all Products screens. Eliminate `borderWidth: 1` in `ProductsListScreen.tsx`, `ProductFormScreen.tsx`, `ProductCard.tsx`, `StockSummaryScreen.tsx`, `CategoriesListScreen.tsx`, `CategoryFormSheet.tsx`. Replace with tonal surface per Stitch "No-Line Rule". *(Supersedes Tasks 53–56 where they overlap)*

---

## 🟨 Low Priority (Products Audit)

### `src/screens/Products/ProductDetailScreen.tsx`
- [ ] **Task 100** (Audit 4.2): Add batch tracking panel — tab or section showing batch numbers, quantities, mfg/expiry dates from `batches` table.

### `src/screens/Products/ProductFormScreen.tsx`
- [ ] **Task 101** (Audit 4.3): Add product variants support — extend form to support size/color variants with separate SKUs and prices.
- [ ] **Task 102** (Audit 4.4): Add image upload — integrate `expo-image-picker`, upload to Supabase storage, store `image_url` in product record.

### `src/screens/Inventory/BarcodeGeneratorScreen.tsx`
- [ ] **Task 103** (Audit UX): Add barcode format options (CODE128, EAN, UPC) and label size presets in label settings section (L261–286).

---

## 🟥 High Priority (App-Wide UI/UX Audit)

### `src/screens/Reports/ReportsScreen.tsx`
- [x] **Task 104** (Audit P0): Fixed double-header bug — removed `backHeader` block (L168–L181), corrected typed navigation, collapsed to single header, replaced `createStyles` with `useMemo`, typed `useNavigation()`.

### `src/screens/Settings/SettingsScreen.tsx`
- [x] **Task 105** (Audit P0): Fixed Settings back arrow — replaced `navigate('Home' as never)` with `navigation.goBack()`.

### `src/screens/Expenses/ExpensesScreen.tsx`
- [x] **Task 106** (Audit P0): Fixed dead-tap expense rows — removed `Pressable` wrapper, added `ListHeader title="Expenses"`, removed bespoke header block, typed `useNavigation()`.

### `src/screens/Purchase/PurchaseListScreen.tsx`
- [x] **Task 107** (Audit P0): Added `ListHeader title="Purchases"`, replaced `ScreenWrapper` root with `View + ScrollView`, fixed FAB icon color to `tokens.primaryForeground`.

---

## 🟧 Medium Priority (App-Wide UI/UX Audit)

### Settings Sub-Screens
- [x] **Task 108** (Audit P1): Verified — active Settings sub-screens already have `DetailHeader`. Inactive screens (Security, Notifications, Plans, Integrations) are commented out of navigation. No action needed.

### No-Line Rule — Batch C1 (Expenses + Purchase)
- [x] **Task 110** (Audit P1): Removed `borderWidth: 1` from `PurchaseListScreen`, `PurchaseDetailScreen`, `CreatePurchaseScreen`. Tonal surface + shadow applied.
- [/] **Task 110b** (Audit P1 — remaining): Remove `borderWidth: 1` from `ExpensesScreen.tsx` (totalCard, card, cardFooter). locked-by: antigravity-session | 2026-04-17 01:02:00 +05:30

### No-Line Rule — Batch C2 (Reports + CreditBook)
- [/] **Task 111** (Audit P1): Remove `borderWidth: 1` from `ReportsScreen.tsx` (exportButton, filterContainer, chartCard, chartArea borderBottomWidth), `PartyLedgerScreen.tsx` (3 occurrences), `AddCreditTransactionSheet.tsx` (2 occurrences). locked-by: antigravity-session | 2026-04-17 01:02:00 +05:30

### No-Line Rule — Batch C3 (Settings Module)
- [x] **Task 112** (Audit P1): Removed `borderWidth: 1` from `OnlineStoreConfigScreen` and `BillingTemplatesScreen`. Inactive screens commented out.

### No-Line Rule — Batch C4 (Auth + Invoice flows)
- [/] **Task 113** (Audit P1): Remove `borderWidth: 1` from `LoginScreen.tsx` (card), `SimplifiedPOSScreen.tsx` (2+), `InvoiceSummaryScreen.tsx` (1+), remaining `InvoiceDetailScreen.tsx` button borders, `BarcodeGeneratorScreen.tsx`. locked-by: antigravity-session | 2026-04-17 01:02:00 +05:30

### Hardcoded Color Sweep D1 — `#fff` icon colors
- [x] **Task 114** (Audit P1): Fixed `BillingTemplatesScreen`, `CreatePurchaseScreen`, `PurchaseListScreen`. Remaining minor instances in `SuppliersListScreen`, `ProductsListScreen`, `InvoicesListScreen` tracked in audit report.
- [/] **Task 114b** (Audit P1 — remaining): Replace `color="#fff"` on icon components in: `SuppliersListScreen`, `ProductsListScreen`, `InvoicesListScreen`, `CustomersListScreen`, `ExpensesScreen` (FAB), `InvoiceDetailScreen`, `SimplifiedPOSScreen`, `AddExpenseSheet`, `PartyFilterSheet`. Use `tokens.primaryForeground` or `tokens.white`. locked-by: antigravity-session | 2026-04-17 01:02:00 +05:30

### Hardcoded Color Sweep D2 — `shadowColor: '#000'`
- [/] **Task 115** (Audit P1): Replace `shadowColor: '#000'` with `tokens.shadowColor` in: `LoginScreen.tsx`, `FAB.tsx`, `ProductFormScreen.tsx`, `ProductDetailScreen.tsx`, `BarcodeGeneratorScreen.tsx`, `ItemSelectionSheet.tsx`. locked-by: antigravity-session | 2026-04-17 01:02:00 +05:30

### Hardcoded Color Sweep D3 — Inline `rgba()` in Dashboard + CreditBook
- [/] **Task 116** (Audit P1): Replace inline `rgba()` with token equivalents. `DashboardScreen.tsx`: `rgba(0,110,45,...)` → `tokens.primaryAlpha*`. `CreditBookScreen.tsx`: `rgba(239,68,68,0.10)` → `tokens.destructiveAlpha10`, `rgba(29,185,84,0.10)` → `tokens.primaryAlpha10`, `tokens.primary + '15'` → `tokens.primaryAlpha15`. locked-by: antigravity-session | 2026-04-17 01:02:00 +05:30

---

## 🟨 Low Priority (App-Wide UI/UX Audit)

### Untyped Navigation Cleanup — Batch F
- [ ] **Task 119** (Audit P2): Fix remaining untyped `useNavigation()` calls (beyond Task 73). Files: `ExpensesScreen.tsx`, `ReportsScreen.tsx` → `NavigationProp<AppNavigationParamList>`; `ProductStockAdjustScreen.tsx` → `NativeStackNavigationProp<ProductsStackParamList>`; `OnlineStoreConfigScreen.tsx` → `NativeStackNavigationProp<SettingsStackParamList>`; `ListHeader.tsx`, `DetailHeader.tsx` → `NavigationProp<AppNavigationParamList>`.

### Spacing/Radius Token Sweeps
- [ ] **Task 117** (Audit P2): Standardize spacing/radius in `ExpensesScreen.tsx`. Replace raw values: `padding: 20` → `tokens.spacingXl`, `borderRadius: 20` → `tokens.radiusXl`, `borderRadius: 16` → `tokens.radiusLg`, `padding: 18` → `tokens.spacingLg`, separator `height: 14` → `tokens.spacingMd`.

### Dead Code + Dev Artifact Removal
- [ ] **Task 121** (Audit P3): Remove unused `import { testSupabaseConnection }` from `LoginScreen.tsx`. Remove the dead empty `<ScreenWrapper>` block at `ProductStockAdjustScreen.tsx` L146–152.

### `formatCurrency` Consolidation
- [ ] **Task 122** (Audit P3): Replace local `formatCurrency` definitions in `PurchaseListScreen.tsx` and `ExpensesScreen.tsx` with imports from `src/utils/formatting.ts`.

---

## 🐛 Bugs (From Supabase Audit — Apr 17, 2026)

### P1: Critical Data Integrity

- [x] **Bug 1** (Audit P1-002): Fix inventory value calculation in `dashboardService.ts`. Change `selling_price` to `purchase_price` for accurate cost-basis valuation.
  - **File:** `src/supabase/dashboardService.ts:174-176`
  - **Fix:** `(r.purchase_price ?? 0) * (r.stock_quantity ?? 0)`

- [ ] **Bug 2** (Audit P1-001): Add stock restoration to `deleteOrder()` or disable order deletion for orders with items. Currently deletes items without restoring stock.
  - **File:** `src/supabase/ordersService.ts:372-391`
  - **Options:** (1) Add restoration like `cancelOrder`, (2) Disable delete for orders with items, (3) Soft-delete pattern.

### P2: UX/Data Sync Issues

- [ ] **Bug 3** (Audit P2-002): Stock adjustment failures in `createOrder` are silently swallowed. Add error toast/alert when stock adjustment fails.
  - **File:** `src/supabase/ordersService.ts:219-221`

- [ ] **Bug 4** (Audit P2-003): Remove hardcoded weekly visualization data from Dashboard.
  - **File:** `src/screens/Dashboard/DashboardScreen.tsx:46`
  - **Fix:** Replace `WEEKLY_BARS` constant with actual trend data from `reportsService.getWeeklyTrend()` or remove chart.

- [ ] **Bug 5** (Audit P2-005): Dashboard credit summary errors not shown to users.
  - **File:** `src/screens/Dashboard/DashboardScreen.tsx:81-100`
  - **Fix:** Add error state UI for receivables/payables section when query fails.

---

## 🔍 Need Review (Manual Verification Required)

### Security & Database *(Requires Supabase Console Access)*

- [ ] **Review 1** (Audit P1-003): **Verify RLS policies are enabled** on all production tables (`orders`, `order_items`, `products`, `parties`, `purchase_orders`, `payments`, `credit_transactions`, `stock_ledger`). Required policy pattern: `USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))`.

- [ ] **Review 2** (Audit P2-001): **Decision needed on Realtime subscriptions** — no realtime sync currently implemented. Options: (1) Supabase Realtime for critical tables, (2) Accept pull-to-refresh, (3) Periodic background sync.

- [ ] **Review 3**: **Verify unique constraints** on `products(barcode, org_id)`, `products(sku, org_id)`, `parties(phone, org_id)`, `orders(invoice_number, org_id)`.

### Business Logic Verification

- [ ] **Review 4** (Audit P2-004): **Network error handling strategy**. Options: (1) NetInfo with offline error messages, (2) Offline queue, (3) Simple "Check connection" retry button.

- [ ] **Review 5**: **Order deletion policy**. `deleteOrder` has stock inconsistency bug (Bug 2). Decision: allow permanent delete or force cancel-only?

### Test Matrix Verification

- [ ] **Review 6**: Run manual test scenarios on production build:
  1. Fresh signup → organization created correctly
  2. Create product → appears in search immediately
  3. Create invoice with 5 items → stock reduces correctly
  4. Cancel invoice → stock restores correctly
  5. Delete invoice (if enabled) → verify stock handling
  6. Record payment → balance updates in Credit Book
  7. Check Dashboard → all KPIs match manual calculations
  8. Multi-device: Login on 2 devices, verify data sync

---

## 📊 Audit Summary

**Audit Date:** April 17, 2026
**Scope:** Full Supabase wiring verification
**Overall Status:** 85% Production Ready

| Severity | Count | Status |
|----------|-------|--------|
| P0 Critical | 0 | ✅ None found |
| P1 High | 3 | ⚠️ Action required |
| P2 Medium | 5 | 📋 Plan to address |
| P3 Low | 4 | 💡 Nice to have |

**Immediate Blockers for Production:**
- Bug 1 (Inventory value calculation)
- Review 1 (RLS policy verification)
- Bug 2 (Order deletion stock handling)

**Supabase Integration Quality:** Strong architecture with proper type safety, React Query integration, and organization-based data isolation. Main gaps are in edge-case data integrity and real-time sync.
