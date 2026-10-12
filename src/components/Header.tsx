import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Smartphone,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  ShoppingCart,
  User,
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
  Rocket,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  onOpenSyncModal: () => void;
  onOpenCart?: () => void;
  onOpenLoginModal: (role?: 'customer' | 'admin') => void;
  cartCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSyncModal,
  onOpenCart,
  onOpenLoginModal,
  cartCount = 0,
}) => {
  const {
    authSession,
    theme,
    toggleTheme,
    selectedStoreId,
    setSelectedStoreId,
    stores,
    currentStore,
    marketBudget,
    pendingOrdersCount,
    openIdooShortagesCount,
    resetToInitialData,
    sheetSyncState,
  } = useApp();

  const isAdmin = authSession.role === 'admin';

  const budgetPercent = Math.min(
    100,
    Math.round((marketBudget.usedAmount / marketBudget.monthlyBudgetLimit) * 100)
  );

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 text-slate-800 shadow-xs">
      {/* Top Territory Bar */}
      <div className="bg-gradient-to-r from-pink-50/90 via-slate-50 to-pink-50/90 border-b border-pink-100 px-4 sm:px-6 py-1.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-extrabold text-slate-900 tracking-wide">WICHITA METRO TERRITORY:</span>
          <span className="text-slate-600">Consolidated dealer ordering &amp; IDOO allocation portal</span>
        </div>

        {/* Financial Cap info strictly shown ONLY to Admin! */}
        {isAdmin ? (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span>
              IDOO Limit: <strong className="text-slate-900">${marketBudget.monthlyBudgetLimit.toLocaleString()}</strong>
            </span>
            <span className="hidden sm:inline">
              Used: <strong className={budgetPercent > 80 ? 'text-amber-600' : 'text-emerald-700'}>
                ${marketBudget.usedAmount.toLocaleString()} ({budgetPercent}%)
              </strong>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Active Store:</span>
            <strong className="text-pink-600 font-bold">{currentStore.shortName}</strong>
          </div>
        )}
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-600 to-pink-500 flex items-center justify-center shadow-md shadow-pink-600/20 text-white shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  WICHITA WIRELESS
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                  B2B
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {isAdmin ? 'Administrator Operations Command' : 'Store Dealer Ordering Portal'}
              </p>
            </div>
          </div>

          {/* Store Selector (Defaults to All Wichita Combined) */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Building2 className="w-4 h-4 text-pink-600" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-500">Target Store</span>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-4 font-sans"
              >
                {stores.map((s) => (
                  <option key={s.custno} value={s.custno} className="text-slate-900 font-sans">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Session & Role Switches */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active Role Badge & Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              {isAdmin ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Admin Mode</span>
                  {(pendingOrdersCount > 0 || openIdooShortagesCount > 0) && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-pink-50 text-pink-700 border border-pink-200 rounded-lg text-xs font-bold shadow-xs">
                  <User className="w-4 h-4 text-pink-600" />
                  <span>Customer Mode</span>
                </div>
              )}

              <button
                onClick={() => onOpenLoginModal(isAdmin ? 'customer' : 'admin')}
                className="text-xs px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors font-semibold"
                title={isAdmin ? 'Switch to Customer View' : 'Login as Admin'}
              >
                {isAdmin ? 'Customer View' : 'Admin Login'}
              </button>
            </div>

            {/* Google Sheets Sync & Git Deploy Guide Button */}
            <button
              onClick={onOpenSyncModal}
              title="Google Sheet Live Sync & GitHub Deployment Guide"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-emerald-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden lg:inline">Sheets &amp; Deploy</span>
              {sheetSyncState.webhookUrl && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Auto-Sync Active"></span>
              )}
            </button>

            {/* Cart Trigger (for Customer) */}
            {!isAdmin && onOpenCart && (
              <button
                onClick={onOpenCart}
                className="relative p-2 sm:px-3 sm:py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Order Cart</span>
                {cartCount > 0 && (
                  <span className="bg-white text-pink-700 text-[11px] font-black px-1.5 py-0.2 rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Reset Data */}
            <button
              onClick={() => {
                if (window.confirm('Reset all portal records back to original Wichita dataset?')) {
                  resetToInitialData();
                }
              }}
              title="Reset Demo Data"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-rose-600 border border-slate-200 transition-colors shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Location Selector */}
      <div className="md:hidden bg-slate-50 px-4 py-2 border-t border-slate-200 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-semibold">Store:</span>
        <select
          value={selectedStoreId}
          onChange={(e) => setSelectedStoreId(e.target.value)}
          className="bg-white text-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold border border-slate-200 shadow-xs"
        >
          {stores.map((s) => (
            <option key={s.custno} value={s.custno}>
              {s.shortName}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
};
