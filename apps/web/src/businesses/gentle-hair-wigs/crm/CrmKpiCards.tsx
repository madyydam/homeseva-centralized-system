'use client';

import { Dispatch, SetStateAction, memo } from 'react';
import {
  Users,
  Sparkles,
  Clock,
  CheckCircle2,
  PhoneCall,
  XCircle,
} from 'lucide-react';
import { normalizeStatus } from './crmUtils';

export interface MonthKpiStats {
  total: number;
  notSelected: number;
  interested: number;
  followUp: number;
  converted: number;
  notInterested: number;
  notPicked: number;
}

interface CrmKpiCardsProps {
  monthKpis: MonthKpiStats;
  statusFilter: string;
  setStatusFilter: Dispatch<SetStateAction<string>>;
}

export const CrmKpiCards = memo(function CrmKpiCards({
  monthKpis,
  statusFilter,
  setStatusFilter,
}: CrmKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {/* Card 1: TOTAL LEADS */}
      <div
        onClick={() => setStatusFilter('all')}
        className={`rounded-xl border px-3.5 py-2 shadow-2xs flex items-center justify-between transition-all duration-150 cursor-pointer select-none group ${
          statusFilter === 'all'
            ? 'border-slate-800 ring-2 ring-slate-800/25 bg-slate-900 text-white shadow-md'
            : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-xs'
        }`}
        title="Click to show All Leads"
      >
        <div>
          <div className="flex items-center space-x-1.5">
            <span
              className={`text-[10px] font-black uppercase tracking-wider block leading-tight ${
                statusFilter === 'all' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              Total Leads
            </span>
            {monthKpis.notSelected > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusFilter((prev) =>
                    normalizeStatus(prev) === 'notselected' ? 'all' : 'Not Selected'
                  );
                }}
                title={`${monthKpis.notSelected} leads with status Not Selected (Click to filter)`}
                className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border transition cursor-pointer ${
                  normalizeStatus(statusFilter) === 'notselected'
                    ? 'bg-amber-400 text-slate-900 border-amber-500 ring-1 ring-amber-500 font-black'
                    : statusFilter === 'all'
                    ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                {monthKpis.notSelected} Unset
              </button>
            )}
          </div>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span
              className={`text-xl font-black leading-none ${
                statusFilter === 'all' ? 'text-white' : 'text-slate-900'
              }`}
            >
              {monthKpis.total}
            </span>
            {statusFilter === 'all' && (
              <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider">
                All Active
              </span>
            )}
          </div>
        </div>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition ${
            statusFilter === 'all' ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Users className="h-4 w-4" />
        </div>
      </div>

      {/* Card 2: INTERESTED */}
      <div
        onClick={() =>
          setStatusFilter((prev) =>
            normalizeStatus(prev) === 'interested' ? 'all' : 'Interested'
          )
        }
        className={`rounded-xl border px-3.5 py-2 shadow-2xs flex items-center justify-between transition-all duration-150 cursor-pointer select-none group ${
          normalizeStatus(statusFilter) === 'interested'
            ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-50/90 shadow-md scale-[1.02]'
            : 'border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30'
        }`}
        title="Click to show only Interested leads (click again to show all)"
      >
        <div>
          <div className="flex items-center space-x-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block leading-tight">
              Interested
            </span>
            {normalizeStatus(statusFilter) === 'interested' && (
              <span className="text-[8.5px] font-black uppercase tracking-wider bg-emerald-600 text-white px-1 py-0.2 rounded leading-none">
                Active
              </span>
            )}
          </div>
          <span className="text-xl font-black text-emerald-600 leading-none">
            {monthKpis.interested}
          </span>
        </div>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg border shrink-0 transition ${
            normalizeStatus(statusFilter) === 'interested'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}
        >
          <Sparkles className="h-4 w-4" />
        </div>
      </div>

      {/* Card 3: FOLLOW-UP */}
      <div
        onClick={() =>
          setStatusFilter((prev) =>
            normalizeStatus(prev) === 'followup' ? 'all' : 'Follow-up'
          )
        }
        className={`rounded-xl border px-3.5 py-2 shadow-2xs flex items-center justify-between transition-all duration-150 cursor-pointer select-none group ${
          normalizeStatus(statusFilter) === 'followup'
            ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-50/90 shadow-md scale-[1.02]'
            : 'border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50/30'
        }`}
        title="Click to show only Follow-up leads (click again to show all)"
      >
        <div>
          <div className="flex items-center space-x-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block leading-tight">
              Follow-up
            </span>
            {normalizeStatus(statusFilter) === 'followup' && (
              <span className="text-[8.5px] font-black uppercase tracking-wider bg-blue-600 text-white px-1 py-0.2 rounded leading-none">
                Active
              </span>
            )}
          </div>
          <span className="text-xl font-black text-blue-600 leading-none">
            {monthKpis.followUp}
          </span>
        </div>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg border shrink-0 transition ${
            normalizeStatus(statusFilter) === 'followup'
              ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
              : 'bg-blue-50 text-blue-600 border-blue-200'
          }`}
        >
          <Clock className="h-4 w-4" />
        </div>
      </div>

      {/* Card 4: CONVERTED */}
      <div
        onClick={() =>
          setStatusFilter((prev) =>
            normalizeStatus(prev) === 'converted' ? 'all' : 'Converted'
          )
        }
        className={`rounded-xl border px-3.5 py-2 shadow-2xs flex items-center justify-between transition-all duration-150 cursor-pointer select-none group ${
          normalizeStatus(statusFilter) === 'converted'
            ? 'border-purple-500 ring-2 ring-purple-500/40 bg-purple-50/90 shadow-md scale-[1.02]'
            : 'border-purple-200 bg-white hover:border-purple-400 hover:bg-purple-50/30'
        }`}
        title="Click to show only Converted leads (click again to show all)"
      >
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block leading-tight">
              Converted
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              {monthKpis.total > 0
                ? `${((monthKpis.converted / monthKpis.total) * 100).toFixed(0)}% Conv`
                : '0% Conv'}
            </span>
            {normalizeStatus(statusFilter) === 'converted' && (
              <span className="text-[8.5px] font-black uppercase tracking-wider bg-purple-600 text-white px-1 py-0.2 rounded leading-none">
                Active
              </span>
            )}
          </div>
          <span className="text-xl font-black text-purple-600 leading-none">
            {monthKpis.converted}
          </span>
        </div>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg border shrink-0 transition ${
            normalizeStatus(statusFilter) === 'converted'
              ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
              : 'bg-purple-50 text-purple-600 border-purple-200'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
        </div>
      </div>

      {/* Card 5: NOT PICKED */}
      <div
        onClick={() =>
          setStatusFilter((prev) =>
            normalizeStatus(prev) === 'notpicked' ? 'all' : 'Not Picked'
          )
        }
        className={`rounded-xl border px-3.5 py-2 shadow-2xs flex items-center justify-between transition-all duration-150 cursor-pointer select-none group ${
          normalizeStatus(statusFilter) === 'notpicked'
            ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-50/90 shadow-md scale-[1.02]'
            : 'border-amber-200 bg-white hover:border-amber-400 hover:bg-amber-50/30'
        }`}
        title="Click to show only Not Picked leads (click again to show all)"
      >
        <div>
          <div className="flex items-center space-x-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block leading-tight">
              Not Picked
            </span>
            {normalizeStatus(statusFilter) === 'notpicked' && (
              <span className="text-[8.5px] font-black uppercase tracking-wider bg-amber-600 text-white px-1 py-0.2 rounded leading-none">
                Active
              </span>
            )}
          </div>
          <span className="text-xl font-black text-amber-600 leading-none">
            {monthKpis.notPicked}
          </span>
        </div>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg border shrink-0 transition ${
            normalizeStatus(statusFilter) === 'notpicked'
              ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
              : 'bg-amber-50 text-amber-600 border-amber-200'
          }`}
        >
          <PhoneCall className="h-4 w-4" />
        </div>
      </div>

      {/* Card 6: NOT INTERESTED */}
      <div
        onClick={() =>
          setStatusFilter((prev) =>
            normalizeStatus(prev) === 'notinterested' ? 'all' : 'Not Interested'
          )
        }
        className={`rounded-xl border px-3.5 py-2 shadow-2xs flex items-center justify-between transition-all duration-150 cursor-pointer select-none group ${
          normalizeStatus(statusFilter) === 'notinterested'
            ? 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-50/90 shadow-md scale-[1.02]'
            : 'border-rose-200 bg-white hover:border-rose-400 hover:bg-rose-50/30'
        }`}
        title="Click to show only Not Interested leads (click again to show all)"
      >
        <div>
          <div className="flex items-center space-x-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block leading-tight">
              Not Interested
            </span>
            {normalizeStatus(statusFilter) === 'notinterested' && (
              <span className="text-[8.5px] font-black uppercase tracking-wider bg-rose-600 text-white px-1 py-0.2 rounded leading-none">
                Active
              </span>
            )}
          </div>
          <span className="text-xl font-black text-rose-600 leading-none">
            {monthKpis.notInterested}
          </span>
        </div>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg border shrink-0 transition ${
            normalizeStatus(statusFilter) === 'notinterested'
              ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
              : 'bg-rose-50 text-rose-600 border-rose-200'
          }`}
        >
          <XCircle className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
});

