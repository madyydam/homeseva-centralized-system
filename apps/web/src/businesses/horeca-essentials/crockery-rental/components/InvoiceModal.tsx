import React, { useState } from 'react';
import { useInventory } from '../InventoryContext';
import { Invoice } from '../types';
import { numberToIndianWords } from '../numberToWords';
import {
  FileText,
  Printer,
  Share2,
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
  onRecordPayment?: (invoice: Invoice) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose, onRecordPayment }) => {
  const { profile, role, generateInvoice } = useInventory();
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(invoice);
  const [waiverAmount, setWaiverAmount] = useState(0);
  const [showWaiverDialog, setShowWaiverDialog] = useState(false);
  const [waiverReason, setWaiverReason] = useState('');

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const phone = currentInvoice.customer_phone.replace(/\D/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const text = encodeURIComponent(
      `Hello ${currentInvoice.customer_name},\n\nHere is your official Tax & Rental Invoice from *${profile.name}*:\n\n` +
        `• Invoice No: *#${currentInvoice.invoice_number}*\n` +
        `• Invoice Date: *${new Date(currentInvoice.issued_at).toLocaleDateString('en-IN')}*\n` +
        `• Total Amount: *₹${currentInvoice.total_amount.toLocaleString('en-IN')}*\n` +
        `• Advance Received: *₹${currentInvoice.advance_paid.toLocaleString('en-IN')}*\n` +
        `• *NET BALANCE DUE: ₹${currentInvoice.balance_due.toLocaleString('en-IN')}*\n\n` +
        `Please transfer to UPI ID: *${profile.upi_id}*\n` +
        `Thank you for your business!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleApplyWaiver = () => {
    if (waiverAmount <= 0) return;
    try {
      const updated = generateInvoice(currentInvoice.booking_id, currentInvoice.tax_rate, waiverAmount);
      setCurrentInvoice(updated);
      setShowWaiverDialog(false);
    } catch (e) {
      console.error(e);
    }
  };

  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const amountInWords = numberToIndianWords(currentInvoice.total_amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
      <div className="relative w-full max-w-5xl h-[92vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Sticky Top Action Bar (HIDDEN ON PRINT) */}
        <div className="no-print print:hidden flex-shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6 py-3 z-20">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  Tax Invoice #{currentInvoice.invoice_number}
                </h2>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                  currentInvoice.status === 'paid'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                }`}>
                  {currentInvoice.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Original commercial document • Printable A4 or direct WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Document Scale Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border text-xs">
              <span className="text-[10px] font-semibold text-muted-foreground px-1.5 uppercase">Scale:</span>
              <button
                type="button"
                onClick={() => setZoomPercent(85)}
                className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                  zoomPercent === 85 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
                }`}
                title="Fit more on laptop screen"
              >
                85%
              </button>
              <button
                type="button"
                onClick={() => setZoomPercent(100)}
                className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                  zoomPercent === 100 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
                }`}
                title="Standard actual size"
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setZoomPercent(115)}
                className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                  zoomPercent === 115 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
                }`}
                title="Large view"
              >
                115%
              </button>
            </div>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
              title="Send invoice via WhatsApp"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print A4</span>
            </button>

            {/* Record Payment Button if balance due */}
            {currentInvoice.balance_due > 0 && onRecordPayment && (
              <button
                onClick={() => onRecordPayment(currentInvoice)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition cursor-pointer"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Pay</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Canvas */}
        <div className="flex-1 overflow-y-auto bg-slate-200/70 dark:bg-slate-900/70 p-4 sm:p-8 flex justify-center">
          {/* PRINTABLE OFFICIAL COMMERCIAL TAX INVOICE */}
          <div
            id="printable-document"
            style={{
              zoom: `${zoomPercent}%`,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
            className="w-full max-w-4xl bg-white text-slate-900 shadow-xl border border-slate-300 rounded-xl p-8 sm:p-12 space-y-6 transition-all origin-top my-auto sm:my-0"
          >
          {/* Letterhead Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                  S
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
                    {profile.name}
                  </h1>
                  <p className="text-xs font-semibold text-amber-700 mt-1">
                    {profile.tagline}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 max-w-md leading-relaxed mt-1">
                {profile.address}
              </p>
              <div className="flex flex-wrap gap-x-5 text-xs text-slate-700 font-medium pt-0.5">
                <span>Phone: <strong className="text-slate-900">{profile.phone}</strong></span>
                {profile.alt_phone && <span>Alt: <strong className="text-slate-900">{profile.alt_phone}</strong></span>}
                <span>Email: <strong className="text-slate-900">{profile.email}</strong></span>
                <span>GSTIN: <strong className="text-slate-900 font-mono">{profile.gstin}</strong></span>
              </div>
            </div>

            {/* Invoice Meta Block */}
            <div className="sm:text-right border-l-2 sm:border-l-0 sm:border-r-0 border-slate-900 pl-4 sm:pl-0">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-sm mb-1">
                TAX INVOICE
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                #{currentInvoice.invoice_number}
              </div>
              <div className="text-xs text-slate-600 font-medium mt-1.5 space-y-1">
                <div>Invoice Date: <strong className="text-slate-900">{new Date(currentInvoice.issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
                <div>Financial Year: <strong className="text-slate-900">{currentInvoice.financial_year}</strong></div>
                <div>Booking Reference: <strong className="text-slate-900 font-mono">#{currentInvoice.booking_number}</strong></div>
              </div>
            </div>
          </div>

          {/* Customer & Event Details Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-300 bg-slate-50/70 p-4 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-1">
                BILLED TO / CUSTOMER:
              </span>
              <h2 className="text-base font-bold text-slate-900 pt-1">
                {currentInvoice.customer_name}
              </h2>
              <p className="text-slate-600 leading-relaxed">{currentInvoice.customer_address}</p>
              <p className="text-slate-800 font-medium">
                Contact: <strong className="font-mono">{currentInvoice.customer_phone}</strong>
              </p>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-1">
                RENTAL DURATION & VENUE:
              </span>
              <div className="space-y-1 pt-1 text-slate-700">
                <div className="flex justify-between">
                  <span>Delivery Date:</span>
                  <strong className="text-slate-900 font-mono">{currentInvoice.delivery_date}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Return Date:</span>
                  <strong className="text-slate-900 font-mono">{currentInvoice.return_date}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Billable Duration:</span>
                  <strong className="text-slate-900 font-mono bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                    {currentInvoice.rent_days} Day(s)
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Commercial Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-10">#</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Description of Goods / Services</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-20">HSN/SAC</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-20">Quantity</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right w-24">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {currentInvoice.lines.map((line, idx) => (
                  <tr
                    key={line.id}
                    className={line.type === 'damage' ? 'bg-rose-50/70 text-rose-950' : 'hover:bg-slate-50/50'}
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200">
                      {line.description}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600 font-mono border-r border-slate-200">
                      997312
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold border-r border-slate-200">
                      {line.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono border-r border-slate-200">
                      {line.rate >= 0 ? `₹${line.rate.toLocaleString('en-IN')}` : `-₹${Math.abs(line.rate).toLocaleString('en-IN')}`}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {line.amount >= 0 ? `₹${line.amount.toLocaleString('en-IN')}` : `-₹${Math.abs(line.amount).toLocaleString('en-IN')}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Amount in Words Banner */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
            <span className="font-bold text-slate-500 uppercase text-[10px] block">
              TOTAL AMOUNT IN WORDS:
            </span>
            <div className="font-bold text-slate-900 text-sm mt-0.5 italic">
              {amountInWords}
            </div>
          </div>

          {/* Banking / UPI & Financial Summary Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t-2 border-slate-300 pt-4">
            {/* Banking Details */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <QrCode className="h-4 w-4 text-amber-600" />
                <span>PAYMENT INSTRUCTIONS & BANK DETAILS</span>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">UPI VPA:</span>
                  <span className="font-mono font-bold text-amber-800 text-sm bg-amber-100 px-2 py-0.5 rounded">
                    {profile.upi_id}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-slate-200">
                  <div>Bank Name: <strong>{profile.bank_name}</strong></div>
                  <div>Account No: <strong className="font-mono">{profile.account_number}</strong></div>
                  <div>IFSC Code: <strong className="font-mono">{profile.ifsc}</strong></div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Scan UPI QR or transfer via NEFT/IMPS. Mention invoice number in narration.
              </p>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span>Rent Total:</span>
                <span className="font-mono font-bold text-slate-900">₹{currentInvoice.rent_amount.toLocaleString('en-IN')}</span>
              </div>
              {currentInvoice.transport_charge > 0 && (
                <div className="flex justify-between">
                  <span>Transport & Delivery Logistics:</span>
                  <span className="font-mono text-slate-900">₹{currentInvoice.transport_charge.toLocaleString('en-IN')}</span>
                </div>
              )}
              {currentInvoice.late_fee > 0 && (
                <div className="flex justify-between text-amber-800 font-semibold">
                  <span>Late Fee Surcharge:</span>
                  <span className="font-mono">+₹{currentInvoice.late_fee.toLocaleString('en-IN')}</span>
                </div>
              )}
              {currentInvoice.damage_amount > 0 && (
                <div className="flex justify-between text-rose-700 font-semibold">
                  <div className="flex items-center gap-1">
                    <span>Breakage & Missing Charges:</span>
                    {(role === 'owner' || role === 'manager') && (
                      <button
                        onClick={() => setShowWaiverDialog(true)}
                        className="text-[10px] text-blue-600 underline hover:text-blue-800 no-print"
                      >
                        (Waive)
                      </button>
                    )}
                  </div>
                  <span className="font-mono font-bold">+₹{currentInvoice.damage_amount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {currentInvoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Customer Discount:</span>
                  <span className="font-mono">-₹{currentInvoice.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {currentInvoice.tax_amount > 0 && (
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span>GST ({currentInvoice.tax_rate}%):</span>
                  <span className="font-mono text-slate-900">₹{currentInvoice.tax_amount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="border-t-2 border-slate-300 pt-1.5 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Invoice Value:</span>
                <span className="font-mono text-base">₹{currentInvoice.total_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-700">
                <span>Less: Advance Received:</span>
                <span className="font-mono">-₹{currentInvoice.advance_paid.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-lg font-black text-slate-900">
                <span>NET BALANCE DUE:</span>
                <span className="font-mono text-amber-700 text-xl">
                  ₹{currentInvoice.balance_due.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions & Signatures */}
          <div className="border-t border-slate-300 pt-4 space-y-4">
            <div className="text-[10px] text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-700 uppercase block mb-0.5">
                TERMS & CONDITIONS OF RENTAL:
              </span>
              {profile.terms_conditions}
            </div>

            {/* Signature Blocks */}
            <div className="grid grid-cols-2 gap-8 pt-6">
              <div className="text-center pt-8 border-t border-slate-300 text-xs text-slate-600 font-medium">
                Customer Acceptance Signature & Stamp
              </div>
              <div className="text-center pt-8 border-t border-slate-300 text-xs text-slate-900 font-bold">
                For {profile.name}
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">(Authorized Signatory)</div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Manager/Owner Damage Waiver Modal */}
        {showWaiverDialog && (
          <div className="no-print fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-foreground">Waive Damage Charges</h3>
              <p className="text-xs text-muted-foreground">
                Current breakage charges: ₹{currentInvoice.damage_amount}. As Manager/Owner, enter amount to waive.
              </p>
              <div>
                <label className="text-xs font-medium text-foreground">Waiver Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  max={currentInvoice.damage_amount}
                  value={waiverAmount}
                  onChange={(e) => setWaiverAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-mono font-bold mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Mandatory Waiver Reason</label>
                <input
                  type="text"
                  placeholder="e.g. VIP client goodwill or mutual transport accident"
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowWaiverDialog(false)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyWaiver}
                  disabled={waiverAmount <= 0 || !waiverReason.trim()}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  Apply Waiver
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
