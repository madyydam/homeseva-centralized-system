import React, { useState } from 'react';
import { useInventory } from '../InventoryContext';
import { Booking, Invoice, Payment } from '../types';
import { CreditCard, X, CheckCircle2, Printer, QrCode } from 'lucide-react';
import { numberToIndianWords } from '../numberToWords';

interface PaymentModalProps {
  booking?: Booking | null | undefined;
  invoice?: Invoice | null | undefined;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ booking, invoice, onClose }) => {
  const { recordPayment, role, profile } = useInventory();

  const customerName = invoice ? invoice.customer_name : booking?.customer_name || 'Customer';
  const customerId = booking?.customer_id || '';
  const bookingId = invoice ? invoice.booking_id : booking?.id || '';
  const bookingNumber = invoice ? invoice.booking_number : booking?.booking_number || '';
  const defaultAmount = invoice ? invoice.balance_due : 1000;

  const [amount, setAmount] = useState(defaultAmount);
  const [method, setMethod] = useState<Payment['method']>('UPI');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('Final balance payment settlement');
  const [receiptSaved, setReceiptSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    recordPayment({
      booking_id: bookingId,
      booking_number: bookingNumber,
      customer_id: customerId,
      customer_name: customerName,
      amount,
      method,
      reference: reference || `REF-${Date.now().toString().slice(-6)}`,
      notes,
      date: new Date().toISOString(),
      received_by: role === 'owner' ? 'Owner' : 'Counter Staff',
      direction: 'received',
    });

    setReceiptSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Record Payment</h2>
              <p className="text-xs text-muted-foreground">{bookingNumber} • {customerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {receiptSaved ? (
          <div className="p-6 text-center space-y-4 text-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Payment Received Successfully!</h3>
              <p className="text-muted-foreground mt-0.5">
                ₹{amount.toLocaleString('en-IN')} via {method} credited to account.
              </p>
            </div>

            {/* Receipt Summary & Printable Document */}
            <div
              id="printable-document"
              className="rounded-xl border border-slate-300 bg-white p-6 text-left space-y-4 text-slate-900 shadow-sm"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {/* Receipt Letterhead */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h4 className="text-base font-black uppercase text-slate-900 tracking-tight">
                    {profile.name}
                  </h4>
                  <p className="text-[11px] text-slate-600">{profile.address}</p>
                  <p className="text-[11px] text-slate-700">Phone: <strong>{profile.phone}</strong> | GSTIN: <strong>{profile.gstin}</strong></p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xs">
                    PAYMENT RECEIPT
                  </span>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-1">
                    Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Receipt Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Received From:</span>
                  <strong className="text-slate-900 text-sm block">{customerName}</strong>
                  <span className="text-slate-600 font-mono">Ref Booking: #{bookingNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Payment Method & Ref:</span>
                  <strong className="text-slate-900 block">{method}</strong>
                  <span className="text-slate-600 font-mono">{reference || 'N/A'}</span>
                </div>
              </div>

              {/* Amount Highlight */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Amount Received:</span>
                  <div className="text-xs text-emerald-900 font-medium italic mt-0.5">
                    {numberToIndianWords(amount)}
                  </div>
                </div>
                <div className="text-xl font-black font-mono text-emerald-700">
                  ₹{amount.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-[11px] text-slate-600">
                <span>Received By: <strong className="text-slate-900">{role === 'owner' ? 'Owner' : 'Counter Staff'}</strong></span>
                <span className="border-t border-slate-400 pt-1 px-4 text-center font-bold text-slate-900">
                  For {profile.name} (Authorized Signatory)
                </span>
              </div>
            </div>

            <div className="no-print print:hidden flex flex-wrap justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const text = encodeURIComponent(
                    `Hello ${customerName},\n\nWe have received payment of *₹${amount.toLocaleString('en-IN')}* for Booking *#${bookingNumber}* via ${method}.\n` +
                      `Reference: ${reference || 'Confirmed'}\n\nThank you for choosing *${profile.name}*!`
                  );
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
              >
                <span>Share WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground hover:bg-primary/90 transition cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Official Receipt</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2 font-semibold text-foreground hover:bg-muted cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {invoice && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 flex justify-between items-center text-amber-800">
                <span>Invoice #{invoice.invoice_number} Balance Due:</span>
                <span className="font-mono font-bold text-sm">₹{invoice.balance_due.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                Payment Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base font-bold font-mono mt-1 text-primary"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Payment Mode
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-semibold mt-1"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Transaction / Ref #
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/629104829102"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                Payment Notes / Remarks
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs mt-1"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95"
              >
                Save Payment & Update Balance
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
