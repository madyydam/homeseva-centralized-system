'use client';

import { useState } from 'react';
import { X, HelpCircle, CheckCircle2 } from 'lucide-react';
import { adjsDb } from './db';
import { PrintboothSupportTicket } from './types';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: () => void;
}

export function SupportTicketModal({
  isOpen,
  onClose,
  onTicketCreated,
}: SupportTicketModalProps) {
  const [merchantName, setMerchantName] = useState('');
  const [phone, setPhone] = useState('');
  const [issueType, setIssueType] = useState<PrintboothSupportTicket['issueType']>('Setup & Wi-Fi');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantName.trim() || !phone.trim()) return;

    const newTicket: PrintboothSupportTicket = {
      id: `PB-TCK-${Date.now().toString().slice(-4)}`,
      ticketNumber: `TCK/2026/${Math.floor(100 + Math.random() * 900)}`,
      merchantName: merchantName.trim(),
      phone: phone.trim(),
      issueType,
      status: 'Open',
      createdAt: new Date().toISOString(),
      resolutionNotes: description.trim() || undefined,
    };

    adjsDb.addTicket(newTicket);
    onTicketCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900 font-sans">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5 text-purple-600" />
            <h3 className="text-base font-extrabold text-slate-900">Log Merchant Support Ticket</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Merchant / Contact Name *</label>
            <input
              type="text"
              required
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder=""
              className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder=""
              className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Issue Category</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value as PrintboothSupportTicket['issueType'])}
              className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none font-bold"
            >
              <option value="Setup & Wi-Fi">Setup &amp; Wi-Fi Pairing</option>
              <option value="Payment Gateway">Payment Gateway &amp; UPI QR</option>
              <option value="Invoice Request">Invoice / Delivery Challan Request</option>
              <option value="Hardware Check">Hardware &amp; Spooler Check</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Issue Details / Remarks</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder=""
              className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 font-bold text-white shadow-sm transition"
            >
              Log Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

