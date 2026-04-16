# BillZest Mobile — Full UI/UX & Code Quality Audit Report

**Audit Date:** April 17, 2026  
**Auditor:** Antigravity AI  
**Scope:** Application-wide — all screens, navigation, shared components  
**Status:** In Progress (P0 batch resolved; P1–P3 queued in TASKS.md)

---

## Executive Summary

A full production-grade audit of the BillZest mobile application was conducted. **80+ distinct issues** were identified spanning navigation architecture, design system violations, dead UX interactions, hardcoded colors, and code quality problems. Issues were triaged into P0–P3 priority tiers and encoded into TASKS.md as Tasks 104–122.

**Key verdict:** The app has a strong architectural foundation (Supabase, TanStack Query, React Navigation, Zustand) but multiple visible UX defects — notably double headers, dead taps, inconsistent tab screen patterns — that were preventing a production-quality feel.

---

## Critical Findings Resolved (Session — Apr 17, 2026)

### Hotfix: Double Header on All Drawer Screens
**Root cause:** `AppDrawerNavigator` in `RootNavigator.tsx` had no `headerShown: false` default. Every non-Home drawer screen (`Purchases`, `Expenses`, `CreditBook`, `Reports`, `SettingsStack`, `Vendors`) was rendering both:
1. The native DrawerNavigator header (hamburger + title)
2. The screen's own custom header (`ListHeader` / `topBar` / `toolbar`)

**Fix:** Added `headerShown: false` to all 6 affected `<Drawer.Screen>` registrations.  
**File:** `src/navigation/RootNavigator.tsx`

---

### Task 104 — ReportsScreen Double Header + Wrong Back Nav
**File:** `src/screens/Reports/ReportsScreen.tsx`  
**Issue:** Two stacked header sections — `backHeader` block (ArrowLeft + "Reports") AND `headerRow` (`screenTitle` = "Reports") — both rendered before the content. Back arrow called `navigate('Home' as never)` which is type-unsafe and navigates incorrectly.  
**Fix:**
- Removed duplicate `backHeader` block entirely
- Replaced both header sections with single `topBar` (back + title + share)
- Replaced `navigate('Home' as never)` with `navigation.goBack()`
- Added `useMemo` wrapper for `createStyles(tokens)`
- Typed `useNavigation<NavigationProp<AppNavigationParamList>>()`
- Removed `borderWidth: 1` from `filterContainer`, `kpiCard`, `chartCard`, `chartArea`

---

### Task 105 — SettingsScreen Wrong Back Navigation
**File:** `src/screens/Settings/SettingsScreen.tsx`  
**Issue:** Custom toolbar back arrow called `navigation.navigate('Home' as never)` — wrong for a Drawer screen, type-unsafe, and bypasses the actual back stack.  
**Fix:** Replaced with `navigation.goBack()` — returns to whichever screen was active before Settings was opened.

---

### Task 106 — ExpensesScreen Dead-Tap Rows + Missing ListHeader
**File:** `src/screens/Expenses/ExpensesScreen.tsx`  
**Issues:**
- All expense list rows were wrapped in `<Pressable>` with a dead `handleExpensePress` handler (commented-out navigation). Every tap did nothing but create a visual pressed-state illusion.
- Screen used a bespoke header `<View style={styles.header}>` with hardcoded `paddingHorizontal: 20 / paddingTop: 20` instead of `ListHeader`, creating visual inconsistency with Dashboard/Invoices/CreditBook tab screens.
- `useNavigation()` untyped.
**Fix:**
- Removed `<Pressable>` wrapper; expense rows are now plain `<View>` (no detail screen exists)
- Replaced bespoke header with `<ListHeader title="Expenses" />`
- Added compact 2-column summary strip (Total Spent + Entry Count) using tokens
- Upgraded cards to No-Line tonal style (shadow elevation, `surface_container_lowest`)
- Removed unused `navigation` import and `handleExpensePress` dead function

---

### Task 107 — PurchaseListScreen Missing Page Header
**File:** `src/screens/Purchase/PurchaseListScreen.tsx`  
**Issue:** Screen had no page header at all — users could not tell which screen they were on. Root `<ScreenWrapper>` pattern inconsistent with other tab screens (Dashboard uses `View + ListHeader + ScrollView`).  
**Fix:**
- Swapped `<ScreenWrapper>` root for `<View style={styles.screen}>`
- Inserted `<ListHeader title="Purchases" />` at the top
- Added `screen` style (`flex: 1, backgroundColor: tokens.background`)
- Fixed FAB icon `color="#fff"` → `tokens.primaryForeground`

