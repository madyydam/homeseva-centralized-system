'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Wine,
  Boxes,
  Receipt,
  Plus,
  LogOut,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { BusinessDashboardProps } from '../types';
import { horecaEssentialsConfig } from './config';
import { horecaEssentialsDb } from './db';
import {
  EssentialsSaleItem,
  CrockeryRentalBookingItem,
  HorecaStockItem,
  HorecaEssentialsData,
} from './types';
import CrockeryRentalApp from './crockery-rental/CrockeryRentalApp';

export default function HorecaEssentialsDashboard({
  division = 'essentials-sales',
  role = 'Wholesale Sales Executive',
}: BusinessDashboardProps) {
  const [activeDivision, setActiveDivision] = useState<'essentials-sales' | 'crockery-rental'>(
    division === 'crockery-rental' ? 'crockery-rental' : 'essentials-sales'
  );

  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'rentals' | 'stock'>('overview');
  const [data, setData] = useState<HorecaEssentialsData>({
    salesOrders: [],
    rentalBookings: [],
    stockItems: [],
  });

  const refreshData = () => {
    setData({ ...horecaEssentialsDb.getData() });
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Modals state
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  // Form states: Sale
  const [saleClient, setSaleClient] = useState('');
  const [salePhone, setSalePhone] = useState('');
  const [saleItems, setSaleItems] = useState('Stainless Steel Commercial Cookware Set + Buffet Chafers');
  const [saleSubtotal, setSaleSubtotal] = useState('48000');

  // Form states: Rental
  const [rentalEvent, setRentalEvent] = useState('Grand Wedding Banquet (500 Pax)');
  const [rentalCaterer, setRentalCaterer] = useState('');
  const [rentalPhone, setRentalPhone] = useState('');
  const [rentalItems, setRentalItems] = useState('500 Bone China Dinner Plates + 500 Wine Goblets + Cutlery');
  const [rentalCharges, setRentalCharges] = useState('35000');
  const [rentalDeposit, setRentalDeposit] = useState('15000');
  const [rentalReturnDate, setRentalReturnDate] = useState('');

  // Form states: Stock
  const [stockName, setStockName] = useState('');
  const [stockSku, setStockSku] = useState('');
  const [stockQty, setStockQty] = useState('200');
  const [stockRate, setStockRate] = useState('250');

  const totalWholesaleRevenue = data.salesOrders.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  const totalRentalRevenue = data.rentalBookings.reduce((sum, r) => sum + (Number(r.rentalCharges) || 0), 0);
  const activeRentalBookings = data.rentalBookings.filter((r) => r.status === 'Booked' || r.status === 'Dispatched').length;

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleClient.trim()) return;
    const sub = Number(saleSubtotal) || 0;
    const gst = Math.round(sub * 0.18);
    const newSale: EssentialsSaleItem = {
      id: `HRC-SAL-${String(data.salesOrders.length + 1).padStart(3, '0')}`,
      orderNumber: `HRC/SAL/2026/${String(data.salesOrders.length + 101)}`,
      clientName: saleClient.trim(),
      phone: salePhone.trim(),
      itemsSummary: saleItems.trim(),
      subtotal: sub,
      gstAmount: gst,
      totalAmount: sub + gst,
      paymentStatus: 'Paid',
      orderDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    horecaEssentialsDb.addSaleOrder(newSale);
    refreshData();
    setShowSaleModal(false);
    setSaleClient('');
    setSalePhone('');
  };

  const handleCreateRental = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rentalCaterer.trim()) return;
    const newRental: CrockeryRentalBookingItem = {
      id: `CRK-RENT-${String(data.rentalBookings.length + 1).padStart(3, '0')}`,
      bookingRef: `RENT/2026/${String(data.rentalBookings.length + 101)}`,
      eventName: rentalEvent.trim(),
      catererOrClient: rentalCaterer.trim(),
      phone: rentalPhone.trim(),
      eventDate: new Date().toISOString().split('T')[0] || '',
      returnDate: rentalReturnDate || 'Next Day',
      itemsRented: rentalItems.trim(),
      rentalCharges: Number(rentalCharges) || 0,
      securityDeposit: Number(rentalDeposit) || 0,
      status: 'Booked',
      breakagesRecorded: 0,
    };
    horecaEssentialsDb.addRentalBooking(newRental);
    refreshData();
    setShowRentalModal(false);
    setRentalCaterer('');
  };

  const handleCreateStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockName.trim()) return;
    const newStock: HorecaStockItem = {
      id: `STK-${String(data.stockItems.length + 1).padStart(3, '0')}`,
      sku: stockSku || `SKU-${Date.now().toString().slice(-4)}`,
      name: stockName.trim(),
      division: activeDivision,
      totalUnits: Number(stockQty) || 0,
      availableUnits: Number(stockQty) || 0,
      ratePerUnit: Number(stockRate) || 0,
      unit: 'Units',
    };
    horecaEssentialsDb.addStockItem(newStock);
    refreshData();
    setShowStockModal(false);
    setStockName('');
  };

  if (activeDivision === 'crockery-rental') {
    return <CrockeryRentalApp />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans selection:bg-emerald-600 selection:text-white">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 md:h-screen md:sticky md:top-0 z-30">
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <UtensilsCrossed className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs font-black text-slate-900 truncate">HORECA Essentials</h1>
                <p className="text-[10px] font-semibold text-emerald-700 truncate">
                  Essentials Sales
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 space-y-4">
            {/* Division Switcher Pill */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
              <button
                onClick={() => setActiveDivision('essentials-sales')}
                className="flex-1 py-1.5 rounded-lg transition text-center bg-white text-emerald-900 shadow-2xs font-extrabold"
              >
                Sales
              </button>
              <button
                onClick={() => setActiveDivision('crockery-rental')}
                className="flex-1 py-1.5 rounded-lg transition text-center text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Crockery Rental
              </button>
            </div>

            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Practice Modules
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'overview'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab('sales')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'sales'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  <span>B2B Wholesale Sales</span>
                  <span className="ml-auto rounded-full bg-emerald-100 text-emerald-800 px-1.5 text-[10px] font-mono font-bold">
                    {data.salesOrders.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('rentals')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'rentals'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Wine className="h-4 w-4 text-emerald-600" />
                  <span>Banquet Crockery Rentals</span>
                  <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                    {data.rentalBookings.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('stock')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'stock'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Boxes className="h-4 w-4 text-emerald-600" />
                  <span>Inventory Catalog</span>
                  <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                    {data.stockItems.length}
                  </span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5 mb-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-xs font-black text-white shrink-0 shadow-2xs">
              HE
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-900 truncate leading-tight">HORECA Officer</span>
              <span className="block text-[10px] text-emerald-700 font-semibold truncate leading-tight">{role}</span>
            </div>
          </div>
          <Link
            href="/signin/horeca-essentials"
            className="w-full flex items-center justify-center space-x-1.5 rounded-lg border border-slate-200 bg-white py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
          >
            <LogOut className="h-3 w-3" />
            <span>Switch Division / Exit</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div>
            <span className="text-sm font-extrabold text-slate-900">HORECA Essentials</span>
            <p className="text-[11px] text-slate-500 font-medium">
              Active: Essentials Sales · Isolated DB
            </p>
          </div>
          <button
            onClick={() => setShowSaleModal(true)}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Wholesale Sale</span>
          </button>
        </header>

        <div className="p-6 space-y-6 max-w-7xl">
          {/* SALES TABLE */}
          {(activeTab === 'overview' || activeTab === 'sales') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">B2B Wholesale Sales Invoices</h3>
                  <p className="text-xs text-slate-500">Commercial kitchen equipment and dining ware sales</p>
                </div>
                <button onClick={() => setShowSaleModal(true)} className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
                  + New Sale
                </button>
              </div>

              {data.salesOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Receipt className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No wholesale orders recorded</h4>
                  <p className="mt-1 text-[11px] text-slate-400">Enter your first B2B hospitality sales invoice.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Order #</th>
                        <th className="py-2.5 px-3">Client / Hotel</th>
                        <th className="py-2.5 px-3">Items Summary</th>
                        <th className="py-2.5 px-3 font-mono">Total with GST</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.salesOrders.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-emerald-700">{s.orderNumber}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{s.clientName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{s.phone}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 max-w-[220px] truncate">{s.itemsSummary}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹ {s.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3">
                            <span className="rounded bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                              {s.paymentStatus}
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

          {/* RENTALS TABLE */}
          {(activeTab === 'overview' || activeTab === 'rentals') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Crockery &amp; Banquet Event Rental Roster</h3>
                  <p className="text-xs text-slate-500">Event hires, security deposits, and return inspections</p>
                </div>
                <button onClick={() => setShowRentalModal(true)} className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
                  + Book Hire
                </button>
              </div>

              {data.rentalBookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Wine className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No crockery rental bookings</h4>
                  <p className="mt-1 text-[11px] text-slate-400">Book banquet plates, wine glasses, and chafers for events.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Booking #</th>
                        <th className="py-2.5 px-3">Event &amp; Caterer</th>
                        <th className="py-2.5 px-3">Items Hired</th>
                        <th className="py-2.5 px-3 font-mono">Rental Fee</th>
                        <th className="py-2.5 px-3 font-mono">Security Deposit</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.rentalBookings.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-emerald-700">{r.bookingRef}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{r.eventName}</span>
                            <span className="text-[10px] text-slate-500">Caterer: {r.catererOrClient}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 max-w-[220px] truncate">{r.itemsRented}</td>
                          <td className="py-3 px-3 font-mono font-bold">₹ {r.rentalCharges.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 font-mono text-emerald-700">₹ {r.securityDeposit.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3">
                            <span className="rounded bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                              {r.status}
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
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Record B2B Wholesale Sale</h3>
            <form onSubmit={handleCreateSale} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hotel / Client Name *</label>
                <input
                  type="text"
                  value={saleClient}
                  onChange={(e) => setSaleClient(e.target.value)}
                  placeholder="e.g. Radisson Blu Banquets"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={salePhone}
                  onChange={(e) => setSalePhone(e.target.value)}
                  placeholder="+91..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Items Description</label>
                <input
                  type="text"
                  value={saleItems}
                  onChange={(e) => setSaleItems(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtotal Amount (₹)</label>
                <input
                  type="number"
                  value={saleSubtotal}
                  onChange={(e) => setSaleSubtotal(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none font-mono"
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
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Save Sale Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rental */}
      {showRentalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Book Banquet Crockery Rental</h3>
            <form onSubmit={handleCreateRental} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Event Name *</label>
                <input
                  type="text"
                  value={rentalEvent}
                  onChange={(e) => setRentalEvent(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Caterer / Client Name *</label>
                <input
                  type="text"
                  value={rentalCaterer}
                  onChange={(e) => setRentalCaterer(e.target.value)}
                  placeholder="e.g. Royal Caterers"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rental Charges (₹)</label>
                  <input
                    type="number"
                    value={rentalCharges}
                    onChange={(e) => setRentalCharges(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deposit (₹)</label>
                  <input
                    type="number"
                    value={rentalDeposit}
                    onChange={(e) => setRentalDeposit(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRentalModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Confirm Rental Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

