import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IdooBacklogItem } from '../types';
import {
  ListOrdered,
  Clock,
  CheckCircle2,
  Download,
  Calendar,
} from 'lucide-react';

export const IdooBacklogManager: React.FC = () => {
  const { idooBacklog, updateIdooBacklogStatus, marketBudget } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredItems = idooBacklog.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  const totalNeededPcs = idooBacklog
    .filter((b) => b.status !== 'Fulfilled & Shipped')
    .reduce((sum, b) => sum + b.neededQty, 0);

  const totalEstimatedCost = idooBacklog
    .filter((b) => b.status !== 'Fulfilled & Shipped')
    .reduce((sum, b) => sum + b.totalCost, 0);

  const handleCarrierRefUpdate = (item: IdooBacklogItem) => {
    const ref = window.prompt(
      `Enter IDOO Carrier Reference / Order Number for ${item.itmdesc}:`,
      item.carrierRefNo || `IDOO-${Math.floor(100000 + Math.random() * 900000)}`
    );
    if (ref !== null && ref.trim()) {
      updateIdooBacklogStatus(item.id, 'IDOO Ordered', ref.trim());
    }
  };

  const exportIdooCsv = () => {
    const headers = [
      'Order Number',
      'Store Code',
      'Store Name',
      'SKU',
      'Description',
      'Manufacturer',
      'Quantity Needed (Pcs)',
      'Unit Cost',
      'Total Cost',
      'Date Added',
      'Estimated Arrival (2-Day SLA)',
      'Status',
      'Carrier Ref No',
    ];

    const rows = idooBacklog.map((i) => [
      i.orderNumber,
      i.storeId,
      `"${i.storeName}"`,
      i.itemSku,
      `"${i.itmdesc}"`,
      i.manufacturer,
      i.neededQty,
      i.unitWholesaleCost,
      i.totalCost,
      i.addedAt,
      i.estimatedArrivalDate,
      i.status,
      i.carrierRefNo || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Wichita_IDOO_Backlog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total IDOO Shortage Units
          </span>
          <p className="text-2xl font-black text-amber-700">{totalNeededPcs} pcs</p>
          <p className="text-xs text-slate-500 mt-1">Pending carrier fulfillment for stores</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Est. IDOO Procurement Cost
          </span>
          <p className="text-2xl font-black text-slate-900">${totalEstimatedCost.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">
            Monthly limit: ${marketBudget.monthlyBudgetLimit.toLocaleString()}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            SLA Policy
          </span>
          <p className="text-lg font-bold text-indigo-700 flex items-center gap-1.5 mt-1">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>2-Day IDOO Arrival</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Orders held 2 days for IDOO stock before full shipment.
          </p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-amber-600" />
              <span>IDOO Shortages &amp; Backlog Sheet</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Items ordered by Wichita stores that were not in active allocation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-900 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none shadow-xs font-medium"
            >
              <option value="ALL">All Statuses ({idooBacklog.length})</option>
              <option value="Awaiting IDOO Order">Awaiting IDOO Order</option>
              <option value="IDOO Ordered">IDOO Ordered</option>
              <option value="Received in Hub">Received in Hub</option>
              <option value="Fulfilled & Shipped">Fulfilled &amp; Shipped</option>
            </select>

            <button
              onClick={exportIdooCsv}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-emerald-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No active shortages in backlog</p>
            <p className="text-xs text-slate-400 mt-1">
              All customer order demands are currently covered by active allocations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Destination Store</th>
                  <th className="py-3 px-4">Phone Item Description</th>
                  <th className="py-3 px-4 text-center">Needed (Pcs)</th>
                  <th className="py-3 px-4 text-right">Est. Cost</th>
                  <th className="py-3 px-4">2-Day SLA Est.</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-pink-700">
                      {item.orderNumber}
                      <span className="block font-sans text-[10px] text-slate-400">{item.addedAt}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block truncate max-w-[170px]">
                        {item.storeName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{item.storeId}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 block truncate max-w-xs">{item.itmdesc}</span>
                      <span className="font-mono text-[10px] text-slate-500">SKU: {item.itemSku}</span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded font-bold text-amber-800 bg-amber-50 border border-amber-200 text-xs">
                        {item.neededQty} pcs
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ${item.totalCost.toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-indigo-700">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{item.estimatedArrivalDate}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          item.status === 'Awaiting IDOO Order'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : item.status === 'IDOO Ordered'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : item.status === 'Received in Hub'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.carrierRefNo && (
                        <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                          Ref: {item.carrierRefNo}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {item.status === 'Awaiting IDOO Order' && (
                        <button
                          onClick={() => handleCarrierRefUpdate(item)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                        >
                          Mark IDOO Ordered
                        </button>
                      )}

                      {item.status === 'IDOO Ordered' && (
                        <button
                          onClick={() => updateIdooBacklogStatus(item.id, 'Received in Hub')}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
                        >
                          Stock Arrived
                        </button>
                      )}

                      {item.status === 'Received in Hub' && (
                        <button
                          onClick={() => updateIdooBacklogStatus(item.id, 'Fulfilled & Shipped')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                        >
                          Ship to Store
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
