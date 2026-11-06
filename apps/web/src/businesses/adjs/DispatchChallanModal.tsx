'use client';

import { X, Printer, Package, CheckCircle2, ShieldCheck, Truck, FileText } from 'lucide-react';
import { PrintboothMachineOrder } from './types';

interface DispatchChallanModalProps {
  order: PrintboothMachineOrder | null;
  onClose: () => void;
}

export function DispatchChallanModal({ order, onClose }: DispatchChallanModalProps) {
  if (!order) return null;

  const challanNo = `CH/PB/2026/${order.orderNumber.replace(/[^0-9]/g, '').slice(-3) || '101'}`;
  const serialNo = `PB-KSK-2026-${order.id.replace(/[^0-9]/g, '').slice(-4) || '8841'}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900 font-sans my-8">
        {/* Top Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <h3 className="text-sm font-black text-slate-900">Official Machine Dispatch Challan</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Challan Body */}
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white font-black">
                  <Printer className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h1 className="text-base font-black text-slate-900 tracking-tight">ADJS · PRINTBOOTH™</h1>
                  <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                    Smart Self-Service Printing Kiosks
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                THINK IT. PRINT IT. – Direct Turnkey B2B Machine Supply
              </p>
            </div>

            <div className="text-right">
              <span className="block text-xs font-black font-mono text-purple-900">{challanNo}</span>
              <span className="block text-[11px] text-slate-500 font-medium">
                Date: {order.orderDate || new Date().toISOString().split('T')[0]}
              </span>
              <span className="inline-block mt-1 rounded bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 text-[10px] font-bold">
                Stage: {order.stage}
              </span>
            </div>
          </div>

          {/* Consignee Merchant Details */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Consignee (Merchant / Store)
              </span>
              <span className="font-extrabold text-slate-900 block text-sm">{order.merchantName}</span>
              <span className="font-semibold text-slate-700 block">{order.shopName}</span>
              <span className="text-slate-500 block mt-0.5">Destination: {order.city}</span>
              <span className="text-slate-600 font-mono font-bold block mt-0.5">Phone: {order.phone}</span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Order &amp; Machine Serial
              </span>
              <span className="font-mono font-bold text-purple-700 block">Order: {order.orderNumber}</span>
              <span className="font-mono font-bold text-slate-800 block mt-0.5">Serial: {serialNo}</span>
              <span className="text-slate-500 block mt-0.5">Dispatch Mode: Dedicated Freight Logistics</span>
              <span className="text-emerald-700 font-semibold block mt-0.5">✓ Factory Pre-Tested &amp; Sealed</span>
            </div>
          </div>

          {/* Machine Inventory Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-2.5">Item Description</th>
                  <th className="p-2.5">Kiosk Model</th>
                  <th className="p-2.5 font-mono text-center">Units</th>
                  <th className="p-2.5 font-mono text-right">Agreed Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                <tr>
                  <td className="p-3">
                    <span className="block font-bold text-slate-900">Commercial Printing Kiosk Unit</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Includes 21.5&quot; Touchscreen, Thermal Spooler, UPI QR screen &amp; Autonomous Kiosk OS
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-700">{order.kioskModel}</td>
                  <td className="p-3 font-mono font-bold text-center">{order.units}</td>
                  <td className="p-3 font-mono font-bold text-right text-slate-900">
                    ₹ {order.totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Included Accessories Checklist */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 text-[11px] space-y-2">
            <span className="block font-bold text-slate-700">Standard Turnkey Package Contents:</span>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>1x Powder-Coated Kiosk Enclosure</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>1x Pre-configured Linux Kiosk Core</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>2x Master Physical Security Keys</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>1x Merchant Quick-Start Manual</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-slate-500 border-t border-slate-200">
            <div>
              <div className="h-10 border-b border-dashed border-slate-300" />
              <span className="block mt-1 font-bold text-slate-700">Authorised Signatory (ADJS)</span>
              <span className="text-[10px]">Quality Inspection &amp; Freight Desk</span>
            </div>
            <div className="text-right">
              <div className="h-10 border-b border-dashed border-slate-300" />
              <span className="block mt-1 font-bold text-slate-700">Receiver / Merchant Signature</span>
              <span className="text-[10px]">Received in Good Physical Condition</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end print:hidden">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Close Challan
          </button>
        </div>
      </div>
    </div>
  );
}

