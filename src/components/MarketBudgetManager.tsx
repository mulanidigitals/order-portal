import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DollarSign, ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, Sliders } from 'lucide-react';

export const MarketBudgetManager: React.FC = () => {
  const { marketBudget, updateMarketBudgetLimit } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [newLimitInput, setNewLimitInput] = useState(marketBudget.monthlyBudgetLimit.toString());

  const remainingBudget = Math.max(0, marketBudget.monthlyBudgetLimit - marketBudget.usedAmount);
  const usedPercent = Math.min(
    100,
    Math.round((marketBudget.usedAmount / marketBudget.monthlyBudgetLimit) * 100)
  );

  const isOverBudget = marketBudget.usedAmount > marketBudget.monthlyBudgetLimit;
  const isNearLimit = usedPercent >= 80 && !isOverBudget;

  const handleSaveLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(newLimitInput);
    if (!isNaN(parsed) && parsed > 0) {
      updateMarketBudgetLimit(parsed);
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Budget Status Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Wichita Market Spending Cap
              </span>
              <span className="text-xs text-slate-500 font-mono">Cycle: {marketBudget.activeCycleMonth}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>IDOO Portal Monthly Spending Limit</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict limit enforced to prevent over-spending on carrier IDOO orders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => {
                  setNewLimitInput(marketBudget.monthlyBudgetLimit.toString());
                  setIsEditing(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 shadow-xs"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Adjust Limit</span>
              </button>
            ) : (
              <form onSubmit={handleSaveLimit} className="flex items-center gap-2">
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={newLimitInput}
                  onChange={(e) => setNewLimitInput(e.target.value)}
                  className="w-28 bg-white border border-indigo-500 rounded-xl px-2.5 py-1 text-xs text-slate-900 font-mono font-bold"
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Big Meter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase">Total Monthly Limit</span>
            <p className="text-3xl font-black text-slate-900 mt-1 font-mono">
              ${marketBudget.monthlyBudgetLimit.toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-500 block mt-1">Configured for Wichita territory</span>
          </div>

          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase">Spent this Month</span>
            <p className="text-3xl font-black text-amber-700 mt-1 font-mono">
              ${marketBudget.usedAmount.toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-500 block mt-1">{usedPercent}% consumed</span>
          </div>

          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase">Remaining Headroom</span>
            <p className="text-3xl font-black text-emerald-700 mt-1 font-mono">
              ${remainingBudget.toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-500 block mt-1">Available for new IDOO placements</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all ${
                isOverBudget
                  ? 'bg-rose-600'
                  : isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, usedPercent)}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>$0</span>
            <span>$50,000</span>
            <span>${marketBudget.monthlyBudgetLimit.toLocaleString()} CAP</span>
          </div>
        </div>

        {/* Status Alerts */}
        {isOverBudget && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <strong>Monthly IDOO Cap Exceeded:</strong> Wichita territory has surpassed its authorized monthly carrier order ceiling. Orders will be blocked until limits are revised.
            </div>
          </div>
        )}

        {isNearLimit && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong>Budget Warning:</strong> You have consumed {usedPercent}% of your monthly IDOO allocation.
            </div>
          </div>
        )}

        {!isNearLimit && !isOverBudget && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong>Budget Healthy:</strong> Plenty of capacity remains for ordering phones from carrier IDOO portal.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
