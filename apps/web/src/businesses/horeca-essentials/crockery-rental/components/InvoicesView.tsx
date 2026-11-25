import React, { useState, useMemo } from 'react';
import { useInventory } from '../InventoryContext';
import { Invoice, InvoiceFirm } from '../types';
import { INVOICE_FIRMS } from '../firms';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import {
  FileText,
  Search,
  PlusCircle,
  Share2,
  CreditCard,
  Eye,
  Trash2,
} from 'lucide-react';

interface InvoicesViewProps {
  onSelectInvoice: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ onSelectInvoice, onRecordPayment }) => {
  const { invoices, deleteInvoice, role } = useInventory();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'final'>('all');
  const [firmFilter, setFirmFilter] = useState<'all' | InvoiceFirm>('all');

  // New Create Invoice Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canDelete =
    role === 'owner' ||
    role === 'manager' ||
    (role as string) === 'General Manager' ||
    (role as string) === 'general_manager';

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

  const { totalBilled, totalOutstanding, someshwarCount, homesevaCount } = useMemo(() => {
    let billed = 0;
    let outstanding = 0;
    let someshwar = 0;
    let homeseva = 0;
    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];
      if (!inv) continue;
      billed += Number(inv.total_amount) || 0;
      outstanding += Number(inv.balance_due) || 0;
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

  const handleDeleteInvoice = (e: React.MouseEvent, inv: Invoice) => {
    e.stopPropagation();
    if (window.confirm(`Delete Invoice #${inv.invoice_number} for ${inv.customer_name}?`)) {
      deleteInvoice(inv.id);
    }
  };

  const handleInvoiceCreated = (created: Invoice) => {
    setShowCreateModal(false);
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

      {/* Full-Width Invoices Table — Click any row to open Bill Popup */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Bills & Invoices ({filteredInvoices.length})
          </span>
          <span className="text-[11px] text-muted-foreground">
            Click any bill row to open popup preview, print or PDF
          </span>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-14 text-center text-xs text-muted-foreground space-y-3">
            <FileText className="h-9 w-9 mx-auto text-muted-foreground/40" />
            <p className="font-semibold text-sm text-foreground">No bills found.</p>
            <p className="text-xs text-muted-foreground">Create a new invoice or adjust your search/filter.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Create New Invoice</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground font-bold border-b border-border text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invoice No.</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4 text-center">Items / Days</th>
                  <th className="py-3 px-4 text-right">Total Bill</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filteredInvoices.map((inv) => {
                  const firmKey = inv.firm === 'homeseva' ? 'homeseva' : 'someshwar';
                  const firmConfig = INVOICE_FIRMS[firmKey] || INVOICE_FIRMS.someshwar;
                  const itemCount = (inv.lines || []).filter((l) => l.type !== 'tax').length;

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv)}
                      className="hover:bg-amber-500/5 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-black text-foreground whitespace-nowrap">
                        <span className="group-hover:text-amber-600 transition">
                          #{inv.invoice_number}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground font-mono whitespace-nowrap">
                        {new Date(inv.issued_at).toLocaleDateString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground">{inv.customer_name}</div>
                        {inv.customer_phone && (
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {inv.customer_phone}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            firmKey === 'someshwar'
                              ? 'bg-lime-100 text-lime-800 border border-lime-200 dark:bg-lime-950/60 dark:text-lime-400'
                              : 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400'
                          }`}
                        >
                          {firmConfig.name.split(' ')[0]}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        {inv.booking_number ? `#${inv.booking_number}` : 'DIRECT'}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="text-foreground font-semibold">{itemCount} items</span>
                        <span className="text-muted-foreground"> • </span>
                        <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold">
                          {inv.rent_days || 1}d
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground whitespace-nowrap">
                        ₹{inv.total_amount.toLocaleString('en-IN')}
                      </td>

                      <td
                        className={`py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap ${
                          inv.balance_due > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {inv.balance_due > 0
                          ? `₹${inv.balance_due.toLocaleString('en-IN')}`
                          : 'Paid ✓'}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>

                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectInvoice(inv)}
                            title="Open Bill Popup"
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-amber-600 hover:border-amber-500/40 hover:bg-amber-500/10 transition cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleShareWhatsApp(inv)}
                            title="Send via WhatsApp"
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-emerald-600 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition cursor-pointer"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>

                          {inv.balance_due > 0 && (
                            <button
                              onClick={() => onRecordPayment(inv)}
                              title="Collect Payment"
                              className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition cursor-pointer"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={(e) => handleDeleteInvoice(e, inv)}
                              title="Delete Bill"
                              className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE INVOICE MODAL */}
      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onInvoiceCreated={handleInvoiceCreated}
        />
      )}
    </div>
  );
};
