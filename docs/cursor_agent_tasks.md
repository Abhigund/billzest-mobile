# Cursor Agent Task List

**Agent Instructions:**
- **DATABASE DEPENDENT TASKS ARE CURRENTLY OUT OF SCOPE. Please completely ignore tasks involving RPC or SQL modifications.**
- You have access to the full codebase in Cursor.
- Execute ONE task at a time. Do not combine multiple tasks into a single run.
- Stop and ask for review after completing each task.
- Each task corresponds to exactly one finding from the audit and is designed to fit a 15-30 minute session.

*Note: The tasks are strictly ordered by Priority (Critical -> High -> Medium -> Low), and then grouped by file to minimize context switching. If a High priority task has dependencies on a lower priority task (e.g., calling an SQL RPC that must be created first), take care of the dependency first if possible.*

---

## 🟥 High Priority

### `src/supabase/ordersService.ts`
- [ ] **Task 1** (Audit 2.3): Modify `createOrder` (L183–L226). Replace the read-then-write stock loop with a call to `supabase.rpc('adjust_stock', { p_product_id, p_delta: -qty })` for each product. Remove the manual `select` + `update` loop. *(Note: Requires `adjust_stock` RPC from Task 6)*
- [ ] **Task 2** (Audit 2.4): Modify `cancelOrder` (L309–L343). Replace the manual stock restoration loop with a call to `supabase.rpc('cancel_order_restore_stock', { p_order_id: id })`. *(Note: Requires `cancel_order_restore_stock` RPC from Task 7)*

### `src/screens/Invoices/AddSaleScreen.tsx`
- [x] **Task 3** (Audit 2.6): Modify `handleGenerateBill` edit-mode branch (L394–L398). Currently only updates status to `'sent'`. Change to also send the current `lineItems` (mapped to `items` payload) and updated totals to `ordersService.updateOrder`.
- [x] **Task 4** (Audit 10.2): Refactor `AddSaleScreen.tsx`. Replace extracted functions (`validateInvoice()`, `handleGenerateBill()`, `handleBack()`, `handleScan()`, and mutation hooks) with calls to the newly created `useInvoiceFlow()`. Verify identical behavior. *(Note: Requires Task 5)*

### `src/screens/Invoices/hooks/useInvoiceFlow.ts`
- [x] **Task 5** (Audit 10.1): Create new file. Extract `validateInvoice()`, `handleGenerateBill()`, `handleBack()`, `handleScan()`, and all mutation hook calls (`useCreateOrder`, `useUpdateOrderStatus`, `useCreatePurchase`) from AddSaleScreen into a custom hook that returns `{ validate, submitInvoice, handleBack, handleScan, isSubmitting }`.

---

## 🟧 Medium Priority

### Supabase SQL Editor
- [ ] **Task 6** (Audit 2.1): Create and test the `adjust_stock` RPC function. Run it manually against a test product to confirm it returns correctly or raises on insufficient stock.
- [ ] **Task 7** (Audit 2.2): Create and test the `cancel_order_restore_stock` RPC function that takes `order_id` and restores stock atomically. Test with a cancelled order.

### `src/supabase/ordersService.ts`
- [x] **Task 8** (Audit 2.5): Modify `deleteOrder` (L357–L365). Add error check on `order_items` delete. If either delete fails, throw and don't leave orphans.

### `src/navigation/RootNavigator.tsx`
- [x] **Task 9** (Audit 6.1): Wrap the `Vendors` drawer screen's `SuppliersListScreen` (L313–L315) in a small `VendorsStack` navigator so it has a proper back button and can push to detail screens.
- [x] **Task 10** (Audit 9.2): Apply the param list types (`RootDrawerParamList`, `MainTabsParamList`, etc.) to all navigator calls (`createNativeStackNavigator<...>()`, `createBottomTabNavigator<...>()`, `createDrawerNavigator<...>()`).

