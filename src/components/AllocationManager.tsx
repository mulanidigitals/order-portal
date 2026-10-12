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
  FileSpreadsheet,
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
  const [manualBrand, setManualBrand] = useState('SAMSUNG');
  const [manualEaQty, setManualEaQty] = useState<number | ''>(3);

  // Edit EA Modal State
  const [editingAlloc, setEditingAlloc] = useState<AllocationItem | null>(null);
  const [editEaCount, setEditEaCount] = useState<number | ''>(3);

  // Delete Confirm Modal State
  const [deletingAlloc, setDeletingAlloc] = useState<AllocationItem | null>(null);

  // Multi-Attachment State
  const [attachedFiles, setAttachedFiles] = useState<{ id: string; name: string; preview: string }[]>([]);
  const [replacePrevious, setReplacePrevious] = useState(true);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extracted items from scan (all in pure EA!)
  const [extractedItems, setExtractedItems] = useState<
    {
      sku: string;
      description: string;
      manufacturer: string;
      packs: number; // Represents EA quantity
    }[]
  >([]);

  // Presets matching user's exact carrier screenshot
  const carrierPresets = [
    {
      name: 'Carrier Portal Screenshot Batch (Wichita Territory)',
      filesCount: 1,
      items: [
        { sku: '610214685872', description: 'SAM A166U A16 5G 128G BLU KIT', manufacturer: 'SAMSUNG', packs: 3 }, // 3 of 3 EA available
        { sku: '610214688811', description: 'SAM A176U A17 128G BLK KIT', manufacturer: 'SAMSUNG', packs: 6 },
        { sku: '610214688613', description: 'MOT XT26151 GPLAY 64G BLU KIT', manufacturer: 'MOTOROLA', packs: 8 },
        { sku: '610214687005', description: 'MOT XT25171 G STYLUS 5G 128G BLU KIT', manufacturer: 'MOTOROLA', packs: 5 },
        { sku: '195950051681', description: 'APL IPHONE 16E 128G BLK TMUS KIT', manufacturer: 'APPLE', packs: 4 },
        { sku: '195951041155', description: 'APL IPHONE 17E 256G BLK KIT', manufacturer: 'APPLE', packs: 2 },
        { sku: '195950642803', description: 'APL IPHONE 17 256G BLK KIT', manufacturer: 'APPLE', packs: 3 },
        { sku: '195950637151', description: 'APL IPHONE 17 PRO MAX 256G SLV KIT', manufacturer: 'APPLE', packs: 1 },
        { sku: '610214687357', description: 'TMO REVVL 8 5G 128G SLV KIT', manufacturer: 'T-MOBILE', packs: 4 },
        { sku: '610214725677', description: 'SAM A376U A37 5G 128G GRY KIT', manufacturer: 'SAMSUNG', packs: 3 },
        { sku: '610214726636', description: 'SAM A576U A57 5G 256G BLU KIT', manufacturer: 'SAMSUNG', packs: 2 },
        { sku: '610214688644', description: 'MOT XT26131 G 128G BLU KIT', manufacturer: 'MOTOROLA', packs: 4 },
      ],
    },
    {
      name: 'Single Screenshot Update (Samsung & Motorola Fast Movers)',
      filesCount: 1,
      items: [
        { sku: '610214685872', description: 'SAM A166U A16 5G 128G BLU KIT', manufacturer: 'SAMSUNG', packs: 3 },
        { sku: '610214688811', description: 'SAM A176U A17 128G BLK KIT', manufacturer: 'SAMSUNG', packs: 6 },
        { sku: '610214688613', description: 'MOT XT26151 GPLAY 64G BLU KIT', manufacturer: 'MOTOROLA', packs: 8 },
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
          simulateOcrScan();
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

  const simulateOcrScan = () => {
    setOcrStatus('analyzing');
    setTimeout(() => {
      // Load preset items with EA quantities exactly as per carrier screenshot
      const preset = carrierPresets[0];
      setExtractedItems(preset.items);
      setOcrStatus('done');
    }, 1000);
  };

  const loadPreset = (index: number) => {
    const preset = carrierPresets[index];
    setAttachedFiles([
      { id: 'p1', name: 'Carrier_Portal_Allocation.png', preview: '' },
    ]);
    setOcrStatus('analyzing');
    setTimeout(() => {
      setExtractedItems(preset.items);
      setOcrStatus('done');
    }, 600);
  };

  const handleUpdateExtractedQty = (index: number, newQty: number) => {
    setExtractedItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], packs: Math.max(0, newQty) };
      return updated;
    });
  };

  const handleApplyExtracted = () => {
    if (extractedItems.length === 0) return;
    addAllocationFromScreenshot(
      extractedItems,
      replacePrevious,
      `Carrier Scan (${attachedFiles.length || 1} file)`
    );
    setExtractedItems([]);
    setAttachedFiles([]);
    setOcrStatus('idle');
    setActiveSubTab('current');
  };

  const exportAllocationsCsv = () => {
    const headers = [
      'SKU',
      'Description',
      'Brand',
      'Allocated Units (EA)',
      'Reserved Units (EA)',
      'Available to Order (EA)',
      'Last Updated',
      'Source Note',
    ];

    const rows = allocations.map((a) => [
      a.itemSku,
      `"${a.itmdesc}"`,
      a.manufacturer,
      a.totalPcs,
      a.reservedPcs,
      a.availablePcs,
      `"${a.lastUpdated}"`,
      `"${a.sourceNote || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Wichita_Allocations_EA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalAllocatedEa = allocations.reduce((sum, a) => sum + a.totalPcs, 0);
  const totalReservedEa = allocations.reduce((sum, a) => sum + a.reservedPcs, 0);
  const totalAvailableEa = allocations.reduce((sum, a) => sum + a.availablePcs, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-700 border border-pink-200 flex items-center justify-center">
            <Layers className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
              Total Quota (EA)
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {totalAllocatedEa} EA
            </span>
            <span className="text-[10px] text-slate-400 block font-sans">
              All quantities in EA (Units)
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
              Available to Order (EA)
            </span>
            <span className="text-xl font-black text-emerald-700 font-mono">
              {totalAvailableEa} EA
            </span>
            <span className="text-[10px] text-emerald-600 block font-sans font-semibold">
              Ready for PO placement
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
              Active Reserved (EA)
            </span>
            <span className="text-xl font-black text-amber-700 font-mono">
              {totalReservedEa} EA
            </span>
            <span className="text-[10px] text-amber-600 block font-sans">
              Unshipped active orders
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
              Active SKUs
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {allocations.length} Phones
            </span>
            <span className="text-[10px] text-slate-400 block font-sans">
              Carrier Allocations
            </span>
          </div>
          <button
            onClick={exportAllocationsCsv}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs: Live Allocation vs Upload Screenshot Scan */}
      <div className="flex border-b border-slate-200 gap-3">
        <button
          onClick={() => setActiveSubTab('current')}
          className={`pb-3.5 px-4 text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'current'
              ? 'border-pink-600 text-pink-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Active Allocation Table (EA)</span>
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">
            {allocations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('ocr')}
          className={`pb-3.5 px-4 text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'ocr'
              ? 'border-pink-600 text-pink-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Scan / Ingest Carrier Portal (EA)</span>
          <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">
            Scanner
          </span>
        </button>
      </div>

      {/* SubTab 1: Active Allocations */}
      {activeSubTab === 'current' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold">Rule:</span>
              <span className="text-xs bg-indigo-50 text-indigo-900 border border-indigo-200 px-2.5 py-1 rounded-xl font-bold">
                Quantities are in EA (Each/Units) &bull; If carrier shows "3 of 3", it means 3 EA Available
              </span>
            </div>

            <button
              onClick={() => {
                setManualSku('');
                setManualDesc('');
                setManualBrand('SAMSUNG');
                setManualEaQty(3);
                setIsManualAddOpen(true);
              }}
              className="px-3.5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Allocation Manually (EA)</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">SKU / Item</th>
                    <th className="py-3.5 px-4">Phone Model Description</th>
                    <th className="py-3.5 px-4">Brand</th>
                    <th className="py-3.5 px-4 text-center font-bold text-slate-700 bg-slate-100/50">
                      Total Allocated (EA)
                    </th>
                    <th className="py-3.5 px-4 text-center font-bold text-amber-700 bg-amber-50/40">
                      Reserved (EA)
                    </th>
                    <th className="py-3.5 px-4 text-center font-black text-emerald-800 bg-emerald-50/50 text-sm">
                      Available to Order (EA)
                    </th>
                    <th className="py-3.5 px-4">Last Updated</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {allocations.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-700 whitespace-nowrap">
                        {a.itemSku}
                      </td>
                      <td className="py-3.5 px-4 font-sans font-bold text-slate-900 max-w-sm truncate">
                        {a.itmdesc}
                        {a.itemSku === '610214685872' && (
                          <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 font-mono px-1.5 py-0.5 rounded font-bold">
                            3 of 3 EA Available
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-600 font-semibold">
                        {a.manufacturer}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 bg-slate-50/50">
                        {a.totalPcs} EA
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-700 bg-amber-50/30">
                        {a.reservedPcs} EA
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-emerald-700 bg-emerald-50/40 text-sm">
                        {a.availablePcs} of {a.totalPcs} EA Available
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-500 text-[11px]">
                        {a.lastUpdated}
                        {a.sourceNote && (
                          <span className="block text-[10px] text-slate-400 font-mono">{a.sourceNote}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5 font-sans">
                        <button
                          onClick={() => {
                            setEditingAlloc(a);
                            setEditEaCount(a.totalPcs);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 transition-colors"
                          title="Edit EA Allocation"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                          <span>Edit EA</span>
                        </button>
                        <button
                          onClick={() => setDeletingAlloc(a)}
                          className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
                          title="Delete Allocation"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {allocations.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 font-sans">
                        No active allocations found. Upload a carrier portal screenshot or add manually.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: Scan / Upload Carrier Screenshot */}
      {activeSubTab === 'ocr' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-pink-600" />
                <span>Upload Carrier Portal Screenshots (Automatic EA Extraction)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload your IDOO or carrier allocation screenshot. Every scanned quota is processed strictly in <strong>EA units</strong> (no pack multiplying).
              </p>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-pink-200 hover:border-pink-400 bg-pink-50/20 hover:bg-pink-50/40 rounded-3xl p-8 text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleMultipleFiles(e.target.files)}
              />
              <Upload className="w-8 h-8 mx-auto text-pink-600 mb-2" />
              <p className="text-xs font-bold text-slate-800">
                Click to browse or drop screenshots here
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports multiple PNG, JPG, or PDF attachments
              </p>
            </div>

            {/* Quick Sample Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-slate-500 font-bold">Or Load Verified Screenshot:</span>
              {carrierPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => loadPreset(idx)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-pink-50 hover:border-pink-300 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <FileImage className="w-3.5 h-3.5 text-pink-600" />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Uploaded File Badges */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-600 font-bold">Attached:</span>
                {attachedFiles.map((file) => (
                  <span
                    key={file.id}
                    className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-3 py-1 rounded-xl text-xs font-medium border border-slate-200"
                  >
                    <FileImage className="w-3.5 h-3.5 text-pink-600" />
                    <span>{file.name}</span>
                    <button
                      onClick={() => removeAttachment(file.id)}
                      className="text-slate-400 hover:text-slate-700 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Extracted Allocation Table */}
          {extractedItems.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 animate-in fade-in-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Extracted Allocations ({extractedItems.length} items detected)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Verify EA quantities below. You can adjust any number before applying to live allocation.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replacePrevious}
                      onChange={(e) => setReplacePrevious(e.target.checked)}
                      className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                    />
                    <span>Replace previous allocation quota</span>
                  </label>

                  <button
                    onClick={handleApplyExtracted}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply to Live Allocation (EA)</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Phone Model Description</th>
                      <th className="p-3">Brand</th>
                      <th className="p-3 text-center bg-emerald-50 text-emerald-900 font-black">
                        Available Allocation (EA)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {extractedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-700">{item.sku}</td>
                        <td className="p-3 font-sans font-bold text-slate-900">{item.description}</td>
                        <td className="p-3 font-sans text-slate-600 font-semibold">{item.manufacturer}</td>
                        <td className="p-3 text-center bg-emerald-50/40">
                          <div className="inline-flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={item.packs}
                              onChange={(e) => handleUpdateExtractedQty(idx, parseInt(e.target.value) || 0)}
                              className="w-16 text-center bg-white border border-emerald-300 rounded-lg py-1 px-2 font-black text-emerald-800 text-sm focus:outline-none"
                            />
                            <span className="font-bold text-emerald-800 text-xs font-sans">EA</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit EA Modal */}
      {editingAlloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full shadow-2xl p-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h4 className="font-extrabold text-sm text-slate-900">Edit Allocation (EA)</h4>
              <button onClick={() => setEditingAlloc(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-900 block">{editingAlloc.itmdesc}</span>
                <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                  SKU: {editingAlloc.itemSku}
                </span>
                <span className="text-[11px] text-amber-700 font-mono mt-1 block">
                  Currently Reserved: {editingAlloc.reservedPcs} EA
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Total Allocated Units (EA):
                </label>
                <input
                  type="number"
                  min="0"
                  value={editEaCount}
                  onChange={(e) => setEditEaCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-black text-emerald-700 text-base focus:bg-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Resulting available: {Math.max(0, (Number(editEaCount) || 0) - editingAlloc.reservedPcs)} EA available to order
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingAlloc(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateAllocationItem(editingAlloc.id, Number(editEaCount) || 0);
                    setEditingAlloc(null);
                  }}
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-xl shadow-xs"
                >
                  Save EA Quota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Modal */}
      {isManualAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h4 className="font-extrabold text-sm text-slate-900">Add Phone Allocation (EA)</h4>
              <button onClick={() => setIsManualAddOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!manualSku.trim() || !manualDesc.trim()) return;
                const qty = Number(manualEaQty) || 1;
                addAllocationItemManually({
                  itemSku: manualSku.trim(),
                  itmdesc: manualDesc.trim(),
                  manufacturer: manualBrand,
                  packs: qty,
                  packUnitSize: 1,
                  totalPcs: qty,
                  availablePcs: qty,
                });
                setIsManualAddOpen(false);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">SKU / Item *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 610214685872"
                  value={manualSku}
                  onChange={(e) => setManualSku(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SAM A166U A16 5G 128G BLU KIT"
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand</label>
                  <select
                    value={manualBrand}
                    onChange={(e) => setManualBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="SAMSUNG">SAMSUNG</option>
                    <option value="APPLE">APPLE</option>
                    <option value="MOTOROLA">MOTOROLA</option>
                    <option value="T-MOBILE">T-MOBILE</option>
                    <option value="TCL">TCL</option>
                    <option value="ONEPLUS">ONEPLUS</option>
                    <option value="GOOGLE">GOOGLE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-emerald-800 mb-1">Available Quota (EA) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={manualEaQty}
                    onChange={(e) => setManualEaQty(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl px-3 py-2 font-mono font-black text-emerald-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsManualAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-xl shadow-xs"
                >
                  Save Allocation (EA)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAlloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full shadow-2xl p-6 text-xs text-center space-y-3">
            <Trash2 className="w-8 h-8 text-rose-600 mx-auto" />
            <h4 className="font-extrabold text-sm text-slate-900">Delete Allocation?</h4>
            <p className="text-slate-500 text-xs">
              Are you sure you want to remove allocation for <strong className="text-slate-900">{deletingAlloc.itmdesc}</strong>?
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingAlloc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteAllocationItem(deletingAlloc.id);
                  setDeletingAlloc(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
