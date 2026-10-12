import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CustomerLedgerEntry } from '../types';
import {
  CreditCard,
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Sliders,
  Building2,
  Edit2,
  Trash2,
  Check,
} from 'lucide-react';

export const CustomerLedgerManager: React.FC = () => {
  const {
    customerAccount,
    ledger,
    recordCustomerPayment,
    updateCreditLimit,
    addLedgerEntry,
    updateLedgerEntry,
    deleteLedgerEntry,
  } = useApp();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

  // Manual Adjustment form state (+ / - values, credits, debits)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjType, setAdjType] = useState<CustomerLedgerEntry['type']>('Credit Adjustment');
  const [adjAmount, setAdjAmount] = useState<number | ''>('');
  const [adjRef, setAdjRef] = useState('');
  const [adjDate, setAdjDate] = useState(new Date().toLocaleDateString('en-US'));
  const [adjNotes, setAdjNotes] = useState('');

  // Edit existing entry modal state
  const [editingEntry, setEditingEntry] = useState<CustomerLedgerEntry | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editType, setEditType] = useState<CustomerLedgerEntry['type']>('Debit Adjustment');
  const [editRef, setEditRef] = useState('');
  const [editDebit, setEditDebit] = useState<number | ''>('');
  const [editCredit, setEditCredit] = useState<number | ''>('');
  const [editNotes, setEditNotes] = useState('');

  // Delete entry modal state
  const [deletingEntry, setDeletingEntry] = useState<CustomerLedgerEntry | null>(null);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'Wire' | 'ACH' | 'Cash' | 'Check' | 'Zelle' | 'Carrier Rebate'>('Wire');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Limit form state
  const [newCreditLimit, setNewCreditLimit] = useState<number | ''>(customerAccount.creditLimit);
  const [limitNotes, setLimitNotes] = useState('');

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjAmount === '' || isNaN(Number(adjAmount))) {
      alert('Please enter a valid adjustment amount.');
      return;
    }

    const rawVal = Number(adjAmount);
    let debitVal = 0;
    let creditVal = 0;

    if (adjType === 'Credit Adjustment' || adjType === 'Refund / Credit Note') {
      creditVal = Math.abs(rawVal);
    } else if (adjType === 'Debit Adjustment' || adjType === 'Order Invoice') {
      debitVal = Math.abs(rawVal);
    } else {
      if (rawVal < 0) {
        creditVal = Math.abs(rawVal);
      } else {
        debitVal = rawVal;
      }
    }

    addLedgerEntry({
      date: adjDate.trim() || new Date().toLocaleDateString('en-US'),
      type: adjType,
      referenceNumber: adjRef.trim() || `ADJ-${Date.now().toString().slice(-6)}`,
      debit: debitVal,
      credit: creditVal,
      notes: adjNotes.trim() || 'Admin manual balance adjustment',
    });

    setIsAdjustModalOpen(false);
    setAdjAmount('');
    setAdjRef('');
    setAdjNotes('');
  };

  const openEditModal = (entry: CustomerLedgerEntry) => {
    setEditingEntry(entry);
    setEditDate(entry.date);
    setEditType(entry.type);
    setEditRef(entry.referenceNumber);
    setEditDebit(entry.debit);
    setEditCredit(entry.credit);
    setEditNotes(entry.notes);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    updateLedgerEntry(editingEntry.id, {
      date: editDate.trim(),
      type: editType,
      referenceNumber: editRef.trim(),
      debit: Number(editDebit) || 0,
      credit: Number(editCredit) || 0,
      notes: editNotes.trim(),
    });

    setEditingEntry(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingEntry) return;
    deleteLedgerEntry(deletingEntry.id);
    setDeletingEntry(null);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    if (!paymentRef.trim()) {
      alert('Reference number / check number is required.');
      return;
    }

    recordCustomerPayment(
      Number(paymentAmount),
      paymentMethod,
      paymentRef.trim(),
      paymentNotes.trim()
    );

    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    setPaymentRef('');
    setPaymentNotes('');
  };

  const handleUpdateLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCreditLimit || Number(newCreditLimit) <= 0) {
      alert('Please enter a valid credit limit.');
      return;
    }

    updateCreditLimit(Number(newCreditLimit), limitNotes.trim());
    setIsLimitModalOpen(false);
    setLimitNotes('');
  };

  const creditUsedPercent = Math.min(
    100,
    Math.round((customerAccount.currentBalance / customerAccount.creditLimit) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Account Balance & Action Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Dealer Account
              </span>
              <span className="text-xs text-slate-500 font-mono">{customerAccount.customerId}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>{customerAccount.customerName}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Managing credit lines, invoiced IDOO orders, manual balance adjustments (+/- values), and payment settlements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* New Ledger Adjustment Button */}
            <button
              onClick={() => {
                setAdjRef(`ADJ-${Date.now().toString().slice(-6)}`);
                setAdjAmount('');
                setAdjDate(new Date().toLocaleDateString('en-US'));
                setAdjNotes('');
                setIsAdjustModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              title="Add manual debit or credit adjustment (+ / - values)"
            >
              <Plus className="w-4 h-4" />
              <span>+ Ledger Adjustment (+ / -)</span>
            </button>

            <button
              onClick={() => {
                setPaymentRef(`ACH-${Date.now().toString().slice(-6)}`);
                setIsPaymentModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <DollarSign className="w-4 h-4" />
              <span>Record Payment</span>
            </button>

            <button
              onClick={() => {
                setNewCreditLimit(customerAccount.creditLimit);
                setIsLimitModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 shadow-xs"
            >
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>Adjust Credit Limit</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">
              Approved Credit Facility
            </span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              ${customerAccount.creditLimit.toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">Maximum allowed exposure</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">
              Current Outstanding Balance
            </span>
            <p className={`text-2xl font-black font-mono ${customerAccount.currentBalance < 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {customerAccount.currentBalance < 0
                ? `-$${Math.abs(customerAccount.currentBalance).toLocaleString()} (Credit Balance)`
                : `$${customerAccount.currentBalance.toLocaleString()}`}
            </p>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  creditUsedPercent > 80 ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.max(0, creditUsedPercent)}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">{creditUsedPercent}% of limit used</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">
              Available Credit Remaining
            </span>
            <p className="text-2xl font-black text-emerald-700 font-mono">
              ${customerAccount.availableCredit.toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">Safe headroom for new phone orders</span>
          </div>
        </div>
      </div>

      {/* Ledger Audit Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Dealer Account Ledger Entries ({ledger.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological log of orders billed, payments collected, adjustments, and negative/positive value edits.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs font-medium"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Print Ledger</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Reference / Confirmation</th>
                <th className="py-3 px-4 text-right">Debit (Invoiced)</th>
                <th className="py-3 px-4 text-right">Credit (Paid)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
                <th className="py-3 px-4">Description / Notes</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {ledger.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-sans text-slate-600">{entry.date}</td>
                  <td className="py-3 px-4 font-sans">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                        entry.type === 'Order Invoice' || entry.type === 'Debit Adjustment'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : entry.type === 'Payment Received' || entry.type === 'Credit Adjustment' || entry.type === 'Refund / Credit Note'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {(entry.type === 'Order Invoice' || entry.type === 'Debit Adjustment') && (
                        <ArrowUpRight className="w-3 h-3 text-rose-600" />
                      )}
                      {(entry.type === 'Payment Received' || entry.type === 'Credit Adjustment' || entry.type === 'Refund / Credit Note') && (
                        <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                      )}
                      {entry.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-pink-700 font-semibold">{entry.referenceNumber}</td>
                  <td className="py-3 px-4 text-right text-rose-700 font-medium">
                    {entry.debit > 0 ? `$${entry.debit.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-medium">
                    {entry.credit > 0 ? `$${entry.credit.toLocaleString()}` : '-'}
                  </td>
                  <td className={`py-3 px-4 text-right font-bold ${entry.runningBalance < 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                    {entry.runningBalance < 0
                      ? `-$${Math.abs(entry.runningBalance).toLocaleString()}`
                      : `$${entry.runningBalance.toLocaleString()}`}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-600 text-xs max-w-sm truncate">
                    {entry.notes}
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(entry)}
                        title="Edit this ledger entry"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingEntry(entry)}
                        title="Delete this ledger entry"
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Ledger Adjustment Modal (+ / - Values, Custom Debit / Credit) */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2 text-indigo-700">
                <Plus className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Add Ledger Adjustment (+ / - Values)</h3>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Adjustment Type:
                </label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="Credit Adjustment">Credit Adjustment (- balance / discount / rebate)</option>
                  <option value="Debit Adjustment">Debit Adjustment (+ balance / fee / extra invoice)</option>
                  <option value="Refund / Credit Note">Refund / Credit Note (dealer credit)</option>
                  <option value="Payment Received">Manual Payment Entry</option>
                  <option value="Order Invoice">Manual Invoice Charge</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Adjustment Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 500.00 (or negative value)"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold text-sm focus:bg-white focus:outline-none focus:border-indigo-600"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Tip: Credits reduce the customer's balance; Debits increase what they owe.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Date:
                  </label>
                  <input
                    type="text"
                    required
                    value={adjDate}
                    onChange={(e) => setAdjDate(e.target.value)}
                    placeholder="MM/DD/YYYY"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Reference / Voucher #:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ADJ-789012"
                    value={adjRef}
                    onChange={(e) => setAdjRef(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Reason / Adjustment Notes:
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Price protection rebate on 10 pcs iPhone 16 or carrier credit adjustment..."
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Post Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Existing Ledger Entry Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2 text-indigo-700">
                <Edit2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Edit Ledger Entry</h3>
              </div>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Date:
                  </label>
                  <input
                    type="text"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Reference #:
                  </label>
                  <input
                    type="text"
                    required
                    value={editRef}
                    onChange={(e) => setEditRef(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono text-xs focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Entry Type:
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:bg-white"
                >
                  <option value="Order Invoice">Order Invoice</option>
                  <option value="Payment Received">Payment Received</option>
                  <option value="Credit Adjustment">Credit Adjustment</option>
                  <option value="Debit Adjustment">Debit Adjustment</option>
                  <option value="Refund / Credit Note">Refund / Credit Note</option>
                  <option value="Credit Limit Adjustment">Credit Limit Adjustment</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-rose-700">
                    Debit Amount ($):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editDebit}
                    onChange={(e) => setEditDebit(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold text-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-emerald-700">
                    Credit Amount ($):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editCredit}
                    onChange={(e) => setEditCredit(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold text-xs focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Description / Notes:
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  Save Entry Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Ledger Entry Confirmation Modal */}
      {deletingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full shadow-2xl p-6 text-xs animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Delete Ledger Entry?</span>
            </h3>
            <p className="text-slate-600 mb-3">
              Are you sure you want to delete entry <strong className="text-slate-900 font-mono">{deletingEntry.referenceNumber}</strong>?
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold">
                  {deletingEntry.debit > 0 ? `Debit $${deletingEntry.debit}` : `Credit $${deletingEntry.credit}`}
                </span>
              </div>
              <div className="flex justify-between mt-1 text-[11px] text-slate-500">
                <span>Date:</span>
                <span>{deletingEntry.date}</span>
              </div>
            </div>
            <p className="text-[11px] text-rose-600 mb-4">
              Running balance and dealer available credit will automatically be recomputed.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingEntry(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <DollarSign className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Record Customer Payment</h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Payment Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 5000.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold text-sm focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="Wire">Bank Wire Transfer</option>
                  <option value="ACH">ACH Transfer</option>
                  <option value="Cash">Cash Deposit</option>
                  <option value="Check">Business Check</option>
                  <option value="Zelle">Zelle Transfer</option>
                  <option value="Carrier Rebate">Carrier Spiff / Rebate Credit</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Reference # / Check # / Wire Confirmation
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WIRE-890214"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Payment towards Invoice #WICH-ORD-9912"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Credit Limit Modal */}
      {isLimitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2 text-indigo-700">
                <CreditCard className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Adjust Dealer Credit Line</h3>
              </div>
              <button
                onClick={() => setIsLimitModalOpen(false)}
                className="text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateLimit} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  New Approved Credit Limit ($)
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  placeholder="e.g. 75000.00"
                  value={newCreditLimit}
                  onChange={(e) => setNewCreditLimit(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold text-sm focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Reason / Approval Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly volume expansion approved by Regional Director"
                  value={limitNotes}
                  onChange={(e) => setLimitNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsLimitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  Update Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
