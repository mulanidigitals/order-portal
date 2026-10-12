import React from 'react';
import { useApp } from '../context/AppContext';
import { CreditCard, DollarSign, ArrowUpRight, ArrowDownLeft, FileText, CheckCircle2 } from 'lucide-react';

export const CustomerLedgerView: React.FC = () => {
  const { customerAccount, ledger } = useApp();

  const creditUsedPercent = Math.min(
    100,
    Math.round((customerAccount.currentBalance / customerAccount.creditLimit) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Account Credit Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Credit Limit</span>
            <CreditCard className="w-4 h-4 text-pink-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">${customerAccount.creditLimit.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Approved monthly B2B dealer credit line</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Current Outstanding Balance</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700">${customerAccount.currentBalance.toLocaleString()}</p>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all ${
                creditUsedPercent > 80 ? 'bg-rose-500' : 'bg-amber-500'
              }`}
              style={{ width: `${creditUsedPercent}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{creditUsedPercent}% of limit utilized</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Ordering Credit</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">${customerAccount.availableCredit.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Ready for new stock allocations</p>
        </div>
      </div>

      {/* Ledger Transactions Statement */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Customer Account Statement &amp; Ledger</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live ledger for {customerAccount.customerName} (Wichita Territory)
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs font-medium"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Print Statement</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Transaction Type</th>
                <th className="py-3 px-3">Reference / IDOO No.</th>
                <th className="py-3 px-3 text-right">Debit (Invoiced)</th>
                <th className="py-3 px-3 text-right">Credit (Paid)</th>
                <th className="py-3 px-3 text-right">Running Balance</th>
                <th className="py-3 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {ledger.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 text-slate-600 font-sans">{entry.date}</td>
                  <td className="py-3 px-3 font-sans">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                        entry.type === 'Order Invoice'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : entry.type === 'Payment Received'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {entry.type === 'Order Invoice' && <ArrowUpRight className="w-3 h-3 text-rose-600" />}
                      {entry.type === 'Payment Received' && <ArrowDownLeft className="w-3 h-3 text-emerald-600" />}
                      {entry.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-pink-700 font-semibold">{entry.referenceNumber}</td>
                  <td className="py-3 px-3 text-right text-rose-700 font-medium">
                    {entry.debit > 0 ? `$${entry.debit.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-medium">
                    {entry.credit > 0 ? `$${entry.credit.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    ${entry.runningBalance.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-600 text-xs max-w-sm truncate">
                    {entry.notes}
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
