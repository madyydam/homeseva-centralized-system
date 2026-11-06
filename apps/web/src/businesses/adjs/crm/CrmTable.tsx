'use client';

import { useState } from 'react';
import {
  Search,
  Phone,
  MessageCircle,
  Clock,
  Trash2,
  Edit3,
  Calendar,
  Store,
  Package,
  MapPin,
  ChevronDown,
  Building,
} from 'lucide-react';
import { PrintboothLeadItem, PrintboothLeadStatusType } from '../types';
import {
  getStatusBadgeClass,
  formatDateToDMY,
  normalizeStatus,
} from './crmUtils';

interface CrmTableProps {
  leads: PrintboothLeadItem[];
  selectedMonthName: string;
  selectedYear: string;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  dateFilter: string;
  setDateFilter: (s: string) => void;
  sortBy: 'newest' | 'oldest' | 'name';
  setSortBy: (s: 'newest' | 'oldest' | 'name') => void;
  onUpdateStatus: (leadId: string, newStatus: PrintboothLeadStatusType) => void;
  onUpdateCalls: (leadId: string, calls: number) => void;
  onOpenNotes: (lead: PrintboothLeadItem) => void;
  onDeleteLead: (leadId: string) => void;
}

export function CrmTable({
  leads,
  selectedMonthName,
  selectedYear,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  sortBy,
  setSortBy,
  onUpdateStatus,
  onUpdateCalls,
  onOpenNotes,
  onDeleteLead,
}: CrmTableProps) {
  const [leadToDelete, setLeadToDelete] = useState<PrintboothLeadItem | null>(null);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col font-sans">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder=""
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-500 text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-purple-600 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="interested">Interested</option>
              <option value="followup">Follow-up</option>
              <option value="negotiation">Negotiation</option>
              <option value="converted">Converted (Machine Sold)</option>
              <option value="notpicked">Not Picked</option>
              <option value="notinterested">Not Interested</option>
            </select>
          </div>

          {/* Date filter */}
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-500 text-[11px]">Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 focus:border-purple-600 focus:outline-none"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[10px] text-purple-700 font-bold hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-500 text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-purple-600 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Merchant Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10.5px]">
            <tr>
              <th className="py-3 px-3 w-12 text-center">#</th>
              <th className="py-3 px-4 min-w-[200px]">Merchant / Shop Name</th>
              <th className="py-3 px-4 min-w-[150px]">Phone Number</th>
              <th className="py-3 px-4 min-w-[170px]">Status</th>
              <th className="py-3 px-4 min-w-[120px]">Calls (0-5)</th>
              <th className="py-3 px-4 min-w-[110px]">Date</th>
              <th className="py-3 px-4 min-w-[160px]">Notes</th>
              <th className="py-3 px-4 w-16 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <Package className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-bold text-slate-600">No kiosk inquiries found for this filter</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;+ Add New Lead&quot; to record an inquiry.</p>
                </td>
              </tr>
            ) : (
              leads.map((lead, idx) => {
                const isConverted = lead.status === 'Converted';
                const notesFilledCount = lead.notesList.filter((n) => n.trim().length > 0).length;
                const cleanPhone = lead.phone.replace(/\D+/g, '');
                const waLink = cleanPhone ? `https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}` : '';

                return (
                  <tr key={lead.id} className="hover:bg-purple-50/30 transition">
                    {/* Index */}
                    <td className="py-3 px-3 text-center text-slate-400 font-mono font-bold text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Merchant & Business */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-900 block text-xs">
                          {lead.clientName}
                        </span>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {lead.shopName && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                              <Store className="h-3 w-3 text-slate-400" />
                              <span>{lead.shopName}</span>
                            </span>
                          )}
                          {lead.locationCategory && (
                            <span className="rounded bg-slate-100 text-slate-600 px-1.5 py-0.2 text-[9.5px] font-bold">
                              {lead.locationCategory}
                            </span>
                          )}
                        </div>

                        {/* Converted Kiosk Model & City (ONLY SHOWN IF CONVERTED) */}
                        {isConverted && lead.kioskModel && (
                          <div className="inline-flex items-center gap-1 rounded bg-purple-100 text-purple-900 px-2 py-0.5 text-[10px] font-extrabold border border-purple-200 mt-0.5">
                            <Package className="h-3 w-3 text-purple-700" />
                            <span>{lead.kioskModel}</span>
                            {lead.installationCity && (
                              <span className="text-purple-700 font-normal">({lead.installationCity})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{lead.phone}</span>
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 transition"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3 px-4">
                      <select
                        value={lead.status}
                        onChange={(e) => onUpdateStatus(lead.id, e.target.value as PrintboothLeadStatusType)}
                        className={`rounded-xl border px-2.5 py-1 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer ${getStatusBadgeClass(
                          lead.status
                        )}`}
                      >
                        <option value="Interested">Interested</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Converted">Converted (Machine Sold)</option>
                        <option value="Not Picked">Not Picked</option>
                        <option value="Not Interested">Not Interested</option>
                      </select>
                    </td>

                    {/* Calls (0 to 5) */}
                    <td className="py-3 px-4">
                      <select
                        value={lead.callCount}
                        onChange={(e) => onUpdateCalls(lead.id, Number(e.target.value))}
                        className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-purple-600 focus:outline-none cursor-pointer"
                      >
                        <option value={0}>0 Calls</option>
                        <option value={1}>1 Call</option>
                        <option value={2}>2 Calls</option>
                        <option value={3}>3 Calls</option>
                        <option value={4}>4 Calls</option>
                        <option value={5}>5 Calls</option>
                      </select>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 font-semibold">
                      {formatDateToDMY(lead.leadDate)}
                    </td>

                    {/* Notes Modal Button */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onOpenNotes(lead)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-purple-900 transition"
                      >
                        <Edit3 className="h-3 w-3 text-purple-600" />
                        <span>{notesFilledCount}/5 Notes</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setLeadToDelete(lead)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Lead"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 text-slate-900 space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900">Delete Kiosk Lead?</h4>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete lead <span className="font-bold">{leadToDelete.clientName}</span> ({leadToDelete.phone})? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setLeadToDelete(null)}
                className="rounded-xl border border-slate-200 px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteLead(leadToDelete.id);
                  setLeadToDelete(null);
                }}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 font-bold text-white shadow-sm text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

