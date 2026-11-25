import React from 'react';
import { Invoice } from '../types';
import { INVOICE_FIRMS } from '../firms';

interface SomeshwarInvoiceTemplateProps {
  invoice: Invoice;
}

export const SomeshwarInvoiceTemplate: React.FC<SomeshwarInvoiceTemplateProps> = ({ invoice }) => {
  const firm = INVOICE_FIRMS.someshwar;

  // Format date like '03 Nov 2026'
  const invoiceDate = invoice.issued_at
    ? new Date(invoice.issued_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  // Calculate Subtotal (sum of non-tax lines)
  const lineItems = invoice.lines.filter((l) => l.type !== 'tax');
  const subtotal = lineItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const gstAmount = Number(invoice.tax_amount) || Math.round(subtotal * 0.18 * 10) / 10;
  const roundOff = invoice.round_off !== undefined ? Number(invoice.round_off) : Math.round((Number(invoice.total_amount) - (subtotal + gstAmount)) * 100) / 100;
  const grandTotal = Number(invoice.total_amount) || Math.round(subtotal + gstAmount + roundOff);

  return (
    <div className="relative w-full bg-white text-slate-900 font-sans p-6 sm:p-10 select-text overflow-hidden min-h-[1050px] flex flex-col justify-between border border-slate-200 print:border-none print:p-8 print:m-0 print:min-h-0 print:h-auto print:shadow-none shadow-xl rounded-xl">
      {/* Decorative Modern Top-Left Lime Geometric Banner */}
      <div className="absolute -top-4 -left-4 w-44 h-56 pointer-events-none overflow-hidden z-0 print:opacity-100">
        <svg viewBox="0 0 160 200" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="0,0 120,0 60,110 0,70" fill="#78B800" />
          <polygon points="0,70 60,110 0,190" fill="#65A300" />
          <polygon points="60,110 130,10 80,140 10,190" fill="#84CC16" opacity="0.9" />
          <polygon points="0,180 50,150 0,200" fill="#4D7C0F" />
        </svg>
      </div>

      {/* Decorative Bottom-Right Dark Slate Angle */}
      <div className="absolute -bottom-4 -right-4 w-36 h-36 pointer-events-none overflow-hidden z-0 print:opacity-100">
        <svg viewBox="0 0 120 120" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="120,120 120,20 20,120" fill="#1E293B" />
          <polygon points="120,60 120,120 60,120" fill="#0F172A" />
        </svg>
      </div>

      <div className="relative z-10 space-y-4">
        {/* Company Header at Top Left */}
        <div className="pt-2 pl-4 max-w-sm">
          <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
            {firm.name}
          </h2>
          {firm.addressLines.map((line, idx) => (
            <p key={idx} className="text-xs font-bold text-slate-800 leading-snug">
              {line}
            </p>
          ))}
        </div>

        {/* Center Title */}
        <div className="pt-2 text-center">
          <h1 className="text-2xl font-black text-[#1d3557] tracking-wide inline-block">
            Tax invoice
          </h1>
        </div>

        {/* Horizontal Divider Line */}
        <div className="border-t-2 border-slate-900 w-full" />

        {/* Invoice Number & Date */}
        <div className="flex justify-end items-center pr-1 -mt-2">
          <span className="text-xs font-black text-slate-900 tracking-wide">
            Inv no- {invoice.invoice_number.replace(/^Inv no- /i, '')} /Date: {invoiceDate}
          </span>
        </div>

        {/* FROM & TO Box Grid */}
        <div className="border border-slate-900 rounded-xs grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-900 text-xs">
          {/* FROM Column */}
          <div className="p-3.5 space-y-2">
            <span className="font-black text-slate-900 block uppercase tracking-wider text-[11px]">
              FROM
            </span>
            <div className="space-y-0.5 text-slate-900 font-semibold leading-relaxed">
              <p className="font-black text-sm">{firm.name}</p>
              {firm.addressLines.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
              <p className="font-bold pt-1">
                Gst - <span className="font-mono">{firm.gstin}</span>
              </p>
            </div>
          </div>

          {/* TO Column */}
          <div className="p-3.5 space-y-2">
            <span className="font-black text-slate-900 block uppercase tracking-wider text-[11px]">
              TO
            </span>
            <div className="space-y-0.5 text-slate-900 font-semibold leading-relaxed">
              <p className="font-black text-sm uppercase">{invoice.customer_name}</p>
              <p className="text-slate-800 whitespace-pre-line">{invoice.customer_address || 'Address on file'}</p>
              {invoice.customer_phone && (
                <p className="text-slate-700">Phone: {invoice.customer_phone}</p>
              )}
              <p className="font-bold pt-1">
                GSTIN/UIN :{' '}
                <span className="font-mono font-bold">
                  {invoice.customer_gstin || 'Unregistered / Consumer'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-900 rounded-xs overflow-hidden mt-3">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#dce6f2] text-slate-900 font-bold border-b border-slate-900 text-center">
                <th className="py-2.5 px-3 w-12 border-r border-slate-900">Sr.</th>
                <th className="py-2.5 px-4 text-left border-r border-slate-900">Description</th>
                <th className="py-2.5 px-3 w-20 border-r border-slate-900">Qty</th>
                <th className="py-2.5 px-3 w-28 border-r border-slate-900">Rate / Per Day</th>
                <th className="py-2.5 px-4 text-right w-32">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-400">
              {lineItems.map((line, idx) => (
                <tr key={line.id || idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-center border-r border-slate-900 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-4 border-r border-slate-900 font-medium text-slate-900">
                    {(line.description || line.particulars || 'Item')
                      .replace(/\s*\(\d+.*?\)$/, '')
                      .replace(/\s+\d+\s*nos\b.*/i, '')
                      .trim()}
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-900 font-medium">
                    {line.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-900 font-medium">
                    {line.rate}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                    ₹{Number(line.amount).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}

              {/* Ensure table has minimum visual height */}
              {lineItems.length < 3 &&
                Array.from({ length: 3 - lineItems.length }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-9">
                    <td className="border-r border-slate-900"></td>
                    <td className="border-r border-slate-900"></td>
                    <td className="border-r border-slate-900"></td>
                    <td className="border-r border-slate-900"></td>
                    <td></td>
                  </tr>
                ))}
            </tbody>
            <tfoot className="border-t border-slate-900 divide-y divide-slate-400 font-medium">
              {/* Sub-total */}
              <tr>
                <td colSpan={4} className="py-2 px-4 text-right border-r border-slate-900 font-bold">
                  Sub-total
                </td>
                <td className="py-2 px-4 text-right font-bold text-slate-900">
                  ₹{subtotal.toLocaleString('en-IN')}
                </td>
              </tr>

              {/* GST @ 18% */}
              <tr>
                <td colSpan={4} className="py-1.5 px-4 text-right border-r border-slate-900 font-bold">
                  GST @ {invoice.tax_rate || 18}%
                </td>
                <td className="py-1.5 px-4 text-right font-bold text-slate-900 font-mono">
                  {gstAmount.toFixed(1)}
                </td>
              </tr>

              {/* Round Off */}
              <tr>
                <td colSpan={4} className="py-1.5 px-4 text-right border-r border-slate-900 font-bold">
                  Round Off
                </td>
                <td className="py-1.5 px-4 text-right font-bold text-slate-900 font-mono">
                  {roundOff >= 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}
                </td>
              </tr>

              {/* Grand Total */}
              <tr className="bg-[#dce6f2] font-black text-slate-900 border-t-2 border-slate-900 text-sm">
                <td colSpan={4} className="py-2.5 px-4 text-right border-r border-slate-900 uppercase tracking-wider">
                  Grand Total
                </td>
                <td className="py-2.5 px-4 text-right text-base font-black">
                  ₹{grandTotal.toLocaleString('en-IN')}/-
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Bank Details & Signature Section */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
          {/* Bank Details Left */}
          <div className="space-y-1 text-xs">
            <h4 className="font-black text-slate-900 text-sm tracking-tight mb-2">
              Bank A/c Details
            </h4>
            <p className="text-slate-800">
              <span className="font-bold">A/c Holder's Name :</span> {firm.bank.accountHolder}
            </p>
            <p className="text-slate-800">
              <span className="font-bold">Bank Name :</span> {firm.bank.bankName}
            </p>
            <p className="text-slate-800 font-mono">
              <span className="font-bold font-sans">A/c No. :</span> {firm.bank.accountNumber}
            </p>
            <p className="text-slate-800">
              <span className="font-bold">Branch & IFS Code:</span>{' '}
              <span className="font-mono">{firm.bank.branchAndIfsc}</span>
            </p>
          </div>

          {/* Signature Right */}
          <div className="text-center sm:text-right space-y-2 pr-2">
            <p className="text-xs font-black text-slate-900">{firm.signatureLabel}</p>

            {/* Signature Stamp Badge */}
            <div className="inline-block border border-dashed border-slate-400 rounded-lg p-2.5 my-1 text-center bg-slate-50/60 min-w-[190px]">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                SOMESHWAR ENTERPRISES
              </span>
              <div className="h-10 flex items-center justify-center italic text-blue-900 font-serif font-black text-xl tracking-widest my-0.5">
                Ganesh
              </div>
              <span className="text-[10px] font-bold text-slate-500 block">
                Proprietor
              </span>
            </div>

            <p className="text-xs font-black text-slate-900 block">
              Authorised Signatory
            </p>
          </div>
        </div>
      </div>

      {/* Footer Address Repeat */}
      <div className="relative z-10 pt-10 text-[11px] font-bold text-slate-800 leading-snug">
        <p className="font-black">{firm.name}</p>
        {firm.addressLines.map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>
    </div>
  );
};
