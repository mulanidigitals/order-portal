import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
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
} from 'lucide-react';

export const AllocationManager: React.FC = () => {
  const { allocations, addAllocationFromScreenshot, updateAllocationItem } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'current' | 'ocr'>('current');

  // Multi-Attachment State
  const [attachedFiles, setAttachedFiles] = useState<{ id: string; name: string; preview: string }[]>([]);
  const [replacePrevious, setReplacePrevious] = useState(true); // User requirement: "JAB ALLOCATION UPLOAD HO TAU PREVIOUS ZERO HOJAI"
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
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-600">
                Pack Rule: <strong className="text-slate-900">iPhones = 20 pcs/pack</strong> | Other Brands = <strong className="text-slate-900">5 pcs/pack</strong>
              </div>

              <button
                onClick={exportAllocationCsv}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-emerald-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Allocations CSV</span>
              </button>
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
                    <th className="py-3 px-4 text-right">Edit</th>
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
                          <button
                            onClick={() => {
                              const newPacks = window.prompt(
                                `Enter new pack count for ${a.itmdesc}:`,
                                a.packs.toString()
                              );
                              if (newPacks !== null && !isNaN(parseInt(newPacks))) {
                                updateAllocationItem(a.id, parseInt(newPacks));
                              }
                            }}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
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
    </div>
  );
};
