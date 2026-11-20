import React, { useState, useMemo } from 'react';
import { useInventory } from '../InventoryContext';
import { Invoice, InvoiceFirm } from '../types';
import { INVOICE_FIRMS } from '../firms';
import { CreateInvoiceModal } from './CreateInvoiceModal';
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
  ChevronRight,
  Download,
  Filter,
  Sparkles,
} from 'lucide-react';

interface InvoicesViewProps {
  onSelectInvoice: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ onSelectInvoice, onRecordPayment }) => {
  const { invoices } = useInventory();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'final'>('all');
  const [firmFilter, setFirmFilter] = useState<'all' | InvoiceFirm>('all');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    invoices[0]?.id || ''
  );

  // New Create Invoice Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchFirm = firmFilter === 'all' || (inv.firm || 'someshwar') === firmFilter;
      const matchSearch =
        !q ||
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.customer_name.toLowerCase().includes(q) ||
        inv.booking_number.toLowerCase().includes(q) ||
        (inv.customer_phone || '').includes(q);
      return matchStatus && matchFirm && matchSearch;
    });
  }, [invoices, statusFilter, firmFilter, search]);

  const activeInvoice = useMemo(() => {
    return invoices.find((i) => i.id === selectedInvoiceId) || filteredInvoices[0] || null;
  }, [invoices, selectedInvoiceId, filteredInvoices]);

  const { totalBilled, totalOutstanding, someshwarCount, homesevaCount } = useMemo(() => {
    let billed = 0;
    let outstanding = 0;
    let someshwar = 0;
    let homeseva = 0;
    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];
      if (!inv) continue;
      billed += inv.total_amount;
      outstanding += inv.balance_due;
      if (inv.firm === 'homeseva') {
        homeseva++;
      } else {
        someshwar++;
      }
    }
    return {
      totalBilled: billed,
      totalOutstanding: outstanding,
      someshwarCount: someshwar,
      homesevaCount: homeseva,
    };
  }, [invoices]);

  const handleShareWhatsApp = (inv: Invoice) => {
    const firm = INVOICE_FIRMS[inv.firm || 'someshwar'];
    const phone = (inv.customer_phone || '').replace(/\D/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const text = encodeURIComponent(
      `Hello ${inv.customer_name},\n\n` +
        `Your official Tax & Rental Invoice from *${firm.name}* is ready:\n` +
        `• Invoice No: *#${inv.invoice_number}*\n` +
        `• Total Amount: *₹${inv.total_amount.toLocaleString('en-IN')}*\n` +
        `• Advance Received: *₹${(inv.advance_paid || 0).toLocaleString('en-IN')}*\n` +
        `• *Balance Due: ₹${inv.balance_due.toLocaleString('en-IN')}*\n\n` +
        `Bank Details:\n` +
        `A/c Name: ${firm.bank.accountHolder}\n` +
        `Bank: ${firm.bank.bankName}\n` +
        `A/c No: ${firm.bank.accountNumber}\n` +
        `IFSC: ${firm.bank.branchAndIfsc}\n\n` +
        `Thank you for choosing ${firm.name}!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleInvoiceCreated = (created: Invoice) => {
    setShowCreateModal(false);
    setSelectedInvoiceId(created.id);
    onSelectInvoice(created);
  };

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
              Dual-firm billing (Someshwar Enterprises & Homeseva 2024-2025) with exact PDF formats, A4 printing & PDF download.
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
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Invoice</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats & Filter Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pt-3 border-t border-border">
          {/* Dual Filters: Firm & Status */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Firm Selector Pills */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs font-bold border border-border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase px-1.5">
                Entity:
              </span>
              <button
                onClick={() => setFirmFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  firmFilter === 'all'
                    ? 'bg-card text-foreground shadow-xs font-black'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({invoices.length})
              </button>
              <button
                onClick={() => setFirmFilter('someshwar')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${
                  firmFilter === 'someshwar'
                    ? 'bg-lime-600 text-white shadow-xs font-black'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-lime-400"></span>
                <span>Someshwar ({someshwarCount})</span>
              </button>
              <button
                onClick={() => setFirmFilter('homeseva')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${
                  firmFilter === 'homeseva'
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                <span>HomeSeva ({homesevaCount})</span>
              </button>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter('final')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  statusFilter === 'final'
                    ? 'bg-amber-600 text-white'
                    : 'bg-muted/40 text-amber-600 hover:bg-amber-500/10'
                }`}
              >
                Unpaid / Due ({invoices.filter((i) => i.status !== 'paid').length})
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  statusFilter === 'paid'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted/40 text-emerald-600 hover:bg-emerald-500/10'
                }`}
              >
                Paid ({invoices.filter((i) => i.status === 'paid').length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs font-mono ml-auto">
            <span>
              Total Billed: <strong className="text-foreground">₹{totalBilled.toLocaleString('en-IN')}</strong>
            </span>
            <span>
              Total Due: <strong className="text-rose-600 font-bold">₹{totalOutstanding.toLocaleString('en-IN')}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Content: Invoices History List on Left + Live Document Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Invoices History List (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Invoice History ({filteredInvoices.length})
            </span>
            <span className="text-[11px] text-muted-foreground">Click row to open details</span>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-3">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="font-semibold">No invoices found matching current filter.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Create New Invoice</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[750px] overflow-y-auto">
              {filteredInvoices.map((inv) => {
                const isSelected = activeInvoice?.id === inv.id;
                const firmKey = inv.firm || 'someshwar';
                const firmConfig = INVOICE_FIRMS[firmKey];

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
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-foreground">
                          #{inv.invoice_number}
                        </span>

                        {/* Firm Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            firmKey === 'someshwar'
                              ? 'bg-lime-100 text-lime-800 border border-lime-200 dark:bg-lime-950/60 dark:text-lime-400'
                              : 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400'
                          }`}
                        >
                          {firmConfig.name.split(' ')[0]}
                        </span>

                        {/* Status Badge */}
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
                        <span>{inv.lines.filter((l) => l.type === 'rent').length} items</span>
                        {inv.booking_number && (
                          <>
                            <span>•</span>
                            <span className="font-mono">Ref #{inv.booking_number}</span>
                          </>
                        )}
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
                        (activeInvoice.firm || 'someshwar') === 'someshwar'
                          ? 'bg-lime-100 text-lime-800 border border-lime-200 dark:bg-lime-950/60 dark:text-lime-400'
                          : 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400'
                      }`}
                    >
                      {INVOICE_FIRMS[activeInvoice.firm || 'someshwar'].name}
                    </span>
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
                    Financial Year: {activeInvoice.financial_year} • Issued on{' '}
                    {new Date(activeInvoice.issued_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectInvoice(activeInvoice)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>View / Print A4</span>
                  </button>

                  <button
                    onClick={() => handleShareWhatsApp(activeInvoice)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                    title="Send to customer WhatsApp"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  {activeInvoice.balance_due > 0 && (
                    <button
                      onClick={() => onRecordPayment(activeInvoice)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 px-3 py-2 text-xs font-bold hover:bg-emerald-500/20 transition cursor-pointer"
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
                    Billed To / Buyer
                  </span>
                  <div className="font-bold text-sm text-foreground">
                    {activeInvoice.customer_name}
                  </div>
                  <p className="text-muted-foreground whitespace-pre-line">{activeInvoice.customer_address}</p>
                  {activeInvoice.customer_phone && (
                    <p className="font-mono text-foreground font-semibold pt-0.5">
                      Phone: {activeInvoice.customer_phone}
                    </p>
                  )}
                  {activeInvoice.customer_gstin && (
                    <p className="font-mono text-foreground font-bold">
                      GSTIN: {activeInvoice.customer_gstin}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-1 text-xs">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block">
                    Logistics & Rental Term
                  </span>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entity Format:</span>
                    <strong className="font-semibold text-foreground">
                      {INVOICE_FIRMS[activeInvoice.firm || 'someshwar'].name}
                    </strong>
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
                    <span className="text-muted-foreground">Rental Days:</span>
                    <strong className="font-mono text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 px-1 rounded">
                      {activeInvoice.rent_days} Day(s)
                    </strong>
                  </div>
                  {activeInvoice.dispatch_doc_no && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dispatch Doc:</span>
                      <strong className="font-mono text-foreground">{activeInvoice.dispatch_doc_no}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Table Breakdown */}
              <div className="px-6 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Itemized Billing & Line Items ({activeInvoice.lines.length})
                  </h4>
                  <span className="text-[11px] text-muted-foreground">SAC: 997319 (Rental Services)</span>
                </div>

                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 text-muted-foreground font-bold border-b border-border text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Rate / Day</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {activeInvoice.lines.map((l, idx) => (
                        <tr
                          key={l.id || idx}
                          className={l.type === 'damage' ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''}
                        >
                          <td className="py-2 px-3 text-muted-foreground font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-foreground">
                            {l.particulars || l.description}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">{l.quantity}</td>
                          <td className="py-2 px-3 text-right font-mono">₹{l.rate}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                            ₹{Number(l.amount).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Breakdown Footer */}
              <div className="p-6 bg-muted/20 border-t border-border flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">Bank Information ({INVOICE_FIRMS[activeInvoice.firm || 'someshwar'].name})</p>
                  <p>Bank: {INVOICE_FIRMS[activeInvoice.firm || 'someshwar'].bank.bankName}</p>
                  <p className="font-mono">A/c: {INVOICE_FIRMS[activeInvoice.firm || 'someshwar'].bank.accountNumber}</p>
                  <p className="font-mono">IFSC: {INVOICE_FIRMS[activeInvoice.firm || 'someshwar'].bank.branchAndIfsc}</p>
                </div>

                <div className="w-full sm:w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Rent Charges:</span>
                    <span className="font-mono text-foreground font-semibold">
                      ₹{activeInvoice.rent_amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {activeInvoice.transport_charge > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Transport & Logistics:</span>
                      <span className="font-mono text-foreground">
                        ₹{activeInvoice.transport_charge.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {activeInvoice.damage_amount > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Damage / Breakage:</span>
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

                  {activeInvoice.round_off !== undefined && activeInvoice.round_off !== 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Round Off:</span>
                      <span className="font-mono text-foreground">
                        {activeInvoice.round_off >= 0 ? `+${activeInvoice.round_off}` : activeInvoice.round_off}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border">
                    <span>Total Tax Invoice:</span>
                    <span className="font-mono text-base font-black">
                      ₹{activeInvoice.total_amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Advance Payment Received:</span>
                    <span className="font-mono text-emerald-600 font-bold">
                      ₹{(activeInvoice.advance_paid || 0).toLocaleString('en-IN')}
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
              <p className="text-xs">Select an invoice from the history list or click "Create Invoice" to generate one.</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE INVOICE MODAL (STEP 1: SELECT FIRM -> STEP 2: DETAILS -> SAVE) */}
      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onInvoiceCreated={handleInvoiceCreated}
        />
      )}
    </div>
  );
};
