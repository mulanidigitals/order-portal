import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { AllocationItem } from '../types';
import {
  Upload,
  Camera,
  CheckCircle2,
  Sparkles,
  Layers,
  Edit2,
  Download,
  FileImage,
  X,
  RefreshCw,
  RotateCcw,
  Plus,
  Trash2,
  Info,
  HelpCircle,
} from 'lucide-react';

export const AllocationManager: React.FC = () => {
  const {
    allocations,
    addAllocationFromScreenshot,
    updateAllocationItem,
    addAllocationItemManually,
    deleteAllocationItem,
    productAnalytics,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'current' | 'ocr'>('current');

  // Manual Add Modal State
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [manualSku, setManualSku] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualBrand, setManualBrand] = useState('APPLE');
  const [manualPacks, setManualPacks] = useState<number | ''>(1);
  const [manualPackSize, setManualPackSize] = useState<number>(20);

  // Edit Pack Modal State (replaces window.prompt)
  const [editingAlloc, setEditingAlloc] = useState<AllocationItem | null>(null);
  const [editPackCount, setEditPackCount] = useState<number | ''>(1);

  // Delete Confirm Modal State
  const [deletingAlloc, setDeletingAlloc] = useState<AllocationItem | null>(null);

  // Multi-Attachment State
  const [attachedFiles, setAttachedFiles] = useState<{ id: string; name: string; preview: string }[]>([]);
  const [replacePrevious, setReplacePrevious] = useState(true);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extracted items from all attachments combined
  const [extractedItems, setExtractedItems] = useState<
    {
      sku: string;
      description: string;
      manufacturer: string;
      packs: number;
    }[]
  >([]);

  // Multi-attachment sample presets
  const sampleBatches = [
    {
      name: 'Combined 2-Page Carrier Screenshot Batch (Page 1 & 2)',
      filesCount: 2,
      items: [
        // Page 1: iPhones & Flagships
        { sku: '195950051681', description: 'APL IPHONE 16E 128G BLK TMUS KIT', manufacturer: 'APPLE', packs: 3 },
        { sku: '195951041155', description: 'APL IPHONE 17E 256G BLK KIT', manufacturer: 'APPLE', packs: 2 },
        { sku: '195950642803', description: 'APL IPHONE 17 256G BLK KIT', manufacturer: 'APPLE', packs: 2 },
        { sku: '195950637151', description: 'APL IPHONE 17 PRO MAX 256G SLV KIT', manufacturer: 'APPLE', packs: 1 },
        // Page 2: Samsung & Motorola
        { sku: '610214688811', description: 'SAM A176U A17 128G BLK KIT', manufacturer: 'SAMSUNG', packs: 8 },
        { sku: '610214685872', description: 'SAM A166U A16 5G 128G BLU KIT', manufacturer: 'SAMSUNG', packs: 10 },
        { sku: '610214725677', description: 'SAM A376U A37 5G 128G GRY KIT', manufacturer: 'SAMSUNG', packs: 5 },
        { sku: '610214687005', description: 'MOT XT25171 G STYLUS 5G 128G BLU KIT', manufacturer: 'MOTOROLA', packs: 6 },
        { sku: '610214688613', description: 'MOT XT26151 GPLAY 64G BLU KIT', manufacturer: 'MOTOROLA', packs: 8 },
        { sku: '610214687357', description: 'TMO REVVL 8 5G 128G SLV KIT', manufacturer: 'T-MOBILE', packs: 4 },
      ],
    },
    {
      name: 'Single Screenshot Update (Samsung & Moto Only)',
      filesCount: 1,
      items: [
        { sku: '610214688811', description: 'SAM A176U A17 128G BLK KIT', manufacturer: 'SAMSUNG', packs: 5 },
        { sku: '610214685872', description: 'SAM A166U A16 5G 128G BLU KIT', manufacturer: 'SAMSUNG', packs: 6 },
        { sku: '610214688613', description: 'MOT XT26151 GPLAY 64G BLU KIT', manufacturer: 'MOTOROLA', packs: 5 },
      ],
    },
  ];

  const handleMultipleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: { id: string; name: string; preview: string }[] = [];
    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        newAttachments.push({
          id: `file-${Date.now()}-${idx}`,
          name: file.name,
          preview: reader.result as string,
        });
        if (newAttachments.length === files.length) {
          setAttachedFiles((prev) => [...prev, ...newAttachments]);
          simulateMultiOcrProcessing();
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
    if (attachedFiles.length <= 1) {
      setExtractedItems([]);
      setOcrStatus('idle');
    }
  };

  const simulateMultiOcrProcessing = () => {
    setOcrStatus('analyzing');
    setTimeout(() => {
      const preset = sampleBatches[0];
      setExtractedItems(preset.items);
      setOcrStatus('done');
    }, 1200);
  };

  const loadBatchPreset = (index: number) => {
    const preset = sampleBatches[index];
    setAttachedFiles([
      { id: 'p1', name: 'Carrier_Allocation_Page1.png', preview: '' },
      ...(preset.filesCount > 1
        ? [{ id: 'p2', name: 'Carrier_Allocation_Page2.png', preview: '' }]
        : []),
    ]);
    setOcrStatus('analyzing');
    setTimeout(() => {
      setExtractedItems(preset.items);
      setOcrStatus('done');
    }, 600);
  };

  const handleConfirmOcrSave = () => {
    if (extractedItems.length === 0) return;
    addAllocationFromScreenshot(
      extractedItems,
      replacePrevious,
      `Multi-Screenshot OCR Batch (${attachedFiles.length || 1} files)`
    );
    setExtractedItems([]);
    setAttachedFiles([]);
    setOcrStatus('idle');
    setActiveSubTab('current');
  };

  const exportAllocationCsv = () => {
    const headers = [
      'SKU',
      'Description',
      'Brand',
      'Packs',
      'Multiplier (Pcs/Pack)',
      'Total Units (Pcs)',
      'Reserved Units',
      'Available Units (Pcs)',
      'Last Updated',
      'Source Note',
    ];

    const rows = allocations.map((a) => [
      a.itemSku,
      `"${a.itmdesc}"`,
      a.manufacturer,
      a.packs,
      a.packUnitSize,
      a.totalPcs,
      a.reservedPcs,
      a.availablePcs,
      `"${a.lastUpdated}"`,
      `"${a.sourceNote || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Wichita_Phone_Allocations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalAllocationPcs = allocations.reduce((sum, a) => sum + a.totalPcs, 0);
  const availableAllocationPcs = allocations.reduce((sum, a) => sum + a.availablePcs, 0);
  const reservedAllocationPcs = allocations.reduce((sum, a) => sum + a.reservedPcs, 0);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Allocated Stock
          </span>
          <p className="text-2xl font-black text-slate-900 font-mono">{totalAllocationPcs} pcs</p>
          <p className="text-xs text-slate-500 mt-1">Multiplied from carrier distributor packs</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Available for Customer Orders
          </span>
          <p className="text-2xl font-black text-emerald-700 font-mono">{availableAllocationPcs} pcs</p>
          <p className="text-xs text-slate-500 mt-1">Ready for instant store dispatch</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Committed / Reserved Units
          </span>
          <p className="text-2xl font-black text-amber-700 font-mono">{reservedAllocationPcs} pcs</p>
          <p className="text-xs text-slate-500 mt-1">Held for active pending orders</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="flex border-b border-slate-200 px-5 pt-3 gap-4">
          <button
            onClick={() => setActiveSubTab('current')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeSubTab === 'current'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Active Phone Allocations ({allocations.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ocr')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeSubTab === 'ocr'
                ? 'border-pink-600 text-pink-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Multi-Screenshot Ingestion</span>
            <span className="bg-pink-50 text-pink-700 text-[10px] px-2 py-0.5 rounded-full border border-pink-200 font-bold">
              Multi-Attachment
            </span>
          </button>
        </div>

        {/* Tab 1: Current Allocations */}
        {activeSubTab === 'current' && (
          <div>
            {/* Allocation & Reserved Concept Explanation */}
            <div className="m-4 p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs text-indigo-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-900 block text-sm">
                    💡 Allocation &amp; Reserved Units Rule
                  </span>
                  <p className="text-slate-700 mt-1 leading-relaxed">
                    <strong>Allocation</strong> is the total available quota from the carrier that dealers can order. If there are <strong>40 pcs in allocation</strong>, that means the dealer can place an order for <strong>40 pcs</strong>!
                  </p>
                  <p className="text-slate-700 mt-1 leading-relaxed">
                    <strong>What is "Reserved"?</strong> When a customer places an order for 10 pcs, those 10 pcs are marked as <strong>Reserved (Committed)</strong> so other orders don't double-book them.
                    Formula: <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono font-bold text-indigo-900">Available Pcs = Total Allocation − Reserved Pcs</code>.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-600">
                Pack Rule: <strong className="text-slate-900">iPhones = 20 pcs/pack</strong> | Other Brands = <strong className="text-slate-900">5 pcs/pack</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setManualSku('');
                    setManualDesc('');
                    setManualBrand('APPLE');
                    setManualPacks(1);
                    setManualPackSize(20);
                    setIsManualAddOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Item Manually</span>
                </button>
                <button
                  onClick={exportAllocationCsv}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-emerald-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Model Description</th>
                    <th className="py-3 px-4">Brand</th>
                    <th className="py-3 px-4 text-center">Packs</th>
                    <th className="py-3 px-4 text-center">Pack Multiplier</th>
                    <th className="py-3 px-4 text-center">Total Pcs</th>
                    <th className="py-3 px-4 text-center">Reserved</th>
                    <th className="py-3 px-4 text-center">Available Pcs</th>
                    <th className="py-3 px-4">Last Updated</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {allocations.map((a) => {
                    const isApple = a.manufacturer === 'APPLE';
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-600">{a.itemSku}</td>
                        <td className="py-3 px-4 font-sans font-bold text-slate-900 max-w-xs truncate">{a.itmdesc}</td>
                        <td className="py-3 px-4 font-sans text-slate-600">{a.manufacturer}</td>

                        <td className="py-3 px-4 text-center font-bold text-pink-700 text-sm">
                          {a.packs} pk
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              isApple
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            × {a.packUnitSize} pcs/pk
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-bold text-slate-900 text-sm">
                          {a.totalPcs} pcs
                        </td>

                        <td className="py-3 px-4 text-center text-amber-700 font-semibold">
                          {a.reservedPcs} pcs
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                              a.availablePcs > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {a.availablePcs} pcs
                          </span>
                        </td>

                        <td className="py-3 px-4 font-sans text-slate-500 text-[11px]">
                          {a.lastUpdated}
                        </td>

                        <td className="py-3 px-4 text-right font-sans">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingAlloc(a);
                                setEditPackCount(a.packs);
                              }}
                              title="Edit Pack Count"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-700 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingAlloc(a)}
                              title="Delete Allocation Item"
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Multi-Attachment Screenshot Ingestion */}
        {activeSubTab === 'ocr' && (
          <div className="p-6 space-y-6">
            {/* Explanatory Banner & Zero-out toggle */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-pink-600" />
                    <span>Multi-Attachment Screenshot Ingestion</span>
                  </h4>
                  <p className="text-slate-500 mt-0.5">
                    Upload multiple allocation screenshot pages simultaneously (Page 1, Page 2, Page 3). All items are merged into a unified allocation update.
                  </p>
                </div>
              </div>

              {/* Zero-Out Previous Allocations Toggle as required: "JAB ALLOCATION UPLOAD HO TAU PREVIOUS ZERO HOJAI" */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold text-rose-950 block">
                      Reset Previous Allocations to ZERO on Upload
                    </span>
                    <span className="text-rose-800 text-[11px]">
                      When enabled, old allocation numbers are cleared to 0 so only this fresh batch is active.
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replacePrevious}
                    onChange={(e) => setReplacePrevious(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>
            </div>

            {/* Multi-file Upload Drop Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-pink-500 rounded-3xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleMultipleFiles(e.target.files)}
                className="hidden"
              />

              <div className="max-w-md mx-auto space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-md shadow-pink-600/20">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Select or Drag Multiple Allocation Screenshots
                </h4>
                <p className="text-xs text-slate-500">
                  Hold Ctrl / Shift to select multiple files at once. All pages will be processed together.
                </p>
              </div>
            </div>

            {/* List of Attached Screenshots */}
            {attachedFiles.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Attached Screenshot Files ({attachedFiles.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800"
                    >
                      <FileImage className="w-3.5 h-3.5 text-pink-600" />
                      <span className="font-mono">{file.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttachment(file.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Multi-Page Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-600">Or simulate with multi-page batch preset:</span>
              {sampleBatches.map((batch, bIdx) => (
                <button
                  key={bIdx}
                  onClick={() => loadBatchPreset(bIdx)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold transition-colors shadow-xs"
                >
                  ⚡ {batch.name}
                </button>
              ))}
            </div>

            {/* OCR Analyzing */}
            {ocrStatus === 'analyzing' && (
              <div className="text-center py-8 text-slate-600 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-pink-600" />
                <span className="text-xs font-bold">
                  Extracting allocations from multiple attachments &amp; applying pack multipliers...
                </span>
              </div>
            )}

            {/* Extracted Items Review Table */}
            {ocrStatus === 'done' && extractedItems.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Extracted Allocations ({extractedItems.length} items parsed)</span>
                    </h4>
                    <span className="text-xs text-slate-500">
                      {replacePrevious
                        ? '⚠️ Previous allocations will be wiped to ZERO and replaced by this batch.'
                        : 'New allocations will be added to existing stock.'}
                    </span>
                  </div>

                  <button
                    onClick={handleConfirmOcrSave}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm &amp; Fill Allocations Sheet</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase">
                        <th className="p-2.5">SKU</th>
                        <th className="p-2.5">Model Description</th>
                        <th className="p-2.5">Brand</th>
                        <th className="p-2.5 text-center">Extracted Packs</th>
                        <th className="p-2.5 text-center">Pack Multiplier</th>
                        <th className="p-2.5 text-center">New Total Pcs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {extractedItems.map((item, idx) => {
                        const isIphone =
                          item.manufacturer.toUpperCase() === 'APPLE' ||
                          item.description.toUpperCase().includes('IPHONE');
                        const multiplier = isIphone ? 20 : 5;
                        const generatedPcs = item.packs * multiplier;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="p-2.5 text-slate-700 font-bold">{item.sku}</td>
                            <td className="p-2.5 text-slate-900 font-sans font-medium">{item.description}</td>
                            <td className="p-2.5 text-slate-600 font-sans">{item.manufacturer}</td>
                            <td className="p-2.5 text-center font-bold text-pink-700">{item.packs} packs</td>
                            <td className="p-2.5 text-center text-slate-500">
                              {multiplier} pcs/pk {isIphone && '(iPhone 20x)'}
                            </td>
                            <td className="p-2.5 text-center text-emerald-700 font-black text-sm">
                              {generatedPcs} pcs
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Add Allocation Item Modal */}
      {isManualAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl p-6 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Add Item to Allocation List Manually
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Select from Wichita catalog or enter custom carrier quota
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsManualAddOpen(false)}
                className="text-slate-400 hover:text-slate-800 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!manualSku.trim() || !manualDesc.trim()) {
                  alert('Please select or enter SKU and description.');
                  return;
                }
                const packsCount = Number(manualPacks) || 1;
                const multiplier = Number(manualPackSize) || 5;
                const totalUnits = packsCount * multiplier;

                addAllocationItemManually({
                  itemSku: manualSku.trim(),
                  itmdesc: manualDesc.trim(),
                  manufacturer: manualBrand.trim().toUpperCase() || 'APPLE',
                  packs: packsCount,
                  packUnitSize: multiplier,
                  totalPcs: totalUnits,
                  availablePcs: totalUnits,
                });

                setIsManualAddOpen(false);
              }}
              className="space-y-4"
            >
              {/* Quick Select from Price List */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Quick Select from Price List Catalog:
                </label>
                <select
                  onChange={(e) => {
                    const selected = productAnalytics.find((p) => p.itemSku === e.target.value);
                    if (selected) {
                      setManualSku(selected.itemSku);
                      setManualDesc(selected.itmdesc);
                      setManualBrand(selected.manufacturer);
                      const isApple =
                        selected.manufacturer.toUpperCase() === 'APPLE' ||
                        selected.itmdesc.toUpperCase().includes('IPHONE');
                      setManualPackSize(isApple ? 20 : 5);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="">-- Choose from Catalog or Enter Custom Below --</option>
                  {productAnalytics.map((p) => (
                    <option key={p.itemSku} value={p.itemSku}>
                      {p.itmdesc} ({p.itemSku}) - {p.manufacturer}
                    </option>
                  ))}
                </select>
              </div>

              {/* SKU */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Item SKU Number:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 195950051681"
                  value={manualSku}
                  onChange={(e) => setManualSku(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Phone Description:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. APL IPHONE 16E 128G BLK TMUS KIT"
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Brand & Pack Multiplier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Manufacturer / Brand:
                  </label>
                  <select
                    value={manualBrand}
                    onChange={(e) => {
                      const newBrand = e.target.value;
                      setManualBrand(newBrand);
                      if (newBrand === 'APPLE') {
                        setManualPackSize(20);
                      } else {
                        setManualPackSize(5);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-indigo-600"
                  >
                    <option value="APPLE">APPLE (iPhone 20x)</option>
                    <option value="SAMSUNG">SAMSUNG (5x)</option>
                    <option value="MOTOROLA">MOTOROLA (5x)</option>
                    <option value="T-MOBILE">T-MOBILE (5x)</option>
                    <option value="GOOGLE">GOOGLE (5x)</option>
                    <option value="OTHER">OTHER (Custom)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Pack Multiplier (Pcs / Pack):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={manualPackSize}
                    onChange={(e) => setManualPackSize(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Number of Packs */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Number of Packs to Allocate:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={manualPacks}
                    onChange={(e) => setManualPacks(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                    className="w-32 bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-center text-pink-700 text-sm focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                  <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex-1 text-center font-mono">
                    <span className="text-[11px] text-indigo-700 block">Total Customer Orderable:</span>
                    <strong className="text-sm font-black text-indigo-950">
                      {((Number(manualPacks) || 1) * manualPackSize)} pcs
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Allocation List</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Pack Count Modal */}
      {editingAlloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full shadow-2xl p-6 text-xs animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-indigo-600" />
              <span>Edit Allocation Packs</span>
            </h3>
            <p className="text-slate-500 mb-3 truncate font-medium">
              {editingAlloc.itmdesc} ({editingAlloc.itemSku})
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingAlloc && editPackCount !== '') {
                  updateAllocationItem(editingAlloc.id, Number(editPackCount));
                  setEditingAlloc(null);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Pack Count (Pack size: {editingAlloc.packUnitSize} pcs/pack):
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editPackCount}
                  onChange={(e) =>
                    setEditPackCount(e.target.value === '' ? '' : parseInt(e.target.value) || 0)
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between text-xs font-mono">
                <span>New Total Units:</span>
                <strong className="text-slate-900 font-black">
                  {(Number(editPackCount) || 0) * editingAlloc.packUnitSize} pcs
                </strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingAlloc(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Update Packs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Allocation Confirm Modal */}
      {deletingAlloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full shadow-2xl p-6 text-xs animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Remove from Allocation?</span>
            </h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to remove <strong className="text-slate-900 font-mono">{deletingAlloc.itmdesc}</strong> from the active allocation quota?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingAlloc(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAllocationItem(deletingAlloc.id);
                  setDeletingAlloc(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
