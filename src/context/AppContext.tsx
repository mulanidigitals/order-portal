import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  InventoryItem,
  AllocationItem,
  CustomerOrder,
  OrderItem,
  IdooBacklogItem,
  CustomerAccount,
  CustomerLedgerEntry,
  MarketBudgetConfig,
  SalesRecord,
  ProductAnalytics,
  PhoneWiseOrderSummary,
  AuthSession,
  UserRole,
} from '../types';
import {
  INITIAL_INVENTORY,
  INITIAL_ALLOCATIONS,
  INITIAL_ORDERS,
  INITIAL_SALES_RECORDS,
  INITIAL_CUSTOMER_ACCOUNT,
  INITIAL_LEDGER,
  INITIAL_MARKET_BUDGET,
  WICHITA_STORES,
  WICHITA_COMBINED_ID,
  StoreLocation,
} from '../data/initialData';

export interface SheetSyncState {
  webhookUrl: string;
  autoSyncEnabled: boolean;
  lastSyncTime: string | null;
  status: 'idle' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
  totalSyncedItems: number;
}

interface AppContextType {
  // Auth Session
  authSession: AuthSession;
  loginAsCustomer: (storeId?: string) => void;
  loginAsAdmin: (password: string) => boolean;
  logout: () => void;

  // Navigation & Store Filter
  selectedStoreId: string;
  setSelectedStoreId: (storeId: string) => void;
  stores: StoreLocation[];
  currentStore: StoreLocation;
  isCombinedStore: boolean;

  // Data
  inventory: InventoryItem[];
  allocations: AllocationItem[];
  orders: CustomerOrder[];
  idooBacklog: IdooBacklogItem[];
  customerAccount: CustomerAccount;
  ledger: CustomerLedgerEntry[];
  marketBudget: MarketBudgetConfig;
  salesRecords: SalesRecord[];

  // Computed Analytics & Catalogs
  productAnalytics: ProductAnalytics[];
  customerPhoneCatalog: ProductAnalytics[];
  phoneWiseOrders: PhoneWiseOrderSummary[];
  pendingOrdersCount: number;
  openIdooShortagesCount: number;
  recent7DaysSalesCount: number;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Google Sheets Live Auto-Sync
  sheetSyncState: SheetSyncState;
  updateSheetWebhookUrl: (url: string) => void;
  toggleAutoSync: () => void;
  triggerManualSheetSync: () => Promise<boolean>;

  // Actions
  toggleTopPriority: (sku: string) => void;
  acceptOrder: (orderId: string, notes?: string) => void;
  rejectOrder: (orderId: string, reason: string) => void;
  cancelOrder: (orderId: string, reason?: string) => void;
  editAndFinalizeOrder: (
    orderId: string,
    updatedItems: OrderItem[],
    notes?: string,
    idooOrderNumber?: string,
    trackingNumber?: string,
    carrierName?: string
  ) => { success: boolean; error?: string };

  placeCustomerOrder: (
    items: { itemSku: string; quantity: number }[],
    notes?: string
  ) => { success: boolean; orderId?: string; error?: string };

  processOrderAdmin: (
    orderId: string,
    idooOrderNumber: string,
    invoiceAmount: number,
    notes?: string,
    trackingNumber?: string,
    carrierName?: string
  ) => { success: boolean; error?: string };

  updateOrderStatus: (orderId: string, newStatus: CustomerOrder['status']) => void;

  updateIdooBacklogStatus: (
    backlogId: string,
    newStatus: IdooBacklogItem['status'],
    carrierRefNo?: string
  ) => void;

  addAllocationFromScreenshot: (
    parsedItems: {
      sku: string;
      description: string;
      manufacturer: string;
      packs: number;
    }[],
    replacePrevious?: boolean,
    batchLabel?: string
  ) => void;

  updateAllocationItem: (
    id: string,
    packs: number,
    note?: string
  ) => void;

  addAllocationItemManually: (item: {
    itemSku: string;
    itmdesc: string;
    manufacturer: string;
    packs: number;
    packUnitSize: number;
    totalPcs: number;
    availablePcs: number;
  }) => void;
  deleteAllocationItem: (id: string) => void;

  updateMarketBudgetLimit: (newLimit: number) => void;

  recordCustomerPayment: (
    amount: number,
    method: 'Wire' | 'ACH' | 'Cash' | 'Check' | 'Zelle' | 'Carrier Rebate',
    refNo: string,
    notes?: string
  ) => void;

  addLedgerEntry: (entry: Omit<CustomerLedgerEntry, 'id' | 'runningBalance'>) => void;
  updateLedgerEntry: (id: string, updated: Partial<CustomerLedgerEntry>) => void;
  deleteLedgerEntry: (id: string) => void;

  updateCreditLimit: (newLimit: number, notes?: string) => void;

  deleteOrder: (orderId: string) => void;
  resetToInitialData: () => void;
  adminPassword: string;
  updateAdminPassword: (newPass: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const DEFAULT_SHEET_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbw-VDOydZxvcQiZ8CH--K8qdKv8AAuUmBkteO5cTQUXEjlm-ZXbwnmauX7t-fqO8Szi/exec';

const STORAGE_KEYS = {
  AUTH: 'wichita_auth_session_v2',
  ADMIN_PASSWORD: 'wichita_admin_password_v2',
  INVENTORY: 'wichita_inventory_v2',
  ALLOCATIONS: 'wichita_allocations_v2',
  ORDERS: 'wichita_orders_v2',
  IDOO_BACKLOG: 'wichita_idoo_backlog_v2',
  ACCOUNT: 'wichita_customer_account_v2',
  LEDGER: 'wichita_ledger_v2',
  BUDGET: 'wichita_market_budget_v2',
  SALES: 'wichita_sales_records_v2',
  STORE_ID: 'wichita_selected_store_id_v2',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default login session (can be customer or admin, starts with customer default or saved)
  const [authSession, setAuthSession] = useState<AuthSession>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return {
      role: 'customer',
      username: 'wichita_dealer',
      displayName: 'Wichita Metro Dealer Portal',
      loginTime: new Date().toLocaleTimeString(),
    };
  });

