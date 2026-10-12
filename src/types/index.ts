export interface InventoryItem {
  id: string;
  custno: string;
  company: string;
  marketid: string;
  region: string;
  item: string; // SKU
  manufacturer: string;
  color: string;
  prodline: string;
  category: 'PHONES' | 'BTS' | 'SIM CARD' | 'ACCESSORIES';
  subclass: string;
  itmdesc: string;
  minprice?: number;
  serialized: boolean;
  price: number; // retail price
  qty: number; // stock qty in store
  cost: number;
  lastcost: number;
  wholesale: number; // wholesale / dealer transfer cost
  adddate: string;
  isTopPriority?: boolean; // User requested: "TOP WOH HONGI JO ME PRICE LIST ME END ROW ME TOP LIKH DUNGA"
}

export interface AllocationItem {
  id: string;
  itemSku: string;
  itmdesc: string;
  manufacturer: string;
  packs: number; // In packs
  packUnitSize: number; // 20 pcs for iPhones, 5 pcs for others
  totalPcs: number; // packs * packUnitSize
  reservedPcs: number;
  availablePcs: number;
  lastUpdated: string;
  sourceNote?: string;
}

export interface OrderItem {
  itemSku: string;
  itmdesc: string;
  manufacturer: string;
  orderedQty: number; // in pcs
  availableFromAllocation: number; // in pcs
  shortageQty: number; // in pcs (to order via IDOO)
  unitPrice: number;
  wholesalePrice: number;
}

export type OrderStatus = 
  | 'Pending Review'
  | 'Approved'
  | 'Rejected'
  | 'IDOO Shortage Pending'
  | 'Placed / Processing'
  | 'Shipped / Fulfilled'
  | 'Cancelled';

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  storeId?: string;
  storeName?: string;
  customerName: string;
  items: OrderItem[];
  totalPcs: number;
  totalWholesaleValue: number;
  totalRetailValue: number;
  status: OrderStatus;
  hasShortage: boolean;
  shortageTotalPcs: number;
  rejectionReason?: string;
  // Admin processing fields (prompted when marking Placed)
  idooOrderNumber?: string;
  idooInvoiceAmount?: number;
  trackingNumber?: string;
  carrierName?: string;
  processedAt?: string;
  shippedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface IdooBacklogItem {
  id: string;
  orderId: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  itemSku: string;
  itmdesc: string;
  manufacturer: string;
  neededQty: number; // in pcs
  unitWholesaleCost: number;
  totalCost: number;
  addedAt: string;
  estimatedArrivalDate: string; // 2 days from order
  status: 'Awaiting IDOO Order' | 'IDOO Ordered' | 'Received in Hub' | 'Fulfilled & Shipped';
  carrierRefNo?: string;
}

export interface CustomerLedgerEntry {
  id: string;
  date: string;
  type: 'Order Invoice' | 'Payment Received' | 'Credit Limit Adjustment' | 'Refund / Credit Note' | 'Debit Adjustment' | 'Credit Adjustment';
  referenceNumber: string;
  orderId?: string;
  debit: number; // increases balance (e.g., order invoice)
  credit: number; // decreases balance (e.g., payment)
  runningBalance: number;
  paymentMethod?: 'Wire' | 'ACH' | 'Cash' | 'Check' | 'Zelle' | 'Carrier Rebate';
  notes: string;
}

export interface CustomerAccount {
  customerId: string;
  customerName: string;
  market: string; // WICHITA
  contactPerson: string;
  phone: string;
  email: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  assignedStores: string[];
}

export interface MarketBudgetConfig {
  market: 'WICHITA';
  monthlyBudgetLimit: number;
  usedAmount: number;
  activeCycleMonth: string;
  lastUpdated: string;
}

export interface SalesRecord {
  id: string;
  storeId: string;
  itemSku: string;
  itmdesc: string;
  quantitySold: number;
  saleDate: string;
}

export interface ProductAnalytics {
  itemSku: string;
  itmdesc: string;
  manufacturer: string;
  category: string;
  price: number;
  wholesale: number;
  currentInventory: number;
  availableAllocationPcs: number;
  customerPreviousOrdersPcs: number;
  last7DaysSalesPcs: number;
  last14DaysSalesPcs: number;
  projected2WeeksDemandPcs: number;
  projected3WeeksDemandPcs: number;
  weeksOfSupply: number; // current inventory / weekly sales rate
  recommendedOrderQtyPcs: number;
  overOrderingRisk: boolean;
  stockoutRisk: boolean;
  isTopPriority: boolean; // Flagged as TOP in price list
  salesTrendPercentage: number; // Trend change over 7 vs previous 7 days
}

export interface PhoneWiseOrderSummary {
  itemSku: string;
  itmdesc: string;
  manufacturer: string;
  totalUnitsOrdered: number;
  totalWholesaleSpent: number;
  totalAllocatedFulfilled: number;
  totalIdooProcured: number;
  orderOccurrences: number;
  lastOrderedDate: string;
  recentOrders: {
    orderNumber: string;
    date: string;
    storeName: string;
    qty: number;
    status: OrderStatus;
    idooOrderNumber?: string;
    trackingNumber?: string;
    carrierName?: string;
  }[];
}

export type UserRole = 'customer' | 'admin' | null;

export interface SheetSyncState {
  webhookUrl: string;
  autoSyncEnabled: boolean;
  lastSyncTime: string | null;
  status: 'synced' | 'syncing' | 'idle' | 'error';
  errorMessage?: string;
  totalSyncedItems: number;
}

export interface AuthSession {
  role: UserRole;
  username: string;
  displayName: string;
  loginTime: string;
}