### `src/screens/Invoices/AddSaleScreen.tsx`
- [x] **Task 11** (Audit 6.2): Wrap the root `<View>` in `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>`. Import `KeyboardAvoidingView` and `Platform`.
- [ ] **Task 12** (Audit 10.8): Final assembly. Convert `AddSaleScreen` to a ~200 line shell that wires up the `useInvoiceFlow` hook and renders the newly extracted components. *(Note: Do this after minor components are extracted)*

### `src/screens/Invoices/components/InvoiceItemsList.tsx`
- [x] **Task 13** (Audit 10.5): Create new component. Extract the items card (L574–L654 original) into its own component. Props: `lineItems`, `updateQuantity`, `removeLineItem`, `onAddItems`, `formatCurrency`, `tokens`.

### Global / Batch Refactoring
- [ ] **Task 14** (Audit 9.3): Replace `useNavigation<any>()` with typed `useNavigation<NativeStackNavigationProp<XxxParamList>>()` across all screens. (Perform in batches of 5-6 screens).
- [ ] **Task 15** (Audit 9.4): Replace `useRoute<any>()` with typed `useRoute<RouteProp<XxxParamList, 'ScreenName'>>()` across all screens.

---

## 🟨 Low Priority

### `src/screens/Invoices/AddSaleScreen.tsx`
- [x] **Task 16** (Audit 6.4): Replace `<View style={{ height: 120 }} />` (L758) with `paddingBottom: 120` on `scrollContent` style and remove the spacer View.
- [ ] **Task 17** (Audit 7.2): Replace local `formatCurrency` (L274) and `getInitials` (L324) with imports from `utils/formatting`. *(Requires Task 26)*
- [ ] **Task 18** (Audit 8.2): Replace `'#fff'` with `tokens.white` (or `tokens.primaryForeground`), `'#1a1a2e'` with `tokens.shadowColor`.
- [ ] **Task 19** (Audit 8.4): Add `accessibilityLabel` to: back button, party selector row, each stepper `−` button, each stepper `+` button, Generate Bill button, Save Draft button.
- [ ] **Task 20** (Audit 8.7): Add `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` to all stepper buttons (L609, L628).

### `src/screens/Invoices/AddItemsScreen.tsx`
- [ ] **Task 21** (Audit 6.3): Wrap content in `KeyboardAvoidingView` (same pattern as 6.2).
- [ ] **Task 22** (Audit 7.3): Replace local `formatCurrency` (L83) and `getInitials` (L52) with imports from `utils/formatting`.
- [ ] **Task 23** (Audit 8.3): Replace `'#fff'` with `tokens.white` (or `tokens.primaryForeground`) and `'#1a1a2e'` with `tokens.shadowColor`.
- [ ] **Task 24** (Audit 8.5): Add `accessibilityLabel` to: stepper `−` buttons, stepper `+` buttons, back button, "Add to Invoice" button, mic button.
- [ ] **Task 25** (Audit 8.8): Add `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` to all stepper buttons (L215, L240).

### `src/utils/formatting.ts`
- [ ] **Task 26** (Audit 7.1): Create file with `formatCurrency(val: number): string` and `getInitials(name: string): string` extracted from `AddSaleScreen`.

### `src/screens/Invoices/InvoicesListScreen.tsx`
- [ ] **Task 27** (Audit 7.4): If `formatCurrency` is defined locally, replace with import from `utils/formatting`.
- [ ] **Task 28** (Audit 11.4): Replace `rgba(0,0,0,0.15)` (L504) with a theme token.

### `src/utils/validation.ts` & `src/utils/validators.ts`
- [ ] **Task 29** (Audit 7.5): Determine which is in use. If one is dead, rename/delete. If both are used, merge into one with both sets of exports.

### `src/theme/tokens.ts`
- [ ] **Task 30** (Audit 8.1): Add tokens: `white: 'hsl(0, 0%, 100%)'`, `shadowColor: '#1a1a2e'`, `radiusSm: 8`, `radiusMd: 12`, `radiusLg: 16`, `radiusXl: 24`, `radiusFull: 999`.

