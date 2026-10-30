import React, { useState, useMemo, useCallback } from 'react';
import { useInventory } from '../InventoryContext';
import { Invoice, Booking } from '../types';
import {
  FileText,
  Search,
  PlusCircle,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  Eye,
  CreditCard,
  Building2,
  Calendar,
  AlertTriangle,
  X,
  ChevronRight,
  ShieldAlert,
  Percent,
  Truck,
  Hash,
} from 'lucide-react';

interface InvoicesViewProps {
  onSelectInvoice: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ onSelectInvoice, onRecordPayment }) => {
  const { invoices, bookings, generateInvoice, profile, payments } = useInventory();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'final'>('all');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    invoices[0]?.id || ''
  );

  // Create Invoice Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    bookings[0]?.id || ''
  );
  const [taxRate, setTaxRate] = useState<number>(18);
  const [damageWaiver, setDamageWaiver] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchSearch =
        !q ||
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.customer_name.toLowerCase().includes(q) ||
        inv.booking_number.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [invoices, statusFilter, search]);

  const activeInvoice = useMemo(() => {
    return invoices.find((i) => i.id === selectedInvoiceId) || filteredInvoices[0] || null;
  }, [invoices, selectedInvoiceId, filteredInvoices]);

  const { totalBilled, totalOutstanding } = useMemo(() => {
    let billed = 0;
    let outstanding = 0;
    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];
      if (!inv) continue;
      billed += inv.total_amount;
      outstanding += inv.balance_due;
    }
    return { totalBilled: billed, totalOutstanding: outstanding };
  }, [invoices]);

  const handleShareWhatsApp = (inv: Invoice) => {
    const phone = inv.customer_phone.replace(/\D/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const text = encodeURIComponent(
      `Hello ${inv.customer_name},\n\nYour official Tax & Rental Invoice from *${profile.name}* is ready:\n` +
        `• Invoice No: *#${inv.invoice_number}*\n` +
        `• Total Amount: *₹${inv.total_amount.toLocaleString('en-IN')}*\n` +
        `• Advance Received: *₹${inv.advance_paid.toLocaleString('en-IN')}*\n` +
        `• *Balance Due: ₹${inv.balance_due.toLocaleString('en-IN')}*\n` +
        `• UPI ID: *${profile.upi_id}*\n\nThank you for choosing ${profile.name}!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleGenerateNewInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) return;

    try {
      const newInv = generateInvoice(
        selectedBookingId,
        taxRate,
        damageWaiver,
        discountAmount
      );
      setShowCreateModal(false);
      setSelectedInvoiceId(newInv.id);
    } catch (err: any) {
      alert(err.message || 'Error generating invoice');
    }
  };

  // Find booking for create invoice modal preview
  const targetBooking = bookings.find((b) => b.id === selectedBookingId);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-black text-foreground">
                Invoices & Billing Hub
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Financial year sequential tax invoices (e.g. 26-27/0086) with breakage settlement, GST & delivery logistics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search invoice #, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-input bg-background pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Create Invoice Action Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95 transition cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Invoice</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats & Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              All Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setStatusFilter('final')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                statusFilter === 'final'
                  ? 'bg-amber-600 text-white'
                  : 'bg-muted/40 text-amber-600 hover:bg-amber-500/10'
              }`}
            >
              Due / Unpaid ({invoices.filter((i) => i.status !== 'paid').length})
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                statusFilter === 'paid'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-muted/40 text-emerald-600 hover:bg-emerald-500/10'
              }`}
            >
              Settled / Paid ({invoices.filter((i) => i.status === 'paid').length})
            </button>
          </div>

          <div className="flex items-center gap-5 text-xs font-mono">
            <span>
              Total Billed: <strong className="text-foreground">₹{totalBilled.toLocaleString('en-IN')}</strong>
            </span>
            <span>
              Total Due: <strong className="text-rose-600 font-bold">₹{totalOutstanding.toLocaleString('en-IN')}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Content: Invoices List on Left + Dedicated Details Section on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Invoices List (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Invoice Records ({filteredInvoices.length})
            </span>
            <span className="text-[11px] text-muted-foreground">Click row to preview details</span>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground">
              No invoices found matching current filter.
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[750px] overflow-y-auto">
              {filteredInvoices.map((inv) => {
                const isSelected = activeInvoice?.id === inv.id;
                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoiceId(inv.id)}
                    className={`p-4 transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-l-4 border-amber-600'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-foreground">
                          #{inv.invoice_number}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                            inv.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-foreground truncate">
                        {inv.customer_name}
                      </h4>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>{new Date(inv.issued_at).toLocaleDateString('en-IN')}</span>
                        <span>•</span>
                        <span>Ref #{inv.booking_number}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-sm text-foreground">
                        ₹{inv.total_amount.toLocaleString('en-IN')}
                      </div>
                      <div
                        className={`text-xs font-mono font-semibold ${
                          inv.balance_due > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {inv.balance_due > 0 ? `Due: ₹${inv.balance_due.toLocaleString('en-IN')}` : 'Paid ✓'}
                      </div>
                    </div>

                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition ${
                        isSelected ? 'text-amber-600 translate-x-0.5' : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Dedicated "Invoice Details & Line Items" Section (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          {activeInvoice ? (
            <div className="space-y-6">
              {/* Details Header & Top Actions */}
              <div className="p-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-mono font-black text-lg text-foreground">
                      Invoice #{activeInvoice.invoice_number}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        activeInvoice.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}
                    >
                      {activeInvoice.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Financial Year: {activeInvoice.financial_year} • Issued on {new Date(activeInvoice.issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectInvoice(activeInvoice)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print / Full Document</span>
                  </button>

                  <button
                    onClick={() => handleShareWhatsApp(activeInvoice)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                    title="Send to customer WhatsApp"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  {activeInvoice.balance_due > 0 && (
                    <button
                      onClick={() => onRecordPayment(activeInvoice)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition cursor-pointer"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Collect Payment</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Customer and Logistics Info Cards */}
              <div className="px-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-1 text-xs">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block">
                    Billed To / Customer
                  </span>
                  <div className="font-bold text-sm text-foreground">
                    {activeInvoice.customer_name}
                  </div>
                  <p className="text-muted-foreground">{activeInvoice.customer_address}</p>
                  <p className="font-mono text-foreground font-semibold pt-0.5">
                    Phone: {activeInvoice.customer_phone}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-1 text-xs">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block">
                    Logistics & Rental Term
                  </span>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking Ref:</span>
                    <strong className="font-mono text-foreground">#{activeInvoice.booking_number}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Date:</span>
                    <strong className="font-mono text-foreground">{activeInvoice.delivery_date}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Return Date:</span>
                    <strong className="font-mono text-foreground">{activeInvoice.return_date}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billable Period:</span>
                    <strong className="font-mono text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 px-1 rounded">
                      {activeInvoice.rent_days} Day(s)
                    </strong>
                  </div>
                </div>
              </div>

              {/* Line Items Table Breakdown */}
              <div className="px-6 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Itemized Billing & Line Items
                  </h4>
                  <span className="text-[11px] text-muted-foreground">SAC: 997312 (Rental Services)</span>
                </div>

                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 text-muted-foreground font-bold border-b border-border text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Rate</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {activeInvoice.lines.map((l, idx) => (
                        <tr
                          key={l.id}
                          className={l.type === 'damage' ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''}
                        >
                          <td className="py-2.5 px-3 text-muted-foreground">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-medium text-foreground">
                            {l.description}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            {l.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                            ₹{l.rate.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                            ₹{l.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals & Balance Due Summary */}
              <div className="px-6 pb-6">
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Crockery Rental Charge:</span>
                    <span className="font-mono text-foreground font-semibold">
                      ₹{activeInvoice.rent_amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {activeInvoice.transport_charge > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Transport & Delivery Charge:</span>
                      <span className="font-mono text-foreground font-semibold">
                        ₹{activeInvoice.transport_charge.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {activeInvoice.damage_amount > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Breakage / Missing Charge:</span>
                      <span className="font-mono">
                        +₹{activeInvoice.damage_amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {activeInvoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Promotional Discount:</span>
                      <span className="font-mono">
                        -₹{activeInvoice.discount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground pt-1 border-t border-border">
                    <span>GST ({activeInvoice.tax_rate}%):</span>
                    <span className="font-mono text-foreground">
                      ₹{activeInvoice.tax_amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border">
                    <span>Total Tax Invoice:</span>
                    <span className="font-mono text-base">
                      ₹{activeInvoice.total_amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Advance Payment Received:</span>
                    <span className="font-mono text-emerald-600 font-bold">
                      ₹{activeInvoice.advance_paid.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div
                    className={`flex justify-between items-center p-3 rounded-lg text-sm font-black ${
                      activeInvoice.balance_due > 0
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    <span>NET BALANCE DUE:</span>
                    <span className="font-mono text-lg">
                      ₹{activeInvoice.balance_due.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-muted-foreground space-y-2">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm font-bold">No Invoice Selected</p>
              <p className="text-xs">Select an invoice from the list or click "Create Invoice" to generate one.</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE INVOICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Create Commercial Tax Invoice
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Select a booking and configure billing terms to generate sequential FY invoice
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateNewInvoice} className="p-6 space-y-5">
              {/* Select Booking */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Select Booking Reference:
                </label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  required
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.booking_number} • {b.customer_name} ({b.delivery_date} to {b.expected_return_date}) - {b.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Booking Quick Snapshot */}
              {targetBooking && (
                <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">{targetBooking.customer_name}</span>
                    <span className="font-mono text-muted-foreground">{targetBooking.customer_phone}</span>
                  </div>
                  <div className="text-muted-foreground">
                    Items: {targetBooking.items.length} product(s) | Status:{' '}
                    <strong className="text-foreground capitalize">{targetBooking.status}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border font-mono text-[11px]">
                    <span>Advance Received: ₹{targetBooking.advance_paid}</span>
                    {targetBooking.damage_charge > 0 && (
                      <span className="text-rose-600 font-bold">
                        Unsettled Damage: ₹{targetBooking.damage_charge}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Billing Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">GST Rate (%):</label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full rounded-xl border border-input bg-background p-2 text-xs text-foreground cursor-pointer"
                  >
                    <option value={18}>18% (Standard SAC 997312)</option>
                    <option value={12}>12% (Reduced)</option>
                    <option value={5}>5% (Special)</option>
                    <option value={0}>0% (Tax Exempt / Bill of Supply)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Damage Waiver (₹):</label>
                  <input
                    type="number"
                    min="0"
                    value={damageWaiver}
                    onChange={(e) => setDamageWaiver(Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-xl border border-input bg-background p-2 text-xs text-foreground font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground">Waive breakage charges</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Discount (₹):</label>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-xl border border-input bg-background p-2 text-xs text-foreground font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground">Promotional discount</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 cursor-pointer"
                >
                  Generate Official Tax Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
