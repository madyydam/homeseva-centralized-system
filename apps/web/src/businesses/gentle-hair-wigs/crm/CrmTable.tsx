'use client';

import { Dispatch, SetStateAction, Fragment, memo } from 'react';
import {
  Search,
  Calendar,
  X,
  Clock,
  MessageSquare,
  CheckCircle2,
  Edit3,
  Trash2,
  FileSpreadsheet,
  Plus,
  Building2,
} from 'lucide-react';
import { CrmLeadItem, CrmLeadStatusType } from '../types';
import { formatDateToDMY, getStatusBadgeClass } from './crmUtils';

interface CrmTableProps {
  tableLeads: CrmLeadItem[];
  currentMonthLeads: CrmLeadItem[];
  selectedMonthName: string;
  selectedMonth: string;
  selectedYear: string;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  statusFilter: string;
  setStatusFilter: Dispatch<SetStateAction<string>>;
  studioFilter?: string;
  setStudioFilter?: Dispatch<SetStateAction<string>>;
  dateFilter: string;
  setDateFilter: Dispatch<SetStateAction<string>>;
  sortBy: 'newest' | 'oldest' | 'name';
  setSortBy: Dispatch<SetStateAction<'newest' | 'oldest' | 'name'>>;
  setSelectedYear: Dispatch<SetStateAction<string>>;
  setSelectedMonth: Dispatch<SetStateAction<string>>;
  handleUpdateStatus: (lead: CrmLeadItem, status: CrmLeadStatusType) => void;
  handleUpdateCalls: (leadId: string, callCount: number) => void;
  handleOpenNotes: (lead: CrmLeadItem) => void;
  handleDeleteLead: (leadId: string, leadName: string) => void;
  setShowAddLeadModal: Dispatch<SetStateAction<boolean>>;
  setShowImportModal: Dispatch<SetStateAction<boolean>>;
  setNewLeadDate: Dispatch<SetStateAction<string>>;
}

const getWhatsAppUrl = (phone: string): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const waNumber =
    cleanPhone.startsWith('91') && cleanPhone.length > 10
      ? cleanPhone
      : cleanPhone.length === 10
      ? `91${cleanPhone}`
      : cleanPhone;
  return `https://wa.me/${waNumber}`;
};

