'use client';

import { Dispatch, SetStateAction, memo, useMemo } from 'react';
import {
  X,
  Plus,
  Building2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { CrmLeadItem, CrmLeadStatusType, StudioInfoItem } from '../types';
import { formatDateToDMY, findDuplicateLead } from './crmUtils';

interface AddLeadModalProps {
  showAddLeadModal: boolean;
  setShowAddLeadModal: Dispatch<SetStateAction<boolean>>;
  selectedMonthName: string;
  selectedYear: string;
  studios: StudioInfoItem[];
  existingLeads?: CrmLeadItem[];
  newClientName: string;
  setNewClientName: Dispatch<SetStateAction<string>>;
  newPhone: string;
  setNewPhone: Dispatch<SetStateAction<string>>;
  newStatus: CrmLeadStatusType;
  setNewStatus: Dispatch<SetStateAction<CrmLeadStatusType>>;
  newCallCount: number;
  setNewCallCount: Dispatch<SetStateAction<number>>;
  newLeadDate: string;
  setNewLeadDate: Dispatch<SetStateAction<string>>;
  newFollowUpDate: string;
  setNewFollowUpDate: Dispatch<SetStateAction<string>>;
  newStudioSlug: string;
  setNewStudioSlug: Dispatch<SetStateAction<string>>;
  newNotesList: [string, string, string, string, string];
  setNewNotesList: Dispatch<SetStateAction<[string, string, string, string, string]>>;
  handleCreateLead: (e: React.FormEvent) => void;
}

export const AddLeadModal = memo(function AddLeadModal({
  showAddLeadModal,
  setShowAddLeadModal,
  selectedMonthName,
  selectedYear,
  studios,
  existingLeads = [],
  newClientName,
  setNewClientName,
  newPhone,
  setNewPhone,
  newStatus,
  setNewStatus,
  newCallCount,
  setNewCallCount,
  newLeadDate,
  setNewLeadDate,
  newFollowUpDate,
  setNewFollowUpDate,
  newStudioSlug,
  setNewStudioSlug,
  newNotesList,
  setNewNotesList,
  handleCreateLead,
}: AddLeadModalProps) {
  // Live duplicate detection
  const duplicateLead = useMemo(() => {
    if (!newPhone || !existingLeads || existingLeads.length === 0) return null;
    return findDuplicateLead(newPhone, existingLeads);
  }, [newPhone, existingLeads]);

  if (!showAddLeadModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              + Add New Lead in {selectedMonthName} {selectedYear}
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Record inquiry directly into the centralized CRM sheet
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddLeadModal(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleCreateLead} className="space-y-3">
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Client Name (Optional)
              </label>
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600">
                  Phone Number *
                </label>
                {duplicateLead && (
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    Already Exists
                  </span>
                )}
              </div>
              <input
                type="tel"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className={`w-full rounded-lg border p-2 text-xs font-mono font-bold transition ${
                  duplicateLead
                    ? 'border-rose-400 bg-rose-50/40 text-rose-950 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500'
                }`}
              />
              {duplicateLead && (
                <div className="mt-1.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-[11px] font-bold flex items-start space-x-2 animate-in fade-in duration-150 shadow-2xs">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-snug">
                    <span className="block font-black text-rose-900">
                      This phone number already exists in CRM!
                    </span>
                    <span className="text-[10px] text-rose-800 block mt-0.5 font-medium">
                      Existing Lead: <strong className="text-slate-900">{duplicateLead.clientName}</strong> · Status: <span className="font-bold uppercase text-slate-900">{duplicateLead.status}</span> · Studio: <span className="text-slate-900 font-bold">{duplicateLead.studioName || duplicateLead.studioSlug}</span> · Added: {formatDateToDMY(duplicateLead.createdAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Status & Calls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Status Dropdown
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as CrmLeadStatusType)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-black text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="Not Selected">Not Selected</option>
                <option value="Interested">Interested</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Converted">Converted</option>
                <option value="Not Picked">Not Picked</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>

            {newStatus === 'Converted' ? (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-purple-700 mb-1 flex items-center space-x-1">
                  <Building2 className="h-3 w-3 text-purple-600" />
                  <span>Converted Studio Branch *</span>
                </label>
                <select
                  value={newStudioSlug}
                  onChange={(e) => setNewStudioSlug(e.target.value)}
                  className="w-full rounded-lg border border-purple-300 p-2 text-xs font-black text-purple-900 bg-purple-50/50 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {studios.map((st) => (
                    <option key={st.slug} value={st.slug}>
                      {st.name} ({st.shortName})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  Calls (0 to 5)
                </label>
                <select
                  value={newCallCount}
                  onChange={(e) => setNewCallCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs font-black text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value={0}>0 Calls</option>
                  <option value={1}>1 Call</option>
                  <option value={2}>2 Calls</option>
                  <option value={3}>3 Calls</option>
                  <option value={4}>4 Calls</option>
                  <option value={5}>5 Calls</option>
                </select>
              </div>
            )}
          </div>

          {/* Row 3: Date & Follow-up Date */}
          <div className={`grid gap-3 ${newStatus === 'Follow-up' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                <span>Lead Date</span>
                {newLeadDate && (
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    ({formatDateToDMY(newLeadDate)})
                  </span>
                )}
              </label>
              <input
                type="date"
                value={newLeadDate}
                onChange={(e) => setNewLeadDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            {newStatus === 'Follow-up' && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-blue-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-blue-600" />
                    <span>Follow-up Date *</span>
                  </span>
                  {newFollowUpDate && (
                    <span className="text-[10px] font-mono text-blue-700 font-bold">
                      ({formatDateToDMY(newFollowUpDate)})
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  required
                  value={newFollowUpDate}
                  onChange={(e) => setNewFollowUpDate(e.target.value)}
                  className="w-full rounded-lg border border-blue-200 p-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Row 4: Initial Notes */}
          <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600">
              Initial Notes (Up to 5 in 1 Lead)
            </label>

            <input
              type="text"
              placeholder="Note 1 (e.g. Inquired about lace wig via Instagram ad)..."
              value={newNotesList[0]}
              onChange={(e) => {
                const copy = [...newNotesList] as [string, string, string, string, string];
                copy[0] = e.target.value;
                setNewNotesList(copy);
              }}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />

            <input
              type="text"
              placeholder="Note 2 (optional follow-up info)..."
              value={newNotesList[1]}
              onChange={(e) => {
                const copy = [...newNotesList] as [string, string, string, string, string];
                copy[1] = e.target.value;
                setNewNotesList(copy);
              }}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {duplicateLead ? (
              <span className="text-[11px] font-bold text-rose-700 flex items-center space-x-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                <span>Duplicate phone number. Cannot save duplicate lead.</span>
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">
                Centralized CRM · Unique Phone Guaranteed
              </span>
            )}
            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setShowAddLeadModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={Boolean(duplicateLead)}
                title={duplicateLead ? 'This phone number already exists in CRM' : 'Save Lead'}
                className={`inline-flex items-center space-x-1.5 rounded-lg px-4 py-1.5 text-xs font-black shadow-2xs transition cursor-pointer ${
                  duplicateLead
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-75'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{duplicateLead ? 'Duplicate Exists' : 'Save Lead'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});

