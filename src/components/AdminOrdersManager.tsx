import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CustomerOrder, OrderItem } from '../types';
import {
  PackageCheck,
  Clock,
  AlertTriangle,
  FileCheck,
  Filter,
  Check,
  X,
  Ban,
  Save,
  Edit3,
  Plus,
  Trash2,
  Send,
} from 'lucide-react';

export const AdminOrdersManager: React.FC = () => {
  const {
    orders,
    processOrderAdmin,
    updateOrderStatus,
    acceptOrder,
    rejectOrder,
    cancelOrder,
    deleteOrder,
    editAndFinalizeOrder,
    productAnalytics,
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);

  // Modal Prompt for "Mark Placed / Process" (IDOO confirmation # and Invoiced amount)
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [orderToProcess, setOrderToProcess] = useState<CustomerOrder | null>(null);
  const [modalIdooNumber, setModalIdooNumber] = useState('');
  const [modalInvoiceAmount, setModalInvoiceAmount] = useState<number | ''>('');
  const [modalTrackingNumber, setModalTrackingNumber] = useState('');
  const [modalCarrierName, setModalCarrierName] = useState('UPS Ground');
  const [modalNotes, setModalNotes] = useState('');
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Reject / Cancel / Delete in-app modal state (no window.prompt!)
  const [rejectModalOrder, setRejectModalOrder] = useState<CustomerOrder | null>(null);
  const [rejectReason, setRejectReason] = useState('Stock unavailable at carrier distributor');
  const [cancelModalOrder, setCancelModalOrder] = useState<CustomerOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('Order cancelled by dealer request');
  const [deleteModalOrder, setDeleteModalOrder] = useState<CustomerOrder | null>(null);

  // Edit & Finalize Order Modal State
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [editIdooNumber, setEditIdooNumber] = useState('');
  const [editTrackingNumber, setEditTrackingNumber] = useState('');
  const [editCarrierName, setEditCarrierName] = useState('UPS Ground');
  const [selectedAddSku, setSelectedAddSku] = useState('');

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'ALL') return true;
    return o.status === filterStatus;
  });

  const openProcessModal = (order: CustomerOrder) => {
    setOrderToProcess(order);
    setModalIdooNumber(order.idooOrderNumber || `IDOO-${Math.floor(100000 + Math.random() * 900000)}`);
    setModalInvoiceAmount(order.totalWholesaleValue);
    setModalTrackingNumber(order.trackingNumber || `1Z${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`);
    setModalCarrierName(order.carrierName || 'UPS Ground');
    setModalNotes('');
    setProcessingError(null);
    setIsProcessModalOpen(true);
  };

  const handleConfirmProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToProcess) return;

    if (!modalIdooNumber.trim()) {
      setProcessingError('Please provide an IDOO confirmation order number.');
      return;
    }

    if (!modalInvoiceAmount || Number(modalInvoiceAmount) <= 0) {
      setProcessingError('Please provide a valid invoice amount.');
      return;
    }

    const res = processOrderAdmin(
      orderToProcess.id,
      modalIdooNumber.trim(),
      Number(modalInvoiceAmount),
      modalNotes.trim(),
      modalTrackingNumber.trim() || undefined,
      modalCarrierName
    );

    if (res.success) {
      setIsProcessModalOpen(false);
      setOrderToProcess(null);
    } else {
      setProcessingError(res.error || 'Failed to process order.');
    }
  };

  const handleConfirmReject = () => {
    if (!rejectModalOrder) return;
    rejectOrder(rejectModalOrder.id, rejectReason.trim() || 'Order rejected by admin');
    setRejectModalOrder(null);
  };

  const handleConfirmCancel = () => {
    if (!cancelModalOrder) return;
    cancelOrder(cancelModalOrder.id, cancelReason.trim() || undefined);
    setCancelModalOrder(null);
  };

  // Open Edit Order Modal
  const openEditOrderModal = (order: CustomerOrder) => {
    setEditingOrder(order);
    setEditItems(JSON.parse(JSON.stringify(order.items)));
    setEditNotes(order.notes || '');
    setEditIdooNumber(order.idooOrderNumber || '');
    setEditTrackingNumber(order.trackingNumber || '');
    setEditCarrierName(order.carrierName || 'UPS Ground');
    setSelectedAddSku('');
  };

  const handleEditItemQty = (sku: string, qty: number) => {
    const cleanQty = Math.max(0, qty);
    setEditItems((prev) =>
      prev.map((it) => (it.itemSku === sku ? { ...it, orderedQty: cleanQty } : it))
    );
  };

  const handleRemoveEditItem = (sku: string) => {
    setEditItems((prev) => prev.filter((it) => it.itemSku !== sku));
  };

  const handleAddEditItem = () => {
    if (!selectedAddSku) return;
    const existing = editItems.find((it) => it.itemSku === selectedAddSku);
    if (existing) {
      handleEditItemQty(selectedAddSku, existing.orderedQty + 1);
      setSelectedAddSku('');
      return;
    }

    const prod = productAnalytics.find((p) => p.itemSku === selectedAddSku);
    if (prod) {
      setEditItems((prev) => [
        ...prev,
        {
          itemSku: prod.itemSku,
          itmdesc: prod.itmdesc,
          manufacturer: prod.manufacturer,
          orderedQty: 5,
          availableFromAllocation: Math.min(5, prod.availableAllocationPcs),
          shortageQty: Math.max(0, 5 - prod.availableAllocationPcs),
          unitPrice: prod.price,
          wholesalePrice: prod.wholesale,
        },
      ]);
      setSelectedAddSku('');
    }
  };

  const handleFinalizeSaveOrder = () => {
    if (!editingOrder) return;
    if (editItems.filter((i) => i.orderedQty > 0).length === 0) {
      alert('Order must contain at least 1 item with positive quantity.');
      return;
    }

    const res = editAndFinalizeOrder(
      editingOrder.id,
      editItems,
      editNotes,
      editIdooNumber.trim() || undefined,
      editTrackingNumber.trim() || undefined,
      editCarrierName
    );
    if (res.success) {
      setEditingOrder(null);
    } else {
      alert(res.error || 'Failed to finalize order');
    }
  };

  const editTotalPcs = editItems.reduce((sum, i) => sum + i.orderedQty, 0);
  const editTotalWholesale = editItems.reduce(
    (sum, i) => sum + i.orderedQty * i.wholesalePrice,
    0
  );

  // Wichita Territory Stock Overview
  const totalWichitaStoresInvExclHq = productAnalytics.reduce(
    (sum, p) => sum + p.storesInventoryExclHq,
    0
  );
  const totalWichitaHubInvTtlwichhq = productAnalytics.reduce(
    (sum, p) => sum + p.hubInventoryTtlwichhq,
    0
  );
  const totalWichitaInventorySum = totalWichitaStoresInvExclHq + totalWichitaHubInvTtlwichhq;

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-indigo-600" />
            <span>Orders Management &amp; Approvals</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Accept, Reject, Edit, or Cancel Wichita dealer orders. Finalize quantities and process IDOO placement.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600 font-semibold">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-1.5 focus:outline-none font-semibold text-xs shadow-xs"
          >
            <option value="ALL">All Orders ({orders.length})</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="IDOO Shortage Pending">IDOO Shortages</option>
            <option value="Placed / Processing">Placed &amp; Invoiced</option>
            <option value="Shipped / Fulfilled">Shipped / Fulfilled</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Wichita Inventory Overview Bar (Stores vs Hub TTLWICHHQ) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Wichita Stores Inv (Excl TTLWICHHQ)
          </span>
          <p className="text-xl font-black text-slate-900 font-mono mt-1">
            {totalWichitaStoresInvExclHq.toLocaleString()} pcs
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Available across Wichita store branches
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Wichita Hub Inv (TTLWICHHQ)
          </span>
          <p className="text-xl font-black text-indigo-700 font-mono mt-1">
            {totalWichitaHubInvTtlwichhq.toLocaleString()} pcs
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Available at Wichita Central Hub
          </span>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
            Total Combined Wichita Inventory
          </span>
          <p className="text-xl font-black text-emerald-700 font-mono mt-1">
            {totalWichitaInventorySum.toLocaleString()} pcs
          </p>
          <span className="text-[10px] text-indigo-600 mt-0.5 block">
            Stores ({totalWichitaStoresInvExclHq}) + Hub ({totalWichitaHubInvTtlwichhq})
          </span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <PackageCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No orders found</p>
            <p className="text-xs text-slate-400 mt-1">
              Active orders placed by Wichita customers will be listed here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Order Date</th>
                  <th className="py-3.5 px-4 text-center">Units (Pcs)</th>
                  <th className="py-3.5 px-4">Allocation vs Shortage</th>
                  <th className="py-3.5 px-4">Wichita Inv Context</th>
                  <th className="py-3.5 px-4">Wholesale Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">IDOO Details</th>
                  <th className="py-3.5 px-4 text-right">Order Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredOrders.map((order) => {
                  const hasShortage = order.shortageTotalPcs > 0;
                  const isPending = order.status === 'Pending Review';
                  const isApproved = order.status === 'Approved' || order.status === 'IDOO Shortage Pending';

                  // Compute order items stock in Wichita stores vs Hub TTLWICHHQ
                  const orderStoresInv = order.items.reduce((sum, it) => {
                    const prod = productAnalytics.find((p) => p.itemSku === it.itemSku);
                    return sum + (prod ? prod.storesInventoryExclHq : 0);
                  }, 0);
                  const orderHubInv = order.items.reduce((sum, it) => {
                    const prod = productAnalytics.find((p) => p.itemSku === it.itemSku);
                    return sum + (prod ? prod.hubInventoryTtlwichhq : 0);
                  }, 0);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-pink-700 text-xs">
                        {order.orderNumber}
                      </td>

                      <td className="py-3.5 px-4 font-sans text-slate-600 text-xs">
                        {order.createdAt}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black text-slate-900 text-sm">{order.totalPcs} pcs</span>
                        <span className="block text-[10px] text-slate-500 font-sans">
                          ({order.items.length} SKUs)
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-sans">
                        <div className="space-y-0.5">
                          <span className="inline-block text-[11px] text-emerald-700 font-bold">
                            ✓ {order.totalPcs - order.shortageTotalPcs} pcs in Alloc
                          </span>
                          {hasShortage && (
                            <span className="block text-[11px] text-amber-700 font-bold">
                              ⚠️ {order.shortageTotalPcs} pcs Shortage
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Wichita Inv Context (Stores vs Hub TTLWICHHQ) */}
                      <td className="py-3.5 px-4 font-sans text-[11px]">
                        <div className="space-y-0.5">
                          <span className="text-slate-700 block font-mono">
                            Stores: <strong className="text-slate-900">{orderStoresInv} pcs</strong>
                          </span>
                          <span className="text-indigo-700 block font-mono">
                            Hub: <strong className="text-indigo-950">{orderHubInv} pcs</strong>
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ${order.totalWholesaleValue.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 font-sans">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            order.status === 'Pending Review'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : order.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : order.status === 'IDOO Shortage Pending'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : order.status === 'Placed / Processing'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : order.status === 'Shipped / Fulfilled'
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : order.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {order.status}
                        </span>
                        {order.rejectionReason && (
                          <span className="block text-[10px] text-rose-600 mt-0.5 font-sans">
                            {order.rejectionReason}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {order.idooOrderNumber ? (
                          <div className="text-xs">
                            <span className="text-indigo-700 font-bold">{order.idooOrderNumber}</span>
                            <span className="block text-[10px] text-slate-500">
                              ${order.idooInvoiceAmount?.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-sans">Pending IDOO</span>
                        )}
                      </td>

                      {/* Action buttons: Accept, Reject, Cancel, Edit, Place */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap font-sans">
                        {/* View Items */}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs"
                          title="View order items"
                        >
                          View
                        </button>

                        {/* Edit & Finalize PO Button (Admin can add/delete items) */}
                        <button
                          onClick={() => openEditOrderModal(order)}
                          className="px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold border border-pink-200 shadow-xs inline-flex items-center gap-1"
                          title="Admin: Add, edit, or delete items from this customer PO"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit PO (+/- Items)</span>
                        </button>

                        {/* Accept Button */}
                        {isPending && (
                          <button
                            onClick={() => acceptOrder(order.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                            title="Approve / Accept Order"
                          >
                            <Check className="w-3.5 h-3.5 inline mr-0.5" />
                            <span>Accept</span>
                          </button>
                        )}

                        {/* Reject Button (In-app modal) */}
                        {isPending && (
                          <button
                            onClick={() => {
                              setRejectModalOrder(order);
                              setRejectReason('Stock unavailable at carrier distributor');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
                            title="Reject Order with reason"
                          >
                            <X className="w-3.5 h-3.5 inline mr-0.5" />
                            <span>Reject</span>
                          </button>
                        )}

                        {/* Place Order (IDOO Prompt) */}
                        {isApproved && (
                          <button
                            onClick={() => openProcessModal(order)}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                          >
                            Place IDOO
                          </button>
                        )}

                        {/* Ship */}
                        {order.status === 'Placed / Processing' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'Shipped / Fulfilled')}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
                          >
                            Ship
                          </button>
                        )}

                        {/* Cancel Button (In-app modal) */}
                        {order.status !== 'Shipped / Fulfilled' && order.status !== 'Cancelled' && order.status !== 'Rejected' && (
                          <button
                            onClick={() => {
                              setCancelModalOrder(order);
                              setCancelReason('Order cancelled by dealer request');
                            }}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-amber-600 transition-colors"
                            title="Cancel Order"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Permanent Delete Order Button (Admin Only) */}
                        <button
                          onClick={() => setDeleteModalOrder(order)}
                          className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Order (Admin Exclusive)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Order In-App Modal (Admin Only) */}
      {deleteModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 text-xs animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              <span>Delete Order #{deleteModalOrder.orderNumber}</span>
            </h3>
            <p className="text-slate-600 mb-2">
              Are you sure you want to permanently delete this order?
            </p>
            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-rose-800 text-[11px] mb-4 space-y-1">
              <p>• Reserved allocations will be released back to available inventory.</p>
              <p>• Corresponding shortage backlog items will be removed.</p>
              <p>• This action is permanent and only available to administrators.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteModalOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteOrder(deleteModalOrder.id);
                  setDeleteModalOrder(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold"
              >
                Yes, Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Order In-App Modal */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 text-xs animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Reject Order #{rejectModalOrder.orderNumber}</span>
            </h3>
            <p className="text-slate-600 mb-3">
              Please provide the reason for rejecting this dealer order:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-500 mb-4"
              placeholder="Enter rejection reason..."
            ></textarea>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order In-App Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 text-xs animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Ban className="w-5 h-5 text-slate-600" />
              <span>Cancel Order #{cancelModalOrder.orderNumber}</span>
            </h3>
            <p className="text-slate-600 mb-3">
              Confirm cancellation and specify any remarks:
            </p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
              >
                Dismiss
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-900 font-bold"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit & Finalize Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl p-6 text-xs max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-pink-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Edit &amp; Finalize Order #{editingOrder.orderNumber}
                  </h3>
                  <span className="text-slate-500 text-[11px]">Adjust phone quantities, add items, and finalize</span>
                </div>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="text-slate-500 hover:text-slate-800 px-2 py-1 bg-slate-100 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4">
              {/* Item editor list */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-500 text-[11px] uppercase">
                    <tr>
                      <th className="p-3">Phone Description</th>
                      <th className="p-3 text-center">Stores Inv (Excl HQ)</th>
                      <th className="p-3 text-center">Hub (TTLWICHHQ)</th>
                      <th className="p-3 text-center">Quantity (Pcs)</th>
                      <th className="p-3 text-right">Wholesale Price</th>
                      <th className="p-3 text-right">Line Total</th>
                      <th className="p-3 text-center">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {editItems.map((item) => {
                      const prod = productAnalytics.find((p) => p.itemSku === item.itemSku);
                      return (
                        <tr key={item.itemSku} className="hover:bg-white">
                          <td className="p-3 font-sans">
                            <span className="font-bold text-slate-900 block max-w-xs truncate">{item.itmdesc}</span>
                            <span className="text-[10px] text-slate-500 font-mono">SKU: {item.itemSku}</span>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-700">
                            {prod ? `${prod.storesInventoryExclHq} pcs` : '-'}
                          </td>
                          <td className="p-3 text-center font-bold text-indigo-700">
                            {prod ? `${prod.hubInventoryTtlwichhq} pcs` : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditItemQty(item.itemSku, Math.max(1, item.orderedQty - 1))}
                                className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.orderedQty}
                                onChange={(e) =>
                                  handleEditItemQty(item.itemSku, parseInt(e.target.value) || 0)
                                }
                                className="w-14 bg-white border border-slate-300 rounded-lg p-1 text-center text-slate-900 font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => handleEditItemQty(item.itemSku, item.orderedQty + 1)}
                                className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-right text-slate-600">
                            ${item.wholesalePrice.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-700">
                            ${(item.wholesalePrice * item.orderedQty).toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveEditItem(item.itemSku)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete item from this PO"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add item to order row */}
              <div className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <select
                  value={selectedAddSku}
                  onChange={(e) => setSelectedAddSku(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                >
                  <option value="">Select an item from complete price list to add to this PO...</option>
                  {productAnalytics.map((p) => (
                    <option key={p.itemSku} value={p.itemSku}>
                      {p.itmdesc} [Stores: {p.storesInventoryExclHq} | Hub: {p.hubInventoryTtlwichhq} | Alloc: {p.availableAllocationPcs} pcs | ${p.wholesale.toFixed(2)}]
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddEditItem}
                  disabled={!selectedAddSku}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to PO</span>
                </button>
              </div>

              {/* IDOO Ref & Logistics Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    IDOO Order # Ref:
                  </label>
                  <input
                    type="text"
                    value={editIdooNumber}
                    onChange={(e) => setEditIdooNumber(e.target.value)}
                    placeholder="e.g. IDOO-784920"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Carrier Tracking No:
                  </label>
                  <input
                    type="text"
                    value={editTrackingNumber}
                    onChange={(e) => setEditTrackingNumber(e.target.value)}
                    placeholder="e.g. 1Z9999999999999999"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Shipping Carrier:
                  </label>
                  <select
                    value={editCarrierName}
                    onChange={(e) => setEditCarrierName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-900 text-xs"
                  >
                    <option value="UPS Ground">UPS Ground</option>
                    <option value="FedEx Express">FedEx Express</option>
                    <option value="USPS Priority">USPS Priority</option>
                    <option value="Freight Express">Freight Express</option>
                    <option value="Local Courier">Local Courier / Hand Delivery</option>
                  </select>
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Adjustment / Finalization Notes:
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Revised units after customer phone discussion"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              {/* Summary and Finalize Button */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs space-y-0.5">
                  <span className="text-slate-600">Total Units: <strong className="text-slate-900 font-mono">{editTotalPcs} pcs</strong></span>
                  <span className="text-slate-600 block">Total Wholesale: <strong className="text-emerald-700 font-mono">${editTotalWholesale.toLocaleString()}</strong></span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalizeSaveOrder}
                    className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>Finalize &amp; Approve Order</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Modal Prompt when clicking Place IDOO */}
      {isProcessModalOpen && orderToProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <FileCheck className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Record IDOO Order Placement</h3>
              </div>
              <button
                onClick={() => setIsProcessModalOpen(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-600 mb-4">
              When processing order <strong className="text-pink-700 font-mono">#{orderToProcess.orderNumber}</strong>, enter the IDOO Order Confirmation Number and Invoiced Amount to post to the dealer ledger and track IDOO budget.
            </p>

            {processingError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl mb-4 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{processingError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmProcess} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  IDOO Confirmation Order # (Mandatory)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IDOO-784920"
                  value={modalIdooNumber}
                  onChange={(e) => setModalIdooNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Total Order Invoiced Amount ($) (Mandatory)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 3450.00"
                  value={modalInvoiceAmount}
                  onChange={(e) =>
                    setModalInvoiceAmount(
                      e.target.value === '' ? '' : parseFloat(e.target.value)
                    )
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold text-sm focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Original Order Value: ${orderToProcess.totalWholesaleValue.toLocaleString()} ({orderToProcess.totalPcs} pcs)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Carrier Tracking No (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1Z9999999999999999"
                    value={modalTrackingNumber}
                    onChange={(e) => setModalTrackingNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Shipping Carrier
                  </label>
                  <select
                    value={modalCarrierName}
                    onChange={(e) => setModalCarrierName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="UPS Ground">UPS Ground</option>
                    <option value="FedEx Express">FedEx Express</option>
                    <option value="USPS Priority">USPS Priority</option>
                    <option value="Freight Express">Freight Express</option>
                    <option value="Local Courier">Local Courier / Hand Delivery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Dispatch / Order Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Warehouse batch or dispatch comments"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProcessModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Confirm Placed &amp; Bill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Items Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full shadow-2xl p-6 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <span className="text-pink-700 font-mono font-bold text-sm">
                  #{selectedOrder.orderNumber}
                </span>
                <span className="text-slate-500 block text-xs mt-0.5">Wichita Territory Dealer Order</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const ord = selectedOrder;
                    setSelectedOrder(null);
                    openEditOrderModal(ord);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit PO Items (Add / Delete)</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-slate-500 hover:text-slate-800 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block font-sans">Order Date</span>
                  <span className="text-slate-900 font-bold">{selectedOrder.createdAt}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-sans">Total Units</span>
                  <span className="text-pink-700 font-black text-sm">{selectedOrder.totalPcs} pcs</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-sans">Wholesale Total</span>
                  <span className="text-emerald-700 font-bold">${selectedOrder.totalWholesaleValue.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Item Allocation Breakdown &amp; Inventory Context</h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-500 text-[11px] uppercase">
                      <tr>
                        <th className="p-3">Phone Model</th>
                        <th className="p-3 text-center">Ordered</th>
                        <th className="p-3 text-center">In Allocation</th>
                        <th className="p-3 text-center">IDOO Shortage</th>
                        <th className="p-3 text-center">Stores Inv (Excl HQ)</th>
                        <th className="p-3 text-center">Hub (TTLWICHHQ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {selectedOrder.items.map((it, idx) => {
                        const prod = productAnalytics.find((p) => p.itemSku === it.itemSku);
                        return (
                          <tr key={idx}>
                            <td className="p-3 font-sans">
                              <span className="font-bold text-slate-900 block">{it.itmdesc}</span>
                              <span className="text-[10px] text-slate-500 font-mono">SKU: {it.itemSku}</span>
                            </td>
                            <td className="p-3 text-center font-black text-slate-900">{it.orderedQty} pcs</td>
                            <td className="p-3 text-center text-emerald-700 font-semibold">
                              {it.availableFromAllocation} pcs
                            </td>
                            <td className="p-3 text-center text-amber-700 font-semibold">
                              {it.shortageQty > 0 ? `${it.shortageQty} pcs` : '-'}
                            </td>
                            <td className="p-3 text-center text-slate-700 font-bold">
                              {prod ? `${prod.storesInventoryExclHq} pcs` : '-'}
                            </td>
                            <td className="p-3 text-center text-indigo-700 font-bold">
                              {prod ? `${prod.hubInventoryTtlwichhq} pcs` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Notes</span>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
