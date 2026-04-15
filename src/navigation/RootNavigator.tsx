import React from "react";
import {
  NavigationContainer,
  DrawerActions,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DashboardScreen from "../screens/Dashboard/DashboardScreen";
import ProductsListScreen from "../screens/Products/ProductsListScreen";
import ProductDetailScreen from "../screens/Products/ProductDetailScreen";
import ProductFormScreen from "../screens/Products/ProductFormScreen";
import StockSummaryScreen from "../screens/Products/StockSummaryScreen";
// import ProductStockAdjustScreen from '../screens/Products/ProductStockAdjustScreen';
import CustomersListScreen from "../screens/Customers/CustomersListScreen";
import CustomerDetailScreen from "../screens/Customers/CustomerDetailScreen";
import CustomerFormScreen from "../screens/Customers/CustomerFormScreen";
import CategoriesListScreen from "../screens/Products/CategoriesListScreen";
import CategoryFormSheet from "../screens/Products/CategoryFormSheet";
import BarcodeGeneratorScreen from "../screens/Inventory/BarcodeGeneratorScreen";
import InvoicesListScreen from "../screens/Invoices/InvoicesListScreen";
import InvoiceDetailScreen from "../screens/Invoices/InvoiceDetailScreen";
import InvoiceSummaryScreen from "../screens/Invoices/InvoiceSummaryScreen";
import AddItemsScreen from "../screens/Invoices/AddItemsScreen";
import AddSaleScreen from "../screens/Invoices/AddSaleScreen";
import SimplifiedPOSScreen from "../screens/Invoices/SimplifiedPOSScreen";
import PurchaseListScreen from "../screens/Purchase/PurchaseListScreen";
import MobileLoginScreen from "../screens/Auth/MobileLoginScreen";
import VerifyOTPScreen from "../screens/Auth/VerifyOTPScreen";
import PurchaseDetailScreen from "../screens/Purchase/PurchaseDetailScreen";
import SuppliersListScreen from "../screens/Purchase/SuppliersListScreen";
import CreditBookScreen from "../screens/CreditBook/CreditBookScreen";
import PartyLedgerScreen from "../screens/CreditBook/PartyLedgerScreen";
import AddPartySheet from "../components/modals/AddPartySheet";
import AddCreditTransactionSheet from "../screens/CreditBook/AddCreditTransactionSheet";
import ExpensesScreen from "../screens/Expenses/ExpensesScreen";
import ReportsScreen from "../screens/Reports/ReportsScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";
import BusinessInfoScreen from "../screens/Settings/BusinessInfoScreen";
import OnlineStoreConfigScreen from "../screens/Settings/OnlineStoreConfigScreen";
import BillConfigScreen from "../screens/Settings/BillingTemplatesScreen";
import BillingScreen from "../screens/Billing/BillingScreen";
import { View, ActivityIndicator, Pressable } from "react-native";
import { centeredScreenStyles } from "../theme/layout";
import { DefaultTheme, DarkTheme } from "@react-navigation/native";
import { useThemeTokens } from "../theme/ThemeProvider";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Menu,
} from "lucide-react-native";
import { useSupabase } from "../contexts/SupabaseContext";
import LoginScreen from "../screens/Auth/LoginScreen";
import CustomDrawer from "./CustomDrawer";
import ErrorBoundary from "../components/ErrorBoundary";
import {
  DashboardStackParamList,
  ProductsStackParamList,
  CustomersStackParamList,
  InvoicesStackParamList,
  PurchaseStackParamList,
  ExpensesStackParamList,
  VendorsStackParamList,
  CreditBookStackParamList,
  MainTabsParamList,
  RootDrawerParamList,
  AuthStackParamList,
  SettingsStackParamList,
  AppNavigationParamList,
} from "./types";

export const navigationRef =
  createNavigationContainerRef<AppNavigationParamList>();

