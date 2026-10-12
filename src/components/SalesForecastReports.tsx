import React, { useState } from 'react';
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
} from 'lucide-react';

export const SalesForecastReports: React.FC = () => {
  const { productAnalytics } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'OVER_ORDERING' | 'STOCKOUT'>('ALL');

  const filteredItems = productAnalytics.filter((item) => {
    const matchesSearch =
      item.itmdesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemSku.includes(searchQuery) ||
      item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());

    if (riskFilter === 'OVER_ORDERING') return matchesSearch && item.overOrderingRisk;
    if (riskFilter === 'STOCKOUT') return matchesSearch && item.stockoutRisk;

    return matchesSearch;
  });

  const overOrderingCount = productAnalytics.filter((p) => p.overOrderingRisk).length;
  const stockoutRiskCount = productAnalytics.filter((p) => p.stockoutRisk).length;
  const total7DaySold = productAnalytics.reduce((sum, p) => sum + p.last7DaysSalesPcs, 0);
  const total2WeekForecast = productAnalytics.reduce((sum, p) => sum + p.projected2WeeksDemandPcs, 0);

  const exportForecastCsv = () => {
    const headers = [
      'SKU',
      'Description',
      'Manufacturer',
      'Current Store Inventory (Pcs)',
      'Last 7 Days Sales (Pcs)',
      'Last 14 Days Sales (Pcs)',
      '2-Week Demand Forecast (Pcs)',
      '3-Week Demand Forecast (Pcs)',
      'Weeks of Supply (WoS)',
      'Over-Ordering Risk Flag',
      'Stockout Risk Flag',
      'Recommended Reorder Qty (Pcs)',
    ];

    const rows = productAnalytics.map((p) => [
      p.itemSku,
      `"${p.itmdesc}"`,
      p.manufacturer,
      p.currentInventory,
      p.last7DaysSalesPcs,
      p.last14DaysSalesPcs,
      p.projected2WeeksDemandPcs,
      p.projected3WeeksDemandPcs,
      p.weeksOfSupply,
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Last 7 Days Velocity
          </span>
          <p className="text-2xl font-black text-pink-700">{total7DaySold} pcs sold</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Wichita store network volume</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            2-Week Demand Forecast
          </span>
          <p className="text-2xl font-black text-indigo-700">{total2WeekForecast} pcs needed</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Projected 14-day customer sales</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Over-Ordering Alerts
          </span>
          <p className="text-2xl font-black text-rose-700">{overOrderingCount} items</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Inventory exceeds 4+ weeks supply</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Stockout Depletion Risk
          </span>
          <p className="text-2xl font-black text-amber-700">{stockoutRiskCount} items</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Inventory under 1 week supply</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>Predictive Sales Trends &amp; Supply Forecasting</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Admin intelligence: Track 7-day velocity, calculate Weeks of Supply (WoS), and prevent dealer over-ordering.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportForecastCsv}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-emerald-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Forecast CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by phone model or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Risk Filter:</span>
            <div className="flex bg-slate-200/60 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setRiskFilter('ALL')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  riskFilter === 'ALL'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Items
              </button>
              <button
                onClick={() => setRiskFilter('OVER_ORDERING')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  riskFilter === 'OVER_ORDERING'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-3 h-3 text-rose-300" />
                <span>Over-Ordering ({overOrderingCount})</span>
              </button>
              <button
                onClick={() => setRiskFilter('STOCKOUT')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  riskFilter === 'STOCKOUT'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-amber-300" />
                <span>Low Stock ({stockoutRiskCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Forecast Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">SKU / Item</th>
                <th className="py-3 px-4">Phone Description</th>
                <th className="py-3 px-4 text-center">Store Inventory</th>
                <th className="py-3 px-4 text-center">7D Sales (Pcs)</th>
                <th className="py-3 px-4 text-center">14D Sales</th>
                <th className="py-3 px-4 text-center">2-Wk Forecast</th>
                <th className="py-3 px-4 text-center">3-Wk Forecast</th>
                <th className="py-3 px-4 text-center">Weeks of Supply</th>
                <th className="py-3 px-4">Risk &amp; Over-Order Status</th>
                <th className="py-3 px-4 text-right">Reorder Rec</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredItems.map((item) => (
                <tr key={item.itemSku} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-600">{item.itemSku}</td>
                  <td className="py-3 px-4 font-sans max-w-xs">
                    <span className="font-bold text-slate-900 block truncate">{item.itmdesc}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{item.manufacturer}</span>
                  </td>

                  <td className="py-3 px-4 text-center font-black text-slate-900 text-sm">
                    {item.currentInventory} pcs
                  </td>

                  <td className="py-3 px-4 text-center font-bold text-pink-700">
                    {item.last7DaysSalesPcs} pcs
                  </td>

                  <td className="py-3 px-4 text-center text-slate-700">
                    {item.last14DaysSalesPcs} pcs
                  </td>

                  <td className="py-3 px-4 text-center text-indigo-700 font-bold">
                    {item.projected2WeeksDemandPcs} pcs
                  </td>

                  <td className="py-3 px-4 text-center text-slate-700">
                    {item.projected3WeeksDemandPcs} pcs
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        item.weeksOfSupply > 4
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : item.weeksOfSupply < 1
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {item.weeksOfSupply.toFixed(1)} wks
                    </span>
                  </td>

                  <td className="py-3 px-4 font-sans">
                    {item.overOrderingRisk ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>Over-Ordering Risk</span>
                      </span>
                    ) : item.stockoutRisk ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Low Stock Risk</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Balanced Supply</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
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
        </div>
      </div>
    </div>
  );
};