---

### Task 30 — Theme Tokens Verification
**File:** `src/theme/tokens.ts`  
**Status:** Verified complete — `white`, `shadowColor`, `radiusSm/Md/Lg/Xl/Full`, `spacingXs/Sm/Md/Lg/Xl` all already present. Task marked `[x]`.

---

## Outstanding Issues (Queued in TASKS.md)

### 🟧 P1 — High Priority

| Task | Description | Files |
|------|-------------|-------|
| **108** | Add `DetailHeader` to 5 dead-end Settings sub-screens (no back button) | `SecurityScreen`, `NotificationsScreen`, `OnlineStoreConfigScreen`, `PlansScreen`, `IntegrationsScreen` |
| **110** | No-Line sweep C1: Remove `borderWidth: 1` — Expenses + Purchase module | `ExpensesScreen`, `PurchaseListScreen`, `PurchaseDetailScreen`, `CreatePurchaseScreen` |
| **111** | No-Line sweep C2: Remove `borderWidth: 1` — Reports + CreditBook | `ReportsScreen`, `PartyLedgerScreen`, `AddCreditTransactionSheet` |
| **112** | No-Line sweep C3: Remove `borderWidth: 1` — Settings module | 6 Settings screens |
| **113** | No-Line sweep C4: Remove `borderWidth: 1` — Auth + Invoice flows | `LoginScreen`, `SimplifiedPOSScreen`, `InvoiceSummaryScreen`, `InvoiceDetailScreen`, `BarcodeGeneratorScreen` |
| **114** | Color sweep: `color="#fff"` → `tokens.primaryForeground` on FAB/icon calls | 10+ files |
| **115** | Color sweep: `shadowColor: '#000'` → `tokens.shadowColor` | `LoginScreen`, `FAB`, `ProductFormScreen`, `ProductDetailScreen`, `BarcodeGeneratorScreen`, `ItemSelectionSheet` |
| **116** | Color sweep: Inline `rgba()` → token equivalents | `DashboardScreen`, `CreditBookScreen` |

### 🟨 P2–P3 — Medium/Low Priority

| Task | Description |
|------|-------------|
| **117** | Spacing/radius token sweep: `ExpensesScreen.tsx` |
| **118** | Spacing/radius token sweep: `PurchaseListScreen.tsx` |
| **119** | Untyped `useNavigation()` cleanup — 6 remaining files |
| **121** | Dead code: remove `testSupabaseConnection` import from `LoginScreen`, dead `ScreenWrapper` block in `ProductStockAdjustScreen` |
| **122** | `formatCurrency` consolidation: import from `utils/formatting` in `PurchaseListScreen`, `ExpensesScreen` |

---

## Design System Violations Map

### `borderWidth: 1` Violations (No-Line Rule)
> The Stitch Design System mandates zero 1px borders. Differentiate layers using tonal backgrounds and shadow elevation.

| File | Occurrences |
|------|-------------|
| `CreatePurchaseScreen.tsx` | 8 |
| `PurchaseDetailScreen.tsx` | 5 |
| `PurchaseListScreen.tsx` | 4 |
| `PlansScreen.tsx` | 5 |
| `IntegrationsScreen.tsx` | 3 |
| `BillingTemplatesScreen.tsx` | 2 |
| `PartyLedgerScreen.tsx` | 3 |
| `ReportsScreen.tsx` | 4 (partially fixed) |
| `SecurityScreen.tsx` | 1 |
| `NotificationsScreen.tsx` | 1 |
| `OnlineStoreConfigScreen.tsx` | 3 |
| `LoginScreen.tsx` | 1 |
| `SimplifiedPOSScreen.tsx` | 2+ |
| `InvoiceSummaryScreen.tsx` | 1+ |
| `CategoriesListScreen.tsx` | 2 |
| `AddCreditTransactionSheet.tsx` | 2 |

### Hardcoded Colors

| Pattern | Files |
|---------|-------|
| `color="#fff"` on icons | `SuppliersListScreen`, `PurchaseListScreen`, `ProductsListScreen`, `InvoicesListScreen`, `CustomersListScreen`, `InvoiceDetailScreen`, `SimplifiedPOSScreen`, `AddExpenseSheet`, `PartyFilterSheet` |
| `shadowColor: '#000'` | `LoginScreen`, `FAB`, `ProductFormScreen`, `ProductDetailScreen`, `BarcodeGeneratorScreen`, `ItemSelectionSheet` |
| Inline `rgba()` | `DashboardScreen` (chart bars), `CreditBookScreen` (summary badges) |

