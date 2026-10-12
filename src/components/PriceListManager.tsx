import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem } from '../types';
import {
  Tag,
  Flame,
  Search,
  Download,
  Edit3,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  DollarSign,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const PriceListManager: React.FC = () => {
  const {
    inventory,
    toggleTopPriority,
    updateProductPrice,
    addNewProductToPriceList,
    importBulkPriceList,
    resetToInitialData,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [topOnlyFilter, setTopOnlyFilter] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Price Modal State
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editWholesale, setEditWholesale] = useState<number | ''>('');
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editCost, setEditCost] = useState<number | ''>('');

  // Add Item Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMfr, setNewMfr] = useState('SAMSUNG');
  const [newCategory, setNewCategory] = useState<'PHONES' | 'BTS' | 'SIM CARD' | 'ACCESSORIES'>('PHONES');
  const [newWholesale, setNewWholesale] = useState<number | ''>('');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newCost, setNewCost] = useState<number | ''>('');
  const [newInitialQty, setNewInitialQty] = useState<number | ''>(5);
  const [newIsTop, setNewIsTop] = useState(false);

  // Bulk Import / Paste from Google Sheet Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [previewRows, setPreviewRows] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Group unique inventory items by SKU for price list management
  const uniqueItemsMap = new Map<string, InventoryItem>();
  inventory.forEach((i) => {
    if (!uniqueItemsMap.has(i.item)) {
      uniqueItemsMap.set(i.item, i);
    }
  });

  const uniqueItems = Array.from(uniqueItemsMap.values());

  const filteredItems = uniqueItems.filter((item) => {
    const matchesSearch =
      item.itmdesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item.includes(searchQuery) ||
      item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'ALL' || item.category === categoryFilter;

    const matchesTop = !topOnlyFilter || item.isTopPriority;

    return matchesSearch && matchesCategory && matchesTop;
  });

  const topCount = uniqueItems.filter((i) => i.isTopPriority).length;

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setEditWholesale(item.wholesale);
    setEditPrice(item.price);
    setEditCost(item.cost);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const wholesaleVal = Number(editWholesale) || 0;
    const priceVal = Number(editPrice) || 0;
    const costVal = Number(editCost) || 0;

    updateProductPrice(editingItem.item, wholesaleVal, priceVal, costVal);
    showToast(`Price updated for ${editingItem.item} (${editingItem.itmdesc})`);
    setEditingItem(null);
  };

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim() || !newDesc.trim()) {
      showToast('Please provide SKU and item description');
      return;
    }

    const wholesaleVal = Number(newWholesale) || 0;
    const priceVal = Number(newPrice) || 0;
    const costVal = Number(newCost) || 0;
    const qtyVal = Number(newInitialQty) || 0;

    const newItem: InventoryItem = {
      id: `inv-custom-${Date.now()}-${newSku.trim()}`,
      custno: 'TTLWICHHQ',
      company: 'TOMORROW CONNECT MAIN',
      marketid: 'WICHITA',
      region: 'WICHITA',
      item: newSku.trim(),
      manufacturer: newMfr.trim().toUpperCase(),
      color: 'STANDARD',
      prodline: 'METROPCS',
      category: newCategory,
      subclass: newCategory === 'PHONES' ? 'SMARTPHONE' : 'HARDWARE',
      itmdesc: newDesc.trim().toUpperCase(),
      serialized: newCategory !== 'ACCESSORIES' && newCategory !== 'SIM CARD',
      price: priceVal,
      qty: qtyVal,
      cost: costVal,
      lastcost: costVal,
      wholesale: wholesaleVal,
      adddate: new Date().toLocaleDateString(),
      isTopPriority: newIsTop,
    };

    addNewProductToPriceList(newItem);
    showToast(`Added new item ${newSku} to Master Price List!`);
    setIsAddModalOpen(false);
    // Reset form
    setNewSku('');
    setNewDesc('');
    setNewWholesale('');
    setNewPrice('');
    setNewCost('');
    setNewInitialQty(5);
    setNewIsTop(false);
  };

  // Parse pasted TSV/CSV from Google Sheet
  const handleParsePaste = (text: string) => {
    setPasteData(text);
    if (!text.trim()) {
      setPreviewRows([]);
      return;
    }

    const lines = text.trim().split(/\r?\n/);
    const parsed: any[] = [];

    // Check if line 0 is a header
    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes('sku') ||
      firstLine.includes('item') ||
      firstLine.includes('description') ||
      firstLine.includes('price') ||
      firstLine.includes('wholesale');

    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // Split by tab or comma
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      const cleanParts = parts.map((p) => p.trim().replace(/^["']|["']$/g, ''));

      if (cleanParts.length >= 2) {
        // Guess column mappings based on content
        const sku = cleanParts[0];
        const desc = cleanParts[1];
        let wholesale = 0;
        let retail = 0;
        let brand = 'METROPCS';

        // Check remaining columns for numbers
        for (let col = 2; col < cleanParts.length; col++) {
          const val = cleanParts[col].replace(/[$,]/g, '');
          const num = parseFloat(val);
          if (!isNaN(num) && num > 0) {
            if (wholesale === 0) {
              wholesale = num;
            } else if (retail === 0) {
              retail = num;
            }
          } else if (cleanParts[col].length > 1 && !cleanParts[col].startsWith('$')) {
            brand = cleanParts[col];
          }
        }

        if (sku) {
          parsed.push({
            item: sku,
            itmdesc: desc || `Item ${sku}`,
            manufacturer: brand,
            wholesale: wholesale || 100,
            price: retail || wholesale * 1.15 || 120,
            cost: wholesale * 0.9,
          });
        }
      }
    }

    setPreviewRows(parsed);
  };

  const handleApplyBulkImport = () => {
    if (previewRows.length === 0) {
      showToast('No valid rows found to import.');
      return;
    }
    const result = importBulkPriceList(previewRows);
    showToast(`Successfully updated/imported ${result.count} items from Google Sheet data!`);
    setIsBulkModalOpen(false);
    setPasteData('');
    setPreviewRows([]);
  };

  const exportPriceListCsv = () => {
    const headers = [
      'SKU',
      'Model Description',
      'Brand',
      'Category',
      'Subclass',
      'Wholesale Dealer Price',
      'Retail MSRP',
      'Cost',
      'Central Hub Stock',
      'TOP Priority Flag',
    ];

    const rows = uniqueItems.map((i) => [
      i.item,
      `"${i.itmdesc}"`,
      i.manufacturer,
      i.category,
      i.subclass,
      i.wholesale,
      i.price,
      i.cost,
      i.qty,
      i.isTopPriority ? 'TOP' : '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Wichita_Price_List_157Items_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                Admin Control
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                Total Products: {uniqueItems.length} Items (100% Complete)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                TOP Priority: {topCount}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-pink-600" />
              <span>Official Wichita Price List &amp; Admin Rate Manager</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Admin has full rights to update wholesale transfer prices, retail MSRP, and cost for all 157 catalog items. Changes update instantly across customer portal, order invoices, and reports.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>

            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors shadow-xs"
              title="Copy-paste columns from your Google Sheet price list"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Sync / Paste from Google Sheet</span>
            </button>

            <button
              onClick={exportPriceListCsv}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                resetToInitialData();
                showToast('Reset to default 157-item master catalog!');
              }}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-xs rounded-xl border border-slate-200 flex items-center gap-1 transition-colors"
              title="Reset all items and prices to default 157-item master catalogue"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search price list by SKU, model, or brand (e.g. A166, iPhone 16e, Motorola)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-pink-500 shadow-inner"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none shadow-xs"
            >
              <option value="ALL">All Categories ({uniqueItems.length})</option>
              <option value="PHONES">Phones</option>
              <option value="BTS">Tablets &amp; Gateways</option>
              <option value="SIM CARD">SIM Cards &amp; PINs</option>
              <option value="ACCESSORIES">Accessories &amp; Chargers</option>
            </select>

            <button
              onClick={() => setTopOnlyFilter(!topOnlyFilter)}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                topOnlyFilter
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Show TOP Items Only ({topCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Price List Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">SKU / Item</th>
                <th className="py-3.5 px-4">Model Description</th>
                <th className="py-3.5 px-4">Brand</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right bg-emerald-50/50 text-emerald-900" title="Admin Wholesale Dealer Price">
                  Wholesale Dealer Price
                </th>
                <th className="py-3.5 px-4 text-right">Retail MSRP</th>
                <th className="py-3.5 px-4 text-right text-slate-500">Cost</th>
                <th className="py-3.5 px-4 text-center">TOP Flag</th>
                <th className="py-3.5 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredItems.map((item) => (
                <tr
                  key={item.item}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    item.isTopPriority ? 'bg-rose-50/30' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-bold text-slate-700 whitespace-nowrap">
                    {item.item}
                  </td>
                  <td className="py-3.5 px-4 font-sans font-bold text-slate-900 max-w-sm truncate">
                    {item.itmdesc}
                    {item.item === '610214685872' && (
                      <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 font-mono px-1.5 py-0.5 rounded font-bold">
                        Verified $204.00
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-slate-600 font-semibold">
                    {item.manufacturer}
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-700 bg-emerald-50/30 text-sm">
                    ${item.wholesale.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-800 font-bold">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-500">
                    ${item.cost.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => toggleTopPriority(item.item)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all inline-flex items-center gap-1 shadow-xs ${
                        item.isTopPriority
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                      }`}
                      title="Click to toggle TOP flag in Price List"
                    >
                      <Flame className={`w-3.5 h-3.5 ${item.isTopPriority ? 'text-amber-300' : 'text-slate-400'}`} />
                      <span>{item.isTopPriority ? 'TOP' : 'Mark'}</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 inline-flex items-center gap-1 transition-colors"
                      title="Edit Wholesale & Retail Prices"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Price</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-sans">
                    No items found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Price Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-700 border border-pink-200 flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Edit Product Price</h4>
                  <p className="text-[11px] text-slate-500 font-mono">SKU: {editingItem.item}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Item Description</span>
                <span className="font-bold text-slate-900 block mt-0.5">{editingItem.itmdesc}</span>
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  Brand: {editingItem.manufacturer} &bull; Category: {editingItem.category}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Wholesale Dealer Price ($ USD):
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editWholesale}
                    onChange={(e) => setEditWholesale(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-black text-emerald-700 focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">This is the price charged to dealers / stores.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Retail MSRP ($):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Cost Basis ($):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editCost}
                    onChange={(e) => setEditCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-xl shadow-xs"
                >
                  Save New Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl p-6 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-700 border border-pink-200 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Add New Item to Price List</h4>
                  <p className="text-[11px] text-slate-500">Insert custom phone or hardware into Wichita master catalog</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Item SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 610214699999"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand / Manufacturer *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAMSUNG, APPLE, MOTOROLA"
                    value={newMfr}
                    onChange={(e) => setNewMfr(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 uppercase font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Model Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SAM A166U A16 5G 128G BLU KIT"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="PHONES">Phones</option>
                    <option value="BTS">Tablets &amp; Gateways</option>
                    <option value="SIM CARD">SIM Cards &amp; PINs</option>
                    <option value="ACCESSORIES">Accessories &amp; Chargers</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Central Hub Stock (EA)</label>
                  <input
                    type="number"
                    min="0"
                    value={newInitialQty}
                    onChange={(e) => setNewInitialQty(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-emerald-800 mb-1">Wholesale Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="204.00"
                    value={newWholesale}
                    onChange={(e) => setNewWholesale(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl px-3 py-2 font-black text-emerald-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Retail MSRP ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="223.50"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cost Basis ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="167.00"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="markTopCheckbox"
                  checked={newIsTop}
                  onChange={(e) => setNewIsTop(e.target.checked)}
                  className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                />
                <label htmlFor="markTopCheckbox" className="font-bold text-slate-700 cursor-pointer">
                  Mark as TOP Priority in Price List
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-xl shadow-xs"
                >
                  Create &amp; Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import / Paste from Google Sheet Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl p-6 text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Sync / Paste Price List from Google Sheet
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Paste columns directly from your Google Sheet (SKU, Description, Brand, Wholesale, Retail)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 block">How to sync from Google Sheet:</span>
                <ol className="list-decimal list-inside text-slate-600 space-y-1 leading-relaxed">
                  <li>In your Google Sheet, select the columns (SKU, Description, Wholesale Price, Retail).</li>
                  <li>Copy (<kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono">Ctrl+C</kbd> or <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono">Cmd+C</kbd>).</li>
                  <li>Paste below. The system automatically detects prices and matches existing items or adds new ones!</li>
                </ol>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Paste Spreadsheet Data (TSV / CSV):
                </label>
                <textarea
                  rows={6}
                  value={pasteData}
                  onChange={(e) => handleParsePaste(e.target.value)}
                  placeholder={`610214685872\tSAM A166U A16 5G 128G BLU KIT\tSAMSUNG\t204.00\t223.50\n610214688811\tSAM A176U A17 128G BLK KIT\tSAMSUNG\t223.50\t229.99\n195950051681\tAPL IPHONE 16E 128G BLK TMUS KIT\tAPPLE\t638.49\t599.99`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-mono text-[11px] text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {previewRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900">
                      Parsed Preview: {previewRows.length} items detected
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                      Ready to apply
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2">SKU</th>
                          <th className="p-2">Description</th>
                          <th className="p-2 text-right">Wholesale ($)</th>
                          <th className="p-2 text-right">Retail ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {previewRows.slice(0, 20).map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-700">{r.item}</td>
                            <td className="p-2 font-sans truncate max-w-xs">{r.itmdesc}</td>
                            <td className="p-2 text-right text-emerald-700 font-bold">${r.wholesale}</td>
                            <td className="p-2 text-right text-slate-800">${r.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewRows.length > 20 && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      ...and {previewRows.length - 20} more items
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkImport}
                  disabled={previewRows.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black rounded-xl shadow-xs"
                >
                  Apply &amp; Update Prices ({previewRows.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
