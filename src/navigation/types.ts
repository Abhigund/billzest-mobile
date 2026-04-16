export type DashboardStackParamList = {
  DashboardMain: undefined;
  MobileLogin: undefined;
  VerifyOTP: {
    phone?: string;
    mobileNumber?: string;
    verificationId?: string;
  };
};

export type ProductsStackParamList = {
  ProductsMain: undefined;
  ProductDetail: { product?: any };
  ProductForm: { mode?: 'create' | 'edit'; product?: any };
  StockSummary: undefined;
  CategoriesList: undefined;
  CategoryFormSheet: { categoryId?: string; category?: any };
  BarcodeGenerator: { product?: any };
};

export type CustomersStackParamList = {
  CustomersMain: undefined;
  CustomerDetail: { customerId: string; customer?: any };
  CustomerForm: { customerId?: string };
  AddPartySheet: { type?: 'customer' | 'supplier' };
};

export type InvoicesStackParamList = {
  InvoicesMain: undefined;
  InvoiceDetail: { orderId: string; invoice?: any };
  AddSale: { initialMode?: 'sale' | 'purchase'; invoiceId?: string; orderId?: string };
  SimplifiedPOS: undefined;
  AddItems: undefined;
  InvoiceSummary: {
    invoiceId: string;
    invoiceNumber: string;
    subtotal: number;
    discount: number;
    cgst: number;
    sgst: number;
    totalAmount: number;
    amountReceived: number;
    dueDate: string;
  };
  CustomerForm: { customerId?: string };
  AddPartySheet: { type?: 'customer' | 'supplier' };
  Reports: undefined;
};

export type PurchaseStackParamList = {
  PurchaseList: undefined;
  PurchaseDetail: { purchaseId: string; purchase?: any };
  PurchaseCreate: { initialMode?: 'sale' | 'purchase'; invoiceId?: string };
  PurchaseCreateVendor: { customerId?: string };
  SuppliersList: undefined;
  AddPartySheet: { type?: 'customer' | 'supplier' };
};

export type ExpensesStackParamList = {
  ExpensesMain: undefined;
};

export type VendorsStackParamList = {
  SuppliersList: undefined;
};

export type CreditBookStackParamList = {
  CreditBookMain: undefined;
  PartyLedgerScreen: { partyId: string; partyName?: string };
  AddPartySheet: { type?: 'customer' | 'supplier' };
  AddCreditTransactionSheet: { partyId: string };
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  BusinessInfo: undefined;
  OnlineStoreConfig: undefined;
  BillingTemplates: undefined;
  BillingScreen: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabsParamList = {
  DashboardTab: undefined;
  InvoicesTab: undefined;
  CreditBookTab: undefined;
  CustomersTab: undefined;
  ProductsTab: undefined;
};

export type RootDrawerParamList = {
  Home: undefined;
  Purchases: { screen?: string; params?: object } | undefined;
  Vendors: undefined;
  Expenses: { screen?: string; params?: object } | undefined;
  CreditBook: undefined;
  Reports: undefined;
  SettingsStack: undefined;
};

export type AppNavigationParamList = {
  Home: undefined;
  Purchases: { screen?: string; params?: object } | undefined;
  Vendors: undefined;
  Expenses: { screen?: string; params?: object } | undefined;
  CreditBook: undefined;
  Reports: undefined;
  SettingsStack: undefined;
  DashboardTab: undefined;
  InvoicesTab: { screen?: string; params?: object } | undefined;
  CreditBookTab: undefined;
  CustomersTab: { screen?: string; params?: object } | undefined;
  ProductsTab: { screen?: string; params?: object } | undefined;
  DashboardMain: undefined;
  MobileLogin: undefined;
  VerifyOTP: { phone?: string; mobileNumber?: string; verificationId?: string } | undefined;
  ProductsMain: undefined;
  ProductsList: undefined;
  ProductDetail: { product?: any } | undefined;
  ProductForm: { mode?: 'create' | 'edit'; product?: any } | undefined;
  StockSummary: undefined;
  CategoriesList: undefined;
  CategoryFormSheet: { categoryId?: string; category?: any } | undefined;
  BarcodeGenerator: { product?: any; initialItems?: any[] } | undefined;
  CustomersMain: undefined;
  CustomerDetail: { customerId: string; customer?: any } | undefined;
  CustomerForm: { customerId?: string } | undefined;
  AddPartySheet: { type?: 'customer' | 'supplier'; intent?: 'sale' | 'purchase' } | undefined;
  InvoicesMain: undefined;
  InvoiceDetail: { orderId: string; invoice?: any; invoiceId?: string } | undefined;
  AddSale: { initialMode?: 'sale' | 'purchase'; invoiceId?: string; orderId?: string } | undefined;
  InvoiceSummary: {
    invoiceId: string;
    invoiceNumber: string;
    subtotal: number;
    discount: number;
    cgst: number;
    sgst: number;
    totalAmount: number;
    amountReceived: number;
    dueDate: string;
  } | undefined;
  SimplifiedPOS: undefined;
  AddItems: undefined;
  PurchaseList: undefined;
  PurchaseDetail: { purchaseId?: string; purchase?: any } | undefined;
  PurchaseCreate: { initialMode?: 'sale' | 'purchase'; invoiceId?: string; purchase?: any } | undefined;
  PurchaseCreateVendor: { customerId?: string; intent?: 'sale' | 'purchase' } | undefined;
  SuppliersList: undefined;
  CreditBookMain: undefined;
  PartyLedgerScreen: { partyId?: string; partyName?: string; party?: any } | undefined;
  AddCreditTransactionSheet: { partyId?: string; party?: any; mode?: 'given' | 'received' } | undefined;
  SettingsMain: undefined;
  BusinessInfo: undefined;
  OnlineStoreConfig: undefined;
  BillingTemplates: undefined;
  BillingScreen: undefined;
  Login: undefined;
};
