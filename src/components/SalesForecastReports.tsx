import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Download,
  Search,
  ShieldAlert,
  Sparkles,
  Info,
  Filter,
  ArrowUpDown,
  RotateCcw,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  Smartphone,
} from 'lucide-react';

export const SalesForecastReports: React.FC = () => {
  const { productAnalytics } = useApp();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'OVER_ORDERING' | 'STOCKOUT' | 'BALANCED' | 'ZERO_SALES'>('ALL');
  const [wosFilter, setWosFilter] = useState<'ALL' | 'CRITICAL' | 'HEALTHY' | 'EXCESS'>('ALL');
  const [reorderFilter, setReorderFilter] = useState<'ALL' | 'REORDER_ONLY' | 'ADEQUATE_ONLY'>('ALL');
  const [allocationFilter, setAllocationFilter] = useState<'ALL' | 'HAS_ALLOCATION' | 'ZERO_ALLOCATION'>('ALL');
  const [velocityFilter, setVelocityFilter] = useState<'ALL' | 'ACTIVE_7D' | 'ZERO_7D' | 'HIGH_VELOCITY'>('ALL');
  const [stockLocationFilter, setStockLocationFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK' | 'HUB_AVAILABLE'>('ALL');
  const [sortBy, setSortBy] = useState<
    | 'VELOCITY_DESC'
    | 'WOS_ASC'
    | 'WOS_DESC'
    | 'REORDER_DESC'
    | 'INVENTORY_DESC'
    | 'STORES_INV_DESC'
    | 'HUB_INV_DESC'
    | 'NET_WICHITA_DESC'
    | 'FORECAST2_DESC'
    | 'FORECAST3_DESC'
    | 'ALLOCATION_DESC'
    | 'NAME_ASC'
  >('VELOCITY_DESC');

  // Explainer accordion toggle
  const [isExplainerOpen, setIsExplainerOpen] = useState(true);

  // Extract distinct manufacturers & categories
  const brandsList = useMemo(() => {
    const set = new Set<string>();
    productAnalytics.forEach((p) => {
      if (p.manufacturer) set.add(p.manufacturer.toUpperCase());
    });
    return Array.from(set).sort();
  }, [productAnalytics]);

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    productAnalytics.forEach((p) => {
      if (p.category) set.add(p.category.toUpperCase());
    });
    return Array.from(set).sort();
  }, [productAnalytics]);

  // Filtered & Sorted Items
  const filteredItems = useMemo(() => {
    return productAnalytics
      .filter((item) => {
        // Search query
        const matchesSearch =
          item.itmdesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.itemSku.includes(searchQuery) ||
          item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        // Brand filter
        if (brandFilter !== 'ALL' && item.manufacturer.toUpperCase() !== brandFilter) {
          return false;
        }

        // Category filter
        if (categoryFilter !== 'ALL' && item.category.toUpperCase() !== categoryFilter) {
          return false;
        }

        // Risk filter
        if (riskFilter === 'OVER_ORDERING' && !item.overOrderingRisk) return false;
        if (riskFilter === 'STOCKOUT' && !item.stockoutRisk) return false;
        if (riskFilter === 'BALANCED' && (item.overOrderingRisk || item.stockoutRisk || item.last7DaysSalesPcs === 0)) return false;
        if (riskFilter === 'ZERO_SALES' && item.last7DaysSalesPcs > 0) return false;

        // WoS Range Filter
        if (wosFilter === 'CRITICAL' && item.weeksOfSupply >= 1.0) return false;
        if (wosFilter === 'HEALTHY' && (item.weeksOfSupply < 1.0 || item.weeksOfSupply > 4.0)) return false;
        if (wosFilter === 'EXCESS' && item.weeksOfSupply <= 4.0) return false;

        // Reorder Rec Filter
        if (reorderFilter === 'REORDER_ONLY' && item.recommendedOrderQtyPcs <= 0) return false;
        if (reorderFilter === 'ADEQUATE_ONLY' && item.recommendedOrderQtyPcs > 0) return false;

        // Allocation Filter
        if (allocationFilter === 'HAS_ALLOCATION' && item.availableAllocationPcs <= 0) return false;
        if (allocationFilter === 'ZERO_ALLOCATION' && item.availableAllocationPcs > 0) return false;

        // Velocity Filter
        if (velocityFilter === 'ACTIVE_7D' && item.last7DaysSalesPcs <= 0) return false;
        if (velocityFilter === 'ZERO_7D' && item.last7DaysSalesPcs > 0) return false;
        if (velocityFilter === 'HIGH_VELOCITY' && item.last7DaysSalesPcs < 5) return false;

        // Stock Location Filter
        if (stockLocationFilter === 'IN_STOCK' && item.storesInventoryExclHq <= 0) return false;
        if (stockLocationFilter === 'OUT_OF_STOCK' && (item.storesInventoryExclHq > 0 || item.hubInventoryTtlwichhq > 0)) return false;
        if (stockLocationFilter === 'HUB_AVAILABLE' && item.hubInventoryTtlwichhq <= 0) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'VELOCITY_DESC':
            return b.last7DaysSalesPcs - a.last7DaysSalesPcs;
          case 'WOS_ASC':
            return a.weeksOfSupply - b.weeksOfSupply;
          case 'WOS_DESC':
            return b.weeksOfSupply - a.weeksOfSupply;
          case 'REORDER_DESC':
            return b.recommendedOrderQtyPcs - a.recommendedOrderQtyPcs;
          case 'INVENTORY_DESC':
            return b.currentInventory - a.currentInventory;
          case 'STORES_INV_DESC':
            return b.storesInventoryExclHq - a.storesInventoryExclHq;
          case 'HUB_INV_DESC':
            return b.hubInventoryTtlwichhq - a.hubInventoryTtlwichhq;
          case 'NET_WICHITA_DESC':
            return b.netWichitaInventory - a.netWichitaInventory;
          case 'FORECAST2_DESC':
            return b.projected2WeeksDemandPcs - a.projected2WeeksDemandPcs;
          case 'FORECAST3_DESC':
            return b.projected3WeeksDemandPcs - a.projected3WeeksDemandPcs;
          case 'ALLOCATION_DESC':
            return b.availableAllocationPcs - a.availableAllocationPcs;
          case 'NAME_ASC':
            return a.itmdesc.localeCompare(b.itmdesc);
          default:
            return 0;
        }
      });
  }, [
    productAnalytics,
    searchQuery,
    brandFilter,
    categoryFilter,
    riskFilter,
    wosFilter,
    reorderFilter,
    allocationFilter,
    velocityFilter,
    stockLocationFilter,
    sortBy,
  ]);

  const overOrderingCount = productAnalytics.filter((p) => p.overOrderingRisk).length;
  const stockoutRiskCount = productAnalytics.filter((p) => p.stockoutRisk).length;
  const total7DaySold = productAnalytics.reduce((sum, p) => sum + p.last7DaysSalesPcs, 0);
  const total2WeekForecast = productAnalytics.reduce((sum, p) => sum + p.projected2WeeksDemandPcs, 0);
  const totalStoresInvExclHq = productAnalytics.reduce((sum, p) => sum + p.storesInventoryExclHq, 0);
  const totalHubInvTtlwichhq = productAnalytics.reduce((sum, p) => sum + p.hubInventoryTtlwichhq, 0);
  const totalAllocationAvailable = productAnalytics.reduce((sum, p) => sum + p.availableAllocationPcs, 0);

  const resetAllFilters = () => {
    setSearchQuery('');
    setBrandFilter('ALL');
    setCategoryFilter('ALL');
    setRiskFilter('ALL');
    setWosFilter('ALL');
    setReorderFilter('ALL');
    setAllocationFilter('ALL');
    setVelocityFilter('ALL');
    setStockLocationFilter('ALL');
    setSortBy('VELOCITY_DESC');
  };

  const isAnyFilterActive =
    searchQuery !== '' ||
    brandFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    riskFilter !== 'ALL' ||
    wosFilter !== 'ALL' ||
    reorderFilter !== 'ALL' ||
    allocationFilter !== 'ALL' ||
    velocityFilter !== 'ALL' ||
    stockLocationFilter !== 'ALL' ||
    sortBy !== 'VELOCITY_DESC';

  const exportForecastCsv = () => {
    const headers = [
      'SKU',
      'Description',
      'Manufacturer',
      'Category',
      'a - Stores Inventory (Excl TTLWICHHQ)',
      'b - Hub (TTLWICHHQ)',
      'c - Last 7 Days Sales (Pcs)',
      'd - Wichita Inventory (a+b)-c',
      'e - 2-Week Demand Forecast (Pcs)',
      'f - 3-Week Demand Forecast (Pcs)',
      'g - Qty Available in Allocation',
      'Weeks of Supply (WoS)',
      'Over-Ordering Risk Flag',
      'Stockout Risk Flag',
      'Recommended Reorder Qty (Pcs)',
    ];

    const rows = filteredItems.map((p) => [
      p.itemSku,
      `"${p.itmdesc}"`,
      p.manufacturer,
      p.category,
      p.storesInventoryExclHq,
      p.hubInventoryTtlwichhq,
      p.last7DaysSalesPcs,
      p.netWichitaInventory,
      p.projected2WeeksDemandPcs,
      p.projected3WeeksDemandPcs,
      p.availableAllocationPcs,
      p.weeksOfSupply.toFixed(2),
      p.overOrderingRisk ? 'YES' : 'NO',
      p.stockoutRisk ? 'YES' : 'NO',
      p.recommendedOrderQtyPcs,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Wichita_Sales_Forecast_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Stores Inv (Excl HQ)
          </span>
          <p className="text-xl font-black text-slate-900 font-mono mt-1">{totalStoresInvExclHq} EA</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">a - Store branches</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Hub (TTLWICHHQ)
          </span>
          <p className="text-xl font-black text-indigo-700 font-mono mt-1">{totalHubInvTtlwichhq} EA</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">b - Central Hub</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            7D Sales Velocity
          </span>
          <p className="text-xl font-black text-pink-700 font-mono mt-1">{total7DaySold} EA</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">c - Last 7 days run-rate</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            2-Wk Forecast Demand
          </span>
          <p className="text-xl font-black text-indigo-900 font-mono mt-1">{total2WeekForecast} EA</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">e - 14-day projection</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Qty in Allocation
          </span>
          <p className="text-xl font-black text-emerald-700 font-mono mt-1">{totalAllocationAvailable} EA</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">g - Open allocation quota</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Over-Order Alerts
          </span>
          <p className="text-xl font-black text-rose-700 font-mono mt-1">{overOrderingCount} items</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Supply &gt; 4 weeks</span>
        </div>
      </div>

      {/* Metric Intelligence Explainer Guide Card */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-700/50 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-pink-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>Supply Metrics &amp; Allocation Explainer Guide</span>
                <span className="text-[10px] bg-pink-500/30 text-pink-200 font-bold px-2 py-0.5 rounded-full border border-pink-400/30 uppercase tracking-wider">
                  Reference Guide
                </span>
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                Formulas and explanations for Weeks of Supply, Risk Status, Reorder Recommendations, and Allocation Reserved rules.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExplainerOpen(!isExplainerOpen)}
            className="text-xs bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl border border-white/20 font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span>{isExplainerOpen ? 'Hide Guide' : 'Show Explanation Guide'}</span>
            {isExplainerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExplainerOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-indigo-100">
            {/* Concept 1: Weeks of Supply */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-indigo-300">
                <Calendar className="w-4 h-4 text-pink-400 shrink-0" />
                <h4 className="font-extrabold text-white text-sm">1. Weeks of Supply (WoS)</h4>
              </div>
              <p className="text-slate-200 leading-relaxed text-[11px]">
                <strong>What it is:</strong> How many weeks your current on-hand inventory will last based on recent customer buying velocity.
              </p>
              <div className="p-2 bg-black/30 rounded-xl border border-white/10 font-mono text-[11px] text-pink-200">
                Formula: <span className="text-white">Current Stock &divide; Weekly Sales Velocity</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-rose-300 font-medium">
                  <span>&bull; &lt; 1.0 Wk:</span>
                  <span className="font-bold">🚨 Urgent Stockout</span>
                </div>
                <div className="flex items-center justify-between text-emerald-300 font-medium">
                  <span>&bull; 1.0 &ndash; 4.0 Wks:</span>
                  <span className="font-bold">🟢 Healthy / Balanced</span>
                </div>
                <div className="flex items-center justify-between text-amber-300 font-medium">
                  <span>&bull; &gt; 4.0 Wks:</span>
                  <span className="font-bold">⚠️ Overstocked Excess</span>
                </div>
              </div>
            </div>

            {/* Concept 2: Risk & Over-Order Status */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-indigo-300">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <h4 className="font-extrabold text-white text-sm">2. Risk &amp; Over-Order Status</h4>
              </div>
              <p className="text-slate-200 leading-relaxed text-[11px]">
                <strong>What it is:</strong> Smart guardrail preventing dealers from tying up working capital in slow-moving models.
              </p>
              <div className="space-y-2 text-[11px]">
                <div className="p-2 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-200">
                  <strong className="block text-white">Over-Ordering Risk:</strong>
                  Triggered when inventory &gt; 4 weeks of sales. Prevents ordering when store already has excess supply.
                </div>
                <div className="p-2 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-200">
                  <strong className="block text-white">Low Stock Risk:</strong>
                  Triggered when inventory &lt; 1 week of sales. Stock will run out in &lt;7 days without replenishment.
                </div>
              </div>
            </div>

            {/* Concept 3: Reorder Rec */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-indigo-300">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                <h4 className="font-extrabold text-white text-sm">3. Reorder Recommendation</h4>
              </div>
              <p className="text-slate-200 leading-relaxed text-[11px]">
                <strong>What it is:</strong> The ideal number of units to order today to comfortably cover 14-day demand without overstocking.
              </p>
              <div className="p-2 bg-black/30 rounded-xl border border-white/10 font-mono text-[11px] text-emerald-200">
                Formula: <span className="text-white">Max(0, 14-Day Demand &minus; Current Stock)</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                If positive, order that exact quantity (e.g. <strong className="text-pink-300 font-mono">+12 pcs</strong>). If zero, status is <strong className="text-emerald-300">Adequate</strong>.
              </p>
            </div>

            {/* Concept 4: Reserved on Allocation */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-indigo-300">
                <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                <h4 className="font-extrabold text-white text-sm">4. Allocation &amp; Reserved</h4>
              </div>
              <p className="text-slate-200 leading-relaxed text-[11px]">
                <strong>What is Allocation?</strong> The maximum authorized quantity a customer can order (e.g., 40 pcs allocation = dealer can place an order up to 40 pcs).
              </p>
              <div className="p-2 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-indigo-200 space-y-1 text-[11px]">
                <strong className="block text-white">Why keep Reserved?</strong>
                When a customer submits a PO, those units move into <strong>Reserved</strong> so they cannot be double-ordered while awaiting dispatch.
              </div>
              <p className="text-pink-200 text-[11px] leading-relaxed font-semibold">
                &bull; Reserved quantities strictly apply ONLY while order is NOT yet shipped. The moment the order ships, it is cleared from Reserved!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>Predictive Sales Trends &amp; Supply Forecasting</span>
              <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-mono text-xs border border-slate-200">
                {filteredItems.length} of {productAnalytics.length} models
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live Wichita intelligence: Stores inventory (excl TTLWICHHQ), Hub inventory, 7D velocity, net inventory, and demand forecasts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAnyFilterActive && (
              <button
                onClick={resetAllFilters}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}

            <button
              onClick={exportForecastCsv}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Filtered CSV</span>
            </button>
          </div>
        </div>

        {/* Enhanced Multi-Filter Control Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 text-xs">
          {/* Row 1: Search & Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search phone model or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
              />
            </div>

            {/* Brand / Manufacturer */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-xs">
              <span className="text-slate-500 font-semibold text-[11px] shrink-0">Brand:</span>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full bg-transparent text-slate-900 font-bold focus:outline-none text-xs"
              >
                <option value="ALL">All Brands ({brandsList.length})</option>
                {brandsList.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-xs">
              <span className="text-slate-500 font-semibold text-[11px] shrink-0">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-transparent text-slate-900 font-bold focus:outline-none text-xs"
              >
                <option value="ALL">All Categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500 font-semibold text-[11px] shrink-0">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-transparent text-slate-900 font-bold focus:outline-none text-xs"
              >
                <option value="VELOCITY_DESC">Highest 7D Velocity (Sales)</option>
                <option value="STORES_INV_DESC">Highest Stores Inv (Excl HQ)</option>
                <option value="HUB_INV_DESC">Highest Hub Inv (TTLWICHHQ)</option>
                <option value="NET_WICHITA_DESC">Highest Net Wichita Inv</option>
                <option value="FORECAST2_DESC">Highest 2-Wk Forecast Demand</option>
                <option value="FORECAST3_DESC">Highest 3-Wk Forecast Demand</option>
                <option value="ALLOCATION_DESC">Highest Available in Allocation</option>
                <option value="WOS_ASC">Lowest WoS (Stockout First)</option>
                <option value="WOS_DESC">Highest WoS (Overstock First)</option>
                <option value="REORDER_DESC">Highest Reorder Rec</option>
                <option value="NAME_ASC">Model Name (A to Z)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Chip Filters (Allocation, Stock Location, Velocity, Risk, WoS, Reorder) */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Allocation Filter Chips */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold text-[11px]">Allocation:</span>
              <div className="flex bg-white p-0.5 rounded-xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => setAllocationFilter('ALL')}
                  className={`px-2 py-1 rounded-lg text-[11px] ${
                    allocationFilter === 'ALL'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setAllocationFilter('HAS_ALLOCATION')}
                  className={`px-2 py-1 rounded-lg text-[11px] ${
                    allocationFilter === 'HAS_ALLOCATION'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  In Allocation (&gt;0)
                </button>
                <button
                  onClick={() => setAllocationFilter('ZERO_ALLOCATION')}
                  className={`px-2 py-1 rounded-lg text-[11px] ${
                    allocationFilter === 'ZERO_ALLOCATION'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  Zero Alloc (0)
                </button>
              </div>
            </div>

            {/* Stock Location Chips */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold text-[11px]">Stock Location:</span>
              <div className="flex bg-white p-0.5 rounded-xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => setStockLocationFilter('ALL')}
                  className={`px-2 py-1 rounded-lg text-[11px] ${
                    stockLocationFilter === 'ALL'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  All Stock
                </button>
                <button
                  onClick={() => setStockLocationFilter('IN_STOCK')}
                  className={`px-2 py-1 rounded-lg text-[11px] ${
                    stockLocationFilter === 'IN_STOCK'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  In Stores (Excl HQ)
                </button>
                <button
                  onClick={() => setStockLocationFilter('HUB_AVAILABLE')}
                  className={`px-2 py-1 rounded-lg text-[11px] ${
                    stockLocationFilter === 'HUB_AVAILABLE'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  In Hub (TTLWICHHQ)
                </button>
                <button
                  onClick={() => setStockLocationFilter('OUT_OF_STOCK')}
                  className={`px-2 py-1 rounded-lg text-[11px] ${
                    stockLocationFilter === 'OUT_OF_STOCK'
                      ? 'bg-rose-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  Out of Stock (0)
                </button>
              </div>
            </div>

            {/* Sales Velocity Chips */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold text-[11px]">7D Sales:</span>
              <div className="flex bg-white p-0.5 rounded-xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => setVelocityFilter('ALL')}
                  className={`px-2 py-1 rounded-lg text-[11px] ${
                    velocityFilter === 'ALL'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setVelocityFilter('ACTIVE_7D')}
                  className={`px-2 py-1 rounded-lg text-[11px] ${
                    velocityFilter === 'ACTIVE_7D'
                      ? 'bg-pink-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  Active Sellers (&gt;0)
                </button>
                <button
                  onClick={() => setVelocityFilter('HIGH_VELOCITY')}
                  className={`px-2 py-1 rounded-lg text-[11px] ${
                    velocityFilter === 'HIGH_VELOCITY'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  Top Fast (5+)
                </button>
                <button
                  onClick={() => setVelocityFilter('ZERO_7D')}
                  className={`px-2 py-1 rounded-lg text-[11px] ${
                    velocityFilter === 'ZERO_7D'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  Zero Sales
                </button>
              </div>
            </div>

            {/* Risk / Supply Status Chips */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold text-[11px]">Risk:</span>
              <div className="flex bg-white p-0.5 rounded-xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => setRiskFilter('ALL')}
                  className={`px-2 py-1 rounded-lg text-[11px] ${
                    riskFilter === 'ALL'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setRiskFilter('OVER_ORDERING')}
                  className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 ${
                    riskFilter === 'OVER_ORDERING'
                      ? 'bg-rose-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>Over-Order ({overOrderingCount})</span>
                </button>
                <button
                  onClick={() => setRiskFilter('STOCKOUT')}
                  className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 ${
                    riskFilter === 'STOCKOUT'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Low Stock ({stockoutRiskCount})</span>
                </button>
              </div>
            </div>

            {/* Reorder Recommendation Chips */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold text-[11px]">Reorder Rec:</span>
              <div className="flex bg-white p-0.5 rounded-xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => setReorderFilter('ALL')}
                  className={`px-2 py-1 rounded-lg text-[11px] ${
                    reorderFilter === 'ALL'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setReorderFilter('REORDER_ONLY')}
                  className={`px-2 py-1 rounded-lg text-[11px] ${
                    reorderFilter === 'REORDER_ONLY'
                      ? 'bg-pink-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  Needs Reorder (&gt;0)
                </button>
                <button
                  onClick={() => setReorderFilter('ADEQUATE_ONLY')}
                  className={`px-2 py-1 rounded-lg text-[11px] ${
                    reorderFilter === 'ADEQUATE_ONLY'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  Adequate (0)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast Table with User-Requested Columns a through g */}
        <div className="overflow-x-auto">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No items matching current filters</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting or broadening your filter criteria.</p>
              <button
                onClick={resetAllFilters}
                className="mt-3 px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">SKU / Item</th>
                  <th className="py-3 px-3">Phone Description</th>
                  <th className="py-3 px-3 text-center bg-slate-100/60" title="a - Store quantities available in Wichita (excluding TTLWICHHQ)">
                    a - Stores Inv <span className="text-[10px] lowercase text-slate-400 block">(excl HQ)</span>
                  </th>
                  <th className="py-3 px-3 text-center bg-indigo-50/50" title="b - HUB - TTLWICHHQ">
                    b - Hub <span className="text-[10px] text-indigo-400 block">(TTLWICHHQ)</span>
                  </th>
                  <th className="py-3 px-3 text-center" title="c - 7 Days Sales">
                    c - 7D Sales
                  </th>
                  <th className="py-3 px-3 text-center bg-emerald-50/50" title="d - Wichita Inventory (a + b) - c">
                    d - Wichita Inv <span className="text-[10px] text-emerald-600 block">(a+b)-c</span>
                  </th>
                  <th className="py-3 px-3 text-center" title="e - 2 wk forecast (how much required in 2 weeks)">
                    e - 2 Wk F/Cast
                  </th>
                  <th className="py-3 px-3 text-center" title="f - how much required in 3 weeks">
                    f - 3 Wk Req
                  </th>
                  <th className="py-3 px-3 text-center bg-pink-50/50" title="g - qty available in allocation">
                    g - In Alloc
                  </th>
                  <th className="py-3 px-3 text-center" title="Weeks of Supply based on weekly velocity">
                    WoS
                  </th>
                  <th className="py-3 px-3" title="Risk & Over-Order Status">
                    Risk &amp; Over-Order Status
                  </th>
                  <th className="py-3 px-3 text-right" title="Reorder Recommendation">
                    Reorder Rec
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredItems.map((item) => (
                  <tr key={item.itemSku} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-600 whitespace-nowrap">
                      {item.itemSku}
                    </td>

                    <td className="py-3 px-3 font-sans max-w-xs">
                      <span className="font-bold text-slate-900 block truncate">{item.itmdesc}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.manufacturer} &bull; {item.category}
                      </span>
                    </td>

                    {/* a - Store quantities available in Wichita (excluding TTLWICHHQ) */}
                    <td className="py-3 px-3 text-center font-bold text-slate-900 bg-slate-50/50">
                      {item.storesInventoryExclHq} EA
                    </td>

                    {/* b - HUB - TTLWICHHQ */}
                    <td className="py-3 px-3 text-center font-bold text-indigo-700 bg-indigo-50/30">
                      {item.hubInventoryTtlwichhq} EA
                    </td>

                    {/* c - 7 Days Sales */}
                    <td className="py-3 px-3 text-center font-bold text-pink-700">
                      {item.last7DaysSalesPcs} EA
                    </td>

                    {/* d - Wichita inventory (a + b) - c */}
                    <td className="py-3 px-3 text-center font-black text-emerald-800 bg-emerald-50/30">
                      {item.netWichitaInventory} EA
                    </td>

                    {/* e - 2 wk forecast (to know how much we will require in 2 weeks) */}
                    <td className="py-3 px-3 text-center">
                      <span className="text-indigo-900 font-bold block">{item.projected2WeeksDemandPcs} EA</span>
                      <span className="text-[10px] text-slate-500 font-sans block" title="Net replenishment required for 2 weeks after Wichita inventory">
                        Req: <strong className={Math.max(0, item.projected2WeeksDemandPcs - Math.max(0, item.netWichitaInventory)) > 0 ? "text-pink-700 font-bold" : "text-emerald-700 font-semibold"}>
                          {Math.max(0, item.projected2WeeksDemandPcs - Math.max(0, item.netWichitaInventory))} EA
                        </strong>
                      </span>
                    </td>

                    {/* f - how much we will require in 3 weeks */}
                    <td className="py-3 px-3 text-center">
                      <span className="text-slate-800 font-bold block">{item.projected3WeeksDemandPcs} EA</span>
                      <span className="text-[10px] text-slate-500 font-sans block" title="Net replenishment required for 3 weeks after Wichita inventory">
                        Req: <strong className={Math.max(0, item.projected3WeeksDemandPcs - Math.max(0, item.netWichitaInventory)) > 0 ? "text-pink-700 font-bold" : "text-emerald-700 font-semibold"}>
                          {Math.max(0, item.projected3WeeksDemandPcs - Math.max(0, item.netWichitaInventory))} EA
                        </strong>
                      </span>
                    </td>

                    {/* g - qty available in allocation */}
                    <td className="py-3 px-3 text-center font-black text-pink-700 bg-pink-50/30">
                      {item.availableAllocationPcs} EA
                    </td>

                    {/* Weeks of Supply (WoS) */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          item.weeksOfSupply > 4
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : item.weeksOfSupply < 1
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                        title={`Stock lasts ${item.weeksOfSupply.toFixed(1)} weeks based on recent weekly sales rate`}
                      >
                        {item.weeksOfSupply.toFixed(1)} wks
                      </span>
                    </td>

                    {/* Risk & Over-Order Status */}
                    <td className="py-3 px-3 font-sans whitespace-nowrap">
                      {item.overOrderingRisk ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          <span>Over-Ordering Risk</span>
                        </span>
                      ) : item.stockoutRisk ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Low Stock Risk</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Balanced Supply</span>
                        </span>
                      )}
                    </td>

                    {/* Reorder Recommendation */}
                    <td className="py-3 px-3 text-right">
                      {item.recommendedOrderQtyPcs > 0 ? (
                        <span className="font-bold text-pink-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded font-mono">
                          +{item.recommendedOrderQtyPcs} pcs
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans text-xs">Adequate</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
