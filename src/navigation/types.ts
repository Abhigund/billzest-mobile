export type DashboardStackParamList = {
  DashboardMain: undefined;
  MobileLogin: undefined;
  VerifyOTP: { phone?: string; verificationId?: string };
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
  AddSale: { initialMode?: 'sale' | 'purchase'; invoiceId?: string };
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
  AddItems: undefined;
  CustomerForm: { customerId?: string };
  AddPartySheet: { type?: 'customer' | 'supplier' };
  SimplifiedPOS: undefined;
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
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabsParamList = {
  DashboardTab: undefined;
  ProductsTab: undefined;
  CustomersTab: undefined;
  InvoicesTab: undefined;
};

export type RootDrawerParamList = {
  Home: undefined;
  Purchases: undefined;
  Vendors: undefined;
  Expenses: undefined;
  CreditBook: undefined;
  Reports: undefined;
  SettingsStack: undefined;
  SimplifiedPOS: undefined;
};