const Tab = createBottomTabNavigator<MainTabsParamList>();
const Drawer = createDrawerNavigator<RootDrawerParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const DashboardTabStack = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen
      name="DashboardMain"
      component={DashboardScreen}
      options={{ title: "Dashboard" }}
    />
    <DashboardStack.Screen
      name="MobileLogin"
      component={MobileLoginScreen}
      options={{ headerShown: false, presentation: "fullScreenModal" }}
    />
    <DashboardStack.Screen
      name="VerifyOTP"
      component={VerifyOTPScreen}
      options={{ headerShown: false, presentation: "fullScreenModal" }}
    />
  </DashboardStack.Navigator>
);

const ProductsStack = createNativeStackNavigator<ProductsStackParamList>();
const ProductsTabStack = () => (
  <ProductsStack.Navigator screenOptions={{ headerShown: false }}>
    <ProductsStack.Screen
      name="ProductsMain"
      component={ProductsListScreen}
      options={{ title: "Products" }}
    />
    <ProductsStack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ title: "Product Details" }}
    />
    <ProductsStack.Screen
      name="ProductForm"
      component={ProductFormScreen}
      options={{ title: "Product Form" }}
    />
    <ProductsStack.Screen
      name="StockSummary"
      component={StockSummaryScreen}
      options={{ title: "Stock Summary" }}
    />
    <ProductsStack.Screen
      name="CategoriesList"
      component={CategoriesListScreen}
      options={{ title: "Categories" }}
    />
    <ProductsStack.Screen
      name="CategoryFormSheet"
      component={CategoryFormSheet}
      options={{ headerShown: false, presentation: "formSheet" }}
    />
    <ProductsStack.Screen
      name="BarcodeGenerator"
      component={BarcodeGeneratorScreen}
      options={{ title: "Barcode Generator", headerShown: false }}
    />
    {/* OUT OF SCOPE FOR V1 — retained for future releases
    <ProductsStack.Screen
      name="StockAdjust"
      component={ProductStockAdjustScreen}
      options={{ title: 'Stock Adjustment' }}
    />
    */}
  </ProductsStack.Navigator>
);

const CustomersStack = createNativeStackNavigator<CustomersStackParamList>();
const CustomersTabStack = () => (
  <CustomersStack.Navigator screenOptions={{ headerShown: false }}>
    <CustomersStack.Screen
      name="CustomersMain"
      component={CustomersListScreen}
      options={{ title: "Customers" }}
    />
    <CustomersStack.Screen
      name="CustomerDetail"
      component={CustomerDetailScreen}
      options={{ title: "Customer Details" }}
    />
    <CustomersStack.Screen
      name="CustomerForm"
      component={CustomerFormScreen}
      options={{ headerShown: false, presentation: "fullScreenModal" }}
    />
    <CustomersStack.Screen
      name="AddPartySheet"
      component={AddPartySheet}
      options={{ headerShown: false, presentation: "fullScreenModal" }}
    />
  </CustomersStack.Navigator>
);

const InvoicesStack = createNativeStackNavigator<InvoicesStackParamList>();
const InvoicesTabStack = () => (
  <InvoicesStack.Navigator screenOptions={{ headerShown: false }}>
    <InvoicesStack.Screen
      name="InvoicesMain"
      component={InvoicesListScreen}
      options={{ title: "Invoices" }}
    />
    <InvoicesStack.Screen
      name="InvoiceDetail"
      component={InvoiceDetailScreen}
      options={{ title: "Invoice Detail" }}
    />
    <InvoicesStack.Screen
      name="AddSale"
      component={AddSaleScreen}
      options={{ headerShown: false, presentation: "fullScreenModal" }}
    />
    <InvoicesStack.Screen
      name="InvoiceSummary"
      component={InvoiceSummaryScreen}
      options={{ headerShown: false }}
    />
    <InvoicesStack.Screen
      name="AddItems"
      component={AddItemsScreen}
      options={{ headerShown: false, presentation: "fullScreenModal" }}
    />
    <InvoicesStack.Screen
      name="CustomerForm"
      component={CustomerFormScreen}
      options={{ headerShown: false, presentation: "fullScreenModal" }}
    />
    <InvoicesStack.Screen
      name="AddPartySheet"
      component={AddPartySheet}
      options={{ headerShown: false, presentation: "fullScreenModal" }}
    />
    <InvoicesStack.Screen
      name="SimplifiedPOS"
      component={SimplifiedPOSScreen}
      options={{ headerShown: false, presentation: "fullScreenModal" }}
    />
  </InvoicesStack.Navigator>
);

