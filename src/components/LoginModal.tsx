import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Smartphone,
  ShieldCheck,
  Store,
  Lock,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  requiredRole?: 'customer' | 'admin';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  requiredRole,
}) => {
  const { loginAsCustomer, loginAsAdmin, stores, selectedStoreId } = useApp();

  const [roleTab, setRoleTab] = useState<'customer' | 'admin'>(requiredRole || 'customer');
  const [targetStore, setTargetStore] = useState<string>(selectedStoreId || 'ALL_WICHITA');
  const [adminPin, setAdminPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsCustomer(targetStore);
    if (onClose) onClose();
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPin.trim()) {
      setErrorMessage('Please enter the administrator password.');
      return;
    }
    const success = loginAsAdmin(adminPin.trim());
    if (success) {
      setErrorMessage(null);
      setAdminPin('');
      if (onClose) onClose();
    } else {
      setErrorMessage('Access Denied: Incorrect administrator password. Customers cannot access admin panel.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-8 text-xs relative overflow-hidden animate-in zoom-in-95">
        {/* Brand Header */}
        <div className="text-center relative z-10 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center mx-auto text-white shadow-md shadow-pink-600/20 mb-3">
            <Smartphone className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">WICHITA WIRELESS HUB</h2>
          <p className="text-xs text-slate-500 mt-1">Metro by T-Mobile Authorized B2B Portal</p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 mb-6 relative z-10">
          <button
            type="button"
            onClick={() => {
              setRoleTab('customer');
              setErrorMessage(null);
            }}
            className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
              roleTab === 'customer'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Store Customer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleTab('admin');
              setErrorMessage(null);
            }}
            className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
              roleTab === 'admin'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Ops</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Role 1: Customer Login Form */}
        {roleTab === 'customer' && (
          <form onSubmit={handleCustomerLogin} className="space-y-4 relative z-10">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-pink-600" />
                <span>Select Your Wichita Store Location:</span>
              </label>
              <select
                value={targetStore}
                onChange={(e) => setTargetStore(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 text-xs font-semibold focus:bg-white focus:outline-none focus:border-pink-600 shadow-xs"
              >
                {stores.map((s) => (
                  <option key={s.custno} value={s.custno}>
                    {s.name} ({s.custno})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Defaults to All Wichita combined stores.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-slate-600">
              <span className="font-bold text-slate-900 block text-[11px]">Authorized Privileges:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                <li>View available phone allocations in real time</li>
                <li>Submit phone orders strictly in Pieces (Pcs)</li>
                <li>Access 7-day sales velocity and replenishment recommendations</li>
              </ul>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-pink-600 hover:bg-pink-700 text-white shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <span>Enter Customer Ordering Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Role 2: Admin Login Form */}
        {roleTab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4 relative z-10">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Administrator Access PIN / Password:</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Enter administrator password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-3 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-indigo-600 shadow-xs"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-slate-600">
              <span className="font-bold text-slate-900 block text-[11px]">Executive Command Capabilities:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                <li>Accept, Reject, Edit, Cancel &amp; Finalize Wichita orders</li>
                <li>Multi-attachment carrier screenshot OCR &amp; reset allocations</li>
                <li>Manage 2-day IDOO shortage backlogs &amp; carrier orders</li>
                <li>Manage dealer credit ledger, limits, and payment receipts</li>
              </ul>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <span>Unlock Admin Operations</span>
              <ShieldCheck className="w-4 h-4" />
            </button>
          </form>
        )}

        {onClose && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 text-xs font-semibold"
            >
              Continue without logging in
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
