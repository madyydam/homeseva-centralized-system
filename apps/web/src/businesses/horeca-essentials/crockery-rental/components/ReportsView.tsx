import React, { useMemo } from 'react';
import { useInventory } from '../InventoryContext';
import {
  TrendingUp,
  FileSpreadsheet,
  Printer,
  ShieldAlert,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { items, invoices, bookings, payments } = useInventory();

  // 1. Category Revenue Analysis Memoized
  const categoryChartData = useMemo(() => {
    const categoryRevenue: Record<string, number> = {
      plates: 0,
      bowls: 0,
      glassware: 0,
      cups: 0,
      cutlery: 0,
      serving: 0,
    };

    for (let bIdx = 0; bIdx < bookings.length; bIdx++) {
      const b = bookings[bIdx];
      if (!b) continue;
      for (let iIdx = 0; iIdx < b.items.length; iIdx++) {
        const bi = b.items[iIdx];
        if (!bi) continue;
        const cat = bi.category || 'plates';
        const days = bi.rent_basis === 'per_day' ? 2 : 1;
        const amt = (bi.quantity || 0) * bi.rate_snapshot * days;
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + amt;
      }
    }

    return Object.entries(categoryRevenue).map(([key, val]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      revenue: Math.round(val),
    }));
  }, [bookings]);

  const maxRevenue = useMemo(() => {
    const vals = categoryChartData.map((c) => c.revenue);
    return Math.max(...vals, 1);
  }, [categoryChartData]);

  // 2. Stock Valuation Memoized
  const { totalStockValue, totalCollected, totalOutstanding } = useMemo(() => {
    let stockVal = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item) stockVal += item.total_quantity * item.replacement_cost;
    }
    let outstanding = 0;
    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];
      if (inv) {
        outstanding += inv.balance_due;
      }
    }
    let collected = 0;
    for (let i = 0; i < payments.length; i++) {
      const p = payments[i];
      if (p) collected += p.amount;
    }
    return {
      totalStockValue: stockVal,
      totalCollected: collected,
      totalOutstanding: outstanding,
    };
  }, [items, invoices, payments]);

  // 3. Loss & Breakage analysis Memoized
  const { breakageData, totalLossValue } = useMemo(() => {
    const list = items
      .filter((i) => i.written_off > 0)
      .map((i) => ({
        name: (i.name.split('(')[0] || i.name).trim(),
        brokenCount: i.written_off,
        lossValue: i.written_off * i.replacement_cost,
      }))
      .sort((a, b) => b.lossValue - a.lossValue);

    const totalLoss = list.reduce((sum, b) => sum + b.lossValue, 0);
    return { breakageData: list, totalLossValue: totalLoss };
  }, [items]);

  // 4. Stock Distribution Memoized
  const stockDistribution = useMemo(() => {
    let godown = 0;
    let rent = 0;
    let clean = 0;
    let written = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      godown += item.in_godown;
      rent += item.out_on_rent;
      clean += item.in_cleaning;
      written += item.written_off;
    }

    const total = godown + rent + clean + written || 1;

    return [
      { name: 'In Godown (Clean)', value: godown, percent: Math.round((godown / total) * 100), color: '#10b981', bg: 'bg-emerald-500' },
      { name: 'Out on Rent', value: rent, percent: Math.round((rent / total) * 100), color: '#3b82f6', bg: 'bg-blue-500' },
      { name: 'In Cleaning', value: clean, percent: Math.round((clean / total) * 100), color: '#a855f7', bg: 'bg-purple-500' },
      { name: 'Written Off', value: written, percent: Math.round((written / total) * 100), color: '#f43f5e', bg: 'bg-rose-500' },
    ];
  }, [items]);

  const handleExportCSV = () => {
    const headers = 'Item,Category,Total Owned,In Godown,Out on Rent,Cleaning,Written Off,Replacement Cost\n';
    const rows = items
      .map(
        (i) =>
          `"${i.name}","${i.category}",${i.total_quantity},${i.in_godown},${i.out_on_rent},${i.in_cleaning},${i.written_off},${i.replacement_cost}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Crockery_Stock_Report_${new Date().toISOString().split('T')[0] ?? ''}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              Analytics & Executive Reports
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Stock valuation, category revenue breakdown, and breakage loss recovery reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-slate-600" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 4 Financial & Valuation Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Stock Valuation</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1">
            ₹{totalStockValue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Current replacement cost of owned inventory.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total Payments Collected</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 mt-1">
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Reconciled payments in cash, UPI and bank.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Total Outstanding</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-700 mt-1">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Pending invoices balance across accounts.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Cumulative Loss & Breakage</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 mt-1">
            ₹{totalLossValue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Loss ledger value from written-off pieces.
          </p>
        </div>
      </div>

      {/* Visual Charts: Category Revenue + Stock Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category Progress Visualizer */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Revenue Generated by Item Category (₹)
            </h3>
            <span className="text-[11px] text-amber-700 font-bold">Category Share</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {categoryChartData.map((cat) => {
              const pct = maxRevenue > 0 ? Math.round((cat.revenue / maxRevenue) * 100) : 0;
              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {cat.name}
                    </span>
                    <span className="font-mono font-extrabold text-amber-700">
                      ₹{cat.revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stock Status Visual Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Current Physical Stock Status (Pieces)
            </h3>
            <span className="text-[11px] text-slate-400 font-bold">Total Physical Units</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {stockDistribution.map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 truncate flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${item.bg}`} />
                    {item.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {item.percent}%
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-slate-900">
                  {item.value.toLocaleString('en-IN')} <span className="text-[10px] font-normal text-slate-500">pcs</span>
                </div>
                <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.bg} rounded-full`}
                    style={{ width: `${Math.max(item.percent, 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Breakage & Loss Audit Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Breakage & Loss Analysis by Item
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Item Name</th>
                <th className="p-3 text-center">Broken / Missing Pieces</th>
                <th className="p-3 text-right">Replacement Cost / Pc</th>
                <th className="p-3 text-right">Total Financial Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {breakageData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">
                    No broken or missing pieces recorded this season.
                  </td>
                </tr>
              ) : (
                breakageData.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-semibold text-slate-900">{b.name}</td>
                    <td className="p-3 text-center font-mono font-bold text-rose-600">
                      {b.brokenCount} pcs
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      ₹{Math.round(b.lossValue / b.brokenCount)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600">
                      ₹{b.lossValue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
