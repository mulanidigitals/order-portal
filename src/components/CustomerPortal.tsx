import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CustomerOrderHistory } from './CustomerOrderHistory';
import {
  Smartphone,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Store,
  Sparkles,
  Info,
  ArrowRight,
  Flame,
  Layers,
} from 'lucide-react';

interface CartItem {
  itemSku: string;
  quantity: number;
}

export const CustomerPortal: React.FC = () => {
  const {
    currentStore,
    isCombinedStore,
    productAnalytics,
    placeCustomerOrder,
    orders,
    recent7DaysSalesCount,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [catalogFilter, setCatalogFilter] = useState<'TOP' | 'ALLOCATION' | 'ALL'>('ALL');
  const [categoryType, setCategoryType] = useState<'ALL_ITEMS' | 'PHONES' | 'BTS' | 'SIM CARD'>('ALL_ITEMS');

  // Cart State (SKU -> Quantity in pcs)
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);

  // Dynamic manufacturers from all price list items
  const manufacturers = useMemo(() => {
    const list = new Set<string>();
    productAnalytics.forEach((p) => {
      if (p.manufacturer) list.add(p.manufacturer.toUpperCase());
    });
    return ['ALL', ...Array.from(list)];
  }, [productAnalytics]);

  // Base list containing all items or category filtered
  const baseItems = useMemo(() => {
    if (categoryType === 'ALL_ITEMS') return productAnalytics;
    if (categoryType === 'PHONES') return productAnalytics.filter((p) => p.category === 'PHONES');
    if (categoryType === 'BTS') return productAnalytics.filter((p) => p.category === 'BTS');
    if (categoryType === 'SIM CARD') return productAnalytics.filter((p) => p.category === 'SIM CARD');
    return productAnalytics;
  }, [categoryType, productAnalytics]);

  // Filtered & Sorted products
  const filteredProducts = baseItems
    .filter((item) => {
      const matchesSearch =
        item.itmdesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemSku.includes(searchQuery) ||
        item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBrand =
        selectedBrand === 'ALL' ||
        item.manufacturer.toUpperCase() === selectedBrand.toUpperCase();

      if (catalogFilter === 'TOP') {
        return matchesSearch && matchesBrand && item.isTopPriority;
      }
      if (catalogFilter === 'ALLOCATION') {
        return matchesSearch && matchesBrand && item.availableAllocationPcs > 0;
      }
      return matchesSearch && matchesBrand;
    })
    .sort((a, b) => {
      // 1. Top Priority items if flagged in price list
      if (b.isTopPriority !== a.isTopPriority) {
        return b.isTopPriority ? 1 : -1;
      }
      // 2. Allocation available items on top
      if (b.availableAllocationPcs !== a.availableAllocationPcs) {
        return b.availableAllocationPcs - a.availableAllocationPcs;
      }
      return b.last7DaysSalesPcs - a.last7DaysSalesPcs;
    });

  // Cart management
  const updateCartQty = (sku: string, delta: number) => {
    setCart((prev) => {
      const current = prev[sku] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[sku];
        return copy;
      }
      return { ...prev, [sku]: next };
    });
  };

  const setCartExactQty = (sku: string, qty: number) => {
    const sanitized = Math.max(0, qty);
    setCart((prev) => {
      if (sanitized === 0) {
        const copy = { ...prev };
        delete copy[sku];
        return copy;
      }
      return { ...prev, [sku]: sanitized };
    });
  };

  const removeCartItem = (sku: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[sku];
      return copy;
    });
  };

  const cartItemsList: CartItem[] = Object.entries(cart).map(([sku, qty]) => ({
    itemSku: sku,
    quantity: qty,
  }));

  const cartTotalPcs = cartItemsList.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cartItemsList.length === 0) return;
    setOrderSubmitting(true);

    try {
      const result = placeCustomerOrder(cartItemsList, orderNotes);
      if (result.success) {
        setCart({});
        setOrderNotes('');
        setIsCartOpen(false);
        setOrderSuccessMessage(
          `Order #${result.orderId} placed successfully! Recorded in Wichita orders log and auto-synced with backup sheets.`
        );
        setActiveTab('orders');
      } else {
        alert(result.error || 'Failed to place order.');
      }
    } finally {
      setOrderSubmitting(false);
    }
  };

  const totalStoreInAllocation = productAnalytics.filter(
    (p) => p.availableAllocationPcs > 0 && p.category === 'PHONES'
  ).length;

  const totalTopCount = productAnalytics.filter(
    (p) => p.isTopPriority && p.category === 'PHONES'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Territory & Store Greeting Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-pink-50 text-pink-700 border border-pink-200">
                Dealer Ordering Portal
              </span>
              <span className="text-xs font-mono text-slate-500">
                Territory: {isCombinedStore ? 'Wichita (Combined Territory)' : currentStore.name}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Store className="w-6 h-6 text-pink-600" />
              <span>{isCombinedStore ? 'All Wichita Metro Stores' : currentStore.name}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Order phones directly based on current carrier allocations. Available allocated phones are priority-dispatched; shortages are submitted to IDOO with a 2-day fulfillment cycle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-center sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Available in Alloc</span>
              <span className="text-base font-black text-emerald-700 font-mono">
                {totalStoreInAllocation} Models
              </span>
              <span className="text-[10px] text-slate-500 block">Immediate dispatch</span>
            </div>

            <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-center sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">7-Day Sales Velocity</span>
              <span className="text-base font-black text-slate-900 font-mono">
                {recent7DaysSalesCount} pcs sold
              </span>
              <span className="text-[10px] text-slate-500 block">Across territory</span>
            </div>

            <div className="bg-pink-50/60 px-4 py-2.5 rounded-2xl border border-pink-200 text-center sm:text-right">
              <span className="text-[10px] uppercase font-bold text-pink-700 block">Order Cart</span>
              <button
                onClick={() => setIsCartOpen(true)}
                className="text-base font-black text-pink-700 hover:text-pink-800 transition-colors flex items-center justify-center sm:justify-end gap-1.5"
              >
                <ShoppingCart className="w-4 h-4 text-pink-600" />
                <span>{cartTotalPcs} pcs</span>
              </button>
              <span className="text-[10px] text-pink-600 block font-semibold cursor-pointer" onClick={() => setIsCartOpen(true)}>
                Review &amp; Submit →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {orderSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-3.5 rounded-2xl flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{orderSuccessMessage}</span>
          </div>
          <button
            onClick={() => setOrderSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tabs (NO Dealer Ledger Tab for Customer!) */}
      <div className="flex border-b border-slate-200 gap-3">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3.5 px-4 text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'border-pink-600 text-pink-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Product Catalog &amp; Ordering</span>
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono border border-slate-200">
            {filteredProducts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3.5 px-4 text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-pink-600 text-pink-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Order History (Full &amp; Phone-wise)</span>
          {orders.length > 0 && (
            <span className="text-xs bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded-full font-bold">
              {orders.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Catalog */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Rule Guidance Notice */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-pink-600 shrink-0" />
              <div>
                <strong className="text-slate-900">Dealer Ordering Rule:</strong> Allocation available items are sorted at the top. Order quantities are in <strong>Pieces (Pcs)</strong>.
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>In-Allocation: Ready for Dispatch</span>
              </span>
            </div>
          </div>

          {/* Filtering Bar (TOP, ALLOCATION, ALL + Brand Selector) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by phone model, SKU or Apple / Samsung..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Three Mandatory Filters: Top Priority, In-Allocation Only, Show All */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setCatalogFilter('TOP')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      catalogFilter === 'TOP'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-300" />
                    <span>🔥 Top Priority ({totalTopCount})</span>
                  </button>

                  <button
                    onClick={() => setCatalogFilter('ALLOCATION')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      catalogFilter === 'ALLOCATION'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>⚡ In-Allocation Only ({totalStoreInAllocation})</span>
                  </button>

                  <button
                    onClick={() => setCatalogFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      catalogFilter === 'ALL'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>📦 Show All ({baseItems.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Brand Filter & Category Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Brand:</span>
                </span>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  {manufacturers.map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedBrand(m)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        selectedBrand === m
                          ? 'bg-white text-slate-900 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Toggle (All Items vs Phones vs Tablets vs SIMs) */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold">Category:</span>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    onClick={() => setCategoryType('ALL_ITEMS')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      categoryType === 'ALL_ITEMS'
                        ? 'bg-pink-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Items ({productAnalytics.length})
                  </button>
                  <button
                    onClick={() => setCategoryType('PHONES')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      categoryType === 'PHONES'
                        ? 'bg-pink-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Phones
                  </button>
                  <button
                    onClick={() => setCategoryType('BTS')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      categoryType === 'BTS'
                        ? 'bg-pink-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tablets &amp; Gateways
                  </button>
                  <button
                    onClick={() => setCategoryType('SIM CARD')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      categoryType === 'SIM CARD'
                        ? 'bg-pink-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    SIM Cards
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((phone) => {
              const inCartQty = cart[phone.itemSku] || 0;
              const hasAllocation = phone.availableAllocationPcs > 0;

              return (
                <div
                  key={phone.itemSku}
                  className={`bg-white rounded-2xl border transition-all flex flex-col justify-between p-5 shadow-xs relative overflow-hidden ${
                    phone.isTopPriority
                      ? 'border-rose-400 ring-1 ring-rose-200 bg-rose-50/20'
                      : hasAllocation
                      ? 'border-slate-200 hover:border-pink-300 hover:shadow-md'
                      : 'border-slate-200/80 bg-slate-50/50'
                  }`}
                >
                  {/* Top Priority Badge if flagged */}
                  {phone.isTopPriority && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-600 to-pink-600 text-white font-black text-[9px] uppercase px-3 py-0.5 rounded-bl-xl tracking-wider shadow-xs flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-300" />
                      <span>TOP PRIORITY</span>
                    </div>
                  )}

                  <div>
                    {/* Header tags: Allocation status & smart reorder badge */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                      {hasAllocation ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{phone.availableAllocationPcs} pcs In Allocation</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>IDOO Order (2-Day SLA)</span>
                        </span>
                      )}

                      {phone.recommendedOrderQtyPcs > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                          <Sparkles className="w-3 h-3 text-pink-600" />
                          <span>Rec: +{phone.recommendedOrderQtyPcs} pcs</span>
                        </span>
                      )}
                    </div>

                    {/* Brand & Model Title */}
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      {phone.manufacturer} · {phone.category}
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2 mt-0.5 mb-1">
                      {phone.itmdesc}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-500 mb-4">
                      SKU: <span className="text-slate-700 font-semibold">{phone.itemSku}</span>
                    </p>

                    {/* Ordering Trend & Sales Dashboard Card */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center mb-4">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-medium">Store Stock</span>
                        <span className="text-sm font-black text-slate-900 font-mono">
                          {phone.currentInventory} pcs
                        </span>
                      </div>
                      <div className="border-x border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-medium">Last 7D Sold</span>
                        <span className="text-sm font-black text-pink-600 font-mono">
                          {phone.last7DaysSalesPcs} pcs
                        </span>
                        {phone.salesTrendPercentage !== 0 && (
                          <span className={`text-[9px] font-bold block ${phone.salesTrendPercentage > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {phone.salesTrendPercentage > 0 ? `+${phone.salesTrendPercentage}%` : `${phone.salesTrendPercentage}%`}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-medium">Past Orders</span>
                        <span className="text-sm font-black text-slate-700 font-mono">
                          {phone.customerPreviousOrdersPcs} pcs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Controller & Add to Cart button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <button
                        onClick={() => updateCartQty(phone.itemSku, -1)}
                        disabled={inCartQty <= 0}
                        className="px-3 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={inCartQty}
                        onChange={(e) => setCartExactQty(phone.itemSku, parseInt(e.target.value) || 0)}
                        className="w-12 text-center text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
                      />
                      <button
                        onClick={() => updateCartQty(phone.itemSku, 1)}
                        className="px-3 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        if (inCartQty === 0) {
                          updateCartQty(phone.itemSku, phone.recommendedOrderQtyPcs > 0 ? phone.recommendedOrderQtyPcs : 1);
                        }
                        setIsCartOpen(true);
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                        inCartQty > 0
                          ? 'bg-pink-600 hover:bg-pink-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{inCartQty > 0 ? `In Cart (${inCartQty} pcs)` : 'Add to Order'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
              <Smartphone className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="text-sm font-bold text-slate-700">No phones matching this filter</p>
              <p className="text-xs text-slate-500 mt-1">Try selecting "Show All" or clearing search query.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Order History */}
      {activeTab === 'orders' && <CustomerOrderHistory />}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          ></div>

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between">
              {/* Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-pink-600" />
                  <h2 className="text-base font-bold text-slate-900">Order Review Cart</h2>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-slate-500 hover:text-slate-800 text-xs font-semibold px-2 py-1 rounded bg-slate-200"
                >
                  ✕ Close
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <div className="text-xs text-slate-500 mb-1">
                  Destination: <strong className="text-slate-900">{currentStore.shortName}</strong>
                </div>

                {cartItemsList.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">Your cart is empty</p>
                    <p className="text-xs text-slate-400 mt-1">Add phones to review allocation and submit order.</p>
                  </div>
                ) : (
                  cartItemsList.map((item) => {
                    const prod = productAnalytics.find((p) => p.itemSku === item.itemSku);
                    const itmdesc = prod ? prod.itmdesc : item.itemSku;
                    const availableAlloc = prod ? prod.availableAllocationPcs : 0;
                    const willCoverFromAlloc = Math.min(item.quantity, availableAlloc);
                    const willNeedIdoo = Math.max(0, item.quantity - willCoverFromAlloc);

                    return (
                      <div
                        key={item.itemSku}
                        className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{itmdesc}</p>
                            <span className="text-[10px] text-slate-500 font-mono">SKU: {item.itemSku}</span>
                          </div>
                          <button
                            onClick={() => removeCartItem(item.itemSku)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Breakdown */}
                        <div className="flex items-center justify-between text-[11px] bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500">Fulfillment:</span>
                          <div className="space-x-2 font-medium">
                            {willCoverFromAlloc > 0 && (
                              <span className="text-emerald-700 font-bold">{willCoverFromAlloc} pcs in Alloc</span>
                            )}
                            {willNeedIdoo > 0 && (
                              <span className="text-amber-700 font-bold">({willNeedIdoo} pcs via IDOO)</span>
                            )}
                          </div>
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-slate-500">Quantity:</span>
                          <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                            <button
                              onClick={() => updateCartQty(item.itemSku, -1)}
                              className="px-2.5 py-1 text-slate-600 hover:text-slate-900"
                            >
                              -
                            </button>
                            <span className="w-10 text-center font-bold text-slate-900">{item.quantity} pcs</span>
                            <button
                              onClick={() => updateCartQty(item.itemSku, 1)}
                              className="px-2.5 py-1 text-slate-600 hover:text-slate-900"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {cartItemsList.length > 0 && (
                  <div className="pt-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Delivery / Store Notes:
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Add any specific shipping instructions..."
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-pink-500"
                    ></textarea>
                  </div>
                )}
              </div>

              {/* Checkout */}
              {cartItemsList.length > 0 && (
                <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Total Phone Units:</span>
                    <strong className="text-slate-900 font-mono text-sm">{cartTotalPcs} pcs</strong>
                  </div>

                  <button
                    onClick={handleSubmitOrder}
                    disabled={orderSubmitting || cartTotalPcs === 0}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-pink-600 hover:bg-pink-700 text-white shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <span>{orderSubmitting ? 'Submitting Order...' : 'Submit B2B Order'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