### `src/screens/Dashboard/DashboardScreen.tsx`
- [ ] **Task 31** (Audit 8.6): Add `accessibilityLabel` to: date range pills, refresh button.
- [ ] **Task 32** (Audit 11.5): Reduce `paddingBottom` from `100` to `80` (L483).
- [ ] **Task 33** (Audit 11.6): Remove `rotateAnim` from the `useEffect` dependency array (L228–L240) to fix animation restart issue.

### `src/navigation/types.ts`
- [x] **Task 34** (Audit 9.1): Create navigation param list types `RootDrawerParamList`, `MainTabsParamList`, `DashboardStackParamList`, `ProductsStackParamList`, `CustomersStackParamList`, `InvoicesStackParamList`, `PurchaseStackParamList`, `CreditBookStackParamList`, `SettingsStackParamList`, `AuthStackParamList`. Each lists all route names and their expected params.

### Components Extraction
- [x] **Task 35** (Audit 10.3) - `src/screens/Invoices/components/InvoiceMetaStrip.tsx`: Extract the meta strip JSX (L492–L510 original) into its own component. Props: `isEditMode`, `invoiceId`, `invoiceDate`.
- [x] **Task 36** (Audit 10.4) - `src/screens/Invoices/components/BillToCard.tsx`: Extract the "Bill To" card (L512–L572 original). Props: `selectedClient`, `onOpenPartySheet`, `tokens`.
- [ ] **Task 37** (Audit 10.6) - `src/screens/Invoices/components/InvoiceTotalsCard.tsx`: Extract totals card + GST pills + Adjustments card. Props: computed values from store.
- [ ] **Task 38** (Audit 10.7) - `src/screens/Invoices/components/InvoiceBottomBar.tsx`: Extract the bottom CTA bar. Props: `onDraft`, `onGenerate`, `isSubmitting`, `isEditMode`, `mode`.

### Other Miscellaneous
- [ ] **Task 39** (Audit 11.1) - `src/utils/testSupabaseConnection.ts`: Gate all `console.log` calls behind `if (__DEV__)` or delete the file if it's not imported anywhere.
- [ ] **Task 40** (Audit 11.2) - `src/screens/Products/ProductsListScreen.tsx`: Replace `rgba(250,204,21,0.9)` (L624) with `tokens.warning` + opacity.
- [ ] **Task 41** (Audit 11.3) - `src/screens/Products/ProductsListScreen.tsx`: Replace `rgba(220,76,70,0.9)` (L630) with `tokens.destructive` + opacity.

---

## 🎨 Stitch Design Integration - Create Invoice Flow
*Note: These tasks represent the uncompleted Stitch designs and should be executed alongside or after the component extractions (Tasks 35-38).*

- [ ] **Task 42** (Stitch UI - Base Layout): Integrate **"Create Invoice (Green)"** design into the `AddSaleScreen` shell. Implement the "Architectural Editor" base, using `tokens.background`, removing 1px solid borders in favor of the "No-Line" rule with tonal surface layers.
- [ ] **Task 43** (Stitch UI - Party Selector): Integrate **"Select Party (Green)"** design into the `BillToCard` and the party selection list. Apply deep green `primary` tokens and Manrope typography for the customer names and balances.
- [ ] **Task 44** (Stitch UI - Adjustments): Integrate **"Edit Adjustments Bottom Sheet"** design into the invoice adjustments modal. Use functional glassmorphism, ambient shadows for the floating sheet, and soft `on_surface_variant` labels.
- [ ] **Task 45** (Stitch UI - CTAs): Integrate **"Updated Invoice Summary Buttons"** into the `InvoiceBottomBar` component. Build the sticky HUD footer with `surface_container_lowest` at 80% opacity and backdrop-blur, utilizing the refined green primary/secondary button specs.
