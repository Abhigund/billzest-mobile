# BillZest Mobile — Audit Remediation Implementation Plan

---

---

---

## Phase 2: Data Integrity — Stock Race Condition & Edit Mode

**Goal:** Prevent stock oversell on concurrent orders and fix the edit-mode invoice flow that silently discards changes.

**Prerequisites:**
- Phase 1 committed and verified
- Access to Supabase SQL Editor
- Ability to test with two simultaneous browser tabs or devices

### Task List

| # | File | Change | Risk | Est. |
|---|------|--------|------|------|
| 2.1 | **Supabase SQL Editor** | Create and test the `adjust_stock` RPC function (see SQL below). Run it manually against a test product to confirm it returns correctly or raises on insufficient stock. **Do NOT touch app code yet.** | Medium | 30 min |
| 2.2 | **Supabase SQL Editor** | Create and test the `cancel_order_restore_stock` RPC function that takes `order_id` and restores stock atomically. Test with a cancelled order. | Medium | 30 min |
| 2.3 | `src/supabase/ordersService.ts` | **L183–L226 (`createOrder`):** Replace the read-then-write stock loop with a call to `supabase.rpc('adjust_stock', { p_product_id, p_delta: -qty })` for each product. Remove the manual `select` + `update` loop. | High | 45 min |
| 2.4 | `src/supabase/ordersService.ts` | **L309–L343 (`cancelOrder`):** Replace the manual stock restoration loop with a call to `supabase.rpc('cancel_order_restore_stock', { p_order_id: id })`. | High | 30 min |
| 2.5 | `src/supabase/ordersService.ts` | **L357–L365 (`deleteOrder`):** Add error check on `order_items` delete. If either delete fails, throw and don't leave orphans. | Medium | 15 min |
| 2.6 | `src/screens/Invoices/AddSaleScreen.tsx` | **L394–L398 (edit-mode `handleGenerateBill`):** Currently only updates status to `'sent'`. Change to also send the current `lineItems` (mapped to `items` payload) and updated totals to `ordersService.updateOrder`. | High | 45 min |

> [!IMPORTANT]
> Task 2.6 is a **bug fix**, not a refactor of AddSaleScreen. Change only the `handleGenerateBill` edit-mode branch. Do not restructure the rest of the function.

#### SQL for Task 2.1 — `adjust_stock` RPC

```sql
-- Test in Supabase SQL Editor FIRST
CREATE OR REPLACE FUNCTION public.adjust_stock(
  p_product_id UUID,
  p_delta INT,
  p_org_id UUID,
  p_reference_id UUID DEFAULT NULL,
  p_movement_type TEXT DEFAULT 'SALE',
  p_notes TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atomic stock update
  UPDATE products
    SET stock_quantity = stock_quantity + p_delta
    WHERE id = p_product_id
      AND organization_id = p_org_id;

  -- Ledger entry
  INSERT INTO stock_ledger (organization_id, product_id, quantity_change, movement_type, reference_id, notes, created_by)
  VALUES (p_org_id, p_product_id, p_delta, p_movement_type, p_reference_id, p_notes, p_user_id);
END;
$$;
```

#### SQL for Task 2.2 — Verification query
```sql
-- After creating the RPC, test:
SELECT adjust_stock(
  'YOUR_TEST_PRODUCT_UUID'::uuid, 
  -1, 
  'YOUR_ORG_UUID'::uuid,
  NULL,
  'SALE',
  'Test adjust',
  NULL
);
-- Then verify: SELECT stock_quantity FROM products WHERE id = 'YOUR_TEST_PRODUCT_UUID';
-- And: SELECT * FROM stock_ledger WHERE product_id = 'YOUR_TEST_PRODUCT_UUID' ORDER BY created_at DESC LIMIT 1;
```

