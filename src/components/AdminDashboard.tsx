import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AdminOrdersManager } from './AdminOrdersManager';
import { IdooBacklogManager } from './IdooBacklogManager';
import { AllocationManager } from './AllocationManager';
import { SalesForecastReports } from './SalesForecastReports';
import { CustomerLedgerManager } from './CustomerLedgerManager';
import { MarketBudgetManager } from './MarketBudgetManager';
import { PriceListManager } from './PriceListManager';
import {
  ShieldCheck,
  PackageCheck,
  ListOrdered,
  Camera,
  TrendingUp,
  CreditCard,
  DollarSign,
  Tag,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    inventory,
    allocations,
    currentStore,
    isCombinedStore,
    pendingOrdersCount,
    openIdooShortagesCount,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'orders' | 'shortages' | 'allocations' | 'forecast' | 'ledger' | 'budget' | 'pricelist'
  >('orders');

  const totalInventoryUnits = inventory.reduce((sum, i) => sum + i.qty, 0);
  const totalInventoryCost = inventory.reduce((sum, i) => sum + i.qty * i.wholesale, 0);
  const totalAllocatedAvailable = allocations.reduce((sum, a) => sum + a.availablePcs, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Admin Executive Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                Wichita Operations Center
              </span>
              <span className="text-xs font-mono text-slate-500">
                Scope: {isCombinedStore ? 'All Wichita Stores (Combined)' : currentStore.name}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              <span>Admin Operations &amp; Allocation Command</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Store order dispatching, allocation reservations, IDOO 2-day backlogs, dealer credit ledger, and predictive supply forecasting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Wichita Stock Valuation</span>
              <span className="text-base font-black text-slate-900 font-mono">
                ${totalInventoryCost.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block">{totalInventoryUnits} units on hand</span>
            </div>

            <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Allocated Stock</span>
              <span className="text-base font-black text-emerald-700 font-mono">
                {totalAllocatedAvailable} pcs
              </span>
              <span className="text-[10px] text-slate-500 block">Ready to allocate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveAdminTab('orders')}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeAdminTab === 'orders'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Customer Orders</span>
          {pendingOrdersCount > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('shortages')}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeAdminTab === 'shortages'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>IDOO Shortages &amp; Backlog</span>
          {openIdooShortagesCount > 0 && (
            <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {openIdooShortagesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('allocations')}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeAdminTab === 'allocations'
              ? 'border-pink-600 text-pink-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Allocations &amp; Multi-OCR</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('pricelist')}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeAdminTab === 'pricelist'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Price List &amp; TOP Priority</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('forecast')}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeAdminTab === 'forecast'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Sales &amp; Supply Forecasting</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('ledger')}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeAdminTab === 'ledger'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Dealer Ledger &amp; Accounting</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('budget')}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeAdminTab === 'budget'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Market IDOO Cap</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeAdminTab === 'orders' && <AdminOrdersManager />}
      {activeAdminTab === 'shortages' && <IdooBacklogManager />}
      {activeAdminTab === 'allocations' && <AllocationManager />}
      {activeAdminTab === 'pricelist' && <PriceListManager />}
      {activeAdminTab === 'forecast' && <SalesForecastReports />}
      {activeAdminTab === 'ledger' && <CustomerLedgerManager />}
      {activeAdminTab === 'budget' && <MarketBudgetManager />}
    </div>
  );
};
