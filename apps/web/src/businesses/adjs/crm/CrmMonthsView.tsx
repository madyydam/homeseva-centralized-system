'use client';

import { Calendar, ChevronRight, TrendingUp, Users, CheckCircle2, BarChart2, Award, Target, ArrowRight } from 'lucide-react';
import { MONTHS_LIST, AVAILABLE_YEARS } from './crmUtils';
import { PrintboothLeadItem } from '../types';

interface CrmMonthsViewProps {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  leads: PrintboothLeadItem[];
  onSelectMonth: (monthValue: string) => void;
}

export function CrmMonthsView({
  selectedYear,
  setSelectedYear,
  leads,
  onSelectMonth,
}: CrmMonthsViewProps) {
  // Filter leads for the selected year
  const yearLeads = leads.filter((l) => {
    const parts = (l.leadDate || '').split('-');
    return parts[0] === selectedYear;
  });

  const yearTotal = yearLeads.length;
  const yearConverted = yearLeads.filter((l) => l.status === 'Converted').length;
  const annualConvRate = yearTotal > 0 ? ((yearConverted / yearTotal) * 100).toFixed(1) : '0';
  const monthlyAverageLeads = (yearTotal / 12).toFixed(1);
  const monthlyAverageConverted = (yearConverted / 12).toFixed(1);

  // Compute monthly stats for all 12 months
  const monthsData = MONTHS_LIST.map((m) => {
    const monthLeads = yearLeads.filter((l) => {
      const parts = (l.leadDate || '').split('-');
      return parts[1] === m.value;
    });

    const total = monthLeads.length;
    const converted = monthLeads.filter((l) => l.status === 'Converted').length;
    const interested = monthLeads.filter((l) => l.status === 'Interested').length;
    const followUp = monthLeads.filter((l) => l.status === 'Follow-up').length;
    const notPicked = monthLeads.filter((l) => l.status === 'Not Picked').length;
    const notInterested = monthLeads.filter((l) => l.status === 'Not Interested').length;
    const rate = total > 0 ? Math.round((converted / total) * 100) : 0;

    return {
      ...m,
      total,
      converted,
      interested,
      followUp,
      notPicked,
      notInterested,
      rate,
    };
  });

  const maxMonthTotal = Math.max(...monthsData.map((m) => m.total), 5);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header Card with Year Selection */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Annual 12-Month Inquiries &amp; Machine Sales Registry
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Select year and month to open dedicated daily merchant leads sheet.
            </p>
          </div>

          {/* Year Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            <Calendar className="h-3.5 w-3.5 text-slate-500 ml-1.5 mr-0.5 shrink-0" />
            {AVAILABLE_YEARS.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                  selectedYear === yr
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. 12 Months Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
            {selectedYear} Monthly Workspaces (Click a month to open sheet)
          </h3>
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
            12 Months
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {monthsData.map((m) => {
            const isCurrentMonth = selectedYear === '2026' && m.value === '10';

            return (
              <div
                key={m.value}
                onClick={() => onSelectMonth(m.value)}
                className={`group rounded-2xl border bg-white p-5 shadow-xs hover:border-purple-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                  isCurrentMonth ? 'border-purple-400 ring-2 ring-purple-400/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition">
                          {m.name}
                        </h4>
                        {isCurrentMonth && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-400">{selectedYear}</span>
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      <span className="rounded-full bg-purple-50 text-purple-800 border border-purple-200/80 px-2 py-0.5 text-[10px] font-mono font-bold">
                        {m.total} Inquiries
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 font-mono">
                        {m.rate}% Conv
                      </span>
                    </div>
                  </div>

                  {/* Conversion Progress Bar */}
                  <div className="my-2 bg-slate-50 border border-slate-100 rounded-lg p-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                      <span>Conversion</span>
                      <span className="font-mono text-purple-700">{m.converted}/{m.total} Sold</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(m.converted > 0 ? 8 : 0, m.rate))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats Mini Breakdown */}
                  <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-slate-100 text-center">
                    <div className="rounded-xl bg-purple-50/60 p-2">
                      <span className="block text-sm font-black text-purple-700 font-mono">
                        {m.converted}
                      </span>
                      <span className="text-[9.5px] font-bold text-slate-500 uppercase">
                        Sold
                      </span>
                    </div>
                    <div className="rounded-xl bg-blue-50/60 p-2">
                      <span className="block text-sm font-black text-blue-700 font-mono">
                        {m.interested}
                      </span>
                      <span className="text-[9.5px] font-bold text-slate-500 uppercase">
                        Warm
                      </span>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2">
                      <span className="block text-sm font-black text-slate-700 font-mono">
                        {m.rate}%
                      </span>
                      <span className="text-[9.5px] font-bold text-slate-500 uppercase">
                        Conv.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-purple-600 group-hover:text-purple-700">
                  <span>Open {m.short} Sheet</span>
                  <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ANNUAL PERFORMANCE & CONVERSION TRAJECTORY CHARTS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {selectedYear} Annual Performance &amp; Conversion Trajectory
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full">
                  Annual Benchmark
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                12-month inquiry volume, closed machine sales, running monthly averages, and calling metrics.
              </p>
            </div>
          </div>

          {/* Annual Conversion Rate Badge */}
          <div className="flex items-center space-x-2.5 bg-purple-50 border border-purple-200 rounded-2xl px-4 py-2 self-start sm:self-auto">
            <Award className="h-4.5 w-4.5 text-purple-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-purple-600 block uppercase tracking-wider leading-none">
                Annual Conversion Rate
              </span>
              <span className="text-base font-black text-purple-900 leading-tight">
                {annualConvRate}%
                <span className="text-xs font-semibold text-purple-700 ml-1.5 font-mono">
                  ({yearConverted}/{yearTotal} machines)
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* 4 Annual KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Card 1: Annual Total Leads */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block leading-tight">
                Annual Inquiries
              </span>
              <span className="text-2xl font-black text-slate-900 leading-tight font-mono">
                {yearTotal}
              </span>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                Total recorded merchant leads
              </span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 border border-slate-200 shadow-2xs shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </div>

          {/* Card 2: Annual Converted */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block leading-tight">
                Machines Sold
              </span>
              <span className="text-2xl font-black text-purple-800 leading-tight font-mono">
                {yearConverted}
              </span>
              <span className="text-[10px] font-bold text-purple-600/80 block mt-0.5">
                Direct kiosk sales closed
              </span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          {/* Card 3: Monthly Average Leads */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block leading-tight">
                Monthly Avg Inquiries
              </span>
              <span className="text-2xl font-black text-blue-800 leading-tight font-mono">
                ~{monthlyAverageLeads}
              </span>
              <span className="text-[10px] font-bold text-blue-600/80 block mt-0.5">
                Inquiries / month avg
              </span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 border border-blue-200 shadow-2xs shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          {/* Card 4: Monthly Avg Converted */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block leading-tight">
                Monthly Avg Sold
              </span>
              <span className="text-2xl font-black text-emerald-800 leading-tight font-mono">
                ~{monthlyAverageConverted}
              </span>
              <span className="text-[10px] font-bold text-emerald-700/80 block mt-0.5">
                Kiosks / month avg
              </span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-2xs shrink-0">
              <Target className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Visual 12-Month Bar Chart */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                12-Month Inquiries vs Converted Trajectory ({selectedYear})
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                (Click any month bar to open its sheet)
              </span>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-3 text-[11px] font-bold text-slate-600">
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-purple-600 to-purple-400" />
                <span>Total Inquiries</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-emerald-600 to-emerald-400" />
                <span>Machines Sold</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-0.5 w-3 bg-red-400 border-b border-dashed border-red-500" />
                <span>Avg ({monthlyAverageLeads}/mo)</span>
              </div>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="relative pt-6 pb-2">
            {yearTotal > 0 && (
              <div
                className="absolute left-0 right-0 border-b-2 border-dashed border-red-400/70 z-10 pointer-events-none flex items-center justify-end pr-2"
                style={{
                  bottom: `${Math.min(
                    88,
                    Math.max(12, (Number(monthlyAverageLeads) / maxMonthTotal) * 140)
                  )}px`,
                }}
              >
                <span className="text-[9px] font-black bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded -translate-y-2.5 shadow-2xs font-mono">
                  Avg: {monthlyAverageLeads}
                </span>
              </div>
            )}

            {/* 12 Columns */}
            <div className="grid grid-cols-12 gap-1.5 sm:gap-3 items-end h-44">
              {monthsData.map((m) => {
                const totalHeight =
                  m.total > 0
                    ? Math.max(12, Math.round((m.total / maxMonthTotal) * 130))
                    : 6;
                const convertedHeight =
                  m.converted > 0
                    ? Math.max(8, Math.round((m.converted / maxMonthTotal) * 130))
                    : 0;

                return (
                  <div
                    key={m.value}
                    onClick={() => onSelectMonth(m.value)}
                    className="flex flex-col items-center justify-end h-full group cursor-pointer p-1 rounded-lg transition-all duration-150 hover:bg-white hover:shadow-xs"
                    title={`${m.name} ${selectedYear}: ${m.total} Inquiries, ${m.converted} Machines Sold (${m.rate}% Conversion)`}
                  >
                    {/* Tooltip on top */}
                    <div className="mb-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap block font-mono">
                        {m.rate}%
                      </span>
                    </div>

                    {/* Bars Group */}
                    <div className="w-full flex items-end justify-center space-x-1">
                      {/* Total Leads Bar */}
                      <div
                        className={`w-3 sm:w-5 rounded-t-sm transition-all duration-300 ${
                          m.total > 0
                            ? 'bg-gradient-to-t from-purple-600 to-purple-400 group-hover:from-purple-700 shadow-2xs'
                            : 'bg-slate-200/70'
                        }`}
                        style={{ height: `${totalHeight}px` }}
                      />

                      {/* Converted Leads Bar */}
                      <div
                        className={`w-3 sm:w-5 rounded-t-sm transition-all duration-300 ${
                          m.converted > 0
                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-700 shadow-2xs'
                            : 'bg-slate-100'
                        }`}
                        style={{ height: `${convertedHeight}px` }}
                      />
                    </div>

                    {/* Month Label */}
                    <span className="mt-2 text-[10px] font-bold text-slate-500 group-hover:text-purple-700 group-hover:font-black transition">
                      {m.short}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