### Commit Strategy
- **Commit 1:** Tasks 2.1 + 2.2 — SQL migration file only (save in `sql-dump/migrations/001_adjust_stock_rpc.sql`)
- **Commit 2:** Tasks 2.3 + 2.4 → `fix: use atomic RPC for stock adjustments in order create/cancel`
- **Commit 3:** Task 2.5 → `fix: check delete errors in deleteOrder to prevent orphaned items`
- **Commit 4:** Task 2.6 → `fix: edit mode now sends updated line items and totals`

### Verification Checklist
- [ ] Create an invoice with 2 items → stock decreases by correct amounts
- [ ] Cancel that invoice → stock restores exactly
- [ ] Create two invoices rapidly for the same low-stock product → second one correctly reflects updated stock (no oversell)
- [ ] Edit an existing invoice: change quantities, add/remove items, save → changes persist when you re-open the invoice
- [ ] Delete an order → no orphaned `order_items` rows (check in Supabase table editor)
- [ ] Full critical path (Smoke Test #28)

### Rollback Plan
- **SQL:** `DROP FUNCTION IF EXISTS public.adjust_stock; DROP FUNCTION IF EXISTS public.cancel_order_restore_stock;` — the old JS logic still works (just racy), so reverting app commits alone is safe.
- **App:** Revert commits 2–4. Commit 1 (SQL file) can stay since the RPC is not called.

---

---

---

## Phase 6: Navigation Fixes & KeyboardAvoidingView

**Goal:** Fix the dead-end Vendors drawer screen and add `KeyboardAvoidingView` to screens with text inputs.

**Prerequisites:**
- None (independent of other phases, but best done after Phase 5 to avoid merge conflicts)

> [!NOTE]
> **Parallelizable:** Can be developed on a separate branch alongside Phase 5.

### Task List

| # | File | Change | Risk | Est. |
|---|------|--------|------|------|
| 6.1 | `src/navigation/RootNavigator.tsx` | **L313–L315:** Wrap the `Vendors` drawer screen's `SuppliersListScreen` in a small `VendorsStack` navigator (same pattern as `ExpensesStack`) so it has a proper back button and can push to detail screens. | Medium | 20 min |
| 6.2 | `src/screens/Invoices/AddSaleScreen.tsx` | Wrap the root `<View>` in `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>`. Import `KeyboardAvoidingView` and `Platform`. | Medium | 15 min |
| 6.3 | `src/screens/Invoices/AddItemsScreen.tsx` | Wrap content in `KeyboardAvoidingView` (same pattern as 6.2) | Low | 10 min |
| 6.4 | `src/screens/Invoices/AddSaleScreen.tsx` | **L758:** Replace `<View style={{ height: 120 }} />` with `paddingBottom: 120` on `scrollContent` style and remove the spacer View | Low | 5 min |

### Commit Strategy
- **Commit 1:** Task 6.1 → `fix: wrap Vendors drawer screen in stack navigator for proper back nav`
- **Commit 2:** Tasks 6.2 + 6.3 → `fix: add KeyboardAvoidingView to AddSaleScreen and AddItemsScreen`
- **Commit 3:** Task 6.4 → `fix: replace hardcoded spacer with paddingBottom`

### Verification Checklist
- [ ] Drawer → Vendors → tap a vendor (if detail screen exists) → back button works
- [ ] Drawer → Vendors → hardware back button returns to drawer, not dead-end
- [ ] AddSaleScreen: tap search bar → keyboard opens → scroll content is not obscured on iOS
- [ ] AddItemsScreen: tap search box → keyboard opens → product list remains scrollable
- [ ] Smoke Test #23 (Screen Navigation)

### Rollback Plan
Revert commits individually. All changes are UI-only, no data impact.

---

## Phase 7: Shared Utilities Extraction

**Goal:** Eliminate duplicated code (`formatCurrency`, `getInitials`) and consolidate validation files.

**Prerequisites:**
- Phase 5 committed (to avoid merge conflicts on the files being touched)

### Task List

| # | File | Change | Risk | Est. |
|---|------|--------|------|------|
| 7.1 | `src/utils/formatting.ts` | **[NEW]** Create file with `formatCurrency(val: number): string` and `getInitials(name: string): string` extracted from AddSaleScreen | Low | 10 min |
| 7.2 | `src/screens/Invoices/AddSaleScreen.tsx` | Replace local `formatCurrency` (L274) and `getInitials` (L324) with imports from `utils/formatting` | Low | 5 min |
| 7.3 | `src/screens/Invoices/AddItemsScreen.tsx` | Replace local `formatCurrency` (L83) and `getInitials` (L52) with imports from `utils/formatting` | Low | 5 min |
| 7.4 | `src/screens/Invoices/InvoicesListScreen.tsx` | If `formatCurrency` is defined locally, replace with import | Low | 5 min |
| 7.5 | Audit `src/utils/validation.ts` vs `src/utils/validators.ts` | Determine which is in use. If one is dead, rename/delete. If both are used, merge into one with both sets of exports. | Low | 20 min |

### Commit Strategy
- **Commit 1:** Tasks 7.1 + 7.2 + 7.3 + 7.4 → `refactor: extract shared formatCurrency and getInitials to utils`
- **Commit 2:** Task 7.5 → `refactor: consolidate validation/validators into single utils file`

### Verification Checklist
- [ ] AddSaleScreen: currency values still formatted correctly (₹ symbol, Indian numbering)
- [ ] AddItemsScreen: product initials display correctly
- [ ] Build succeeds with no unused import warnings
- [ ] Grep for `formatCurrency` — only appears in `utils/formatting.ts` and imports, nowhere else inline

### Rollback Plan
Revert commits. Pure refactor, no behavior change.

---

## Phase 9: Navigation Type Safety

**Goal:** Add TypeScript types for navigation params, eliminating all `useNavigation<any>()` and `useRoute<any>()`.

**Prerequisites:**
- Phases 1, 5, 6 committed (navigation structure is stable)

### Task List

| # | File | Change | Risk | Est. |
|---|------|--------|------|------|
| 9.1 | `src/navigation/types.ts` | **[NEW]** Define `RootDrawerParamList`, `MainTabsParamList`, `DashboardStackParamList`, `ProductsStackParamList`, `CustomersStackParamList`, `InvoicesStackParamList`, `PurchaseStackParamList`, `CreditBookStackParamList`, `SettingsStackParamList`, `AuthStackParamList`. Each lists all route names and their expected params (or `undefined`). | Low | 45 min |
| 9.2 | `src/navigation/RootNavigator.tsx` | Apply the param list types to all `createNativeStackNavigator<...>()`, `createBottomTabNavigator<...>()`, `createDrawerNavigator<...>()` calls | Medium | 30 min |
| 9.3 | All screens (batch) | Replace `useNavigation<any>()` with typed `useNavigation<NativeStackNavigationProp<XxxParamList>>()` — do 5–6 screens per sub-commit | Medium | 90 min |
| 9.4 | All screens (batch) | Replace `useRoute<any>()` with typed `useRoute<RouteProp<XxxParamList, 'ScreenName'>>()` | Medium | 60 min |

### Commit Strategy
- **Commit 1:** Task 9.1 → `types: define navigation param list types`
- **Commit 2:** Task 9.2 → `types: apply param lists to navigator factories`
- **Commits 3–6:** Task 9.3 (batched by tab/stack) → `types: add typed navigation hooks to [Product/Invoice/Customer/Dashboard] screens`
- **Commit 7:** Task 9.4 → `types: add typed useRoute hooks across all screens`

### Verification Checklist
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] Navigate between all screens — no runtime crashes
- [ ] Smoke Tests #23 (Screen Navigation)