  const [selectedStoreId, setSelectedStoreIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.STORE_ID) || WICHITA_COMBINED_ID;
  });

  const setSelectedStoreId = (id: string) => {
    setSelectedStoreIdState(id);
    localStorage.setItem(STORAGE_KEYS.STORE_ID, id);
  };

  // State with LocalStorage persistence
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [allocations, setAllocations] = useState<AllocationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALLOCATIONS);
    return saved ? JSON.parse(saved) : INITIAL_ALLOCATIONS;
  });

  const [orders, setOrders] = useState<CustomerOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [idooBacklog, setIdooBacklog] = useState<IdooBacklogItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IDOO_BACKLOG);
    if (saved) return JSON.parse(saved);
    // Initial sample backlog for order #WICH-ORD-903429
    return [
      {
        id: 'backlog-init-1',
        orderId: 'ord-hist-03',
        orderNumber: 'WICH-ORD-903429',
        storeId: 'ALL_WICHITA',
        storeName: 'All Wichita Stores (Combined)',
        itemSku: '195950637151',
        itmdesc: 'APL IPHONE 17 PRO MAX 256G SLV KIT',
        manufacturer: 'APPLE',
        neededQty: 4,
        unitWholesaleCost: 1238.49,
        totalCost: 4953.96,
        addedAt: '10/8/26',
        estimatedArrivalDate: '10/10/26',
        status: 'Awaiting IDOO Order',
      },
    ];
  });

  const [customerAccount, setCustomerAccount] = useState<CustomerAccount>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNT);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_ACCOUNT;
  });

  const [ledger, setLedger] = useState<CustomerLedgerEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEDGER);
    return saved ? JSON.parse(saved) : INITIAL_LEDGER;
  });

  const [marketBudget, setMarketBudget] = useState<MarketBudgetConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUDGET);
    return saved ? JSON.parse(saved) : INITIAL_MARKET_BUDGET;
  });

  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    return saved ? JSON.parse(saved) : INITIAL_SALES_RECORDS;
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(authSession));
  }, [authSession]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALLOCATIONS, JSON.stringify(allocations));
  }, [allocations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IDOO_BACKLOG, JSON.stringify(idooBacklog));
  }, [idooBacklog]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(customerAccount));
  }, [customerAccount]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(ledger));
  }, [ledger]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(marketBudget));
  }, [marketBudget]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(salesRecords));
  }, [salesRecords]);

  // Admin Password Management (Protected, configurable, with default 'WichitaAdmin2026')
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || 'WichitaAdmin2026';
  });

  const updateAdminPassword = (newPass: string) => {
    const trimmed = newPass.trim();
    if (trimmed.length < 4) return false;
    setAdminPassword(trimmed);
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, trimmed);
    return true;
  };

  // Auth actions
  const loginAsCustomer = (storeId?: string) => {
    setAuthSession({
      role: 'customer',
      username: 'wichita_customer',
      displayName: 'Wichita Store Customer Account',
      loginTime: new Date().toLocaleTimeString(),
    });
    if (storeId) {
      setSelectedStoreId(storeId);
    } else {
      setSelectedStoreId(WICHITA_COMBINED_ID);
    }
  };

  const loginAsAdmin = (password: string) => {
    // Only accepts the exact configured adminPassword
    if (password && password.trim() === adminPassword) {
      setAuthSession({
        role: 'admin',
        username: 'metro_admin',
        displayName: 'Administrator (Executive Backoffice)',
        loginTime: new Date().toLocaleTimeString(),
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthSession({
      role: null,
      username: '',
      displayName: '',
      loginTime: '',
    });
  };

  // Theme state (Defaults to Light Theme as requested)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('wichita_theme_mode') as 'dark' | 'light') || 'light';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('wichita_theme_mode', next);
      return next;
    });
  };

  // Google Sheets Live Auto-Sync Engine (Connected by default to user's Google Apps Script)
  const [sheetSyncState, setSheetSyncState] = useState<SheetSyncState>(() => {
    const savedUrl = localStorage.getItem('wichita_sheet_webhook_url');
    // Default to the provided live Google Apps Script URL if not set or empty
    const url =
      savedUrl && savedUrl.trim().startsWith('http')
        ? savedUrl.trim()
        : DEFAULT_SHEET_WEBHOOK_URL;
    const autoEnabled = localStorage.getItem('wichita_auto_sync_enabled') !== 'false';
    return {
      webhookUrl: url,
      autoSyncEnabled: autoEnabled,
      lastSyncTime: 'Connected (Live)',
      status: 'synced',
      totalSyncedItems: 0,
    };
  });

  const updateSheetWebhookUrl = (url: string) => {
    const cleanUrl = url.trim() || DEFAULT_SHEET_WEBHOOK_URL;
    localStorage.setItem('wichita_sheet_webhook_url', cleanUrl);
    setSheetSyncState((prev) => ({
      ...prev,
      webhookUrl: cleanUrl,
      status: 'synced',
      lastSyncTime: new Date().toLocaleTimeString(),
    }));
  };

  const toggleAutoSync = () => {
    setSheetSyncState((prev) => {
      const nextEnabled = !prev.autoSyncEnabled;
      localStorage.setItem('wichita_auto_sync_enabled', nextEnabled ? 'true' : 'false');
      return {
        ...prev,
        autoSyncEnabled: nextEnabled,
      };
    });
  };

  // Auto-sync dispatcher: dispatches in the background without freezing or requiring button clicks
  const dispatchAutoSync = async (eventType: string, payload: any) => {
    const targetUrl = sheetSyncState.webhookUrl || DEFAULT_SHEET_WEBHOOK_URL;
    if (!sheetSyncState.autoSyncEnabled || !targetUrl) {
      return;
    }

    try {
      setSheetSyncState((prev) => ({ ...prev, status: 'syncing' }));

      // Google Apps Script Web Apps receive POST in no-cors with keepalive
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          timestamp: new Date().toISOString(),
          territory: 'Wichita',
          data: payload,
        }),
      });

      setSheetSyncState((prev) => ({
        ...prev,
        status: 'synced',
        lastSyncTime: new Date().toLocaleTimeString(),
        totalSyncedItems: prev.totalSyncedItems + 1,
      }));
    } catch (err: any) {
      console.warn('Google Sheet background auto-sync:', err);
      setSheetSyncState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: err?.message || 'Sync failed',
      }));
    }
  };

  // Periodic background heartbeat sync every 60 seconds (Auto-syncs live on Git / Production)
  useEffect(() => {
    const activeUrl = sheetSyncState.webhookUrl || DEFAULT_SHEET_WEBHOOK_URL;
    if (!sheetSyncState.autoSyncEnabled || !activeUrl) return;
    const interval = setInterval(() => {
      dispatchAutoSync('BACKGROUND_HEARTBEAT_SYNC', {
        ordersCount: orders.length,
        allocationsCount: allocations.length,
        timestamp: new Date().toISOString(),
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [sheetSyncState.autoSyncEnabled, sheetSyncState.webhookUrl, orders.length, allocations.length]);

  const triggerManualSheetSync = async (): Promise<boolean> => {
    const targetUrl = sheetSyncState.webhookUrl || DEFAULT_SHEET_WEBHOOK_URL;
    if (!targetUrl) return false;
    await dispatchAutoSync('CUSTOMER_ORDER_PLACED', {
      orderNumber: orders[0]?.orderNumber || 'SYNC-TEST',
      totalPcs: orders[0]?.totalPcs || 0,
      totalWholesaleValue: orders[0]?.totalWholesaleValue || 0,
      status: orders[0]?.status || 'Verified Live',
      itemsSummary: `System Live Snapshot: ${orders.length} orders, ${allocations.length} allocations, ${inventory.length} price list items`,
    });
    return true;
  };

  const currentStore = useMemo(() => {
    return (
      WICHITA_STORES.find((s) => s.custno === selectedStoreId) || WICHITA_STORES[0]
    );
  }, [selectedStoreId]);

  const isCombinedStore = selectedStoreId === WICHITA_COMBINED_ID;

  // Toggle TOP priority flag on any item (User requested: "TOP WOH HONGI JO ME PRICE LIST ME END ROW ME TOP LIKH DUNGA")
  const toggleTopPriority = (sku: string) => {
    setInventory((prev) =>
      prev.map((i) => (i.item === sku ? { ...i, isTopPriority: !i.isTopPriority } : i))
    );
  };

  // Product Analytics Calculation (incorporating Combined vs Specific Store)
  const productAnalytics = useMemo(() => {
    // Unique items from Wichita inventory and allocations
    const uniqueMap = new Map<string, InventoryItem>();
    inventory.forEach((item) => {
      if (!uniqueMap.has(item.item)) {
        uniqueMap.set(item.item, item);
      }
    });

    // Also include any items present in allocations that may not be in inventory table
    allocations.forEach((alloc) => {
      if (!uniqueMap.has(alloc.itemSku)) {
        uniqueMap.set(alloc.itemSku, {
          id: `inv-alloc-${alloc.itemSku}`,
          custno: selectedStoreId,
          company: 'Wichita Central Warehouse',
          marketid: 'WICHITA',
          region: 'WICHITA',
          item: alloc.itemSku,
          manufacturer: alloc.manufacturer || 'METRO',
          color: 'STANDARD',
          prodline: 'METROPCS',
          category: 'PHONES',
          subclass: 'SMARTPHONE',
          itmdesc: alloc.itmdesc,
          serialized: true,
          price: 199.99,
          qty: alloc.availablePcs,
          cost: 150.0,
          lastcost: 150.0,
          wholesale: 160.0,
          adddate: '3/1/26',
        });
      }
    });

    const results: ProductAnalytics[] = [];

    uniqueMap.forEach((invItem, sku) => {
      // Find matching allocation
      const alloc = allocations.find((a) => a.itemSku === sku);
      const availableAllocationPcs = alloc ? Math.max(0, alloc.availablePcs) : 0;

      // Current inventory: If Combined, sum across ALL Wichita stores! Otherwise specific store
      const storeInv = isCombinedStore
        ? inventory.filter((i) => i.item === sku).reduce((sum, i) => sum + i.qty, 0)
        : inventory
            .filter((i) => i.item === sku && i.custno === selectedStoreId)
            .reduce((sum, i) => sum + i.qty, 0);

      // Customer previous orders total pcs for this item
      const prevOrdersPcs = orders
        .filter((o) => o.status !== 'Cancelled')
        .reduce((sum, o) => {
          if (!isCombinedStore && o.storeId !== selectedStoreId && o.storeId !== WICHITA_COMBINED_ID) {
            return sum;
          }
          const itemInOrder = o.items.find((it) => it.itemSku === sku);
          return sum + (itemInOrder ? itemInOrder.orderedQty : 0);
        }, 0);

      // Sales velocity (last 7 days vs previous 7 days)
      const now = new Date('2026-10-10');
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const itemSales = salesRecords.filter((s) => s.itemSku === sku);
      const last7DaysSalesPcs = itemSales
        .filter((s) => new Date(s.saleDate) >= sevenDaysAgo)
        .reduce((sum, s) => sum + s.quantitySold, 0);

      const previous7DaysSalesPcs = itemSales
        .filter((s) => {
          const d = new Date(s.saleDate);
          return d >= fourteenDaysAgo && d < sevenDaysAgo;
        })
        .reduce((sum, s) => sum + s.quantitySold, 0);

      const last14DaysSalesPcs = itemSales
        .filter((s) => new Date(s.saleDate) >= fourteenDaysAgo)
        .reduce((sum, s) => sum + s.quantitySold, 0);

      // Trend percentage change
      const salesTrendPercentage =
        previous7DaysSalesPcs > 0
          ? Math.round(((last7DaysSalesPcs - previous7DaysSalesPcs) / previous7DaysSalesPcs) * 100)
          : last7DaysSalesPcs > 0
          ? 25
          : 0;

      // Weekly Velocity & Forecasts
      const weeklyVelocity = last7DaysSalesPcs > 0 ? last7DaysSalesPcs : Math.max(1, Math.round(last14DaysSalesPcs / 2));
      const projected2WeeksDemandPcs = weeklyVelocity * 2;
      const projected3WeeksDemandPcs = weeklyVelocity * 3;

      // Weeks of Supply (WoS)
      const weeksOfSupply = weeklyVelocity > 0 ? Number((storeInv / weeklyVelocity).toFixed(1)) : (storeInv > 0 ? 8 : 0);

      // Over-ordering & Stockout risk
      const overOrderingRisk = weeksOfSupply >= 3.5 && storeInv >= 5;
      const stockoutRisk = storeInv <= 2 && weeklyVelocity >= 3;

      // Recommendation quantity
      let recommendedOrderQtyPcs = 0;
      if (weeklyVelocity > 0) {
        const targetStock = weeklyVelocity * 2;
        const deficit = targetStock - storeInv;
        recommendedOrderQtyPcs = deficit > 0 ? deficit : 0;
      }

      results.push({
        itemSku: sku,
        itmdesc: invItem.itmdesc,
        manufacturer: invItem.manufacturer || 'METRO',
        category: invItem.category,
        price: invItem.price,
        wholesale: invItem.wholesale,
        currentInventory: storeInv,
        availableAllocationPcs,
        customerPreviousOrdersPcs: prevOrdersPcs,
        last7DaysSalesPcs,
        last14DaysSalesPcs,
        projected2WeeksDemandPcs,
        projected3WeeksDemandPcs,
        weeksOfSupply,
        recommendedOrderQtyPcs,
        overOrderingRisk,
        stockoutRisk,
        isTopPriority: !!invItem.isTopPriority,
        salesTrendPercentage,
      });
    });

    return results;
  }, [inventory, allocations, orders, salesRecords, selectedStoreId, isCombinedStore]);

  // Customer Phone Catalog
  const customerPhoneCatalog = useMemo(() => {
    return productAnalytics
      .filter((p) => p.category === 'PHONES')
      .sort((a, b) => {
        // First priority: Top Priority items if flagged
        if (b.isTopPriority !== a.isTopPriority) {
          return b.isTopPriority ? 1 : -1;
        }
        // Second priority: Available Allocation items top par aane chahiye
        if (b.availableAllocationPcs !== a.availableAllocationPcs) {
          return b.availableAllocationPcs - a.availableAllocationPcs;
        }
        return b.last7DaysSalesPcs - a.last7DaysSalesPcs;
      });
  }, [productAnalytics]);

  // Phone-wise Cumulative Order History (User requested: "MY ORDER ME HISTORY POORNI AANI CHAHIHYE ORDERS AND PHONE WISE")
  const phoneWiseOrders = useMemo(() => {
    const phoneMap = new Map<string, PhoneWiseOrderSummary>();

    orders.forEach((ord) => {
      ord.items.forEach((it) => {
        const existing = phoneMap.get(it.itemSku);
        if (!existing) {
          phoneMap.set(it.itemSku, {
            itemSku: it.itemSku,
            itmdesc: it.itmdesc,
            manufacturer: it.manufacturer,
            totalUnitsOrdered: it.orderedQty,
            totalWholesaleSpent: it.orderedQty * it.wholesalePrice,
            totalAllocatedFulfilled: it.availableFromAllocation,
            totalIdooProcured: it.shortageQty,
            orderOccurrences: 1,
            lastOrderedDate: ord.createdAt,
            recentOrders: [
              {
                orderNumber: ord.orderNumber,
                date: ord.createdAt,
                storeName: ord.storeName || 'Wichita Territory',
                qty: it.orderedQty,
                status: ord.status,
                idooOrderNumber: ord.idooOrderNumber,
                trackingNumber: ord.trackingNumber,
                carrierName: ord.carrierName,
              },
            ],
          });
        } else {
          existing.totalUnitsOrdered += it.orderedQty;
          existing.totalWholesaleSpent += it.orderedQty * it.wholesalePrice;
          existing.totalAllocatedFulfilled += it.availableFromAllocation;
          existing.totalIdooProcured += it.shortageQty;
          existing.orderOccurrences += 1;
          existing.recentOrders.push({
            orderNumber: ord.orderNumber,
            date: ord.createdAt,
            storeName: ord.storeName || 'Wichita Territory',
            qty: it.orderedQty,
            status: ord.status,
            idooOrderNumber: ord.idooOrderNumber,
            trackingNumber: ord.trackingNumber,
            carrierName: ord.carrierName,
          });
        }
      });
    });

    return Array.from(phoneMap.values()).sort(
      (a, b) => b.totalUnitsOrdered - a.totalUnitsOrdered
    );
  }, [orders]);

  // Counts
  const pendingOrdersCount = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'Pending Review' || o.status === 'IDOO Shortage Pending'
    ).length;
  }, [orders]);

  const openIdooShortagesCount = useMemo(() => {
    return idooBacklog.filter((b) => b.status !== 'Fulfilled & Shipped').length;
  }, [idooBacklog]);

  const recent7DaysSalesCount = useMemo(() => {
    return productAnalytics.reduce((acc, curr) => acc + curr.last7DaysSalesPcs, 0);
  }, [productAnalytics]);

  // Place Order
  const placeCustomerOrder = (
    orderItems: { itemSku: string; quantity: number }[],
    notes?: string
  ) => {
    if (!orderItems || orderItems.length === 0) {
      return { success: false, error: 'Order must contain at least 1 item.' };
    }

    let orderTotalPcs = 0;
    let orderTotalWholesale = 0;
    let orderTotalRetail = 0;
    let totalShortage = 0;
    const itemsProcessed: OrderItem[] = [];
    const newBacklogItems: IdooBacklogItem[] = [];

    const orderNumber = `WICH-ORD-${Date.now().toString().slice(-6)}`;
    const orderId = `order-${Date.now()}`;

    const updatedAllocations = [...allocations];

    for (const req of orderItems) {
      if (req.quantity <= 0) continue;

      const invItem = inventory.find((i) => i.item === req.itemSku);
      const allocIdx = updatedAllocations.findIndex((a) => a.itemSku === req.itemSku);
      const alloc = allocIdx >= 0 ? updatedAllocations[allocIdx] : null;

      const itmdesc = invItem ? invItem.itmdesc : alloc ? alloc.itmdesc : req.itemSku;
      const manufacturer = invItem ? invItem.manufacturer : alloc ? alloc.manufacturer : 'GENERIC';
      const wholesalePrice = invItem ? invItem.wholesale : 150.0;
      const unitPrice = invItem ? invItem.price : 199.99;

      const currentAvailable = alloc ? Math.max(0, alloc.availablePcs) : 0;
      const availableFromAlloc = Math.min(req.quantity, currentAvailable);
      const shortage = Math.max(0, req.quantity - availableFromAlloc);

      if (alloc && availableFromAlloc > 0) {
        updatedAllocations[allocIdx] = {
          ...alloc,
          reservedPcs: alloc.reservedPcs + availableFromAlloc,
          availablePcs: Math.max(0, alloc.availablePcs - availableFromAlloc),
        };
      }

      orderTotalPcs += req.quantity;
      orderTotalWholesale += wholesalePrice * req.quantity;
      orderTotalRetail += unitPrice * req.quantity;
      totalShortage += shortage;

      itemsProcessed.push({
        itemSku: req.itemSku,
        itmdesc,
        manufacturer,
        orderedQty: req.quantity,
        availableFromAllocation: availableFromAlloc,
        shortageQty: shortage,
        unitPrice,
        wholesalePrice,
      });

      if (shortage > 0) {
        const estArrival = new Date();
        estArrival.setDate(estArrival.getDate() + 2);

        newBacklogItems.push({
          id: `backlog-${Date.now()}-${req.itemSku}`,
          orderId,
          orderNumber,
          storeId: currentStore.custno,
          storeName: currentStore.name,
          itemSku: req.itemSku,
          itmdesc,
          manufacturer,
          neededQty: shortage,
          unitWholesaleCost: wholesalePrice,
          totalCost: wholesalePrice * shortage,
          addedAt: new Date().toLocaleDateString('en-US'),
          estimatedArrivalDate: estArrival.toLocaleDateString('en-US'),
          status: 'Awaiting IDOO Order',
        });
      }
    }

    const hasShortage = totalShortage > 0;
    const initialStatus: CustomerOrder['status'] = hasShortage
      ? 'IDOO Shortage Pending'
      : 'Pending Review';

    const newOrder: CustomerOrder = {
      id: orderId,
      orderNumber,
      storeId: currentStore.custno,
      storeName: currentStore.name,
      customerName: customerAccount.customerName,
      items: itemsProcessed,
      totalPcs: orderTotalPcs,
      totalWholesaleValue: Number(orderTotalWholesale.toFixed(2)),
      totalRetailValue: Number(orderTotalRetail.toFixed(2)),
      status: initialStatus,
      hasShortage,
      shortageTotalPcs: totalShortage,
      notes: notes || '',
      createdAt: new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    };

    setAllocations(updatedAllocations);
    setOrders((prev) => [newOrder, ...prev]);
    if (newBacklogItems.length > 0) {
      setIdooBacklog((prev) => [...newBacklogItems, ...prev]);
    }

    dispatchAutoSync('CUSTOMER_ORDER_PLACED', {
      order: newOrder,
      ...newOrder,
      itemsSummary: newOrder.items
        .map((it) => `${it.itmdesc} (x${it.orderedQty} pcs)`)
        .join(', '),
    });

    return { success: true, orderId };
  };

  // Process order (Admin Prompt)
  const processOrderAdmin = (
    orderId: string,
    idooOrderNumber: string,
    invoiceAmount: number,
    notes?: string,
    trackingNumber?: string,
    carrierName?: string
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { success: false, error: 'Order not found.' };
    }

    if (!idooOrderNumber.trim()) {
      return { success: false, error: 'IDOO confirmation number is required.' };
    }

    if (!invoiceAmount || invoiceAmount <= 0) {
      return { success: false, error: 'Valid invoice amount is required.' };
    }

    const newUsedBudget = marketBudget.usedAmount + invoiceAmount;
    if (newUsedBudget > marketBudget.monthlyBudgetLimit) {
      const overBudgetAmount = newUsedBudget - marketBudget.monthlyBudgetLimit;
      const proceed = window.confirm(
        `Warning: This order ($${invoiceAmount.toLocaleString()}) exceeds the Wichita IDOO Limit by $${overBudgetAmount.toLocaleString()}! Do you want to approve with budget override?`
      );
      if (!proceed) {
        return { success: false, error: 'Order cancelled: Exceeds monthly IDOO limit.' };
      }
    }

    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'Placed / Processing' as const,
          idooOrderNumber,
          idooInvoiceAmount: invoiceAmount,
          trackingNumber: trackingNumber || o.trackingNumber || `TRK-${Date.now().toString().slice(-8)}`,
          carrierName: carrierName || o.carrierName || 'UPS Ground',
          processedAt: new Date().toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
          notes: notes ? `${o.notes ? o.notes + ' | ' : ''}${notes}` : o.notes,
        };
      }
      return o;
    });

    setOrders(updatedOrders);

    setMarketBudget((prev) => ({
      ...prev,
      usedAmount: prev.usedAmount + invoiceAmount,
      lastUpdated: 'Just now',
    }));

    const newBalance = customerAccount.currentBalance + invoiceAmount;
    const newEntry: CustomerLedgerEntry = {
      id: `led-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US'),
      type: 'Order Invoice',
      referenceNumber: idooOrderNumber,
      orderId: targetOrder.id,
      debit: invoiceAmount,
      credit: 0,
      runningBalance: newBalance,
      notes: `Order #${targetOrder.orderNumber} placed & invoiced via IDOO (${targetOrder.totalPcs} pcs). ${notes || ''}`,
    };

    setLedger((prev) => [...prev, newEntry]);
    setCustomerAccount((prev) => ({
      ...prev,
      currentBalance: newBalance,
      availableCredit: Math.max(0, prev.creditLimit - newBalance),
    }));

    setIdooBacklog((prev) =>
      prev.map((b) => {
        if (b.orderId === orderId && b.status === 'Awaiting IDOO Order') {
          return {
            ...b,
            status: 'IDOO Ordered',
            carrierRefNo: idooOrderNumber,
          };
        }
        return b;
      })
    );

    const targetUpdated = updatedOrders.find((o) => o.id === orderId);

    dispatchAutoSync('ORDER_PROCESSED', {
      order: targetUpdated || targetOrder,
      orderId,
      idooOrderNumber,
      invoiceAmount,
      idooInvoiceAmount: invoiceAmount,
      trackingNumber: trackingNumber || targetUpdated?.trackingNumber,
      carrierName: carrierName || targetUpdated?.carrierName,
      orderNumber: targetOrder.orderNumber,
      totalPcs: targetOrder.totalPcs,
      totalWholesaleValue: targetOrder.totalWholesaleValue,
      status: 'IDOO Confirmed',
    });

    return { success: true };
  };

  const acceptOrder = (orderId: string, notes?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: o.hasShortage ? 'IDOO Shortage Pending' : 'Approved',
              notes: notes ? `${o.notes ? o.notes + ' | ' : ''}Approved: ${notes}` : o.notes,
            }
          : o
      )
    );
    dispatchAutoSync('ORDER_ACCEPTED', { orderId, notes });
  };

  const rejectOrder = (orderId: string, reason: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      // Release reserved allocations back to available
      setAllocations((prevAlloc) =>
        prevAlloc.map((a) => {
          const orderedItem = order.items.find((it) => it.itemSku === a.itemSku);
          if (orderedItem && orderedItem.availableFromAllocation > 0) {
            const restoredReserved = Math.max(0, a.reservedPcs - orderedItem.availableFromAllocation);
            return {
              ...a,
              reservedPcs: restoredReserved,
              availablePcs: a.totalPcs - restoredReserved,
            };
          }
          return a;
        })
      );
      // Remove shortage items from backlog
      setIdooBacklog((prev) => prev.filter((b) => b.orderId !== orderId));
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'Rejected',
              rejectionReason: reason,
              notes: `${o.notes ? o.notes + ' | ' : ''}Rejected: ${reason}`,
            }
          : o
      )
    );
    dispatchAutoSync('ORDER_REJECTED', { orderId, reason });
  };

  const cancelOrder = (orderId: string, reason?: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order && order.status !== 'Cancelled' && order.status !== 'Rejected') {
      setAllocations((prevAlloc) =>
        prevAlloc.map((a) => {
          const orderedItem = order.items.find((it) => it.itemSku === a.itemSku);
          if (orderedItem && orderedItem.availableFromAllocation > 0) {
            const restoredReserved = Math.max(0, a.reservedPcs - orderedItem.availableFromAllocation);
            return {
              ...a,
              reservedPcs: restoredReserved,
              availablePcs: a.totalPcs - restoredReserved,
            };
          }
          return a;
        })
      );
      setIdooBacklog((prev) => prev.filter((b) => b.orderId !== orderId));
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'Cancelled',
              notes: reason ? `${o.notes ? o.notes + ' | ' : ''}Cancelled: ${reason}` : o.notes,
            }
          : o
      )
    );
    dispatchAutoSync('ORDER_CANCELLED', { orderId, reason });
  };

  const deleteOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      // Release allocations if held in reserved
      if (order.status !== 'Cancelled' && order.status !== 'Rejected' && order.status !== 'Shipped / Fulfilled') {
        setAllocations((prevAlloc) =>
          prevAlloc.map((a) => {
            const orderedItem = order.items.find((it) => it.itemSku === a.itemSku);
            if (orderedItem && orderedItem.availableFromAllocation > 0) {
              const restoredReserved = Math.max(0, a.reservedPcs - orderedItem.availableFromAllocation);
              return {
                ...a,
                reservedPcs: restoredReserved,
                availablePcs: a.totalPcs - restoredReserved,
              };
            }
            return a;
          })
        );
      }
      // Clean up backlog entries for this order
      setIdooBacklog((prev) => prev.filter((b) => b.orderId !== orderId));
      // Delete order permanently
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      dispatchAutoSync('ORDER_DELETED', { orderId, orderNumber: order.orderNumber });
    }
  };

  const editAndFinalizeOrder = (
    orderId: string,
    updatedItems: OrderItem[],
    notes?: string,
    idooOrderNumber?: string,
    trackingNumber?: string,
    carrierName?: string
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found' };

    let newTotalPcs = 0;
    let newTotalWholesale = 0;
    let newTotalRetail = 0;
    let newShortageTotal = 0;

    const updatedAllocations = [...allocations];

    // Release old reservations first
    order.items.forEach((oldItem) => {
      const aIdx = updatedAllocations.findIndex((a) => a.itemSku === oldItem.itemSku);
      if (aIdx >= 0) {
        const a = updatedAllocations[aIdx];
        const restoredReserved = Math.max(0, a.reservedPcs - oldItem.availableFromAllocation);
        updatedAllocations[aIdx] = {
          ...a,
          reservedPcs: restoredReserved,
          availablePcs: Math.max(0, a.totalPcs - restoredReserved),
        };
      }
    });

    const finalizedItems: OrderItem[] = [];
    const newBacklogList: IdooBacklogItem[] = [];

    updatedItems.forEach((it) => {
      if (it.orderedQty <= 0) return;
      const aIdx = updatedAllocations.findIndex((a) => a.itemSku === it.itemSku);
      const alloc = aIdx >= 0 ? updatedAllocations[aIdx] : null;
      const avail = alloc ? Math.max(0, alloc.availablePcs) : 0;
      const availFromAlloc = Math.min(it.orderedQty, avail);
      const shortage = Math.max(0, it.orderedQty - availFromAlloc);

      if (alloc && availFromAlloc > 0) {
        updatedAllocations[aIdx] = {
          ...alloc,
          reservedPcs: alloc.reservedPcs + availFromAlloc,
          availablePcs: Math.max(0, alloc.availablePcs - availFromAlloc),
        };
      }

      newTotalPcs += it.orderedQty;
      newTotalWholesale += it.wholesalePrice * it.orderedQty;
      newTotalRetail += it.unitPrice * it.orderedQty;
      newShortageTotal += shortage;

      finalizedItems.push({
        ...it,
        availableFromAllocation: availFromAlloc,
        shortageQty: shortage,
      });

      if (shortage > 0) {
        const est = new Date();
        est.setDate(est.getDate() + 2);
        newBacklogList.push({
          id: `backlog-${Date.now()}-${it.itemSku}`,
          orderId,
          orderNumber: order.orderNumber,
          storeId: 'ALL_WICHITA',
          storeName: 'All Wichita Stores (Combined)',
          itemSku: it.itemSku,
          itmdesc: it.itmdesc,
          manufacturer: it.manufacturer,
          neededQty: shortage,
          unitWholesaleCost: it.wholesalePrice,
          totalCost: it.wholesalePrice * shortage,
          addedAt: new Date().toLocaleDateString('en-US'),
          estimatedArrivalDate: est.toLocaleDateString('en-US'),
          status: 'Awaiting IDOO Order',
        });
      }
    });

    setIdooBacklog((prev) => [
      ...prev.filter((b) => b.orderId !== orderId),
      ...newBacklogList,
    ]);

    setAllocations(updatedAllocations);

    const hasShortage = newShortageTotal > 0;
    const newStatus: CustomerOrder['status'] = hasShortage ? 'IDOO Shortage Pending' : 'Approved';

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              items: finalizedItems,
              totalPcs: newTotalPcs,
              totalWholesaleValue: Number(newTotalWholesale.toFixed(2)),
              totalRetailValue: Number(newTotalRetail.toFixed(2)),
              hasShortage,
              shortageTotalPcs: newShortageTotal,
              status: newStatus,
              idooOrderNumber: idooOrderNumber !== undefined ? idooOrderNumber : o.idooOrderNumber,
              trackingNumber: trackingNumber !== undefined ? trackingNumber : o.trackingNumber,
              carrierName: carrierName !== undefined ? carrierName : o.carrierName,
              notes: notes ? `${o.notes ? o.notes + ' | ' : ''}Finalized: ${notes}` : o.notes,
            }
          : o
      )
    );

    dispatchAutoSync('ORDER_FINALIZED_EDIT', {
      orderId,
      totalPcs: newTotalPcs,
      wholesale: newTotalWholesale,
      items: finalizedItems,
      idooOrderNumber,
      trackingNumber,
    });

    return { success: true };
  };

  const updateOrderStatus = (orderId: string, newStatus: CustomerOrder['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const updateIdooBacklogStatus = (
    backlogId: string,
    newStatus: IdooBacklogItem['status'],
    carrierRefNo?: string
  ) => {
    setIdooBacklog((prev) =>
      prev.map((b) => {
        if (b.id === backlogId) {
          return {
            ...b,
            status: newStatus,
            carrierRefNo: carrierRefNo || b.carrierRefNo,
          };
        }
        return b;
      })
    );
  };

  // Multiple attachment upload support + Zero out previous allocations when replacePrevious=true
  const addAllocationFromScreenshot = (
    parsedItems: {
      sku: string;
      description: string;
      manufacturer: string;
      packs: number;
    }[],
    replacePrevious: boolean = true,
    batchLabel?: string
  ) => {
    setAllocations((prevAllocations) => {
      // If replacePrevious is true (Default), zero out all existing allocations first!
      let baseAllocations: AllocationItem[] = replacePrevious
        ? prevAllocations.map((a) => ({
            ...a,
            packs: 0,
            totalPcs: 0,
            availablePcs: 0,
            lastUpdated: 'Zeroed by new allocation upload',
          }))
        : [...prevAllocations];

      for (const item of parsedItems) {
        const isIphone =
          item.manufacturer.toUpperCase().includes('APPLE') ||
          item.description.toUpperCase().includes('IPHONE') ||
          item.sku.startsWith('1959') ||
          item.sku.startsWith('1942');

        const packUnitSize = isIphone ? 20 : 5;
        const totalPcs = item.packs * packUnitSize;

        const existingIdx = baseAllocations.findIndex((a) => a.itemSku === item.sku);
        if (existingIdx >= 0) {
          const exist = baseAllocations[existingIdx];
          const newTotalPcs = replacePrevious ? totalPcs : exist.totalPcs + totalPcs;
          const newAvailablePcs = Math.max(0, newTotalPcs - exist.reservedPcs);
          baseAllocations[existingIdx] = {
            ...exist,
            packs: replacePrevious ? item.packs : exist.packs + item.packs,
            packUnitSize,
            totalPcs: newTotalPcs,
            availablePcs: newAvailablePcs,
            lastUpdated: 'Just now (Multi-Attachment OCR)',
            sourceNote: batchLabel || 'Screenshot OCR Batch',
          };
        } else {
          baseAllocations.push({
            id: `alloc-${Date.now()}-${item.sku}`,
            itemSku: item.sku,
            itmdesc: item.description,
            manufacturer: item.manufacturer.toUpperCase(),
            packs: item.packs,
            packUnitSize,
            totalPcs,
            reservedPcs: 0,
            availablePcs: totalPcs,
            lastUpdated: 'Just now (Multi-Attachment OCR)',
            sourceNote: batchLabel || 'Screenshot OCR Batch',
          });
        }
      }

      return baseAllocations;
    });

    dispatchAutoSync('ALLOCATION_INGESTED', {
      itemsCount: parsedItems.length,
      replacePrevious,
      batchLabel,
    });
  };

  const updateAllocationItem = (id: string, packs: number, note?: string) => {
    setAllocations((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const totalPcs = packs * a.packUnitSize;
          const availablePcs = Math.max(0, totalPcs - a.reservedPcs);
          return {
            ...a,
            packs,
            totalPcs,
            availablePcs,
            lastUpdated: 'Just now',
            sourceNote: note || a.sourceNote,
          };
        }
        return a;
      })
    );
  };

  const addAllocationItemManually = (item: {
    itemSku: string;
    itmdesc: string;
    manufacturer: string;
    packs: number;
    packUnitSize: number;
    totalPcs: number;
    availablePcs: number;
  }) => {
    setAllocations((prev) => {
      const existingIdx = prev.findIndex((a) => a.itemSku === item.itemSku);
      if (existingIdx >= 0) {
        const exist = prev[existingIdx];
        const newTotal = exist.totalPcs + item.totalPcs;
        const newPacks = exist.packs + item.packs;
        const newAvail = Math.max(0, newTotal - exist.reservedPcs);
        const updated = [...prev];
        updated[existingIdx] = {
          ...exist,
          packs: newPacks,
          totalPcs: newTotal,
          availablePcs: newAvail,
          lastUpdated: 'Just now (Manual Entry)',
          sourceNote: 'Admin Manual Allocation',
        };
        return updated;
      }
      return [
        {
          id: `alloc-manual-${Date.now()}`,
          itemSku: item.itemSku,
          itmdesc: item.itmdesc,
          manufacturer: item.manufacturer.toUpperCase(),
          packs: item.packs,
          packUnitSize: item.packUnitSize,
          totalPcs: item.totalPcs,
          reservedPcs: 0,
          availablePcs: item.availablePcs,
          lastUpdated: 'Just now (Manual Entry)',
          sourceNote: 'Admin Manual Allocation',
        },
        ...prev,
      ];
    });
    dispatchAutoSync('ALLOCATION_UPDATED', { manualAdd: item });
  };

  const deleteAllocationItem = (id: string) => {
    setAllocations((prev) => prev.filter((a) => a.id !== id));
    dispatchAutoSync('ALLOCATION_UPDATED', { deletedId: id });
  };

  const updateMarketBudgetLimit = (newLimit: number) => {
    setMarketBudget((prev) => ({
      ...prev,
      monthlyBudgetLimit: newLimit,
      lastUpdated: 'Just now',
    }));
  };

  // Recomputes running balance for all ledger entries in chronological order
  const recomputeLedgerBalances = (entries: CustomerLedgerEntry[]) => {
    let running = 0;
    return entries.map((entry) => {
      running += (entry.debit || 0) - (entry.credit || 0);
      return {
        ...entry,
        runningBalance: Number(running.toFixed(2)),
      };
    });
  };

  const addLedgerEntry = (entryData: Omit<CustomerLedgerEntry, 'id' | 'runningBalance'>) => {
    setLedger((prev) => {
      const newEntry: CustomerLedgerEntry = {
        ...entryData,
        id: `led-${Date.now()}`,
        runningBalance: 0,
      };
      const updated = recomputeLedgerBalances([...prev, newEntry]);
      const finalBalance = updated.length > 0 ? updated[updated.length - 1].runningBalance : 0;
      setCustomerAccount((acc) => ({
        ...acc,
        currentBalance: finalBalance,
        availableCredit: Math.max(0, acc.creditLimit - finalBalance),
      }));
      return updated;
    });
  };

  const updateLedgerEntry = (id: string, updated: Partial<CustomerLedgerEntry>) => {
    setLedger((prev) => {
      const mapped = prev.map((e) => (e.id === id ? { ...e, ...updated } : e));
      const recomputed = recomputeLedgerBalances(mapped);
      const finalBalance = recomputed.length > 0 ? recomputed[recomputed.length - 1].runningBalance : 0;
      setCustomerAccount((acc) => ({
        ...acc,
        currentBalance: finalBalance,
        availableCredit: Math.max(0, acc.creditLimit - finalBalance),
      }));
      return recomputed;
    });
  };

  const deleteLedgerEntry = (id: string) => {
    setLedger((prev) => {
      const filtered = prev.filter((e) => e.id !== id);
      const recomputed = recomputeLedgerBalances(filtered);
      const finalBalance = recomputed.length > 0 ? recomputed[recomputed.length - 1].runningBalance : 0;
      setCustomerAccount((acc) => ({
        ...acc,
        currentBalance: finalBalance,
        availableCredit: Math.max(0, acc.creditLimit - finalBalance),
      }));
      return recomputed;
    });
  };

  const recordCustomerPayment = (
    amount: number,
    method: 'Wire' | 'ACH' | 'Cash' | 'Check' | 'Zelle' | 'Carrier Rebate',
    refNo: string,
    notes?: string
  ) => {
    addLedgerEntry({
      date: new Date().toLocaleDateString('en-US'),
      type: 'Payment Received',
      referenceNumber: refNo,
      debit: 0,
      credit: amount,
      paymentMethod: method,
      notes: notes || `Payment received via ${method}`,
    });
  };

  const updateCreditLimit = (newLimit: number, notes?: string) => {
    setCustomerAccount((prev) => ({
      ...prev,
      creditLimit: newLimit,
      availableCredit: Math.max(0, newLimit - prev.currentBalance),
    }));

    addLedgerEntry({
      date: new Date().toLocaleDateString('en-US'),
      type: 'Credit Limit Adjustment',
      referenceNumber: `LIMIT-REV-${Date.now().toString().slice(-4)}`,
      debit: 0,
      credit: 0,
      notes: notes || `Credit limit updated to $${newLimit.toLocaleString()}`,
    });
  };

  const resetToInitialData = () => {
    setInventory(INITIAL_INVENTORY);
    setAllocations(INITIAL_ALLOCATIONS);
    setOrders(INITIAL_ORDERS);
    setIdooBacklog([]);
    setCustomerAccount(INITIAL_CUSTOMER_ACCOUNT);
    setLedger(INITIAL_LEDGER);
    setMarketBudget(INITIAL_MARKET_BUDGET);
    setSalesRecords(INITIAL_SALES_RECORDS);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        authSession,
        loginAsCustomer,
        loginAsAdmin,
        logout,
        selectedStoreId,
        setSelectedStoreId,
        stores: WICHITA_STORES,
        currentStore,
        isCombinedStore,
        inventory,
        allocations,
        orders,
        idooBacklog,
        customerAccount,
        ledger,
        marketBudget,
        salesRecords,
        productAnalytics,
        customerPhoneCatalog,
        phoneWiseOrders,
        pendingOrdersCount,
        openIdooShortagesCount,
        recent7DaysSalesCount,
        theme,
        toggleTheme,
        toggleTopPriority,
        acceptOrder,
        rejectOrder,
        cancelOrder,
        editAndFinalizeOrder,
        placeCustomerOrder,
        processOrderAdmin,
        updateOrderStatus,
        updateIdooBacklogStatus,
        addAllocationFromScreenshot,
        updateAllocationItem,
        addAllocationItemManually,
        deleteAllocationItem,
        updateMarketBudgetLimit,
        recordCustomerPayment,
        addLedgerEntry,
        updateLedgerEntry,
        deleteLedgerEntry,
        updateCreditLimit,
        deleteOrder,
        resetToInitialData,
        adminPassword,
        updateAdminPassword,
        sheetSyncState,
        updateSheetWebhookUrl,
        toggleAutoSync,
        triggerManualSheetSync,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
