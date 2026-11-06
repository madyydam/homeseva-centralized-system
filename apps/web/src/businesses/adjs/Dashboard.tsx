'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Printer,
  Users,
  Package,
  Cpu,
  HelpCircle,
  Plus,
  LogOut,
  ChevronRight,
  TrendingUp,
  Store,
  MapPin,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  Code2,
  FileText,
} from 'lucide-react';
import { BusinessDashboardProps } from '../types';
import { adjsConfig } from './config';
import { adjsDb } from './db';
import { PrintboothMachineOrder, PrintboothSupportTicket, KioskModelType } from './types';
import { KIOSK_MODELS } from './crm/crmUtils';
import { CrmView } from './CrmView';
import { ColdcallerDashboard } from './ColdcallerDashboard';
import { DeveloperWorkspace } from './DeveloperWorkspace';
import { DispatchChallanModal } from './DispatchChallanModal';
import { SupportTicketModal } from './SupportTicketModal';

function EnterpriseDashboard({
  role,
  branch,
  division,
}: BusinessDashboardProps & { role: string }) {
  // Normalize role
  const normalizedRole = (role || '').trim().toLowerCase();
  const isDeveloper = normalizedRole.includes('dev') || normalizedRole.includes('engineer');
  const isStaff = normalizedRole.includes('staff') || normalizedRole.includes('support');
  const isManager = normalizedRole.includes('manag');
  const isOwner = normalizedRole.includes('own') || normalizedRole.includes('exec');

  // Developer view default
  const defaultTab = isDeveloper ? 'software' : isStaff ? 'orders' : 'overview';
  const [activeTab, setActiveTab] = useState<'overview' | 'crm' | 'orders' | 'software' | 'support'>(defaultTab);

  const [leadsCount, setLeadsCount] = useState(0);
  const [orders, setOrders] = useState<PrintboothMachineOrder[]>([]);
  const [tickets, setTickets] = useState<PrintboothSupportTicket[]>([]);

  // Modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [activeChallanOrder, setActiveChallanOrder] = useState<PrintboothMachineOrder | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [orderMerchant, setOrderMerchant] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderShop, setOrderShop] = useState('');
  const [orderModel, setOrderModel] = useState<KioskModelType>('PRINTBOOTH™ Compact (Standard)');
  const [orderUnits, setOrderUnits] = useState(1);
  const [orderCity, setOrderCity] = useState('');
  const [orderPrice, setOrderPrice] = useState('285000');

  const refreshData = () => {
    setLeadsCount(adjsDb.getCrmLeads().length);
    setOrders([...adjsDb.getOrders()]);
    setTickets([...adjsDb.getTickets()]);
  };

  useEffect(() => {
    refreshData();
    const unsub = adjsDb.subscribe(refreshData);
    return () => unsub();
  }, []);

  const totalMachineRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const activeDispatches = orders.filter((o) => o.stage === 'Dispatched' || o.stage === 'Assembled & Tested').length;

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderMerchant.trim() || !orderPhone.trim() || !orderCity.trim()) return;

    const u = Number(orderUnits) || 1;
    const price = Number(orderPrice) || 285000;

    const newOrder: PrintboothMachineOrder = {
      id: `PB-ORD-${Date.now().toString().slice(-4)}`,
      orderNumber: `PB/2026/${String(orders.length + 101)}`,
      merchantName: orderMerchant.trim(),
      phone: orderPhone.trim(),
      shopName: orderShop.trim() || orderMerchant.trim(),
      kioskModel: orderModel,
      units: u,
      unitPrice: price,
      totalAmount: u * price,
      stage: 'Order Booked',
      city: orderCity.trim(),
      orderDate: new Date().toISOString().split('T')[0] || '',
    };

    adjsDb.addOrder(newOrder);
    setShowOrderModal(false);
    setOrderMerchant('');
    setOrderPhone('');
    setOrderShop('');
    setOrderCity('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 font-sans selection:bg-purple-600 selection:text-white">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 lg:h-screen lg:sticky lg:top-0 z-30">
        <div>
          {/* Logo & Company Title */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
                <Printer className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1">
                  <span>ADJS</span>
                  <span className="text-[10px] text-purple-700 font-bold">· PRINTBOOTH™</span>
                </h1>
                <p className="text-[10px] font-semibold text-slate-500 truncate">Think It. Print It.</p>
              </div>
            </div>
          </div>

          {/* Navigation Items (STRICT RBAC PERMISSIONS) */}
          <div className="p-3 space-y-4">
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                {isDeveloper ? 'Developer Tools' : isStaff ? 'Support & Dispatch' : 'Kiosk Enterprise'}
              </span>
              <nav className="space-y-1">
                {(isOwner || isManager) && (
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      activeTab === 'overview'
                        ? 'bg-purple-50 text-purple-900 border border-purple-200/80 font-bold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4 text-purple-600" />
                    <span>Overview</span>
                  </button>
                )}

                {(isOwner || isManager) && (
                  <button
                    onClick={() => setActiveTab('crm')}
                    className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      activeTab === 'crm'
                        ? 'bg-purple-50 text-purple-900 border border-purple-200/80 font-bold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Users className="h-4 w-4 text-purple-600" />
                    <span>Centralized CRM</span>
                    <span className="ml-auto rounded-full bg-purple-100 text-purple-800 px-1.5 text-[10px] font-mono font-bold">
                      {leadsCount}
                    </span>
                  </button>
                )}

                {(isOwner || isManager || isStaff) && (
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      activeTab === 'orders'
                        ? 'bg-purple-50 text-purple-900 border border-purple-200/80 font-bold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Package className="h-4 w-4 text-purple-600" />
                    <span>Machine Orders &amp; Dispatch</span>
                    <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                      {orders.length}
                    </span>
                  </button>
                )}

                {(isOwner || isDeveloper) && (
                  <button
                    onClick={() => setActiveTab('software')}
                    className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      activeTab === 'software'
                        ? 'bg-purple-50 text-purple-900 border border-purple-200/80 font-bold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Cpu className="h-4 w-4 text-purple-600" />
                    <span>Kiosk OS &amp; Cloud Print API</span>
                  </button>
                )}

                {(isOwner || isManager || isStaff) && (
                  <button
                    onClick={() => setActiveTab('support')}
                    className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      activeTab === 'support'
                        ? 'bg-purple-50 text-purple-900 border border-purple-200/80 font-bold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <HelpCircle className="h-4 w-4 text-purple-600" />
                    <span>Merchant Helpdesk &amp; Challans</span>
                    {tickets.length > 0 && (
                      <span className="ml-auto rounded-full bg-amber-100 text-amber-800 px-1.5 text-[10px] font-mono font-bold">
                        {tickets.length}
                      </span>
                    )}
                  </button>
                )}
              </nav>
            </div>
          </div>
        </div>

        {/* User Session Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5 mb-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-xs font-black text-white shrink-0 shadow-2xs">
              PB
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-900 truncate leading-tight">
                ADJS · PRINTBOOTH™
              </span>
              <span className="block text-[10px] text-purple-700 font-semibold truncate leading-tight">
                Role: {role}
              </span>
            </div>
          </div>
          <Link
            href="/signin/adjs"
            className="w-full flex items-center justify-center space-x-1.5 rounded-lg border border-slate-200 bg-white py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
          >
            <LogOut className="h-3 w-3" />
            <span>Switch Business / Exit</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900">
                ADJS · PRINTBOOTH™
              </span>
              <span className="rounded-md bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 text-[10px] font-bold">
                Smart Self-Service Printing Kiosks
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Logged in as: <span className="font-bold text-slate-700">{role}</span> · Direct Merchant Sales Platform
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'orders' && (
              <button
                onClick={() => setShowOrderModal(true)}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Record Machine Sale</span>
              </button>
            )}
          </div>
        </header>

        {/* Tab Body */}
        <div className="p-6 space-y-6 max-w-7xl">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Executive Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                      Machine Sales Volume
                    </span>
                    <Package className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black font-mono text-slate-900">{orders.length}</span>
                    <span className="text-xs font-bold text-purple-700">Kiosks Sold</span>
                  </div>
                </div>

                {isOwner && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                        Total Machine Revenue
                      </span>
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-2xl font-black font-mono text-slate-900">
                        ₹ {totalMachineRevenue.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">Gross Sales</span>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                      Active Inquiries
                    </span>
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black font-mono text-slate-900">{leadsCount}</span>
                    <span className="text-xs font-bold text-blue-700">Central CRM</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                      Dispatches in Progress
                    </span>
                    <Truck className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black font-mono text-slate-900">{activeDispatches}</span>
                    <span className="text-xs font-bold text-amber-700">Freight Delivery</span>
                  </div>
                </div>
              </div>

              {/* Business Model Summary Card */}
              <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/70 via-white to-purple-50/30 p-6 shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-sm shrink-0">
                    <Printer className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-black text-slate-900">
                      PRINTBOOTH™ – THINK IT. PRINT IT.
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Smart self-service printing kiosk business. We manufacture and sell complete turnkey kiosks directly to merchants, stationery shops, colleges, hospitals, and entrepreneurs. Once purchased, the machine, paper, ink, and daily operations are owned and operated by the merchant.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-purple-100 text-xs">
                  <div className="rounded-xl bg-white p-3 border border-purple-100">
                    <span className="block font-bold text-purple-900">1. Instant Self-Service</span>
                    <span className="text-[11px] text-slate-500">Print, Copy, Scan &amp; Cloud Docs</span>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-purple-100">
                    <span className="block font-bold text-purple-900">2. Compact Kiosk Unit</span>
                    <span className="text-[11px] text-slate-500">Malls, colleges &amp; transit hubs</span>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-purple-100">
                    <span className="block font-bold text-purple-900">3. Direct Machine Sales</span>
                    <span className="text-[11px] text-slate-500">Turnkey B2B merchant purchase</span>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-purple-100">
                    <span className="block font-bold text-purple-900">4. Autonomous OS</span>
                    <span className="text-[11px] text-slate-500">Cloud Print engine &amp; QR UPI</span>
                  </div>
                </div>
              </div>

              {/* Quick Jump to Centralized CRM */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between shadow-xs">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Centralized B2B Merchant Acquisition CRM</h3>
                  <p className="text-xs text-slate-500">Track merchant inquiries, 12-month sheets, call counts, and converted kiosk sales.</p>
                </div>
                <button
                  onClick={() => setActiveTab('crm')}
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
                >
                  <span>Open CRM Sheet</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 2. DEDICATED CENTRALIZED CRM TAB */}
          {activeTab === 'crm' && (
            <div className="bg-transparent">
              <CrmView onRefresh={refreshData} />
            </div>
          )}

          {/* 3. MACHINE ORDERS & DISPATCH TAB */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Kiosk Orders &amp; Dispatch Board</h3>
                  <p className="text-xs text-slate-500">Tracking direct machine sales to merchants from booking to delivery</p>
                </div>
                <button
                  onClick={() => setShowOrderModal(true)}
                  className="text-xs font-bold text-purple-700 hover:text-purple-800"
                >
                  + Record Machine Sale
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Package className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No machine orders recorded</h4>
                  <p className="mt-1 text-[11px] text-slate-400">
                    When a lead in CRM is marked &quot;Converted&quot;, an order is automatically added here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Order #</th>
                        <th className="py-2.5 px-3">Merchant / Store</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">Kiosk Model</th>
                        <th className="py-2.5 px-3 font-mono">Units</th>
                        <th className="py-2.5 px-3 font-mono">Total (₹)</th>
                        <th className="py-2.5 px-3">Stage</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-purple-700">{o.orderNumber}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{o.merchantName}</span>
                            <span className="text-[11px] text-slate-500">{o.shopName} · {o.city}</span>
                          </td>
                          <td className="py-3 px-3 font-mono">{o.phone}</td>
                          <td className="py-3 px-3 text-slate-800">{o.kioskModel}</td>
                          <td className="py-3 px-3 font-mono font-bold">{o.units}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹ {o.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3">
                            <span className="rounded bg-purple-50 text-purple-800 px-2 py-0.5 text-[10px] font-bold border border-purple-200">
                              {o.stage}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => setActiveChallanOrder(o)}
                                className="inline-flex items-center space-x-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 transition cursor-pointer"
                              >
                                <FileText className="h-3 w-3 text-purple-600" />
                                <span>Challan</span>
                              </button>
                              {o.stage !== 'Delivered' ? (
                                <button
                                  onClick={() => {
                                    adjsDb.advanceOrderStage(o.id);
                                    refreshData();
                                  }}
                                  className="inline-flex items-center space-x-1 rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 px-2 py-1 text-[11px] font-bold text-purple-900 transition cursor-pointer"
                                >
                                  <span>Advance Stage</span>
                                  <ChevronRight className="h-3 w-3" />
                                </button>
                              ) : (
                                <span className="text-emerald-700 text-[11px] font-bold">✓ Delivered</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. SOFTWARE & KIOSK OS TAB (DEVELOPER DESK) */}
          {activeTab === 'software' && (
            <DeveloperWorkspace />
          )}

          {/* 5. MERCHANT HELPDESK & CHALLANS */}
          {activeTab === 'support' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Merchant Onboarding &amp; Support Helpdesk</h3>
                  <p className="text-xs text-slate-500">Assisting merchants with kiosk software setup, Wi-Fi pairing, and invoicing</p>
                </div>
                <button
                  onClick={() => setShowTicketModal(true)}
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Raise Support Ticket</span>
                </button>
              </div>

              {tickets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <HelpCircle className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No open merchant support tickets</h4>
                  <p className="mt-1 text-[11px] text-slate-400">All merchant onboarding and setup requests are up to date.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Ticket #</th>
                        <th className="py-2.5 px-3">Merchant Name</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {tickets.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-purple-700">{t.ticketNumber}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{t.merchantName}</td>
                          <td className="py-3 px-3 font-mono">{t.phone}</td>
                          <td className="py-3 px-3 text-slate-800">{t.issueType}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                                t.status === 'Resolved'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : t.status === 'In Progress'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {t.status !== 'Resolved' ? (
                              <button
                                onClick={() => {
                                  adjsDb.resolveTicket(t.id);
                                  refreshData();
                                }}
                                className="rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[11px] font-bold transition cursor-pointer"
                              >
                                Mark Resolved
                              </button>
                            ) : (
                              <span className="text-emerald-700 text-[11px] font-bold">✓ Resolved</span>
                            )}
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

      {/* Modal: Record Machine Sale */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Record Direct Machine Sale</h3>
            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Merchant / Contact Name *</label>
                <input
                  type="text"
                  required
                  value={orderMerchant}
                  onChange={(e) => setOrderMerchant(e.target.value)}
                  placeholder=""
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={orderPhone}
                    onChange={(e) => setOrderPhone(e.target.value)}
                    placeholder=""
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shop / Business Name</label>
                  <input
                    type="text"
                    value={orderShop}
                    onChange={(e) => setOrderShop(e.target.value)}
                    placeholder=""
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kiosk Model</label>
                <select
                  value={orderModel}
                  onChange={(e) => setOrderModel(e.target.value as KioskModelType)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none font-bold"
                >
                  {KIOSK_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Units</label>
                  <input
                    type="number"
                    min={1}
                    value={orderUnits}
                    onChange={(e) => setOrderUnits(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price / Unit (₹)</label>
                  <input
                    type="number"
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={orderCity}
                    onChange={(e) => setOrderCity(e.target.value)}
                    placeholder=""
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Save Machine Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Dispatch Challan */}
      <DispatchChallanModal
        order={activeChallanOrder}
        onClose={() => setActiveChallanOrder(null)}
      />

      {/* Modal: Support Ticket */}
      <SupportTicketModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        onTicketCreated={refreshData}
      />
    </div>
  );
}

export default function AdjsDashboard(props: BusinessDashboardProps) {
  let role = props.role;
  if (!role && typeof window !== 'undefined') {
    try {
      const match = document.cookie.match(/homeseva_session=([^;]+)/);
      if (match && match[1]) {
        const parts = match[1].split('.');
        if (parts[0]) {
          const json = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(json);
          if (payload.role) role = payload.role;
        }
      }
    } catch {}
  }
  role = role || 'Staff';

  const normalizedRole = (role || '').trim().toLowerCase();
  const isColdcaller = normalizedRole.includes('call') || normalizedRole.includes('tele');

  // STRICT ROLE SANDBOXING: Coldcaller MUST ONLY see their dedicated calling desk!
  if (isColdcaller) {
    return <ColdcallerDashboard {...props} role={role} />;
  }

  return <EnterpriseDashboard {...props} role={role} />;
}