### Rollback Plan
Revert all commits in this phase. Type-only changes have zero runtime impact — the only risk is compile errors.

---

## Phase 10: AddSaleScreen Component Split (Large Refactor)

**Goal:** Break the 1235-line `AddSaleScreen` into focused, single-responsibility components.

**Prerequisites:**
- All prior phases committed and stable
- Smoke Test #28 (Critical Path) passes
- Suggest creating a feature branch: `refactor/split-add-sale-screen`

> [!IMPORTANT]
> This is broken into 5 independently deployable sub-steps. **Deploy and verify after each sub-step** before starting the next. Each sub-step should leave the AddSaleScreen in a fully functional state.

### Task List

| # | File | Change | Risk | Est. |
|---|------|--------|------|------|
| 10.1 | `src/screens/Invoices/hooks/useInvoiceFlow.ts` | **[NEW]** Extract: `validateInvoice()`, `handleGenerateBill()`, `handleBack()`, `handleScan()` and all the mutation hook calls (`useCreateOrder`, `useUpdateOrderStatus`, `useCreatePurchase`) into a custom hook that returns `{ validate, submitInvoice, handleBack, handleScan, isSubmitting }`. AddSaleScreen calls this hook instead of having all the logic inline. | High | 90 min |
| 10.2 | `src/screens/Invoices/AddSaleScreen.tsx` | Replace extracted functions with calls to `useInvoiceFlow()`. Verify identical behavior. | High | 30 min |
| 10.3 | `src/screens/Invoices/components/InvoiceMetaStrip.tsx` | **[NEW]** Extract the meta strip JSX (L492–L510 original) into its own component. Props: `isEditMode`, `invoiceId`, `invoiceDate`. | Low | 20 min |
| 10.4 | `src/screens/Invoices/components/BillToCard.tsx` | **[NEW]** Extract the "Bill To" card (L512–L572 original). Props: `selectedClient`, `onOpenPartySheet`, `tokens`. | Low | 25 min |
| 10.5 | `src/screens/Invoices/components/InvoiceItemsList.tsx` | **[NEW]** Extract the items card (L574–L654 original). Props: `lineItems`, `updateQuantity`, `removeLineItem`, `onAddItems`, `formatCurrency`, `tokens`. | Medium | 30 min |
| 10.6 | `src/screens/Invoices/components/InvoiceTotalsCard.tsx` | **[NEW]** Extract totals card + GST pills + Adjustments card. Props: computed values from store. | Low | 25 min |
| 10.7 | `src/screens/Invoices/components/InvoiceBottomBar.tsx` | **[NEW]** Extract the bottom CTA bar. Props: `onDraft`, `onGenerate`, `isSubmitting`, `isEditMode`, `mode`. | Low | 15 min |
| 10.8 | `src/screens/Invoices/AddSaleScreen.tsx` | Final assembly: AddSaleScreen should be ~200 lines — a shell that wires up the hook and renders the extracted components. | Medium | 30 min |