export const CrmTable = memo(function CrmTable({
  tableLeads,
  currentMonthLeads,
  selectedMonthName,
  selectedMonth,
  selectedYear,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  studioFilter = 'all',
  setStudioFilter,
  dateFilter,
  setDateFilter,
  sortBy,
  setSortBy,
  setSelectedYear,
  setSelectedMonth,
  handleUpdateStatus,
  handleUpdateCalls,
  handleOpenNotes,
  handleDeleteLead,
  setShowAddLeadModal,
  setShowImportModal,
  setNewLeadDate,
}: CrmTableProps) {
  return (
    <div className="space-y-2.5">
      {/* Search & Filter Row - Compact Height */}
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${selectedMonthName} leads by name, phone, or notes...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-1 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition"
            />
          </div>

          {/* Status, Date & Sort Filters */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {/* 1. Status Filter */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <span className="text-[10px] font-black text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Not Selected">Not Selected</option>
                <option value="Interested">Interested</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Converted">Converted</option>
                <option value="Not Picked">Not Picked</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>

            {/* 1.5. Studio Filter (Centralized across all 3 studios) */}
            {setStudioFilter && (
              <div className="flex items-center space-x-1 bg-amber-50/70 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                <Building2 className="h-3 w-3 text-amber-700 shrink-0" />
                <span className="text-[10px] font-black text-amber-900">Studio:</span>
                <select
                  value={studioFilter}
                  onChange={(e) => setStudioFilter(e.target.value)}
                  className="bg-transparent text-xs font-black text-amber-950 focus:outline-none cursor-pointer"
                >
                  <option value="all">All 3 Studios</option>
                  <option value="viman-nagar">Viman Nagar</option>
                  <option value="ravet">Ravet</option>
                  <option value="kolhapur">Kolhapur</option>
                </select>
              </div>
            )}

            {/* 2. Single Date Activity Filter */}
            <div
              className={`flex items-center space-x-1.5 border px-2.5 py-1 rounded-lg transition ${
                dateFilter
                  ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <Calendar
                className={`h-3 w-3 shrink-0 ${dateFilter ? 'text-amber-700' : 'text-slate-500'}`}
              />
              <span
                className={`text-[10px] font-black whitespace-nowrap ${
                  dateFilter ? 'text-amber-800' : 'text-slate-500'
                }`}
              >
                Date:
              </span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setDateFilter(val);
                  if (val && val.length >= 7) {
                    const [y, m] = val.split('-');
                    if (y && m && (y !== selectedYear || m !== selectedMonth)) {
                      setSelectedYear(y);
                      setSelectedMonth(m);
                    }
                  }
                }}
                className="bg-transparent text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
                title="Select a date to see all leads added or updated/edited on that day"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="text-slate-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                  title="Clear date filter"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* 3. Sort Filter */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <span className="text-[10px] font-black text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
                className="bg-transparent text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest Date</option>
                <option value="oldest">Oldest Date</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            {(searchTerm || statusFilter !== 'all' || sortBy !== 'newest' || dateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('');
                  setSortBy('newest');
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 px-1.5 py-0.5 transition cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {(statusFilter !== 'all' || dateFilter || searchTerm) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-amber-50/80 via-slate-50 to-white border border-amber-200/90 px-3.5 py-2 text-xs text-slate-900 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Active Filter:
            </span>

            {statusFilter !== 'all' && (
              <span
                className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black border shadow-2xs ${getStatusBadgeClass(
                  statusFilter as CrmLeadStatusType
                )}`}
              >
                <span>Status: {statusFilter}</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className="hover:opacity-75 cursor-pointer ml-1 font-black text-sm leading-none"
                  title="Clear status filter"
                >
                  &times;
                </button>
              </span>
            )}

            {studioFilter !== 'all' && setStudioFilter && (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                <Building2 className="h-3 w-3 text-amber-700 shrink-0" />
                <span>Studio: {studioFilter === 'viman-nagar' ? 'Viman Nagar' : studioFilter === 'ravet' ? 'Ravet' : studioFilter === 'kolhapur' ? 'Kolhapur' : studioFilter}</span>
                <button
                  type="button"
                  onClick={() => setStudioFilter('all')}
                  className="hover:opacity-75 cursor-pointer ml-1 font-black text-sm leading-none text-amber-900"
                  title="Clear studio filter"
                >
                  &times;
                </button>
              </span>
            )}

            {dateFilter && (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                <Calendar className="h-3 w-3 text-amber-700 shrink-0" />
                <span>Activity Date: {formatDateToDMY(dateFilter)}</span>
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="hover:opacity-75 cursor-pointer ml-1 font-black text-sm leading-none text-amber-900"
                  title="Clear date filter"
                >
                  &times;
                </button>
              </span>
            )}

            {searchTerm && (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
                <Search className="h-3 w-3 text-slate-500 shrink-0" />
                <span>Search: &ldquo;{searchTerm}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="hover:opacity-75 cursor-pointer ml-1 font-black text-sm leading-none"
                  title="Clear search query"
                >
                  &times;
                </button>
              </span>
            )}

            <span className="text-slate-600 font-bold text-[11px] ml-1">
              &rarr; Showing <strong>{tableLeads.length}</strong>{' '}
              {tableLeads.length === 1 ? 'lead' : 'leads'} (out of {currentMonthLeads.length} in{' '}
              {selectedMonthName})
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              if (setStudioFilter) setStudioFilter('all');
              setDateFilter('');
              setSearchTerm('');
              setSortBy('newest');
            }}
            className="text-xs font-black text-rose-600 hover:text-rose-800 underline cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* 7 COLUMNS LEAD TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-black uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[190px]">Name</th>
                <th className="py-2.5 px-3 min-w-[160px]">Phone Number</th>
                <th className="py-2.5 px-3 min-w-[150px]">Status</th>
                <th className="py-2.5 px-3 min-w-[110px]">Calls</th>
                <th className="py-2.5 px-3 min-w-[240px]">Notes</th>
                <th className="py-2.5 px-3 w-16 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableLeads.length > 0 ? (
                tableLeads.map((lead, index) => {
                  const validNotes = lead.notesList ? lead.notesList.filter(Boolean) : [];
                  const noteCount = validNotes.length;
                  const latestNote = noteCount > 0 ? validNotes[noteCount - 1] : '';
                  const isConverted = lead.status === 'Converted';

                  return (
                    <Fragment key={lead.id}>
                      <tr
                        className={`hover:bg-amber-50/20 transition-colors group ${
                          isConverted ? 'bg-purple-50/15' : ''
                        }`}
                      >
                        {/* 1. SERIAL NUMBER */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                          {index + 1}
                        </td>

                        {/* 2. NAME */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-black text-slate-900 text-xs">
                              {lead.clientName?.trim() || "Don't know"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenNotes(lead)}
                              className="p-1 rounded-md text-slate-400 hover:text-amber-700 hover:bg-amber-100/70 transition cursor-pointer group"
                              title={`View Activity Logs (Added: ${formatDateToDMY(lead.createdAt)}${lead.updatedAt && lead.updatedAt !== lead.createdAt ? ` • Updated: ${formatDateToDMY(lead.updatedAt)}` : ''})`}
                            >
                              <Clock className="h-3.5 w-3.5 group-hover:scale-115 transition-transform" />
                            </button>
                          </div>

                          {/* Studio Branch & Follow-up Badges */}
                          <div className="mt-1 flex items-center space-x-1.5 flex-wrap gap-1">
                            <span className="inline-flex items-center space-x-1 text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200/80">
                              <Building2 className="h-2.5 w-2.5 text-amber-700" />
                              <span>{lead.studioName || (lead.studioSlug === 'ravet' ? 'Studio of Ravet' : lead.studioSlug === 'kolhapur' ? 'Studio of Kolhapur' : 'Studio of Viman Nagar')}</span>
                            </span>

                            {/* Follow-up Date */}
                            {lead.status === 'Follow-up' && lead.nextFollowUpDate && (
                              <span className="inline-flex items-center space-x-1 text-[9.5px] font-black px-1.5 py-0.2 rounded border bg-blue-600 text-white border-blue-700 shadow-2xs font-bold">
                                <Calendar className="h-2.5 w-2.5" />
                                <span>Follow-up: {formatDateToDMY(lead.nextFollowUpDate)}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. PHONE NUMBER */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-2">
                            <a
                              href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                              className="font-mono font-bold text-slate-800 text-xs hover:text-blue-600 transition"
                              title="Click to dial phone number"
                            >
                              {lead.phone}
                            </a>

                            {/* WhatsApp Quick Link */}
                            <a
                              href={getWhatsAppUrl(lead.phone)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-0.5 rounded text-emerald-600 hover:bg-emerald-50 transition"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="h-3 w-3" />
                            </a>
                          </div>
                        </td>

                        {/* 4. STATUS (Interactive Dropdown) */}
                        <td className="py-2.5 px-3">
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              handleUpdateStatus(lead, e.target.value as CrmLeadStatusType)
                            }
                            className={`rounded-lg border px-2 py-1 text-xs font-black cursor-pointer focus:outline-none transition ${getStatusBadgeClass(
                              lead.status
                            )}`}
                          >
                            <option value="Not Selected">Not Selected</option>
                            <option value="Interested">Interested</option>
                            <option value="Follow-up">Follow-up</option>
                            <option value="Converted">Converted</option>
                            <option value="Not Picked">Not Picked</option>
                            <option value="Not Interested">Not Interested</option>
                          </select>
                        </td>

                        {/* 5. CALLS */}
                        <td className="py-2.5 px-3">
                          {isConverted ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                              <CheckCircle2 className="h-3 w-3 text-purple-600" />
                              <span>Converted</span>
                            </span>
                          ) : (
                            <select
                              value={lead.callCount}
                              onChange={(e) =>
                                handleUpdateCalls(lead.id, Number(e.target.value))
                              }
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-black text-slate-800 focus:outline-none cursor-pointer hover:bg-white transition"
                            >
                              <option value={0}>0 Calls</option>
                              <option value={1}>1 Call</option>
                              <option value={2}>2 Calls</option>
                              <option value={3}>3 Calls</option>
                              <option value={4}>4 Calls</option>
                              <option value={5}>5 Calls</option>
                            </select>
                          )}
                        </td>

                        {/* 6. NOTES */}
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col space-y-0.5">
                            {lead.status === 'Follow-up' && lead.nextFollowUpDate && (
                              <div className="flex items-center space-x-1 text-[10px] font-black text-blue-700">
                                <Calendar className="h-2.5 w-2.5 text-blue-600" />
                                <span>Due: {formatDateToDMY(lead.nextFollowUpDate)}</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenNotes(lead)}
                              className={`inline-flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded transition w-fit cursor-pointer ${
                                isConverted
                                  ? 'text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80'
                              }`}
                            >
                              <Edit3
                                className={`h-3 w-3 ${
                                  isConverted ? 'text-purple-600' : 'text-amber-600'
                                }`}
                              />
                              <span>{noteCount}/5 Notes</span>
                              <span
                                className={`text-[10px] font-normal ${
                                  isConverted ? 'text-purple-600' : 'text-amber-600'
                                }`}
                              >
                                (Click to edit)
                              </span>
                            </button>

                            {latestNote ? (
                              <p className="text-[10px] text-slate-500 italic truncate max-w-xs">
                                &ldquo;{latestNote}&rdquo;
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic">No notes added</p>
                            )}
                          </div>
                        </td>

                        {/* 7. DELETE */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteLead(lead.id, lead.clientName?.trim() || "Don't know")}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <FileSpreadsheet className="h-8 w-8 text-slate-300" />
                      <h4 className="text-xs font-black text-slate-700">
                        {statusFilter !== 'all'
                          ? `No "${statusFilter}" Leads in ${selectedMonthName} ${selectedYear}`
                          : `No Leads in ${selectedMonthName} ${selectedYear}`}
                      </h4>
                      <p className="text-[11px] text-slate-400 max-w-sm">
                        {statusFilter !== 'all'
                          ? `None of the leads in this month currently have the "${statusFilter}" status.`
                          : searchTerm || dateFilter
                          ? 'No leads matching the current filters. Try resetting the filters.'
                          : 'No client inquiries or leads recorded for this month yet.'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {statusFilter !== 'all' && (
                          <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className="inline-flex items-center space-x-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1 transition shadow-2xs cursor-pointer"
                          >
                            <span>Show All Statuses</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setNewLeadDate(`${selectedYear}-${selectedMonth}-15`);
                            setShowAddLeadModal(true);
                          }}
                          className="inline-flex items-center space-x-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3 py-1 transition shadow-2xs cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add Lead</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowImportModal(true)}
                          className="inline-flex items-center space-x-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs px-3 py-1 transition cursor-pointer"
                        >
                          <FileSpreadsheet className="h-3 w-3" />
                          <span>Import Excel</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 flex items-center justify-between text-[11px] text-slate-500 font-bold">
          <span>
            Showing {tableLeads.length} of {currentMonthLeads.length} leads in {selectedMonthName}{' '}
            {selectedYear}
          </span>
          <span className="font-mono text-slate-400">Strictly 7 Columns &middot; Auto-Saved</span>
        </div>
      </div>
    </div>
  );
});

