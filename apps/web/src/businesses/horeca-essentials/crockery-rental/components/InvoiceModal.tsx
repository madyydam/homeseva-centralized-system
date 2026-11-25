import React, { useState } from 'react';
import { useInventory } from '../InventoryContext';
import { Invoice, InvoiceFirm } from '../types';
import { INVOICE_FIRMS } from '../firms';
import { SomeshwarInvoiceTemplate } from './SomeshwarInvoiceTemplate';
import { HomesevaInvoiceTemplate } from './HomesevaInvoiceTemplate';
import {
  FileText,
  Printer,
  Share2,
  Download,
  X,
  CreditCard,
  Building2,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
  onRecordPayment?: (invoice: Invoice) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose, onRecordPayment }) => {
  const { updateInvoice, deleteInvoice, role } = useInventory();
  const canDelete = role === 'owner' || role === 'manager' || (role as string) === 'General Manager' || (role as string) === 'general_manager';
  const [currentFirm, setCurrentFirm] = useState<InvoiceFirm>(invoice.firm || 'someshwar');
  const [zoomPercent, setZoomPercent] = useState<number>(100);

  const activeFirmConfig = INVOICE_FIRMS[currentFirm];

  const handleSwitchFirm = (newFirm: InvoiceFirm) => {
    setCurrentFirm(newFirm);
    if (updateInvoice) {
      updateInvoice(invoice.id, { firm: newFirm });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Triggers standard print-to-PDF dialog in all browsers
    window.print();
  };

  const handleShareWhatsApp = () => {
    const phone = (invoice.customer_phone || '').replace(/\D/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const text = encodeURIComponent(
      `Hello ${invoice.customer_name},\n\n` +
        `Here is your official Tax & Rental Invoice from *${activeFirmConfig.name}*:\n\n` +
        `• Invoice No: *#${invoice.invoice_number}*\n` +
        `• Invoice Date: *${new Date(invoice.issued_at).toLocaleDateString('en-IN')}*\n` +
        `• Total Amount: *₹${invoice.total_amount.toLocaleString('en-IN')}*\n` +
        `• Advance Received: *₹${(invoice.advance_paid || 0).toLocaleString('en-IN')}*\n` +
        `• *NET BALANCE DUE: ₹${invoice.balance_due.toLocaleString('en-IN')}*\n\n` +
        `Bank Transfer Details:\n` +
        `A/c Name: ${activeFirmConfig.bank.accountHolder}\n` +
        `Bank: ${activeFirmConfig.bank.bankName}\n` +
        `A/c No: ${activeFirmConfig.bank.accountNumber}\n` +
        `IFSC: ${activeFirmConfig.bank.branchAndIfsc}\n\n` +
        `Thank you for your business!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
      {/* Explicit Print CSS so background colors & table layout print 1:1 on A4 page */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            visibility: hidden !important;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #invoice-print-area, #invoice-print-area * {
            visibility: visible !important;
          }
          #invoice-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-5xl h-[94vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Sticky Top Action Bar (HIDDEN ON PRINT) */}
        <div className="no-print print:hidden flex-shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6 py-3 z-20">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  Tax Invoice #{invoice.invoice_number}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    invoice.status === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  }`}
                >
                  {invoice.status.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Entity: <span className="font-bold text-foreground">{activeFirmConfig.name}</span> • Printable A4 or PDF Download
              </p>
            </div>
          </div>

          {/* Firm Format Switcher */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl text-xs font-bold border border-border">
            <span className="text-[10px] font-bold text-muted-foreground uppercase px-1.5 hidden md:inline">
              Format:
            </span>
            <button
              type="button"
              onClick={() => handleSwitchFirm('someshwar')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                currentFirm === 'someshwar'
                  ? 'bg-lime-600 text-white shadow-xs font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-lime-400"></span>
              <span>Someshwar</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchFirm('homeseva')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                currentFirm === 'homeseva'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-blue-400"></span>
              <span>HomeSeva</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
              title="Share via WhatsApp"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Download as PDF Button */}
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted shadow-xs transition cursor-pointer"
              title="Download or Save as PDF"
            >
              <Download className="h-4 w-4 text-amber-600" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            {/* Print A4 Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print A4</span>
            </button>

            {/* Pay Button if balance due */}
            {invoice.balance_due > 0 && onRecordPayment && (
              <button
                onClick={() => onRecordPayment(invoice)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 text-xs font-bold hover:bg-emerald-500/20 transition cursor-pointer"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Pay</span>
              </button>
            )}

            {/* Delete Invoice Button */}
            {canDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`Delete Invoice #${invoice.invoice_number} for ${invoice.customer_name}?`)) {
                    deleteInvoice(invoice.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 px-2.5 py-1.5 text-xs font-bold hover:bg-rose-500/20 transition cursor-pointer"
                title="Delete Invoice"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Canvas Wrapper */}
        <div className="flex-1 overflow-y-auto bg-slate-200/80 p-4 sm:p-8 flex justify-center items-start">
          <div
            id="invoice-print-area"
            style={{
              transform: zoomPercent !== 100 ? `scale(${zoomPercent / 100})` : undefined,
              transformOrigin: 'top center',
            }}
            className="w-full max-w-[850px] transition-transform duration-150"
          >
            {/* Dynamic Render based on Firm Selection */}
            {currentFirm === 'someshwar' ? (
              <SomeshwarInvoiceTemplate invoice={invoice} />
            ) : (
              <HomesevaInvoiceTemplate invoice={invoice} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