### Commit Strategy
- **Commit 1:** Tasks 10.1 + 10.2 → `refactor: extract useInvoiceFlow hook from AddSaleScreen`
  - **DEPLOY & TEST before continuing**
- **Commit 2:** Tasks 10.3 + 10.4 → `refactor: extract InvoiceMetaStrip and BillToCard`
- **Commit 3:** Tasks 10.5 + 10.6 → `refactor: extract InvoiceItemsList and InvoiceTotalsCard`
- **Commit 4:** Tasks 10.7 + 10.8 → `refactor: extract InvoiceBottomBar, finalize AddSaleScreen split`

### Verification Checklist (run after EVERY commit)
- [ ] Create a new sale invoice end-to-end
- [ ] Edit an existing invoice
- [ ] Create a purchase order
- [ ] Barcode scanner opens and finds a product
- [ ] Adjustments (discount, charge, round-off) apply correctly
- [ ] Party selection works
- [ ] Back button shows "Park Sale?" dialog when items exist
- [ ] Smoke Test #9 + Smoke Test #28

### Rollback Plan
Revert to the last passing commit in this phase. Since each commit is independently functional, you can stop mid-phase and the app still works.

---

## Phase 11: Final Cleanup

**Goal:** Remove dead code, clean up minor issues.

**Prerequisites:**
- All prior phases complete

