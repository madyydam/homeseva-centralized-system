'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Boxes,
  Truck,
  Receipt,
  Plus,
  LogOut,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { BusinessDashboardProps } from '../types';
import { dveEnterprisesConfig } from './config';
import { dveEnterprisesDb } from './db';
import {
  TradingPurchaseOrderItem,
  TradingSalesOrderItem,
  DveEnterprisesData,
} from './types';

export default function DveEnterprisesDashboard({
  role = 'Commercial Trading Director',
}: BusinessDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'procurement'>('overview');
  const [data, setData] = useState<DveEnterprisesData>({
    purchaseOrders: [],
    salesOrders: [],
  });

  const refreshData = () => {
    setData({ ...dveEnterprisesDb.getData() });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);

  // Form states: Sale
  const [saleClient, setSaleClient] = useState('');
  const [salePhone, setSalePhone] = useState('');
  const [saleDesc, setSaleDesc] = useState('Bulk Heavy Duty Industrial Fasteners (5,000 units)');
  const [saleAmount, setSaleAmount] = useState('75000');

  // Form states: PO
  const [poVendor, setPoVendor] = useState('');
  const [poType, setPoType] = useState<TradingPurchaseOrderItem['commodityType']>('Industrial Fasteners & Cables');
  const [poCost, setPoCost] = useState('120000');

  const totalTradingRevenue = data.salesOrders.reduce((sum, s) => sum + (Number(s.totalPayable) || 0), 0);
  const totalProcurementCost = data.purchaseOrders.reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0);

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleClient.trim()) return;
    const base = Number(saleAmount) || 0;
    const gst = Math.round(base * 0.18);
    const newSale: TradingSalesOrderItem = {
      id: `DVE-SAL-${String(data.salesOrders.length + 1).padStart(3, '0')}`,
      orderNumber: `DVE/ORD/2026/${String(data.salesOrders.length + 101)}`,
      clientName: saleClient.trim(),
      phone: salePhone.trim(),
      itemsDescription: saleDesc.trim(),
      subtotal: base,
      gstAmount: gst,
      totalPayable: base + gst,
      status: 'Invoiced',
      orderDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    dveEnterprisesDb.addSalesOrder(newSale);
    refreshData();
    setShowSaleModal(false);
    setSaleClient('');
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poVendor.trim()) return;
    const newPO: TradingPurchaseOrderItem = {
      id: `DVE-PO-${String(data.purchaseOrders.length + 1).padStart(3, '0')}`,
      poNumber: `PO/DVE/2026/${String(data.purchaseOrders.length + 101)}`,
      vendorName: poVendor.trim(),
      commodityType: poType,
      quantity: 1,
      totalCost: Number(poCost) || 0,
      paymentTerms: 'Credit 45 Days',
      status: 'PO Issued',
    };
    dveEnterprisesDb.addPurchaseOrder(newPO);
    refreshData();
    setShowPOModal(false);
    setPoVendor('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 font-sans selection:bg-orange-600 selection:text-white">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 lg:h-screen lg:sticky lg:top-0 z-30">
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm">
                <Boxes className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs font-black text-slate-900 truncate">DVE Enterprises</h1>
                <p className="text-[10px] font-semibold text-orange-700 truncate">Commercial Trading</p>
              </div>
            </div>
          </div>

          <div className="p-3 space-y-4">
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Trading Desk
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'overview'
                      ? 'bg-orange-50 text-orange-900 border border-orange-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 text-orange-600" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab('sales')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'sales'
                      ? 'bg-orange-50 text-orange-900 border border-orange-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Receipt className="h-4 w-4 text-orange-600" />
                  <span>Sales Orders</span>
                  <span className="ml-auto rounded-full bg-orange-100 text-orange-800 px-1.5 text-[10px] font-mono font-bold">
                    {data.salesOrders.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('procurement')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'procurement'
                      ? 'bg-orange-50 text-orange-900 border border-orange-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Truck className="h-4 w-4 text-orange-600" />
                  <span>Purchase Orders</span>
                  <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                    {data.purchaseOrders.length}
                  </span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5 mb-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-xs font-black text-white shrink-0 shadow-2xs">
              DV
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-900 truncate leading-tight">Trading Lead</span>
              <span className="block text-[10px] text-orange-700 font-semibold truncate leading-tight">{role}</span>
            </div>
          </div>
          <Link
            href="/signin/dve-enterprises"
            className="w-full flex items-center justify-center space-x-1.5 rounded-lg border border-slate-200 bg-white py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
          >
            <LogOut className="h-3 w-3" />
            <span>Switch Business / Exit</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div>
            <span className="text-sm font-extrabold text-slate-900">DVE Enterprises · Commercial Trading</span>
            <p className="text-[11px] text-slate-500 font-medium">Session: {role} · Isolated Business DB</p>
          </div>
          <button
            onClick={() => setShowSaleModal(true)}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Sales Order</span>
          </button>
        </header>

        <div className="p-6 space-y-6 max-w-7xl">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Sales Invoiced</span>
              <p className="mt-1 text-2xl font-black text-slate-900 font-mono">
                ₹ {totalTradingRevenue.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">Commercial trading dispatch</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Procurement Outlay</span>
              <p className="mt-1 text-2xl font-black text-orange-600 font-mono">
                ₹ {totalProcurementCost.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">Factory bulk purchase orders</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Trade Invoices</span>
              <p className="mt-1 text-2xl font-black text-slate-900 font-mono">{data.salesOrders.length}</p>
              <span className="text-[10px] text-slate-400">Goods delivery notes</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Trading Gross Margin</span>
              <p className="mt-1 text-2xl font-black text-emerald-600 font-mono">
                ₹ {Math.max(0, totalTradingRevenue - totalProcurementCost).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">Net realized spread</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-bold text-slate-900">Direct Actions:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowSaleModal(true)}
                className="inline-flex items-center space-x-1.5 rounded-lg border border-orange-300 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 text-xs font-bold text-orange-900 transition"
              >
                <Receipt className="h-3.5 w-3.5 text-orange-700" />
                <span>+ Commercial Sales Order</span>
              </button>
              <button
                onClick={() => setShowPOModal(true)}
                className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-800 transition"
              >
                <Truck className="h-3.5 w-3.5 text-slate-600" />
                <span>+ Factory Purchase Order</span>
              </button>
            </div>
          </div>

          {/* SALES TABLE */}
          {(activeTab === 'overview' || activeTab === 'sales') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Wholesale Commercial Invoices</h3>
                  <p className="text-xs text-slate-500">Bulk trading deliveries to factories and contractors</p>
                </div>
                <button onClick={() => setShowSaleModal(true)} className="text-xs font-bold text-orange-700 hover:text-orange-800">
                  + New Order
                </button>
              </div>

              {data.salesOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Receipt className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No trading orders recorded</h4>
                  <p className="mt-1 text-[11px] text-slate-400">Issue commercial trading invoices for bulk supplies.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Order #</th>
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3">Commodity Summary</th>
                        <th className="py-2.5 px-3 font-mono">Total with GST</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.salesOrders.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-orange-700">{s.orderNumber}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{s.clientName}</td>
                          <td className="py-3 px-3 text-slate-700 max-w-[240px] truncate">{s.itemsDescription}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹ {s.totalPayable.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3">
                            <span className="rounded bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Sale */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Record Commercial Sales Order</h3>
            <form onSubmit={handleCreateSale} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Organization *</label>
                <input
                  type="text"
                  value={saleClient}
                  onChange={(e) => setSaleClient(e.target.value)}
                  placeholder="e.g. Apex Engineering Works"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Commodity Description</label>
                <input
                  type="text"
                  value={saleDesc}
                  onChange={(e) => setSaleDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtotal (₹) *</label>
                <input
                  type="number"
                  value={saleAmount}
                  onChange={(e) => setSaleAmount(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-orange-500 focus:outline-none font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-600 hover:bg-orange-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

