import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Tag,
  Flame,
  Search,
  Download,
} from 'lucide-react';

export const PriceListManager: React.FC = () => {
  const { inventory, toggleTopPriority } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [topOnlyFilter, setTopOnlyFilter] = useState(false);

  // Group unique inventory items by SKU for price list management
  const uniqueItemsMap = new Map<string, typeof inventory[0]>();
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

  const exportPriceListCsv = () => {
    const headers = [
      'SKU',
      'Model Description',
      'Brand',
      'Category',
      'Subclass',
      'Wholesale Dealer Price',
      'Retail MSRP',
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
      i.isTopPriority ? 'TOP' : '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Wichita_Price_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                Price List &amp; Priority Control
              </span>
              <span className="text-xs text-slate-500 font-mono">Total SKUs: {uniqueItems.length}</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-pink-600" />
              <span>Complete Item Price List &amp; TOP Priority Configuration</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tag any phone or hardware item as <strong className="text-rose-600 font-bold">TOP</strong> in the price list. Top priority items automatically rank at the very top of customer ordering.
            </p>
          </div>

          <button
            onClick={exportPriceListCsv}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-emerald-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Price List CSV</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search price list by SKU or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none shadow-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="PHONES">Phones</option>
              <option value="BTS">Tablets &amp; Gateways</option>
              <option value="SIM CARD">SIM Cards</option>
            </select>

            <button
              onClick={() => setTopOnlyFilter(!topOnlyFilter)}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                topOnlyFilter
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Show TOP Items Only ({topCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Price List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">SKU / Item</th>
                <th className="py-3.5 px-4">Model Description</th>
                <th className="py-3.5 px-4">Brand</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Wholesale Dealer Cost</th>
                <th className="py-3.5 px-4 text-right">Retail MSRP</th>
                <th className="py-3.5 px-4 text-center">TOP Flag (Price List End Row)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredItems.map((item) => (
                <tr
                  key={item.item}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    item.isTopPriority ? 'bg-rose-50/40' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-bold text-slate-600">{item.item}</td>
                  <td className="py-3.5 px-4 font-sans font-bold text-slate-900 max-w-sm truncate">
                    {item.itmdesc}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-slate-600">{item.manufacturer}</td>
                  <td className="py-3.5 px-4 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                    ${item.wholesale.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-700">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => toggleTopPriority(item.item)}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 mx-auto shadow-xs ${
                        item.isTopPriority
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                      title="Click to toggle TOP flag in Price List"
                    >
                      <Flame className={`w-3.5 h-3.5 ${item.isTopPriority ? 'text-amber-300' : 'text-slate-400'}`} />
                      <span>{item.isTopPriority ? 'TOP' : 'Mark TOP'}</span>
                    </button>
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
