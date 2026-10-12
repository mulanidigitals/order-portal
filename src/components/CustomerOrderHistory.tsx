import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CustomerOrder } from '../types';
import {
  Package,
  Smartphone,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Calendar,
  Hash,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';

export const CustomerOrderHistory: React.FC = () => {
  const { orders, phoneWiseOrders, currentStore, isCombinedStore } = useApp();

  const [historyTab, setHistoryTab] = useState<'orders' | 'phones'>('orders');
  const [expandedPhoneSku, setExpandedPhoneSku] = useState<string | null>(null);
  const [phoneSearch, setPhoneSearch] = useState('');

  // Filter orders: If combined, show all Wichita orders; otherwise store-specific
  const relevantOrders = isCombinedStore
    ? orders
    : orders.filter((o) => o.storeId === currentStore.custno || o.storeId === 'ALL_WICHITA');

  const getStatusBadge = (status: CustomerOrder['status']) => {
    switch (status) {
      case 'Pending Review':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Pending Review',
        };
      case 'IDOO Shortage Pending':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: <AlertCircle className="w-3.5 h-3.5 text-purple-600" />,
          label: 'IDOO Processing (2-Day SLA)',
        };
      case 'Placed / Processing':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: <Package className="w-3.5 h-3.5 text-blue-600" />,
          label: 'Order Placed & Invoiced',
        };
      case 'Shipped / Fulfilled':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <Truck className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Shipped to Store',
        };
      case 'Rejected':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
          label: 'Rejected',
        };
      case 'Cancelled':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: <AlertCircle className="w-3.5 h-3.5 text-slate-500" />,
          label: 'Cancelled',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />,
          label: status,
        };
    }
  };

  const filteredPhoneWise = phoneWiseOrders.filter(
    (p) =>
      p.itmdesc.toLowerCase().includes(phoneSearch.toLowerCase()) ||
      p.itemSku.includes(phoneSearch) ||
      p.manufacturer.toLowerCase().includes(phoneSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Sub-tabs: By Order vs By Phone */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-pink-600" />
              <span>Order History &amp; Phone Ingestion Log</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isCombinedStore
                ? 'Showing consolidated history across All Wichita stores.'
                : `Showing orders for ${currentStore.shortName}.`}
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setHistoryTab('orders')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                historyTab === 'orders'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>By Orders ({relevantOrders.length})</span>
            </button>

            <button
              onClick={() => setHistoryTab('phones')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                historyTab === 'phones'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone-wise History ({phoneWiseOrders.length})</span>
            </button>
          </div>
        </div>

        {/* View 1: By Orders */}
        {historyTab === 'orders' && (
          <div>
            {relevantOrders.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No orders placed yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Add phones to your order cart from the catalog tab.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {relevantOrders.map((order) => {
                  const statusInfo = getStatusBadge(order.status);
                  return (
                    <div key={order.id} className="py-5 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-lg bg-pink-50 border border-pink-200 font-mono font-bold text-pink-700 text-xs">
                            {order.orderNumber}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.bg}`}>
                            {statusInfo.icon}
                            <span>{statusInfo.label}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {order.createdAt}
                          </span>
                          {order.idooOrderNumber && (
                            <span className="flex items-center gap-1 font-mono text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200 font-semibold">
                              <Hash className="w-3 h-3" />
                              IDOO Ref: {order.idooOrderNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mb-3">
                        <div className="text-xs font-bold text-slate-700 mb-2 flex justify-between items-center">
                          <span>Phone Line Items</span>
                          <span className="font-mono text-pink-700 font-bold">{order.totalPcs} Total Units</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {order.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="text-xs bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center shadow-xs"
                            >
                              <div className="truncate mr-2">
                                <p className="font-bold text-slate-900 truncate">{it.itmdesc}</p>
                                <span className="text-[10px] text-slate-500 font-mono">SKU: {it.itemSku}</span>
                              </div>
                              <div className="text-right whitespace-nowrap">
                                <span className="font-black text-pink-700 font-mono">{it.orderedQty} pcs</span>
                                {it.shortageQty > 0 && (
                                  <span className="block text-[10px] text-amber-700 font-medium">
                                    ({it.shortageQty} IDOO)
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {order.notes && (
                        <p className="text-xs text-slate-500 italic">Instructions: "{order.notes}"</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* View 2: Phone-wise Cumulative History */}
        {historyTab === 'phones' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search phone model in order history..."
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {filteredPhoneWise.length} Phone Models Tracked
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Phone Model</th>
                    <th className="py-3 px-4 text-center">Total Pcs Ordered</th>
                    <th className="py-3 px-4 text-center">Allocated Fulfilled</th>
                    <th className="py-3 px-4 text-center">IDOO Procured</th>
                    <th className="py-3 px-4 text-center">Order Occurrences</th>
                    <th className="py-3 px-4">Last Ordered</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredPhoneWise.map((p) => {
                    const isExpanded = expandedPhoneSku === p.itemSku;
                    return (
                      <React.Fragment key={p.itemSku}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-sans">
                            <span className="font-bold text-slate-900 block max-w-xs truncate">{p.itmdesc}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              SKU: {p.itemSku} · {p.manufacturer}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center font-black text-pink-700 text-sm">
                            {p.totalUnitsOrdered} pcs
                          </td>

                          <td className="py-3.5 px-4 text-center text-emerald-700 font-semibold">
                            {p.totalAllocatedFulfilled} pcs
                          </td>

                          <td className="py-3.5 px-4 text-center text-amber-700 font-semibold">
                            {p.totalIdooProcured > 0 ? `${p.totalIdooProcured} pcs` : '-'}
                          </td>

                          <td className="py-3.5 px-4 text-center text-slate-600 font-sans">
                            {p.orderOccurrences} times
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 font-sans text-xs">
                            {p.lastOrderedDate}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setExpandedPhoneSku(isExpanded ? null : p.itemSku)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs flex items-center gap-1 ml-auto border border-slate-200"
                            >
                              <span>{isExpanded ? 'Hide' : 'Orders'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/80 font-sans">
                            <td colSpan={7} className="p-4 border-b border-slate-200">
                              <div className="space-y-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                  Order Log for {p.itmdesc}:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {p.recentOrders.map((ro, rIdx) => (
                                    <div
                                      key={rIdx}
                                      className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex justify-between items-center shadow-xs"
                                    >
                                      <div>
                                        <span className="font-mono font-bold text-pink-700">{ro.orderNumber}</span>
                                        <p className="text-[10px] text-slate-500">{ro.date}</p>
                                        <p className="text-[10px] text-slate-400">{ro.storeName}</p>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-black text-slate-900">{ro.qty} pcs</span>
                                        <span className="block text-[10px] text-emerald-700">{ro.status}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
