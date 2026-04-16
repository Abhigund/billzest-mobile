# BillZest Mobile - Agent Context File

This file serves as a persistent context guide for AI engineering agents (Antigravity, Cursor, Claude Code, etc.) assisting with the development and maintenance of the BillZest Mobile project.

## Project Overview
BillZest Mobile is a comprehensive POS (Point of Sale) and invoicing system built natively for mobile. It empowers small businesses to manage sales, track inventory/products, log daily expenses, handle suppliers and customers, and monitor credit ledgers. It supports standard robust workflows as well as a "Quick Bill POS" mode for rapid checkout sequences, emphasizing a high-performance, strictly online-only, and premium user experience.

## Tech Stack
- **Framework:** React Native + Expo (SDK ~54.x)
- **Language:** TypeScript (~5.9.2)
- **Navigation:** React Navigation v7 (Bottom Tabs, Drawer, and Native Stack)
- **Backend & Auth:** Supabase (`@supabase/supabase-js`, PostgreSQL, Auth, Edge/RPC functions)
- **State Management:** 
  - Zustand (`^5.0.9`) for lightweight client/app settings.
  - TanStack React Query (`^5.90.21`) for server state, fetching, and caching.
- **Styling:** Custom Token-based Theming mechanism (`useThemeTokens`). Fully transitioning to the **Stitch Design System**. No TailwindCSS.
- **UI/Animation:** `react-native-reanimated` (`~4.1.1`), `react-native-gesture-handler`, `lucide-react-native` for icons.
- **Native Modules:** `expo-file-system`, `expo-print`, `expo-sharing` (invoice PDF generation and sharing), `@react-native-community/datetimepicker`.
- **Online-Only Architecture:** Direct integration with Supabase for real-time data persistence.

## Project Structure
- `assets/` - Static imagery, splash screens, and icons (used in `app.json`).
- `src/components/` - Reusable presentational generic components, modals, and sheets.
- `src/contexts/` - Global context wrappers (`SupabaseContext`, `OrganizationContext`).
- `src/hooks/` - Custom React hooks (e.g., `useInvoiceFlow`).
- `src/logic/` - Business logic extracted from the UI components.
- `src/navigation/` - Core routing mechanisms, type definitions (`types.ts`), and drawer configuration.
- `src/screens/` - Major features organized by domain (Auth, Dashboard, Invoices, Products, Customers, Purchase, Expenses, CreditBook, Settings, Reports, Inventory).
- `src/services/` - Data access utilities fetching structures mapped directly to Supabase RPCs/tables (e.g., `ordersService.ts`).
- `src/stores/` - Zustand application stores (e.g., `appSettingsStore.ts`).
- `src/supabase/` - Contains initialized Supabase client and `database.types.ts`.
- `src/theme/` - Source of truth for `ThemeProvider` context and the Stitch design `tokens`.
- `src/types/` - Shared TypeScript definitions across abstractions.
- `src/utils/` - Utility handlers for string formatting, mathematical validations, and testing.
- `docs/` - Contains internal audit documents like `TASKS.md`.

## Development Setup
1. **Install Dependencies:** `npm install`
2. **Environment Configuration:** Ensure the `.env` file exists at the root, mapping:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. **Execution:** Use `npx expo start` (or `npm start`). Type `i` to launch the iOS simulator, `a` for Android.

## Build & Deployment
- The application uses Expo Application Services (EAS). Build configuration lives within `app.json` (Slug: `BillZest`).
- **Commands:** Expected to be built via `eas build --platform all`. 
- **Compilation Notes:** `babel-preset-expo` leverages `react-native-worklets/plugin` for `reanimated` support.

## Architecture & Key Concepts
- **Strict Online Integration:** The application operates strictly in online mode, interacting directly with Supabase. User actions should be considered dependent on network availability.
- **Stitch Design System Integration:** The UI utilizes a premium custom design theme leveraging internal design tokens. 
  - **No-Line Rule:** Remove hard 1px solid borders (`borderWidth`). Differentiate component layers using tonal surface backgrounds (e.g., `surface_container_lowest`) and drop shadows. 
- **Component Decomposition:** Active strategy moves away from monolithic screen files. Business flows (like Invoice Creation) route logic internally to pure hooks (e.g., `useInvoiceFlow`), maintaining component files purely as rendering orchestrators mapped to domain-specific visual components (e.g., `BillToCard`).

## Code Conventions
- **Strict Navigation Typing:** You must never cast `useNavigation<any>()` or `useRoute<any>()`. Import explicit typings like `NativeStackNavigationProp<XxxParamList>` from `src/navigation/types.ts`.
- **Absolute Avoidance of Hardcoded Hex:** Map all color requirements to context-injected `tokens.*` properties (e.g. `tokens.primary`, `tokens.warning`, `tokens.shadowColor`).
- **Icons:** Use `<LucideReact>` icons explicitly. Remove string-based Unicode icons from legacy screens.
- **Form Best-Practices:** Use `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>` natively rather than padding the layout arbitrarily. 
- **Accessibility:** Bind elements cleanly with `accessibilityLabel` for interactive items, and wrap tactile buttons in `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}`.

## Important Files & Entry Points
- `App.tsx`: Global execution boundary containing the multi-layered Providers (Theme, Organization, Supabase, QueryClient) required for context parsing.
- `src/navigation/RootNavigator.tsx`: Orchestrates the fundamental tab, drawer, and auth navigation guards.
- `TASKS.md`: This markdown document actively holds the high-priority refactoring/architectural task lists. **ALWAYS cross-reference this file before modifying database logic.**
- `src/supabase/ordersService.ts`: Gateway logic file for executing CRUD flows over sales entries. Frequently updated bridging code for backend Postgres functions.

## External Services & Integrations
- **Supabase**: Primary persistent backend. Utilized deeply for user authorization (`Auth`), general data tables, and crucial RPC transactions (e.g., `adjust_stock`, `cancel_order_restore_stock`).
- **Device Printing**: Expo's print functionality transforms HTML payloads into PDF receipts logic.

## Known Constraints & Gotchas
- **Database Rules:** *DATABASE DEPENDENT TASKS ARE CURRENTLY OUT OF SCOPE*. Do not attempt to modify raw SQL schemas or write definitions for RPC migrations unless explicitly prompted by the user's focus directive.
- **Babel Constraints:** The `react-native-worklets/plugin` must strictly be the **LAST** plugin defined inside `babel.config.js`. Breaking this breaks Reanimated.
- **No Console Logs:** Do not place `console.log` statements indiscriminately in production structures. If necessary for testing endpoints, wrap them inside `if (__DEV__)` gates or rely on standard React boundary error catchers.
