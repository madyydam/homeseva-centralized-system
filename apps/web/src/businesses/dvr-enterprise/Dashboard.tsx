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
import { dvrEnterpriseConfig } from './config';
import { dvrEnterpriseDb } from './db';
import {
  TradingPurchaseOrderItem,
  TradingSalesOrderItem,
  DvrEnterpriseData,
} from './types';

export default function DvrEnterpriseDashboard({
  role = 'Commercial Trading Director',
}: BusinessDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'procurement'>('overview');
  const [data, setData] = useState<DvrEnterpriseData>({
    purchaseOrders: [],
    salesOrders: [],
  });

  const refreshData = () => {
    setData({ ...dvrEnterpriseDb.getData() });
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
    const sub = Number(saleAmount) || 0;
    const gst = Math.round(sub * 0.18);
    const newSale: TradingSalesOrderItem = {
      id: `SO-${String(data.salesOrders.length + 1).padStart(3, '0')}`,
      orderNumber: `DVR/SO/2026/${String(data.salesOrders.length + 101)}`,
      clientName: saleClient.trim(),
      phone: salePhone.trim() || '+91 98220 99887',
      itemsDescription: saleDesc.trim(),
      subtotal: sub,
      gstAmount: gst,
      totalPayable: sub + gst,
      status: 'Invoiced',
      orderDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    dvrEnterpriseDb.addSalesOrder(newSale);
    refreshData();
    setShowSaleModal(false);
    setSaleClient('');
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poVendor.trim()) return;
    const newPO: TradingPurchaseOrderItem = {
      id: `PO-${String(data.purchaseOrders.length + 1).padStart(3, '0')}`,
      poNumber: `DVR/PO/2026/${String(data.purchaseOrders.length + 501)}`,
      vendorName: poVendor.trim(),
      commodityType: poType,
      quantity: 100,
      totalCost: Number(poCost) || 0,
      paymentTerms: 'Credit 45 Days',
      status: 'PO Issued',
    };
    dvrEnterpriseDb.addPurchaseOrder(newPO);
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
                <h1 className="text-xs font-black text-slate-900 truncate">DVR Enterprise</h1>
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
                  <span>Purchase Orders (PO)</span>
                  <span className="ml-auto rounded-full bg-orange-100 text-orange-800 px-1.5 text-[10px] font-mono font-bold">
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
              DVR
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-900 truncate leading-tight">Trading Desk</span>
              <span className="block text-[10px] text-orange-700 font-semibold truncate leading-tight">{role}</span>
            </div>
          </div>
          <Link
            href="/"
            className="w-full flex items-center justify-center space-x-1.5 rounded-lg border border-slate-200 bg-white py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
          >
            <LogOut className="h-3 w-3" />
            <span>Exit Workspace</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold text-slate-900">DVR Enterprise</span>
              <span className="rounded-md bg-orange-50 text-orange-800 border border-orange-200 px-1.5 py-0.5 text-[10px] font-bold">
                Commercial Trading
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Bulk Hardware, Electrical Goods &amp; Supplies Trading</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSaleModal(true)}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ New Sales Order</span>
            </button>
            <button
              onClick={() => setShowPOModal(true)}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Issue PO</span>
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl">
          {/* TAB 1: OVERVIEW & SALES */}
          {(activeTab === 'overview' || activeTab === 'sales') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Wholesale Client Sales Orders</h3>
                  <p className="text-xs text-slate-500">Commercial client deliveries and tax invoice records</p>
                </div>
                <button
                  onClick={() => setShowSaleModal(true)}
                  className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700 transition"
                >
                  + New Sales Order
                </button>
              </div>

              {data.salesOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Receipt className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No sales orders generated</h4>
                  <p className="mt-1 text-[11px] text-slate-400">Record your first B2B trading sale with tax breakdown.</p>
                  <button
                    onClick={() => setShowSaleModal(true)}
                    className="mt-3 inline-flex items-center space-x-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700"
                  >
                    <span>+ Create First Order</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Order Number</th>
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3">Commodity Description</th>
                        <th className="py-2.5 px-3 font-mono">Subtotal</th>
                        <th className="py-2.5 px-3 font-mono">18% GST</th>
                        <th className="py-2.5 px-3 font-mono">Total (INR)</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.salesOrders.map((so) => (
                        <tr key={so.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-orange-700">{so.orderNumber}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{so.clientName}</td>
                          <td className="py-3 px-3 text-slate-600">{so.itemsDescription}</td>
                          <td className="py-3 px-3 font-mono">₹ {so.subtotal.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 font-mono">₹ {so.gstAmount.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">₹ {so.totalPayable.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3">
                            <span className="rounded bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                              {so.status}
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

          {/* TAB 2: PROCUREMENT / PO */}
          {(activeTab === 'overview' || activeTab === 'procurement') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Factory Purchase Orders (Procurement)</h3>
                  <p className="text-xs text-slate-500">Manufacturer bulk orders, commodity contracts &amp; supplier dispatches</p>
                </div>
                <button
                  onClick={() => setShowPOModal(true)}
                  className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700 transition"
                >
                  + Issue New PO
                </button>
              </div>

              {data.purchaseOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Truck className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No factory POs issued yet</h4>
                  <p className="mt-1 text-[11px] text-slate-400">Issue purchase orders to industrial vendors.</p>
                  <button
                    onClick={() => setShowPOModal(true)}
                    className="mt-3 inline-flex items-center space-x-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700"
                  >
                    <span>+ Issue Factory PO</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">PO Number</th>
                        <th className="py-2.5 px-3">Manufacturer / Vendor</th>
                        <th className="py-2.5 px-3">Commodity Line</th>
                        <th className="py-2.5 px-3 font-mono">PO Value (INR)</th>
                        <th className="py-2.5 px-3">Payment Terms</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.purchaseOrders.map((po) => (
                        <tr key={po.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-orange-700">{po.poNumber}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{po.vendorName}</td>
                          <td className="py-3 px-3 text-slate-600">{po.commodityType}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">₹ {po.totalCost.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 text-slate-600">{po.paymentTerms}</td>
                          <td className="py-3 px-3">
                            <span className="rounded bg-blue-50 text-blue-800 px-2 py-0.5 text-[10px] font-bold border border-blue-200">
                              {po.status}
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

      {/* MODAL 1: SALE */}
      {showSaleModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSaleModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Create Wholesale Sales Order</h3>
            <p className="text-xs text-slate-500 mb-4">Record client delivery and generate tax invoice</p>
            <form onSubmit={handleCreateSale} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Business Name *</label>
                <input
                  type="text"
                  value={saleClient}
                  onChange={(e) => setSaleClient(e.target.value)}
                  placeholder="e.g. Apex Engineering & Infrastructure Pvt Ltd"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Phone</label>
                <input
                  type="tel"
                  value={salePhone}
                  onChange={(e) => setSalePhone(e.target.value)}
                  placeholder="+91..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-orange-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Items Description</label>
                <input
                  type="text"
                  value={saleDesc}
                  onChange={(e) => setSaleDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtotal (INR ₹) *</label>
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
                  Save Sales Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PO */}
      {showPOModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPOModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Issue Manufacturer PO</h3>
            <p className="text-xs text-slate-500 mb-4">Create purchase order to factory vendor</p>
            <form onSubmit={handleCreatePO} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Manufacturer / Vendor Name *</label>
                <input
                  type="text"
                  value={poVendor}
                  onChange={(e) => setPoVendor(e.target.value)}
                  placeholder="e.g. Bharat Fasteners Manufacturing Corp"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Commodity Category</label>
                <select
                  value={poType}
                  onChange={(e) => setPoType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-orange-500 focus:outline-none font-semibold"
                >
                  <option value="Industrial Fasteners & Cables">Industrial Fasteners &amp; Cables</option>
                  <option value="Electrical Switchgear">Electrical Switchgear</option>
                  <option value="Pumps & Motors">Pumps &amp; Motors</option>
                  <option value="Safety Workwear">Safety Workwear</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">PO Cost (INR ₹) *</label>
                <input
                  type="number"
                  value={poCost}
                  onChange={(e) => setPoCost(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-orange-500 focus:outline-none font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-600 hover:bg-orange-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