### Untyped Navigation Hooks
Files using `useNavigation()` without type generics (violates AGENTS.md strict typing rule):

| File | Correct Generic |
|------|----------------|
| `ProductStockAdjustScreen.tsx` | `NativeStackNavigationProp<ProductsStackParamList>` |
| `OnlineStoreConfigScreen.tsx` | `NativeStackNavigationProp<SettingsStackParamList>` |
| `ListHeader.tsx` | `NavigationProp<AppNavigationParamList>` |
| `DetailHeader.tsx` | `NavigationProp<AppNavigationParamList>` |

*Note: `ExpensesScreen` and `ReportsScreen` were fixed as part of Tasks 104/106.*

---

## Navigation Architecture Reference

```
NavigationContainer
└── AppDrawerNavigator (DrawerNavigator)
    ├── Home → MainTabs (headerShown: false ✓)
    │   ├── DashboardTab → DashboardStack (headerShown: false ✓)
    │   ├── InvoicesTab → InvoicesStack (headerShown: false ✓)
    │   ├── CreditBookTab → CreditBookStack (headerShown: false ✓)
    │   ├── CustomersTab → CustomersStack (headerShown: false ✓)
    │   └── ProductsTab → ProductsStack (headerShown: false ✓)
    ├── Purchases → PurchaseStack (headerShown: false ✓ fixed)
    ├── Vendors → VendorsStack (headerShown: false ✓ fixed)
    ├── Expenses → ExpensesStack (headerShown: false ✓ fixed)
    ├── CreditBook → CreditBookStack (headerShown: false ✓ fixed)
    ├── Reports → ReportsScreen (headerShown: false ✓ fixed)
    └── SettingsStack → SettingsStackNavigator (headerShown: false ✓ fixed)
        ├── SettingsMain → SettingsScreen
        ├── BusinessInfo → BusinessInfoScreen
        ├── OnlineStoreConfig → OnlineStoreConfigScreen
        ├── BillingTemplates → BillingTemplatesScreen
        └── BillingScreen → BillingScreen (fullScreenModal)
```

**Rule:** Any screen that renders its own custom header (`ListHeader`, `DetailHeader`, custom `toolbar`/`topBar`) **must** have `headerShown: false` on its navigator registration.

---

## Code Quality Patterns — Best Practices Established

### ✅ Do
- Use `<ListHeader title="..." />` for all primary tab-level list screens
- Use `<DetailHeader title="..." />` for all pushed detail/sub-screens
- All `useNavigation()` hooks must include type generic
- `createStyles(tokens)` in components with >1 render must be wrapped in `useMemo`
- Icons on `<FAB />` and primary buttons: `color={tokens.primaryForeground}`
- All shadows: `shadowColor: tokens.shadowColor`
- All card layers: use `tokens.surface_container_lowest` / `tokens.surface_container_low` + shadow elevation instead of `borderWidth: 1`
- Spacing: use `tokens.spacingXs/Sm/Md/Lg/Xl` (4/8/12/16/24)
- Radius: use `tokens.radiusSm/Md/Lg/Xl/Full` (8/12/16/24/999)

### ❌ Don't
- `useNavigation()` without type parameter
- `navigation.navigate('ScreenName' as never)` — always use typed navigation
- `color="#fff"` on icons — always use `tokens.primaryForeground` or `tokens.white`
- `shadowColor: '#000'` — always use `tokens.shadowColor`
- Inline `rgba(...)` — use `tokens.*Alpha*` variants
- `borderWidth: 1` anywhere (No-Line Rule)
- Raw pixel values: `padding: 20`, `borderRadius: 16` — use design tokens
- Dead `Pressable` wrappers with no `onPress` handler
- `console.log` outside `if (__DEV__)` gates
- `navigate('X' as never)` for any navigation call

---

## Verification Checklist (Per Task)

Before marking any task `[x]`:
1. `npx tsc --noEmit` → exit code 0 (zero type errors)
2. `npx expo lint` → exit code 0 (zero lint errors, warnings acceptable)
3. Manual visual check on simulator

---

*This report is maintained alongside `TASKS.md`. Cross-reference both documents when planning new sessions.*
