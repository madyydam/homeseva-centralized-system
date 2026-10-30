'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { InventoryProvider, useInventory } from './InventoryContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AvailabilityView } from './components/AvailabilityView';
import { BookingsView } from './components/BookingsView';
import { InvoicesView } from './components/InvoicesView';
import { ItemsView } from './components/ItemsView';
import { CustomersView } from './components/CustomersView';
import { LedgerView } from './components/LedgerView';
import { CleaningView } from './components/CleaningView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';

import { DispatchModal } from './components/DispatchModal';
import { ReturnModal } from './components/ReturnModal';
import { InvoiceModal } from './components/InvoiceModal';
import { PaymentModal } from './components/PaymentModal';
import { NewBookingModal } from './components/NewBookingModal';

import { Booking, Invoice, UserRole } from './types';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  FileText,
  Package,
  Users,
  FileSpreadsheet,
  Droplets,
  TrendingUp,
  Settings,
  User,
  ArrowLeft,
} from 'lucide-react';

export function CrockeryRentalApp() {
  return (
    <InventoryProvider>
      <MainApp />
    </InventoryProvider>
  );
}

function MainApp() {
  const { role, setRole, bookings, invoices, generateInvoice } = useInventory();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals state
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [dispatchBookingTarget, setDispatchBookingTarget] = useState<Booking | null>(null);
  const [returnBookingTarget, setReturnBookingTarget] = useState<Booking | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentBookingTarget, setPaymentBookingTarget] = useState<Booking | null>(null);
  const [paymentInvoiceTarget, setPaymentInvoiceTarget] = useState<Invoice | null>(null);

  const [bookingDetailTarget, setBookingDetailTarget] = useState<Booking | null>(null);

  const overdueCount = useMemo(() => {
    return bookings.filter((b) => b.status === 'Overdue').length;
  }, [bookings]);

  const navItems = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'availability', label: 'Availability', icon: Calendar },
      {
        id: 'bookings',
        label: 'Bookings & Quotes',
        icon: ClipboardList,
        badge: overdueCount > 0 ? `${overdueCount}` : undefined,
      },
      ...(role !== 'godown' ? [{ id: 'invoices', label: 'Invoices & Billing', icon: FileText }] : []),
      { id: 'items', label: 'Item Master & Stock', icon: Package },
      { id: 'customers', label: 'Customers', icon: Users },
      { id: 'ledger', label: 'Stock Ledger', icon: FileSpreadsheet },
      { id: 'cleaning', label: 'Wash Station', icon: Droplets },
      ...(role !== 'godown' ? [{ id: 'reports', label: 'Reports', icon: TrendingUp }] : []),
      ...(role === 'owner' ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
    ],
    [overdueCount, role]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header - Slim & Clean */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Workspace Body */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 px-4 sm:px-6 py-4 gap-6">
        {/* Left Navigation Sidebar - Stays Dark */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="sticky top-14 h-[calc(100vh-4.5rem)] flex flex-col justify-between rounded-2xl bg-slate-900 border border-slate-800 p-2.5 shadow-xl">
            {/* Top Navigation Items */}
            <div className="space-y-1 flex-1 overflow-y-auto pr-0.5">
              {/* Brand Header */}
              <div className="flex items-center justify-between px-3 py-2 mb-2 border-b border-slate-800/80">
                <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                  Crockery Rental
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="System Live" />
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`group relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/90 hover:translate-x-1 hover:shadow-xs active:scale-98'
                    }`}
                  >
                    {/* Indicator on Active */}
                    <span
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r transition-all duration-200 ${
                        isActive
                          ? 'h-4 bg-white opacity-100'
                          : 'h-0 bg-amber-400 opacity-0 group-hover:h-3 group-hover:opacity-100'
                      }`}
                    />

                    <div className="flex items-center gap-2.5 pl-1">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                          isActive
                            ? 'text-white scale-110'
                            : 'text-slate-400 group-hover:text-amber-400 group-hover:scale-115'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="rounded-full bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 shadow-xs group-hover:scale-110 transition-transform">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Pinned Active Role Selector */}
            <div className="pt-2 mt-auto border-t border-slate-800/80 space-y-2">
              <div className="rounded-xl bg-slate-950/80 p-2.5 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-amber-500" />
                    <span>Role Access</span>
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-2 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="owner">👑 Owner (All Access)</option>
                  <option value="manager">💼 Manager</option>
                  <option value="counter">📞 Counter Staff</option>
                  <option value="godown">📦 Godown Staff</option>
                  <option value="accountant">📊 Accountant</option>
                </select>
              </div>

              {/* Portal Exit */}
              <Link
                href="/signin/horeca-essentials"
                className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Exit to Portal</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Center Main Tabbed Content Area */}
        <main className="flex-1 min-w-0">
          {/* Mobile Tab Scroller */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 border-b border-slate-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                    isActive
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active View Dispatcher */}
          {activeTab === 'dashboard' && (
            <DashboardView
              onDispatchClick={(b) => setDispatchBookingTarget(b)}
              onReturnClick={(b) => setReturnBookingTarget(b)}
              onNewBookingClick={() => setShowNewBooking(true)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onViewBooking={(b) => {
                setBookingDetailTarget(b);
                setActiveTab('bookings');
              }}
            />
          )}

          {activeTab === 'availability' && (
            <AvailabilityView
              onBookItem={() => {
                setShowNewBooking(true);
              }}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsView
              initialSelectedBooking={bookingDetailTarget}
              onDispatch={(b) => setDispatchBookingTarget(b)}
              onReturn={(b) => setReturnBookingTarget(b)}
              onInvoice={(b) => {
                const existing = invoices.find((inv) => inv.booking_id === b.id);
                if (existing) {
                  setSelectedInvoice(existing);
                } else {
                  const newInv = generateInvoice(b.id);
                  setSelectedInvoice(newInv);
                }
              }}
              onPayment={(b) => setPaymentBookingTarget(b)}
              onNewBooking={() => setShowNewBooking(true)}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesView
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onRecordPayment={(inv) => setPaymentInvoiceTarget(inv)}
            />
          )}

          {activeTab === 'items' && <ItemsView />}

          {activeTab === 'customers' && <CustomersView />}

          {activeTab === 'ledger' && <LedgerView />}

          {activeTab === 'cleaning' && <CleaningView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Interactive Modals */}
      {showNewBooking && (
        <NewBookingModal
          onClose={() => setShowNewBooking(false)}
          onSuccess={() => {
            setShowNewBooking(false);
            setActiveTab('bookings');
          }}
        />
      )}

      {dispatchBookingTarget && (
        <DispatchModal
          booking={dispatchBookingTarget}
          onClose={() => setDispatchBookingTarget(null)}
        />
      )}

      {returnBookingTarget && (
        <ReturnModal
          booking={returnBookingTarget}
          onClose={() => setReturnBookingTarget(null)}
          onViewInvoice={(inv) => {
            setReturnBookingTarget(null);
            setSelectedInvoice(inv);
          }}
        />
      )}

      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onRecordPayment={(inv) => {
            setSelectedInvoice(null);
            setPaymentInvoiceTarget(inv);
          }}
        />
      )}

      {(paymentBookingTarget || paymentInvoiceTarget) && (
        <PaymentModal
          booking={paymentBookingTarget || undefined}
          invoice={paymentInvoiceTarget || undefined}
          onClose={() => {
            setPaymentBookingTarget(null);
            setPaymentInvoiceTarget(null);
          }}
        />
      )}
    </div>
  );
}

export default CrockeryRentalApp;