const PurchaseStackNav = createNativeStackNavigator<PurchaseStackParamList>();
const PurchaseStack = () => (
  <PurchaseStackNav.Navigator screenOptions={{ headerShown: false }}>
    <PurchaseStackNav.Screen
      name="PurchaseList"
      component={PurchaseListScreen}
      options={{ title: "Purchases" }}
    />
    <PurchaseStackNav.Screen
      name="PurchaseDetail"
      component={PurchaseDetailScreen}
      options={{ title: "Purchase Detail" }}
    />
    <PurchaseStackNav.Screen
      name="PurchaseCreate"
      component={AddSaleScreen}
      options={{ headerShown: false, presentation: "fullScreenModal" }}
      initialParams={{ initialMode: "purchase" }}
    />
    <PurchaseStackNav.Screen
      name="PurchaseCreateVendor"
      component={CustomerFormScreen}
      options={{ headerShown: false, presentation: "fullScreenModal" }}
    />
    <PurchaseStackNav.Screen
      name="SuppliersList"
      component={SuppliersListScreen}
      options={{ title: "Suppliers" }}
    />
    <PurchaseStackNav.Screen
      name="AddPartySheet"
      component={AddPartySheet}
      options={{ headerShown: false, presentation: "fullScreenModal" }}
    />
  </PurchaseStackNav.Navigator>
);

const ExpensesStackNav = createNativeStackNavigator<ExpensesStackParamList>();
const ExpensesStack = () => (
  <ExpensesStackNav.Navigator screenOptions={{ headerShown: false }}>
    <ExpensesStackNav.Screen
      name="ExpensesMain"
      component={ExpensesScreen}
      options={{ title: "Expenses" }}
    />
  </ExpensesStackNav.Navigator>
);

const VendorsStackNav = createNativeStackNavigator<VendorsStackParamList>();
const VendorsStack = () => (
  <VendorsStackNav.Navigator screenOptions={{ headerShown: false }}>
    <VendorsStackNav.Screen
      name="SuppliersList"
      component={SuppliersListScreen}
      options={{ title: "Vendors / Suppliers" }}
    />
  </VendorsStackNav.Navigator>
);

const CreditBookStackNav =
  createNativeStackNavigator<CreditBookStackParamList>();
const CreditBookStack = () => (
  <CreditBookStackNav.Navigator screenOptions={{ headerShown: false }}>
    <CreditBookStackNav.Screen
      name="CreditBookMain"
      component={CreditBookScreen}
      options={{ title: "Credit Book" }}
    />
    <CreditBookStackNav.Screen
      name="PartyLedgerScreen"
      component={PartyLedgerScreen}
      options={{ title: "Party Ledger" }}
    />
    <CreditBookStackNav.Screen
      name="AddPartySheet"
      component={AddPartySheet}
      options={{ headerShown: false, presentation: "fullScreenModal" }}
    />
    <CreditBookStackNav.Screen
      name="AddCreditTransactionSheet"
      component={AddCreditTransactionSheet}
      options={{ headerShown: false, presentation: "fullScreenModal" }}
    />
  </CreditBookStackNav.Navigator>
);

