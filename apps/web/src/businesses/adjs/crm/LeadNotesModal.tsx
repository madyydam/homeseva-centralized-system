'use client';

import { useState, useEffect } from 'react';
import { X, Save, MessageSquare, Package, MapPin, Store } from 'lucide-react';
import { PrintboothLeadItem } from '../types';
import { getStatusBadgeClass } from './crmUtils';

interface LeadNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: PrintboothLeadItem | null;
  onSaveNotes: (leadId: string, notes: [string, string, string, string, string]) => void;
}

export function LeadNotesModal({
  isOpen,
  onClose,
  lead,
  onSaveNotes,
}: LeadNotesModalProps) {
  const [notes, setNotes] = useState<[string, string, string, string, string]>(['', '', '', '', '']);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (lead) {
      setNotes([...lead.notesList]);
      setSavedFeedback(false);
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleNoteChange = (index: number, val: string) => {
    const updated = [...notes] as [string, string, string, string, string];
    updated[index] = val;
    setNotes(updated);
  };

  const handleSave = () => {
    onSaveNotes(lead.id, notes);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 450);
  };

  const isConverted = lead.status === 'Converted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">{lead.clientName}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${getStatusBadgeClass(lead.status)}`}>
                {lead.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
              <span>{lead.phone}</span>
              {lead.shopName && (
                <span className="flex items-center gap-1 text-slate-700 font-semibold">
                  <Store className="h-3 w-3 text-slate-400" />
                  <span>{lead.shopName}</span>
                </span>
              )}
              {isConverted && lead.kioskModel && (
                <span className="flex items-center gap-1 rounded bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.2 font-mono font-bold text-[10px]">
                  <Package className="h-3 w-3" />
                  <span>{lead.kioskModel}</span>
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 5 Distinct Notes */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5 text-xs">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-1.5 focus-within:border-purple-500 focus-within:bg-white transition">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                <span className="flex items-center gap-1.5 text-purple-700">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Note {idx + 1}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {notes[idx]?.length || 0} chars
                </span>
              </div>
              <textarea
                value={notes[idx]}
                onChange={(e) => handleNoteChange(idx, e.target.value)}
                placeholder=""
                rows={2}
                className="w-full resize-none bg-transparent font-medium text-slate-900 focus:outline-none text-xs"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5 bg-slate-50">
          <span className="text-xs text-emerald-600 font-bold">
            {savedFeedback ? '✓ Notes Saved Successfully!' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 transition text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 font-bold text-white shadow-sm transition text-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Notes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

