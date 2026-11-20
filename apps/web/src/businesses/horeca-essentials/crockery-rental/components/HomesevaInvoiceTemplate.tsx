import React from 'react';
import { Invoice } from '../types';
import { INVOICE_FIRMS } from '../firms';
import { numberToIndianWords } from '../numberToWords';

interface HomesevaInvoiceTemplateProps {
  invoice: Invoice;
}

export const HomesevaInvoiceTemplate: React.FC<HomesevaInvoiceTemplateProps> = ({ invoice }) => {
  const firm = INVOICE_FIRMS.homeseva;

  // Format date like '14-Nov-26'
  const invoiceDate = invoice.issued_at
    ? new Date(invoice.issued_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      }).replace(/ /g, '-')
    : new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      }).replace(/ /g, '-');

  const deliveryDateFormatted = invoice.delivery_date
    ? new Date(invoice.delivery_date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
    : invoiceDate;

  const eventDateFormatted = invoice.event_date
    ? new Date(invoice.event_date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
    : deliveryDateFormatted;

  const lineItems = invoice.lines.filter((l) => l.type !== 'tax');
  const taxableValue = lineItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const taxRate = Number(invoice.tax_rate) || 18;
  const halfTaxRate = taxRate / 2;
  const totalTax = Number(invoice.tax_amount) || Math.round(taxableValue * (taxRate / 100) * 100) / 100;
  const halfTaxAmount = Math.round((totalTax / 2) * 100) / 100;
  const totalAmount = Number(invoice.total_amount) || Math.round((taxableValue + totalTax) * 100) / 100;

  const amountInWords = numberToIndianWords(totalAmount);
  const taxAmountInWords = numberToIndianWords(totalTax);

  const consigneeName = invoice.consignee_name || invoice.customer_name;
  const consigneeAddress = invoice.consignee_address || invoice.customer_address;
  const consigneeGstin = invoice.consignee_gstin || invoice.customer_gstin || '27AAFFC0369P1Z2';

  const buyerName = invoice.customer_name;
  const buyerAddress = invoice.customer_address;
  const buyerGstin = invoice.customer_gstin || '27AAFFC0369P1Z2';

  const dcNumber = invoice.dispatch_doc_no || 'DC NO-352';
  const rentDays = invoice.rent_days || 1;

  return (
    <div className="w-full bg-white text-slate-900 font-sans p-4 sm:p-8 select-text overflow-hidden border border-slate-900 print:border print:border-slate-900 print:p-6 print:m-0 print:shadow-none shadow-xl rounded-none text-xs leading-tight">
      {/* Top Title */}
      <div className="text-center pb-2">
        <h1 className="text-base font-black text-slate-900 tracking-wide">Tax Invoice</h1>
      </div>

      {/* Main Multi-Box Outer Container */}
      <div className="border border-slate-900 divide-y divide-slate-900">
        {/* Row 1: Seller Info (Left) & Invoice Meta Grid (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-900">
          {/* Top-Left: Seller Details with HomeSeva Logo */}
          <div className="md:col-span-7 p-2.5 flex items-start gap-3">
            {/* Crisp HomeSeva Logo Vector */}
            <div className="shrink-0 flex flex-col items-center justify-center p-1 border border-slate-200 rounded-sm bg-slate-50">
              <div className="flex items-center justify-center h-10 w-10">
                <svg viewBox="0 0 100 100" className="h-9 w-9">
                  {/* Four colorful petals roof */}
                  <path d="M50 15 L25 35 L40 50 L50 40 Z" fill="#22c55e" />
                  <path d="M50 15 L75 35 L60 50 L50 40 Z" fill="#ef4444" />
                  <path d="M25 35 L50 55 L35 70 L15 50 Z" fill="#3b82f6" />
                  <path d="M75 35 L50 55 L65 70 L85 50 Z" fill="#f97316" />
                  <circle cx="50" cy="40" r="7" fill="#eab308" />
                </svg>
              </div>
              <div className="text-center mt-0.5">
                <span className="block font-black text-[11px] text-[#0f3b7d] tracking-tighter leading-none">
                  HOME
                </span>
                <span className="block font-black text-[11px] text-[#0f3b7d] tracking-tighter leading-none">
                  SEVA
                </span>
                <span className="block text-[6px] text-slate-500 font-semibold tracking-tight mt-0.5 whitespace-nowrap">
                  One call. Fix it all.
                </span>
              </div>
            </div>

            {/* Seller Address */}
            <div className="space-y-0.5">
              <h2 className="font-bold text-xs text-slate-900 leading-tight">{firm.name}</h2>
              {firm.addressLines.map((line, i) => (
                <p key={i} className="text-[11px] text-slate-800">{line}</p>
              ))}
              <p className="text-[11px] font-bold text-slate-900 pt-0.5">
                GSTIN/UIN: <span className="font-mono">{firm.gstin}</span>
              </p>
              <p className="text-[11px] text-slate-800">State Name : {firm.stateName}, Code : {firm.stateCode}</p>
              <p className="text-[11px] text-slate-800">E-Mail : {firm.email}</p>
            </div>
          </div>

          {/* Top-Right: Invoice Meta 2-Col Grid */}
          <div className="md:col-span-5 grid grid-cols-2 divide-x divide-y divide-slate-900 text-[11px]">
            <div className="p-1.5 border-t-0">
              <span className="text-[10px] text-slate-600 block">Invoice No.</span>
              <span className="font-bold font-mono text-slate-900 block">{invoice.invoice_number}</span>
            </div>
            <div className="p-1.5 border-t-0">
              <span className="text-[10px] text-slate-600 block">Dated</span>
              <span className="font-bold text-slate-900 block">{invoiceDate}</span>
            </div>

            <div className="p-1.5">
              <span className="text-[10px] text-slate-600 block">Delivery Note</span>
              <span className="font-semibold text-slate-800 block">{invoice.delivery_note || '-'}</span>
            </div>
            <div className="p-1.5">
              <span className="text-[10px] text-slate-600 block">Mode/Terms of Payment</span>
              <span className="font-bold text-slate-900 block">RENT IN DAYS- {String(rentDays).padStart(2, '0')}</span>
            </div>

            <div className="p-1.5">
              <span className="text-[10px] text-slate-600 block">Reference No. & Date.</span>
              <span className="font-semibold text-slate-800 block">-</span>
            </div>
            <div className="p-1.5">
              <span className="text-[10px] text-slate-600 block">Other References</span>
              <span className="font-bold text-slate-900 block">RENT IN DAYS- {String(rentDays).padStart(2, '0')}</span>
            </div>

            <div className="p-1.5">
              <span className="text-[10px] text-slate-600 block">Buyer's Order No.</span>
              <span className="font-semibold text-slate-800 block">-</span>
            </div>
            <div className="p-1.5">
              <span className="text-[10px] text-slate-600 block">Dated</span>
              <span className="font-semibold text-slate-800 block">-</span>
            </div>

            <div className="p-1.5">
              <span className="text-[10px] text-slate-600 block">Dispatch Doc No.</span>
              <span className="font-bold text-slate-900 block">{dcNumber}</span>
            </div>
            <div className="p-1.5">
              <span className="text-[10px] text-slate-600 block">Delivery Note Date</span>
              <span className="font-semibold text-slate-800 block">-</span>
            </div>

            <div className="p-1.5">
              <span className="text-[10px] text-slate-600 block">Dispatched through</span>
              <span className="font-bold text-slate-900 block">Delivery Date-{deliveryDateFormatted}</span>
            </div>
            <div className="p-1.5">
              <span className="text-[10px] text-slate-600 block">Destination</span>
              <span className="font-semibold text-slate-800 block">-</span>
            </div>

            {/* Terms of Delivery spans full width */}
            <div className="col-span-2 p-1.5">
              <span className="text-[10px] text-slate-600 block">Terms of Delivery</span>
              <span className="font-bold text-slate-900 block">Event Date-{eventDateFormatted}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Consignee & Buyer Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-900 text-[11px]">
          {/* Consignee (Ship to) */}
          <div className="p-2 space-y-0.5">
            <span className="text-[10px] text-slate-600 block font-semibold">Consignee (Ship to)</span>
            <p className="font-bold text-slate-900">{consigneeName}</p>
            <p className="text-slate-800 whitespace-pre-line">{consigneeAddress}</p>
            <p className="font-bold text-slate-900 pt-1">
              GSTIN/UIN : <span className="font-mono">{consigneeGstin}</span>
            </p>
            <p className="text-slate-800">State Name : Maharashtra, Code : 27</p>
          </div>

          {/* Buyer (Bill to) */}
          <div className="p-2 space-y-0.5">
            <span className="text-[10px] text-slate-600 block font-semibold">Buyer (Bill to)</span>
            <p className="font-bold text-slate-900">{buyerName}</p>
            <p className="text-slate-800 whitespace-pre-line">{buyerAddress}</p>
            <p className="font-bold text-slate-900 pt-1">
              GSTIN/UIN : <span className="font-mono">{buyerGstin}</span>
            </p>
            <p className="text-slate-800">State Name : Maharashtra, Code : 27</p>
          </div>
        </div>

        {/* Row 3: Line Items Table */}
        <div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-900 font-bold divide-x divide-slate-900">
                <th className="py-1 px-1.5 w-10 text-center font-bold">Sl<br/>No.</th>
                <th className="py-1 px-3 text-left font-bold">Particulars</th>
                <th className="py-1 px-2 w-20 text-center font-bold">HSN/SAC</th>
                <th className="py-1 px-2 w-16 text-center font-bold">Quantity</th>
                <th className="py-1 px-2 w-16 text-center font-bold">Rate</th>
                <th className="py-1 px-2 w-12 text-center font-bold">per</th>
                <th className="py-1 px-3 w-28 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {lineItems.map((line, idx) => (
                <tr key={line.id || idx} className="divide-x divide-slate-900 align-top">
                  <td className="py-1 px-1.5 text-center font-medium">{idx + 1}</td>
                  <td className="py-1 px-3 font-medium">
                    <span className="font-bold block text-slate-900">CCG Rental Charges</span>
                    <span className="text-slate-700 block italic text-[11px]">
                      {line.particulars || `${line.description} ${line.quantity}nos @${line.rate}per Nos X${line.days || rentDays}day`}
                    </span>
                  </td>
                  <td className="py-1 px-2 text-center font-mono text-slate-800">{line.hsn_sac || '997319'}</td>
                  <td className="py-1 px-2 text-center">{line.quantity || ''}</td>
                  <td className="py-1 px-2 text-center">{line.rate || ''}</td>
                  <td className="py-1 px-2 text-center">{line.per || 'Nos'}</td>
                  <td className="py-1 px-3 text-right font-bold text-slate-900">
                    {Number(line.amount).toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* CGST Line inside particulars table */}
              <tr className="divide-x divide-slate-900">
                <td className="py-1 px-1.5 text-center"></td>
                <td className="py-1 px-3 font-bold text-right text-slate-900 pr-8">CGST</td>
                <td className="py-1 px-2"></td>
                <td className="py-1 px-2"></td>
                <td className="py-1 px-2"></td>
                <td className="py-1 px-2"></td>
                <td className="py-1 px-3 text-right font-bold text-slate-900 font-mono">
                  {halfTaxAmount.toFixed(2)}
                </td>
              </tr>

              {/* SGST Line inside particulars table */}
              <tr className="divide-x divide-slate-900">
                <td className="py-1 px-1.5 text-center"></td>
                <td className="py-1 px-3 font-bold text-right text-slate-900 pr-8">SGST</td>
                <td className="py-1 px-2"></td>
                <td className="py-1 px-2"></td>
                <td className="py-1 px-2"></td>
                <td className="py-1 px-2"></td>
                <td className="py-1 px-3 text-right font-bold text-slate-900 font-mono">
                  {halfTaxAmount.toFixed(2)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              {/* Total Row */}
              <tr className="border-t border-slate-900 font-black divide-x divide-slate-900 bg-slate-50/50">
                <td colSpan={6} className="py-1.5 px-3 text-right uppercase tracking-wider text-xs font-black">
                  Total
                </td>
                <td className="py-1.5 px-3 text-right text-sm font-black text-slate-900">
                  ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Row 4: Amount in words */}
        <div className="p-2 border-t border-slate-900 flex items-start justify-between">
          <div>
            <span className="text-[10px] text-slate-600 block">Amount Chargeable (in words)</span>
            <span className="font-bold text-xs text-slate-900 block">INR {amountInWords} Only</span>
          </div>
          <span className="text-[10px] font-bold text-slate-600 italic">E. & O.E</span>
        </div>

        {/* Row 5: GST Breakdown Table */}
        <div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-t border-slate-900 divide-x divide-slate-900 text-center font-bold text-[11px]">
                <th rowSpan={2} className="py-1 px-2 w-24">HSN/SAC</th>
                <th rowSpan={2} className="py-1 px-2 w-28">Taxable Value</th>
                <th colSpan={2} className="py-0.5 px-2">CGST</th>
                <th colSpan={2} className="py-0.5 px-2">SGST/UTGST</th>
                <th rowSpan={2} className="py-1 px-2 w-28">Total Tax Amount</th>
              </tr>
              <tr className="border-b border-slate-900 divide-x divide-slate-900 text-center font-bold text-[10px]">
                <th className="py-0.5 px-2 w-14">Rate</th>
                <th className="py-0.5 px-2 w-20">Amount</th>
                <th className="py-0.5 px-2 w-14">Rate</th>
                <th className="py-0.5 px-2 w-20">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="divide-x divide-slate-900 text-center font-mono text-[11px]">
                <td className="py-1 px-2 font-semibold">997319</td>
                <td className="py-1 px-2 text-right">{taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="py-1 px-2">{halfTaxRate}%</td>
                <td className="py-1 px-2 text-right">{halfTaxAmount.toFixed(2)}</td>
                <td className="py-1 px-2">{halfTaxRate}%</td>
                <td className="py-1 px-2 text-right">{halfTaxAmount.toFixed(2)}</td>
                <td className="py-1 px-2 text-right font-bold">{totalTax.toFixed(2)}</td>
              </tr>
              <tr className="border-t border-slate-900 divide-x divide-slate-900 text-center font-bold font-mono text-[11px] bg-slate-50/50">
                <td className="py-1 px-2 text-center font-sans font-bold">Total</td>
                <td className="py-1 px-2 text-right">{taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="py-1 px-2"></td>
                <td className="py-1 px-2 text-right">{halfTaxAmount.toFixed(2)}</td>
                <td className="py-1 px-2"></td>
                <td className="py-1 px-2 text-right">{halfTaxAmount.toFixed(2)}</td>
                <td className="py-1 px-2 text-right">{totalTax.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Row 6: Tax in words */}
        <div className="p-2 border-t border-slate-900">
          <p className="text-[11px]">
            <span className="font-semibold text-slate-700">Tax Amount (in words) :</span>{' '}
            <span className="font-bold text-slate-900">INR {taxAmountInWords} Only</span>
          </p>
        </div>

        {/* Row 7: Remarks & Bank Details & Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-900 text-[11px]">
          {/* Left: Remarks & Customer's Seal */}
          <div className="p-2.5 flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="text-[10px] text-slate-600 block">Remarks:</span>
              <span className="font-mono font-semibold text-slate-900 block">{invoice.remarks || `${invoice.invoice_number} / ${invoiceDate}`}</span>
            </div>
            <div className="pt-8">
              <span className="font-bold text-slate-900 block">Customer's Seal and Signature</span>
            </div>
          </div>

          {/* Right: Company's Bank Details & Authorised Signatory */}
          <div className="p-2.5 flex flex-col justify-between min-h-[140px] text-right">
            <div className="space-y-0.5 text-left text-[11px]">
              <span className="font-bold text-slate-900 block">Company's Bank Details</span>
              <p className="text-slate-800"><span className="font-semibold">A/c Holder's Name :</span> {firm.bank.accountHolder}</p>
              <p className="text-slate-800"><span className="font-semibold">Bank Name :</span> {firm.bank.bankName}</p>
              <p className="text-slate-800 font-mono"><span className="font-semibold font-sans">A/c No. :</span> {firm.bank.accountNumber}</p>
              <p className="text-slate-800"><span className="font-semibold">Branch & IFS Code :</span> <span className="font-mono">{firm.bank.branchAndIfsc}</span></p>
            </div>

            <div className="pt-6 space-y-1">
              <span className="font-black text-xs text-slate-900 block">{firm.signatureLabel}</span>
              <div className="h-8"></div>
              <span className="font-bold text-slate-900 block">Authorised Signatory</span>
            </div>
          </div>
        </div>
      </div>

      {/* Very Bottom: Computer Generated Note */}
      <div className="text-center pt-2">
        <span className="text-[10px] font-semibold text-slate-600 italic">This is a Computer Generated Invoice</span>
      </div>
    </div>
  );
};
