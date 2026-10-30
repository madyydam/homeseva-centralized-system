'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Receipt,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building,
  Users,
  Zap,
  ShoppingBag,
  Layers,
} from 'lucide-react';
import { GentleHairWigsStudioData, FinanceTransactionItem } from './types';
import { gentleHairWigsDb } from './db';

interface FinancePnlViewProps {
  branch: string;
  data: GentleHairWigsStudioData;
  onDataChange: () => void;
  userRole: string;
}

const MONTH_NAMES = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const FIXED_EXPENSE_CATEGORIES = [
  'Studio Rent',
  'Staff Salaries',
  'Electricity & Utilities',
  'Wi-Fi & Internet',
];

export function FinancePnlView({ branch, data, onDataChange, userRole }: FinancePnlViewProps) {
  // Month & Year state
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('10'); // October default
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Modal state
  const [showModal, setShowModal] = useState(false);
  const [txType, setTxType] = useState<'sale' | 'expense'>('sale');
  const [txCategory, setTxCategory] = useState<FinanceTransactionItem['category']>('Hair Wig Sale');
  const [txDescription, setTxDescription] = useState('');
  const [txAmount, setTxAmount] = useState<number | ''>('');
  const [txDate, setTxDate] = useState(`2026-10-29`);
  const [txPaymentMode, setTxPaymentMode] = useState<FinanceTransactionItem['paymentMode']>('UPI / QR Pay');
  const [txRecordedBy, setTxRecordedBy] = useState(userRole || 'Studio Manager');

  // Filter transactions by Month & Year (or All)
  const currentMonthKey = selectedMonth === 'all' ? selectedYear : `${selectedYear}-${selectedMonth}`;

  const monthlyTransactions = useMemo(() => {
    return data.financeTransactions.filter((tx) => {
      if (selectedMonth === 'all') {
        return tx.date.startsWith(selectedYear);
      }
      return tx.month === currentMonthKey;
    });
  }, [data.financeTransactions, selectedMonth, selectedYear, currentMonthKey]);

  // Automated Calculations for the selected Month
  const totalSales = useMemo(() => {
    return monthlyTransactions
      .filter((t) => t.type === 'sale')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  const totalExpenses = useMemo(() => {
    return monthlyTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  // AUTOMATIC PROFIT CALCULATION
  const netProfit = totalSales - totalExpenses;
  const isProfitable = netProfit >= 0;
  const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0.0';

  // Fixed vs Variable Expenses Breakdown
  const fixedExpenses = useMemo(() => {
    return monthlyTransactions
      .filter((t) => t.type === 'expense' && FIXED_EXPENSE_CATEGORIES.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  const variableExpenses = totalExpenses - fixedExpenses;

  // Month-by-month Annual Trends
  const annualSummary = useMemo(() => {
    const monthsMap: Record<
      string,
      { sales: number; fixedExp: number; varExp: number; totalExp: number }
    > = {};

    data.financeTransactions
      .filter((t) => t.date.startsWith(selectedYear))
      .forEach((t) => {
        const mKey = t.month;
        if (!monthsMap[mKey]) {
          monthsMap[mKey] = { sales: 0, fixedExp: 0, varExp: 0, totalExp: 0 };
        }
        if (t.type === 'sale') {
          monthsMap[mKey]!.sales += t.amount;
        } else {
          monthsMap[mKey]!.totalExp += t.amount;
          if (FIXED_EXPENSE_CATEGORIES.includes(t.category)) {
            monthsMap[mKey]!.fixedExp += t.amount;
          } else {
            monthsMap[mKey]!.varExp += t.amount;
          }
        }
      });

    return Object.entries(monthsMap)
      .map(([mKey, vals]) => {
        const [yr, mo] = mKey.split('-');
        const monthLabel = MONTH_NAMES.find((m) => m.value === mo)?.label || mKey;
        const profit = vals.sales - vals.totalExp;
        const margin = vals.sales > 0 ? ((profit / vals.sales) * 100).toFixed(1) : '0.0';
        return {
          monthKey: mKey,
          monthLabel: `${monthLabel} ${yr}`,
          ...vals,
          profit,
          margin,
          isProfitable: profit >= 0,
        };
      })
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [data.financeTransactions, selectedYear]);

  // Filtered transactions for the ledger table
  const filteredLedger = useMemo(() => {
    return monthlyTransactions.filter((tx) => {
      const matchesType = filterType === 'all' || tx.type === filterType;
      const matchesSearch =
        !searchQuery ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.paymentMode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [monthlyTransactions, filterType, searchQuery]);

  // Handlers
  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDescription.trim() || !txAmount || Number(txAmount) <= 0) return;

    const monthStr = txDate.slice(0, 7); // e.g. "2026-10"
    const newTx: FinanceTransactionItem = {
      id: `FTX-${Date.now().toString().slice(-6)}`,
      type: txType,
      category: txCategory,
      description: txDescription.trim(),
      amount: Number(txAmount),
      date: txDate,
      month: monthStr,
      paymentMode: txPaymentMode,
      recordedBy: txRecordedBy.trim() || 'Staff',
    };

    gentleHairWigsDb.addFinanceTransaction(branch, newTx);
    setTxDescription('');
    setTxAmount('');
    setShowModal(false);
    onDataChange();
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Are you sure you want to delete this financial transaction?')) {
      gentleHairWigsDb.deleteFinanceTransaction(branch, id);
      onDataChange();
    }
  };

  // Current Month Label
  const currentMonthLabel =
    selectedMonth === 'all'
      ? `Full Year ${selectedYear}`
      : `${MONTH_NAMES.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`;

  return (
    <div className="space-y-6">
      {/* Month & Year Selection Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Select Period:</span>
          </div>

          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              if (e.target.value !== 'all') {
                setTxDate(`${selectedYear}-${e.target.value}-15`);
              }
            }}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="all">Full Year (All Months)</option>
            {MONTH_NAMES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            Active: {currentMonthLabel}
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => {
              setTxType('sale');
              setTxCategory('Hair Wig Sale');
              setShowModal(true);
            }}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Add Sale / Income</span>
          </button>

          <button
            onClick={() => {
              setTxType('expense');
              setTxCategory('Daily Petty Cash & Tea');
              setShowModal(true);
            }}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Add Expense / Kharcha</span>
          </button>
        </div>
      </div>

      {/* 3 MAIN AUTOMATED METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD 1: TOTAL SALES OF THE MONTH */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Sales of Month
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black font-mono text-slate-900">
                ₹ {totalSales.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Total revenue from custom wigs, toupees &amp; styling services
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-600">
              {monthlyTransactions.filter((t) => t.type === 'sale').length} Inflow Entries
            </span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              Revenue Stream
            </span>
          </div>
        </div>

        {/* CARD 2: TOTAL EXPENSE OF THE MONTH */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Expense of Month
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <ArrowDownRight className="h-4 w-4" />
              </span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black font-mono text-slate-900">
                ₹ {totalExpenses.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Fixed rent &amp; salaries + materials, daily tea &amp; ads
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-600">
              {monthlyTransactions.filter((t) => t.type === 'expense').length} Outflow Vouchers
            </span>
            <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">
              Operating Outflow
            </span>
          </div>
        </div>

        {/* CARD 3: AUTOMATED NET PROFIT / LOSS OF THE MONTH */}
        <div
          className={`rounded-2xl p-5 shadow-xs relative overflow-hidden border flex flex-col justify-between ${
            isProfitable
              ? 'bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border-emerald-300'
              : 'bg-gradient-to-br from-rose-500/10 via-white to-rose-500/5 border-rose-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                Net Profit of Month (Auto)
              </span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  isProfitable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isProfitable ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span
                className={`text-2xl font-black font-mono ${
                  isProfitable ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {isProfitable ? '+ ' : '- '}₹ {Math.abs(netProfit).toLocaleString('en-IN')}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isProfitable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {profitMargin}% margin
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 font-medium">
              Formula: Total Sales (₹ {totalSales.toLocaleString('en-IN')}) − Total Expenses (₹ {totalExpenses.toLocaleString('en-IN')})
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-700">
              Status: {isProfitable ? 'Healthy Operating Profit' : 'Expense Exceeded Sales'}
            </span>
            <span
              className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded ${
                isProfitable ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {isProfitable ? 'Profitable' : 'Loss'}
            </span>
          </div>
        </div>
      </div>

      {/* Fixed vs Variable Expenses Breakdown Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
          <Layers className="h-4 w-4 text-amber-600" />
          <span>Expense Classification &amp; Allocation — {currentMonthLabel}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <Building className="h-3.5 w-3.5 text-blue-600" />
                <span>Fixed Overhead Costs (Rent, Salaries, Bills)</span>
              </span>
              <span className="text-xs font-black font-mono text-slate-900">
                ₹ {fixedExpenses.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Monthly committed costs: Studio commercial rent, stylist base salaries, electricity &amp; fiber internet.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-purple-600" />
                <span>Variable Operational Costs (Stock, Daily Tea, Ads)</span>
              </span>
              <span className="text-xs font-black font-mono text-slate-900">
                ₹ {variableExpenses.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Direct materials: Raw hair bundles, lace bases, adhesives, daily tea, cleaning supplies, and ads.
            </p>
          </div>
        </div>
      </div>

      {/* Month-by-Month Annual Performance Trends Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">
            Month-by-Month Profit &amp; Loss History ({selectedYear})
          </h3>
          <span className="text-xs text-slate-500">
            Compare monthly sales, fixed/variable costs &amp; profit margins
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3 font-mono text-emerald-700">Total Sales (₹)</th>
                <th className="py-2.5 px-3 font-mono text-slate-600">Fixed Costs (₹)</th>
                <th className="py-2.5 px-3 font-mono text-slate-600">Variable Costs (₹)</th>
                <th className="py-2.5 px-3 font-mono text-rose-700">Total Expenses (₹)</th>
                <th className="py-2.5 px-3 font-mono">Net Profit (₹)</th>
                <th className="py-2.5 px-3 text-center">Margin %</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {annualSummary.map((sum) => (
                <tr key={sum.monthKey} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 font-bold text-slate-900">{sum.monthLabel}</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                    ₹ {sum.sales.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    ₹ {sum.fixedExp.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    ₹ {sum.varExp.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-rose-700">
                    ₹ {sum.totalExp.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 font-mono font-black">
                    <span className={sum.isProfitable ? 'text-emerald-700' : 'text-rose-700'}>
                      {sum.isProfitable ? '+ ' : '- '}₹ {Math.abs(sum.profit).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold">{sum.margin}%</td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        sum.isProfitable
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {sum.isProfitable ? 'Profitable' : 'Loss'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED TRANSACTIONS REGISTER (LEDGER) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Detailed Income &amp; Expense Ledger — {currentMonthLabel}
            </h3>
            <p className="text-xs text-slate-500">
              Complete transactional trail for audit, reconciliation, and payment verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Pill Buttons */}
            <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                All ({monthlyTransactions.length})
              </button>
              <button
                onClick={() => setFilterType('sale')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  filterType === 'sale' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                Sales Only
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  filterType === 'expense' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                Expenses Only
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description..."
                className="rounded-lg border border-slate-200 pl-8 pr-3 py-1 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {filteredLedger.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <Receipt className="mx-auto h-8 w-8 text-slate-300" />
            <h4 className="mt-2 text-xs font-bold text-slate-700">No financial entries recorded</h4>
            <p className="mt-1 text-[11px] text-slate-400">
              Click the buttons above to record a new sale or expense entry for this month.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Payment Mode</th>
                  <th className="py-2.5 px-3 font-mono text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3">Recorded By</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredLedger.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono text-slate-600">{tx.date}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === 'sale'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {tx.type === 'sale' ? '+ SALE' : '- EXPENSE'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 max-w-xs">{tx.description}</td>
                    <td className="py-3 px-3 text-slate-600">{tx.paymentMode}</td>
                    <td className="py-3 px-3 font-mono font-bold text-right">
                      <span className={tx.type === 'sale' ? 'text-emerald-700' : 'text-rose-700'}>
                        {tx.type === 'sale' ? '+' : '-'} ₹ {tx.amount.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">{tx.recordedBy}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                        title="Delete transaction"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD TRANSACTION (SALE OR EXPENSE) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Record Monthly Financial Entry</h3>

            <form onSubmit={handleCreateTransaction} className="space-y-3 text-xs">
              {/* Type Toggle: Sale vs Expense */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('sale');
                      setTxCategory('Hair Wig Sale');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      txType === 'sale'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    + Sale / Revenue
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('expense');
                      setTxCategory('Daily Petty Cash & Tea');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      txType === 'expense'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    - Expense / Kharcha
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                >
                  {txType === 'sale' ? (
                    <>
                      <option value="Hair Wig Sale">Hair Wig Sale</option>
                      <option value="Styling & Fitting Service">Styling &amp; Fitting Service</option>
                      <option value="Care Product Sale">Care Product Sale (Adhesive / Solvent)</option>
                      <option value="Other">Other Revenue</option>
                    </>
                  ) : (
                    <>
                      <option value="Studio Rent">Studio Rent (Fixed)</option>
                      <option value="Staff Salaries">Staff Salaries (Fixed)</option>
                      <option value="Electricity & Utilities">Electricity &amp; Power Bill (Fixed)</option>
                      <option value="Wi-Fi & Internet">Wi-Fi &amp; Internet Bill (Fixed)</option>
                      <option value="Wig / Hair Stock Purchase">Wig / Hair Material Stock (Variable)</option>
                      <option value="Daily Petty Cash & Tea">Daily Shop Petty Cash &amp; Tea (Variable)</option>
                      <option value="Marketing & Ads">Marketing &amp; Instagram Ads (Variable)</option>
                      <option value="Cleaning & Sanitization">Cleaning &amp; Sanitization (Variable)</option>
                      <option value="Other">Other Expense</option>
                    </>
                  )}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Memo *</label>
                <input
                  type="text"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder={
                    txType === 'sale'
                      ? 'e.g. Custom HD Lace Wig order advance'
                      : 'e.g. Monthly Studio Rent for Viman Nagar'
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 25000"
                    required
                    min={1}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Payment Mode & Recorded By */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={txPaymentMode}
                    onChange={(e) => setTxPaymentMode(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="UPI / QR Pay">UPI / QR Pay</option>
                    <option value="Cash Counter">Cash Counter</option>
                    <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recorded By</label>
                  <input
                    type="text"
                    value={txRecordedBy}
                    onChange={(e) => setTxRecordedBy(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-white font-bold shadow-xs cursor-pointer ${
                    txType === 'sale' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