### Task List

| # | File | Change | Risk | Est. |
|---|------|--------|------|------|
| 11.1 | `src/utils/testSupabaseConnection.ts` | Gate all `console.log` calls behind `if (__DEV__)` or delete the file if it's not imported anywhere | Low | 10 min |
| 11.2 | `src/screens/Products/ProductsListScreen.tsx` | **L624:** Replace `rgba(250,204,21,0.9)` with `tokens.warning` + opacity | Low | 5 min |
| 11.3 | `src/screens/Products/ProductsListScreen.tsx` | **L630:** Replace `rgba(220,76,70,0.9)` with `tokens.destructive` + opacity | Low | 5 min |
| 11.4 | `src/screens/Invoices/InvoicesListScreen.tsx` | **L504:** Replace `rgba(0,0,0,0.15)` with a token | Low | 5 min |
| 11.5 | `src/screens/Dashboard/DashboardScreen.tsx` | **L483:** Reduce `paddingBottom` from `100` to `80`  | Low | 2 min |
| 11.6 | `src/screens/Dashboard/DashboardScreen.tsx` | **L228–L240:** Remove `rotateAnim` from the `useEffect` dependency array (causes animation restart on every refresh state change) | Low | 5 min |

### Commit Strategy
- **Commit 1:** All tasks → `chore: final cleanup — dead code, hardcoded colors, minor layout fixes`

### Verification Checklist
- [ ] App builds without warnings
- [ ] Dashboard refresh animation spins smoothly without restart
- [ ] Product cards with expiry warnings still show yellow/red badges
- [ ] Full Smoke Test pass (#1–#28)

### Rollback Plan
Revert the single commit. All changes are cosmetic.

---

## Timeline Estimate

| Phase | Tasks | Estimated Time | Calendar Days (2–3h/day) |
|-------|-------|---------------|--------------------------|
| **1: Critical Bugs** | 5 tasks | 25 min | 1 day |
| **2: Data Integrity** | 6 tasks | 2h 45min | 1–2 days |
| **3: Security & API** | 9 tasks | 35 min | 1 day |
| **4: Tax Calc Fix** | 2 tasks | 30 min | *(same day as Phase 3)* |
| **5: FlatList Migration** | 6 tasks | 3h | 1–2 days |
| **6: Nav & Keyboard** | 4 tasks | 50 min | 1 day |
| **7: Shared Utils** | 5 tasks | 45 min | *(same day as Phase 6)* |
| **8: Visual & A11y** | 8 tasks | 1h 35min | 1 day |
| **9: Nav Type Safety** | 4 tasks | 3h 45min | 2 days |
| **10: AddSaleScreen Split** | 8 tasks | 4h 25min | 2 days |
| **11: Final Cleanup** | 6 tasks | 30 min | *(same day as Phase 10 final)* |

### Parallelization Savings
- Phases 3 + 4 can run in parallel → save 1 day
- Phases 7 + 8 + 9 can run in parallel with Phase 5 → save 1–2 days

### Total
| Scenario | Duration |
|----------|----------|
| **Sequential (solo dev)** | **10–12 working days** |
| **With parallelization (2 devs)** | **7–8 working days** |

### Recommended Execution Order for Solo Dev
```
Day 1:  Phase 1 + Phase 4
Day 2:  Phase 2 (SQL + createOrder)
Day 3:  Phase 2 (cancelOrder + editMode) + Phase 3
Day 4:  Phase 5 (ProductsList + memos)
Day 5:  Phase 5 (InvoicesList + AddItems)
Day 6:  Phase 6 + Phase 7
Day 7:  Phase 8
Day 8:  Phase 9
Day 9:  Phase 10 (hook extraction)
Day 10: Phase 10 (component extraction)
Day 11: Phase 10 (final assembly) + Phase 11
```
