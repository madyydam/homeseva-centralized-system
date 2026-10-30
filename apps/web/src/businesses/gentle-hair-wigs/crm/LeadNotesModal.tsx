'use client';

import { Dispatch, SetStateAction, memo } from 'react';
import {
  X,
  Building2,
  Calendar,
  Save,
  Clock,
} from 'lucide-react';
import { CrmLeadItem, CrmLeadStatusType, StudioInfoItem } from '../types';
import { formatDateToDMY, getStatusBadgeClass } from './crmUtils';

interface LeadNotesModalProps {
  activeNotesLead: CrmLeadItem;
  setActiveNotesLead: Dispatch<SetStateAction<CrmLeadItem | null>>;
  studios: StudioInfoItem[];
  editingNotes: [string, string, string, string, string];
  setEditingNotes: Dispatch<SetStateAction<[string, string, string, string, string]>>;
  editingFollowUpDate: string;
  setEditingFollowUpDate: Dispatch<SetStateAction<string>>;
  handleSaveNotes: () => void;
}

export const LeadNotesModal = memo(function LeadNotesModal({
  activeNotesLead,
  setActiveNotesLead,
  studios,
  editingNotes,
  setEditingNotes,
  editingFollowUpDate,
  setEditingFollowUpDate,
  handleSaveNotes,
}: LeadNotesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black text-slate-900">
                Lead Notes & Follow-ups
              </h3>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.2 rounded">
                Up to 5 in 1 Lead
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Client: <span className="text-slate-900 font-bold">{activeNotesLead.clientName}</span> ({activeNotesLead.phone})
            </p>
            <div className="flex items-center space-x-2 mt-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Status:</span>
              <select
                value={activeNotesLead.status}
                onChange={(e) => {
                  const newStatus = e.target.value as CrmLeadStatusType;
                  setActiveNotesLead({
                    ...activeNotesLead,
                    status: newStatus,
                    nextFollowUpDate: newStatus === 'Follow-up' ? editingFollowUpDate : undefined,
                  });
                  if (newStatus !== 'Follow-up') {
                    setEditingFollowUpDate('');
                  }
                }}
                className={`rounded-md border px-2 py-0.5 text-[11px] font-black cursor-pointer focus:outline-none transition ${getStatusBadgeClass(
                  activeNotesLead.status
                )}`}
              >
                <option value="Not Selected">Not Selected</option>
                <option value="Interested">Interested</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Converted">Converted</option>
                <option value="Not Picked">Not Picked</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>

            {activeNotesLead.status === 'Converted' && (
              <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-purple-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 flex items-center space-x-1">
                  <Building2 className="h-3 w-3 text-purple-600" />
                  <span>Converted Studio:</span>
                </span>
                <select
                  value={activeNotesLead.studioSlug || 'viman-nagar'}
                  onChange={(e) => {
                    const targetStudio = studios.find((s) => s.slug === e.target.value) || studios[0]!;
                    setActiveNotesLead({
                      ...activeNotesLead,
                      studioSlug: targetStudio.slug,
                      studioName: targetStudio.name,
                    });
                  }}
                  className="rounded-md border border-purple-300 bg-purple-50 text-purple-900 px-2 py-0.5 text-[11px] font-black cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {studios.map((st) => (
                    <option key={st.slug} value={st.slug}>
                      {st.name} ({st.shortName})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveNotesLead(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Activity & Date Logs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 mb-3 bg-slate-50/90 rounded-xl border border-slate-200/80 text-[11px] shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
              <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="text-slate-500 font-medium">Added:</span>
              <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                {formatDateToDMY(activeNotesLead.createdAt) || 'Not recorded'}
              </span>
            </div>

            {activeNotesLead.updatedAt && (
              <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-medium">Last Activity / Update:</span>
                <span className="font-mono text-amber-950 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300 shadow-2xs">
                  {formatDateToDMY(activeNotesLead.updatedAt)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 text-[10.5px]">
            {activeNotesLead.studioName && (
              <span className="text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                {activeNotesLead.studioName}
              </span>
            )}
            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-black font-mono">
              {activeNotesLead.callCount ?? 0} {activeNotesLead.callCount === 1 ? 'Call' : 'Calls'}
            </span>
          </div>
        </div>

        {/* Follow-up Date Scheduling inside Notes (ONLY for Follow-up status) */}
        {activeNotesLead.status === 'Follow-up' && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 mb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-black text-blue-900 flex items-center space-x-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  <span>Follow-up Date</span>
                  {editingFollowUpDate && (
                    <span className="text-[10px] font-mono font-bold text-blue-800 bg-white border border-blue-200 px-1.5 py-0.2 rounded shadow-2xs">
                      {formatDateToDMY(editingFollowUpDate)}
                    </span>
                  )}
                </label>
                <p className="text-[10px] text-blue-700/80 font-medium">
                  Schedule a follow-up callback date for this lead
                </p>
              </div>

              <div className="flex items-center space-x-1.5">
                <input
                  type="date"
                  value={editingFollowUpDate}
                  onChange={(e) => setEditingFollowUpDate(e.target.value)}
                  className="rounded-lg border border-blue-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {editingFollowUpDate && (
                  <button
                    type="button"
                    onClick={() => setEditingFollowUpDate('')}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center space-x-1.5 mt-2 pt-2 border-t border-blue-200/60">
              <span className="text-[10px] font-black uppercase text-blue-800">Quick set:</span>
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0]!;
                  setEditingFollowUpDate(today);
                }}
                className="text-[10px] font-bold bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded cursor-pointer transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  setEditingFollowUpDate(d.toISOString().split('T')[0]!);
                }}
                className="text-[10px] font-bold bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded cursor-pointer transition"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 3);
                  setEditingFollowUpDate(d.toISOString().split('T')[0]!);
                }}
                className="text-[10px] font-bold bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded cursor-pointer transition"
              >
                In 3 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 7);
                  setEditingFollowUpDate(d.toISOString().split('T')[0]!);
                }}
                className="text-[10px] font-bold bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded cursor-pointer transition"
              >
                Next Week
              </button>
            </div>
          </div>
        )}

        {/* 5 Distinct Note Inputs */}
        <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div key={idx} className="space-y-0.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Note {idx + 1}
              </label>
              <textarea
                rows={2}
                value={editingNotes[idx]}
                onChange={(e) => {
                  const updated = [...editingNotes] as [string, string, string, string, string];
                  updated[idx] = e.target.value;
                  setEditingNotes(updated);
                }}
                placeholder={`Enter Note ${idx + 1} (e.g. consultation details, client preference, trial feedback)...`}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition"
              />
            </div>
          ))}
        </div>

        {/* Modal Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={() => setActiveNotesLead(null)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveNotes}
            className="inline-flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-4 py-1.5 text-xs font-black text-white shadow-2xs transition cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Notes</span>
          </button>
        </div>
      </div>
    </div>
  );
});

