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
  KeyRound,
  RotateCcw,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    inventory,
    allocations,
    currentStore,
    isCombinedStore,
    pendingOrdersCount,
    openIdooShortagesCount,
    adminPassword,
    updateAdminPassword,
    resetToInitialData,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'orders' | 'shortages' | 'allocations' | 'forecast' | 'ledger' | 'budget' | 'pricelist' | 'security'
  >('orders');

  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMessage(null);
    setPasswordSuccessMessage(null);

    if (newPasswordInput.trim().length < 6) {
      setPasswordErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newPasswordInput.trim() !== confirmPasswordInput.trim()) {
      setPasswordErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    const success = updateAdminPassword(newPasswordInput.trim());
    if (success) {
      setPasswordSuccessMessage('Administrator password updated successfully! Keep it confidential.');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } else {
      setPasswordErrorMessage('Failed to update password.');
    }
  };

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

        <button
          onClick={() => setActiveAdminTab('security')}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeAdminTab === 'security'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Admin Password &amp; Reset</span>
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
      {activeAdminTab === 'security' && (
        <div className="space-y-6">
          {/* Security & Password Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs max-w-2xl">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-200 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                <Lock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Administrator Password &amp; Access Control
                </h3>
                <p className="text-xs text-slate-500">
                  Customers cannot login to the admin panel. Change your executive password here anytime.
                </p>
              </div>
            </div>

            {passwordSuccessMessage && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{passwordSuccessMessage}</span>
              </div>
            )}

            {passwordErrorMessage && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-900 p-3.5 rounded-2xl text-xs font-semibold">
                {passwordErrorMessage}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Current Active Password:
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 flex items-center justify-between">
                  <span>{adminPassword}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-bold">
                    Protected Admin Credential
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  New Administrator Password:
                </label>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new strong password (min 6 characters)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Confirm New Password:
                </label>
                <input
                  type="password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="py-3 px-5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Save New Admin Password</span>
              </button>
            </form>
          </div>

          {/* Reset / Restart Portal Data (Exclusive to Admin) */}
          <div className="bg-white border border-rose-200 rounded-3xl p-6 shadow-xs max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Restart / Reset Portal Data (Admin Only)
                </h3>
                <p className="text-xs text-slate-500">
                  This option has been completely removed from customer view. Only administrators can perform a reset.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Resetting will clear all local changes and restore original Wichita inventory, default allocations, initial customer account balance, and demo data.
            </p>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to reset all data back to original Wichita dataset?')) {
                  resetToInitialData();
                  alert('Portal reset back to initial Wichita records.');
                }
              }}
              className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset &amp; Restart All Portal Data</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
