import React, { useState } from 'react';
import { useApp, DEFAULT_SHEET_WEBHOOK_URL } from '../context/AppContext';
import {
  FileSpreadsheet,
  Download,
  Copy,
  CheckCircle2,
  ExternalLink,
  Save,
  Code,
  ShieldCheck,
  Rocket,
  Globe,
  Terminal,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    inventory,
    allocations,
    orders,
    idooBacklog,
    ledger,
    sheetSyncState,
    updateSheetWebhookUrl,
    toggleAutoSync,
    triggerManualSheetSync,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'sync' | 'deploy'>('sync');
  const [webhookInput, setWebhookInput] = useState(sheetSyncState.webhookUrl || DEFAULT_SHEET_WEBHOOK_URL);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isTestingSync, setIsTestingSync] = useState(false);

  if (!isOpen) return null;

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    updateSheetWebhookUrl(webhookInput.trim());
    setSyncStatus('Google Sheet Webhook URL saved successfully! Live Auto-Sync is active.');
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handleTestSync = async () => {
    setIsTestingSync(true);
    const success = await triggerManualSheetSync();
    setIsTestingSync(false);
    if (success) {
      setSyncStatus('Test signal sent successfully to Google Sheet!');
    } else {
      setSyncStatus('Please configure and save a valid Google Sheet Webhook URL first.');
    }
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportInventory = () => {
    const headers = ['Store Code', 'Store Name', 'Market', 'SKU', 'Description', 'Category', 'Manufacturer', 'Stock Qty', 'Retail Price', 'Wholesale Cost'];
    const rows = inventory.map((i) => [
      i.custno,
      `"${i.company}"`,
      i.marketid,
      i.item,
      `"${i.itmdesc}"`,
      i.category,
      i.manufacturer,
      i.qty,
      i.price,
      i.wholesale,
    ]);
    downloadCsv('Wichita_Inventory_Sheet', headers, rows);
  };

  const exportAllocations = () => {
    const headers = ['SKU', 'Description', 'Brand', 'Allocated Units (EA)', 'Reserved Units (EA)', 'Available Units (EA)', 'Last Updated', 'Source'];
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
    downloadCsv('Wichita_Allocations_Sheet', headers, rows);
  };

  const exportOrders = () => {
    const headers = ['Order Number', 'Store Code', 'Store Name', 'Total Units (Pcs)', 'Wholesale Total', 'Status', 'IDOO Confirmation #', 'IDOO Billed Amount', 'Created Date'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.storeId || 'WICHITA',
      `"${o.storeName || 'Wichita Territory'}"`,
      o.totalPcs,
      o.totalWholesaleValue,
      o.status,
      o.idooOrderNumber || '',
      o.idooInvoiceAmount || 0,
      `"${o.createdAt}"`,
    ]);
    downloadCsv('Wichita_Orders_Sheet', headers, rows);
  };

  const exportBacklog = () => {
    const headers = ['Order Number', 'Store Code', 'Store Name', 'SKU', 'Description', 'Needed Pcs', 'Unit Cost', 'Total Cost', 'Date Added', '2-Day Arrival SLA', 'Status', 'Carrier Ref'];
    const rows = idooBacklog.map((b) => [
      b.orderNumber,
      b.storeId,
      `"${b.storeName}"`,
      b.itemSku,
      `"${b.itmdesc}"`,
      b.neededQty,
      b.unitWholesaleCost,
      b.totalCost,
      b.addedAt,
      b.estimatedArrivalDate,
      b.status,
      b.carrierRefNo || '',
    ]);
    downloadCsv('Wichita_IDOO_Backlog_Sheet', headers, rows);
  };

  const exportLedger = () => {
    const headers = ['Date', 'Transaction Type', 'Reference No', 'Debit (Billed)', 'Credit (Paid)', 'Running Balance', 'Notes'];
    const rows = ledger.map((l) => [
      l.date,
      l.type,
      l.referenceNumber,
      l.debit,
      l.credit,
      l.runningBalance,
      `"${l.notes}"`,
    ]);
    downloadCsv('Wichita_Customer_Ledger_Sheet', headers, rows);
  };

  const appsScriptCode = `/**
 * Google Apps Script for Wichita Wireless Hub
 * Automatically appends and logs live orders into your Google Sheet!
 * 
 * Setup:
 * 1. In your Google Sheet, click Extensions > Apps Script
 * 2. Delete existing code and paste this entire script
 * 3. Click 'Deploy' > 'New deployment'
 * 4. Select type: 'Web app'
 * 5. Set 'Execute as': 'Me'
 * 6. Set 'Who has access': 'Anyone' (IMPORTANT)
 * 7. Click Deploy, copy the Web App URL, and paste it into the app settings below!
 */

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var payload = JSON.parse(contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Auto-handle Orders (Customer placed or Admin processed)
    if (payload.eventType === "CUSTOMER_ORDER_PLACED" || payload.eventType === "NEW_ORDER" || payload.eventType === "ORDER_PROCESSED" || payload.eventType === "ORDER_ACCEPTED" || payload.eventType === "ORDER_FINALIZED_EDIT") {
      var ordersSheet = ss.getSheetByName("Customer_Orders") || ss.insertSheet("Customer_Orders");
      if (ordersSheet.getLastRow() === 0) {
        ordersSheet.appendRow(["Timestamp", "Order Number", "Territory / Store", "Total Units (Pcs)", "Wholesale Value", "Status", "IDOO Number", "Billed Amount", "Items Details"]);
      }
      var ord = payload.data.order || payload.data;
      var itemsDesc = "";
      if (ord.items && ord.items.length > 0) {
        itemsDesc = ord.items.map(function(it) {
          return (it.itmdesc || it.itemSku) + " (" + (it.orderedQty || it.quantityOrdered || 0) + " pcs)";
        }).join("; ");
      } else if (payload.data.itemsSummary) {
        itemsDesc = payload.data.itemsSummary;
      }
      ordersSheet.appendRow([
        new Date(),
        ord.orderNumber || "",
        ord.storeName || ord.customerName || "Wichita, KS",
        ord.totalPcs || 0,
        ord.totalWholesaleValue || 0,
        ord.status || "Pending Review",
        ord.idooOrderNumber || "",
        ord.idooInvoiceAmount || ord.invoiceAmount || 0,
        itemsDesc
      ]);
    }

    // 2. Auto-handle Allocations Update
    if (payload.eventType === "ALLOCATION_UPDATED") {
      var allocSheet = ss.getSheetByName("Phone_Allocations") || ss.insertSheet("Phone_Allocations");
      allocSheet.clear();
      allocSheet.appendRow(["Last Updated", "SKU", "Phone Model", "Manufacturer", "Packs", "Available Units (Pcs)"]);
      if (payload.data.allocations && payload.data.allocations.length > 0) {
        payload.data.allocations.forEach(function(item) {
          allocSheet.appendRow([new Date(), item.itemSku, item.itmdesc, item.manufacturer, item.packs, item.availablePcs]);
        });
      }
    }

    // 3. Auto-handle General Log
    var logSheet = ss.getSheetByName("Sync_Logs") || ss.insertSheet("Sync_Logs");
    if (logSheet.getLastRow() === 0) {
      logSheet.appendRow(["Timestamp", "Event Type", "Territory", "Summary"]);
    }
    logSheet.appendRow([new Date(), payload.eventType, payload.territory || "Wichita", JSON.stringify(payload.data).substring(0, 500)]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success", receivedAt: new Date() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (e && e.parameter && e.parameter.action) || "";
    if (action === "getItems" || action === "getPricelist") {
      var sheet = ss.getSheetByName("Price_List") || ss.getSheetByName("Pricelist") || ss.getSheetByName("Items");
      if (sheet) {
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var rows = [];
        for (var i = 1; i < data.length; i++) {
          var rowObj = {};
          for (var j = 0; j < headers.length; j++) {
            rowObj[headers[j]] = data[i][j];
          }
          rows.push(rowObj);
        }
        return ContentService.createTextOutput(JSON.stringify({ status: "success", items: rows }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "online", app: "Wichita Wireless Hub Google Sheet Sync" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full shadow-2xl p-6 text-xs max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Google Sheets Auto-Sync &amp; Deployment Guide
              </h3>
              <p className="text-[11px] text-slate-500">
                100% automated background synchronization with Google Sheets &amp; free cloud hosting instructions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold"
          >
            ✕ Close
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 gap-2 mb-4">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Google Sheets Live Auto-Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('deploy')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'deploy'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Rocket className="w-4 h-4 text-indigo-600" />
            <span>Deploy to GitHub &amp; Free Cloud</span>
          </button>
        </div>

        {syncStatus && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{syncStatus}</span>
          </div>
        )}

        {/* TAB 1: GOOGLE SHEETS LIVE AUTO SYNC */}
        {activeTab === 'sync' && (
          <div className="space-y-6">
            {/* Live Auto-Sync Status Card */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse mt-1 shrink-0"></span>
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-950">
                    Live Background Auto-Sync Status: {sheetSyncState.autoSyncEnabled ? 'ACTIVE (Khus Auto-Sync Hoga)' : 'PAUSED'}
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Aapko bar bar press karne ki zaroorat nahi hai! Customer jab bhi order place karega, ya admin order approve/modify karega, ye background me Google Sheet ko khud auto-update kardega.
                  </p>
                  {sheetSyncState.lastSyncTime && (
                    <span className="text-[11px] text-emerald-700 font-mono block mt-1">
                      Last Live Signal: <strong>{sheetSyncState.lastSyncTime}</strong> · Synced Events: <strong>{sheetSyncState.totalSyncedItems}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={toggleAutoSync}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border ${
                    sheetSyncState.autoSyncEnabled
                      ? 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                      : 'bg-emerald-600 text-white border-emerald-700'
                  }`}
                >
                  {sheetSyncState.autoSyncEnabled ? 'Pause Auto-Sync' : 'Resume Auto-Sync'}
                </button>
                <button
                  onClick={handleTestSync}
                  disabled={isTestingSync}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-800 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingSync ? 'animate-spin' : ''}`} />
                  <span>Test Ping</span>
                </button>
              </div>
            </div>

            {/* Webhook Configuration */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. Google Sheet Webhook URL (One-Time Setup)</span>
              </h4>
              <p className="text-slate-600 text-xs mb-3">
                Paste your deployed Google Apps Script URL here once. Both in development and when deployed live on GitHub, all orders auto-sync to this URL:
              </p>
              <form onSubmit={handleSaveWebhook} className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycby.../exec"
                  value={webhookInput}
                  onChange={(e) => setWebhookInput(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save URL</span>
                </button>
              </form>
            </div>

            {/* Google Apps Script code snippet */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-indigo-600" />
                  <span>2. Google Apps Script Code (Copy &amp; Paste in your Google Sheet)</span>
                </h4>
                <button
                  onClick={() => copyToClipboard(appsScriptCode, 'script')}
                  className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200 font-bold flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey === 'script' ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                </button>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-200 max-h-48 overflow-y-auto">
                <pre>{appsScriptCode}</pre>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                <strong>4 Simple Steps:</strong> Google Sheet open karein → <strong>Extensions</strong> → <strong>Apps Script</strong> → code paste karein → <strong>Deploy as Web App</strong> (Access: Anyone) → Web App URL copy karke upar paste karke Save kardein!
              </p>
            </div>

            {/* Manual CSV Exports */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                3. Download CSV Backup Files (Optional Manual Excel/Sheet Files)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                <button
                  onClick={exportInventory}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition-colors shadow-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">Inventory Sheet</span>
                    <span className="text-[10px] text-slate-500">{inventory.length} records</span>
                  </div>
                  <Download className="w-4 h-4 text-emerald-600" />
                </button>

                <button
                  onClick={exportAllocations}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition-colors shadow-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">Allocations Sheet</span>
                    <span className="text-[10px] text-slate-500">{allocations.length} models</span>
                  </div>
                  <Download className="w-4 h-4 text-emerald-600" />
                </button>

                <button
                  onClick={exportOrders}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition-colors shadow-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">Orders Sheet</span>
                    <span className="text-[10px] text-slate-500">{orders.length} orders</span>
                  </div>
                  <Download className="w-4 h-4 text-emerald-600" />
                </button>

                <button
                  onClick={exportBacklog}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition-colors shadow-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">IDOO Backlog</span>
                    <span className="text-[10px] text-slate-500">{idooBacklog.length} shortages</span>
                  </div>
                  <Download className="w-4 h-4 text-emerald-600" />
                </button>

                <button
                  onClick={exportLedger}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition-colors shadow-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">Customer Ledger</span>
                    <span className="text-[10px] text-slate-500">{ledger.length} entries</span>
                  </div>
                  <Download className="w-4 h-4 text-emerald-600" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEPLOY ON GITHUB & FREE CLOUD PLATFORMS */}
        {activeTab === 'deploy' && (
          <div className="space-y-6">
            {/* Clear Urdu Explanation */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-indigo-950">
              <h4 className="font-extrabold text-sm flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-indigo-700" />
                <span>Kia ye GitHub par deploy hone ke baad Google se khud Auto-Sync hoga?</span>
              </h4>
              <p className="text-xs leading-relaxed text-indigo-900">
                <strong>Jawab: Haan, bilkul 100% khud Auto-Sync hoga!</strong> Kyunki jab aap is app ko GitHub Pages ya Vercel par live deploy karoge, customer kisi bhi mobile ya laptop se link kholega aur jab bhi order submit karega, ye web app seedha aapke Google Sheet ke Webhook par live data push kardegi. Bar bar koi button dabane ki zaroorat nahi hai.
              </p>
            </div>

            {/* Platform Option 1: Vercel (Fastest & 1-Click Free Hosting) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center font-black text-xs">
                    ▲
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Option 1: Vercel (Sub se Asan &amp; 100% Free - Recommended)
                  </h4>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Vercel par 30 seconds me live website ban jati hai, aur jab bhi aap GitHub par naya code push karenge ye khud deploy hojayegi:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700">
                <li>Apna code GitHub par push karein (neeche diye gaye command se).</li>
                <li><strong>vercel.com</strong> par jain aur apne GitHub account se Login karein.</li>
                <li><strong>"Add New" &gt; "Project"</strong> par click karein aur apna repository select karein.</li>
                <li>Framework: <strong>Vite</strong> select hoga khud hi. Simply click <strong>"Deploy"</strong>!</li>
                <li>Aapko foran ek live URL mil jayega (e.g. <code>https://wichita-hub.vercel.app</code>) jo aap apne customers ko de sakte hain!</li>
              </ol>
            </div>

            {/* Platform Option 2: GitHub Pages (Free Hosting on GitHub) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-slate-800" />
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Option 2: GitHub Pages par Deploy karne ke Terminal Steps
                  </h4>
                </div>
                <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  GitHub Free
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Apne computer terminal ya command prompt me ye commands run karein:
              </p>

              <div className="space-y-2">
                {[
                  { title: 'Step 1: Git repository initialize karein', cmd: 'git init' },
                  { title: 'Step 2: Sare files add karein', cmd: 'git add .' },
                  { title: 'Step 3: Commit save karein', cmd: 'git commit -m "Deploy Wichita B2B Portal"' },
                  { title: 'Step 4: Main branch set karein', cmd: 'git branch -M main' },
                  {
                    title: 'Step 5: GitHub repo link karein (Apna repo URL dalein)',
                    cmd: 'git remote add origin https://github.com/YOUR_USERNAME/wichita-portal.git',
                  },
                  { title: 'Step 6: Code GitHub par push karein', cmd: 'git push -u origin main' },
                  { title: 'Step 7: Production build generate karein', cmd: 'npm run build' },
                  { title: 'Step 8: GitHub Pages par deploy karein (1-command)', cmd: 'npx gh-pages -d dist' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">{item.title}</span>
                      <code className="text-xs font-mono font-bold text-slate-900">{item.cmd}</code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(item.cmd, `cmd-${idx}`)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700 shrink-0"
                    >
                      {copiedKey === `cmd-${idx}` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-200">
                <strong>GitHub Pages Settings:</strong> GitHub repository me <strong>Settings</strong> &gt; <strong>Pages</strong> par jain, Branch ko <code>gh-pages</code> / <code>root</code> select karein. Aapka free online portal <code>https://username.github.io/wichita-portal</code> par live hojayega!
              </div>
            </div>

            {/* Platform Option 3: Netlify */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <h4 className="text-sm font-extrabold text-slate-900 mb-1">
                Option 3: Netlify (Drag &amp; Drop Deployment)
              </h4>
              <p className="text-xs text-slate-600">
                Sirf terminal me <code>npm run build</code> chalayein. Iske baad banta hai <code>dist</code> folder. <strong>app.netlify.com/drop</strong> par jain aur <code>dist</code> folder drag &amp; drop kardein. Website instantly live hojayegi!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