const MainTabs = () => {
  const { tokens } = useThemeTokens();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: tokens.background },
        headerTitleStyle: { color: tokens.foreground, fontWeight: "700" },
        headerTintColor: tokens.foreground,
        headerShadowVisible: false,
        headerLeft: () => (
          <Pressable
            onPress={() =>
              navigation.getParent()?.dispatch(DrawerActions.openDrawer())
            }
            accessibilityLabel="Open sidebar menu"
            style={{ paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <Menu color={tokens.foreground} size={22} />
          </Pressable>
        ),
        tabBarHideOnKeyboard: true,
        sceneStyle: { paddingBottom: 8 },
        tabBarStyle: {
          height: 56 + Math.max(insets.bottom, 8),
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: tokens.background,
          borderTopColor: tokens.border,
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardTabStack}
        options={{
          title: "Dashboard",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProductsTab"
        component={ProductsTabStack}
        options={{
          title: "Products",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Package color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CustomersTab"
        component={CustomersTabStack}
        options={{
          title: "Parties",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="InvoicesTab"
        component={InvoicesTabStack}
        options={{
          title: "Invoices",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <FileText color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppDrawerNavigator = () => {
  const { tokens } = useThemeTokens();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerTitleAlign: "left",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: tokens.background },
        headerTintColor: tokens.foreground,
        drawerStyle: { width: "75%" },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={MainTabs}
        options={{ title: "Home", headerShown: false }}
      />
      <Drawer.Screen
        name="Purchases"
        component={PurchaseStack}
        options={{ title: "Purchases" }}
      />
      <Drawer.Screen
        name="Vendors"
        component={VendorsStack}
        options={{ title: "Vendors / Suppliers" }}
      />
      <Drawer.Screen
        name="Expenses"
        component={ExpensesStack}
        options={{ title: "Expenses" }}
      />
      <Drawer.Screen
        name="CreditBook"
        component={CreditBookStack}
        options={{ title: "Credit Book" }}
      />
      {/* OUT OF SCOPE FOR V1 — retained for future releases */}
      <Drawer.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: "Reports" }}
      />
      {/* BusinessInfo moved to SettingsStack
      <Drawer.Screen
        name="BusinessInfo"
        component={BusinessInfoScreen}
        options={{ title: 'Business Info' }}
      />
      */}
      {/* OUT OF SCOPE FOR V1 — retained for future releases
      <Drawer.Screen
        name="BillingTemplates"
        component={BillingTemplatesScreen}
        options={{ title: 'Billing Templates' }}
      />
      <Drawer.Screen
        name="Plans"
        component={PlansScreen}
        options={{ title: 'Plans' }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Drawer.Screen
        name="Security"
        component={SecurityScreen}
        options={{ title: 'Security' }}
      />
      <Drawer.Screen
        name="Integrations"
        component={IntegrationsScreen}
        options={{ title: 'Integrations' }}
      />
      */}
      <Drawer.Screen
        name="SettingsStack"
        component={SettingsStackNavigator}
        options={{ title: "Settings" }}
      />
      <Drawer.Screen
        name="SimplifiedPOS"
        component={SimplifiedPOSScreen}
        options={{ title: "Quick Bill POS", headerShown: false }}
      />
    </Drawer.Navigator>
  );
};

const AuthStackNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
  </AuthStack.Navigator>
);

const SettingsStackNavigator = () => (
  <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen
      name="SettingsMain"
      component={SettingsScreen}
      options={{ title: "Settings" }}
    />
    <SettingsStack.Screen
      name="BusinessInfo"
      component={BusinessInfoScreen}
      options={{ title: "Business Info" }}
    />
    <SettingsStack.Screen
      name="OnlineStoreConfig"
      component={OnlineStoreConfigScreen}
      options={{ title: "Online Store Setup" }}
    />
    <SettingsStack.Screen
      name="BillingTemplates"
      component={BillConfigScreen}
      options={{ title: "Billing Settings" }}
    />
    <SettingsStack.Screen
      name="BillingScreen"
      component={BillingScreen}
      options={{ headerShown: false, presentation: "fullScreenModal" }}
    />
  </SettingsStack.Navigator>
);

const RootNavigator = () => {
  const { mode, tokens } = useThemeTokens();
  const { user, isLoading } = useSupabase();
  // Bypassing auth logic for now if configured
  const shouldBypassAuth = false;

  const navigationTheme = {
    ...(mode === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(mode === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      primary: tokens.primary,
      background: tokens.background,
      card: tokens.card,
      text: tokens.foreground,
      border: tokens.border,
      notification: tokens.destructive,
    },
  };

  if (isLoading && !shouldBypassAuth) {
    return (
      <NavigationContainer theme={navigationTheme}>
        <View style={centeredScreenStyles.container}>
          <ActivityIndicator size="large" color={tokens.primary} />
        </View>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme} ref={navigationRef}>
      <ErrorBoundary>
        {shouldBypassAuth || user ? (
          <AppDrawerNavigator />
        ) : (
          <AuthStackNavigator />
        )}
      </ErrorBoundary>
    </NavigationContainer>
  );
};

export default RootNavigator;
