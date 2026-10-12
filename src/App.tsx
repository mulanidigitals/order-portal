/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { CustomerPortal } from './components/CustomerPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { LoginModal } from './components/LoginModal';

const AppContent: React.FC = () => {
  const { authSession, theme } = useApp();
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginTargetRole, setLoginTargetRole] = useState<'customer' | 'admin'>('customer');

  const handleOpenLogin = (role?: 'customer' | 'admin') => {
    setLoginTargetRole(role || 'customer');
    setIsLoginModalOpen(true);
  };

  const isAdmin = authSession.role === 'admin';
  const isLight = theme === 'light';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-pink-500 selection:text-white ${
        isLight ? 'theme-light bg-slate-50 text-slate-900' : 'theme-dark bg-slate-950 text-slate-100'
      }`}
    >
      {/* Global Navigation Header */}
      <Header
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenLoginModal={handleOpenLogin}
      />

      {/* Main View Area based on Auth Role */}
      <main className="flex-1">
        {isAdmin ? <AdminDashboard /> : <CustomerPortal />}
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-6 text-center text-xs transition-colors ${
          isLight
            ? 'border-slate-200 bg-white text-slate-500'
            : 'border-slate-900 bg-slate-950 text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Wichita Wireless Hub · Metro by T-Mobile Authorized B2B Network</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Territory: <strong>Wichita, KS</strong></span>
            <span>·</span>
            <span>Allocations: <strong>iPhones 20 pcs/pk · Android 5 pcs/pk</strong></span>
            <span>·</span>
            <span>IDOO SLA: <strong>2 Days</strong></span>
          </div>
        </div>
      </footer>

      {/* Google Sheets Sync & Backup Modal */}
      <GoogleSheetSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      {/* Separate Customer & Admin Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        requiredRole={loginTargetRole}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
