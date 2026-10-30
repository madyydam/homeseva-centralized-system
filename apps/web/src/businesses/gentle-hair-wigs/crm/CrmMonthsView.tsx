'use client';

import { Dispatch, SetStateAction, memo } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Plus,
  Users,
  Target,
  BarChart2,
  Award,
  TrendingUp,
  Building2,
  ArrowRight,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { StudioInfoItem } from '../types';
import { MONTHS_LIST, AVAILABLE_YEARS } from './crmUtils';

export interface AnnualAnalyticsData {
  yearTotal: number;
  yearNotSelected: number;
  yearInterested: number;
  yearFollowUp: number;
  yearConverted: number;
  yearNotInterested: number;
  yearNotPicked: number;
  annualConvRate: string;
  monthlyAverageLeads: string;
  monthlyAverageConverted: string;
  monthlySeries: Array<{
    monthKey: string;
    name: string;
    short: string;
    total: number;
    converted: number;
    conversionRate: number;
  }>;
  maxMonthTotal: number;
  studioMap: Record<string, { total: number; converted: number }>;
}

export interface YearMonthsStatsMap {
  [monthKey: string]: {
    total: number;
    notSelected: number;
    interested: number;
    followUp: number;
    converted: number;
    notInterested: number;
    notPicked: number;
  };
}

interface CrmMonthsViewProps {
  selectedYear: string;
  setSelectedYear: Dispatch<SetStateAction<string>>;
  selectedMonth: string;
  yearMonthsStats: YearMonthsStatsMap;
  annualAnalytics: AnnualAnalyticsData;
  studios: StudioInfoItem[];
  handleOpenMonthSheet: (monthValue: string) => void;
  setShowImportModal: Dispatch<SetStateAction<boolean>>;
  setShowAddLeadModal: Dispatch<SetStateAction<boolean>>;
  setNewLeadDate: Dispatch<SetStateAction<string>>;
  setImportFile: Dispatch<SetStateAction<File | null>>;
  setImportPreview: Dispatch<SetStateAction<any[]>>;
  setImportError: Dispatch<SetStateAction<string>>;
  handleExportExcel?: () => void;
}

export const CrmMonthsView = memo(function CrmMonthsView({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  yearMonthsStats,
  annualAnalytics,
  studios,
  handleOpenMonthSheet,
  setShowImportModal,
  setShowAddLeadModal,
  setNewLeadDate,
  setImportFile,
  setImportPreview,
  setImportError,
  handleExportExcel,
}: CrmMonthsViewProps) {
  return (
    <div className="space-y-4">
      {/* Header Card with Year Selection - Compressed */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-[14px] font-bold text-slate-900 tracking-tight">
                Client CRM & Monthly Sheets
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Select year and month to open dedicated lead sheet workspace.
              </p>
            </div>
          </div>

          {/* Year Selector & Actions */}
          <div className="flex items-center space-x-2">
            {/* Year Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Calendar className="h-3.5 w-3.5 text-slate-500 ml-1 mr-0.5 shrink-0" />
              {AVAILABLE_YEARS.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-1 rounded-md text-xs font-black transition cursor-pointer ${
                    selectedYear === yr
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            {/* Import Excel Button */}
            <button
              type="button"
              onClick={() => {
                setImportFile(null);
                setImportPreview([]);
                setImportError('');
                setShowImportModal(true);
              }}
              className="inline-flex items-center space-x-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 px-2.5 py-1 text-xs font-bold transition cursor-pointer"
              title="Import Leads from Excel Sheet (.xlsx, .xls)"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
              <span>Import Excel</span>
            </button>

            {/* Export Complete Backup Button */}
            {handleExportExcel && (
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center space-x-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-2.5 py-1 text-xs font-bold transition cursor-pointer"
                title="Export Complete CRM Database Backup (.xlsx) with all dates and logs"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                <span>Export All (Backup)</span>
              </button>
            )}

            {/* Add Lead Button */}
            <button
              type="button"
              onClick={() => {
                setNewLeadDate(`${selectedYear}-${selectedMonth}-15`);
                setShowAddLeadModal(true);
              }}
              className="inline-flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-3 py-1 text-xs font-black text-white shadow-2xs transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ New Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* 12 Months Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
            {selectedYear} Monthly Folders (Click a month to open sheet)
          </h3>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.2 rounded-md">
            12 Months
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {MONTHS_LIST.map((m) => {
            const stats = yearMonthsStats[m.value] || {
              total: 0,
              notSelected: 0,
              interested: 0,
              followUp: 0,
              converted: 0,
              notInterested: 0,
              notPicked: 0,
            };
            const isCurrentMonth = selectedYear === '2026' && m.value === '10';
            const conversionPct =
              stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(1) : '0';
            const conversionNum = Number(conversionPct);

            return (
              <div
                key={m.value}
                onClick={() => handleOpenMonthSheet(m.value)}
                className={`rounded-xl border bg-white p-3.5 transition-all duration-150 cursor-pointer group flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 ${
                  isCurrentMonth
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : 'border-slate-200 hover:border-amber-300'
                }`}
              >
                <div>
                  {/* Top Header of Card */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-base font-black text-slate-900 group-hover:text-amber-700 transition">
                          {m.name}
                        </h4>
                        {isCurrentMonth && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">
                        {selectedYear}
                      </span>
                    </div>

                    {/* Top Badges */}
                    <div className="flex flex-col items-end space-y-1">
                      <div
                        className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-black ${
                          stats.total > 0
                            ? 'bg-amber-500/10 text-amber-700 border border-amber-200/60'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Users className="h-3 w-3" />
                        <span>{stats.total} Leads</span>
                      </div>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded border leading-tight ${
                          stats.converted > 0
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : stats.total > 0
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}
                      >
                        {conversionPct}% Conv
                      </span>
                    </div>
                  </div>

                  {/* Conversion Percentage Bar */}
                  {stats.total > 0 ? (
                    <div className="my-2 bg-slate-50 border border-slate-100 rounded-lg p-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                        <span className="flex items-center space-x-1">
                          <Target className="h-3 w-3 text-purple-600" />
                          <span>
                            Conversion ({stats.converted}/{stats.total})
                          </span>
                        </span>
                        <span className="font-black text-purple-700">{conversionPct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(stats.converted > 0 ? 8 : 0, conversionNum)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="my-2 bg-slate-50/50 border border-slate-100/60 rounded-lg py-1.5 px-2 text-center">
                      <span className="text-[10px] font-bold text-slate-400 italic">
                        0 Leads recorded (0% Conv)
                      </span>
                    </div>
                  )}

                  {/* Mini Breakdown Pills */}
                  {stats.total > 0 && (
                    <div className="grid grid-cols-3 gap-1 mb-2 text-[9.5px]">
                      <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-100 rounded px-1.5 py-0.5 font-bold text-emerald-800">
                        <span className="truncate">Interested</span>
                        <span className="font-black ml-1">{stats.interested}</span>
                      </div>
                      <div className="flex items-center justify-between bg-blue-50/70 border border-blue-100 rounded px-1.5 py-0.5 font-bold text-blue-800">
                        <span className="truncate">Follow-up</span>
                        <span className="font-black ml-1">{stats.followUp}</span>
                      </div>
                      <div className="flex items-center justify-between bg-purple-50/70 border border-purple-100 rounded px-1.5 py-0.5 font-bold text-purple-800">
                        <span className="truncate">Converted</span>
                        <span className="font-black ml-1">{stats.converted}</span>
                      </div>
                      <div className="flex items-center justify-between bg-amber-50/70 border border-amber-100 rounded px-1.5 py-0.5 font-bold text-amber-800">
                        <span className="truncate">Not Picked</span>
                        <span className="font-black ml-1">{stats.notPicked}</span>
                      </div>
                      <div
                        className={`flex items-center justify-between bg-rose-50/70 border border-rose-100 rounded px-1.5 py-0.5 font-bold text-rose-800 ${
                          stats.notSelected > 0 ? '' : 'col-span-2'
                        }`}
                      >
                        <span className="truncate">Not Interested</span>
                        <span className="font-black ml-1">{stats.notInterested}</span>
                      </div>
                      {stats.notSelected > 0 && (
                        <div className="flex items-center justify-between bg-slate-100/70 border border-slate-200 rounded px-1.5 py-0.5 font-bold text-slate-700">
                          <span className="truncate">Unset</span>
                          <span className="font-black ml-1">{stats.notSelected}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-black text-amber-600 group-hover:text-amber-700">
                  <span>Open {m.short} Sheet</span>
                  <ArrowRight className="h-3 w-3 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ANNUAL CRM PERFORMANCE & TRAJECTORY CHARTS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {selectedYear} Annual Performance & Conversion Trajectory
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Annual Benchmark
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                12-month inquiry volume, actual client conversions, monthly running averages, and studio breakdown.
              </p>
            </div>
          </div>

          {/* Annual Conversion Rate Pill */}
          <div className="flex items-center space-x-2 bg-purple-50 border border-purple-200 rounded-xl px-3.5 py-1.5 self-start sm:self-auto">
            <Award className="h-4 w-4 text-purple-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-purple-600 block uppercase tracking-wider leading-none">
                Annual Conversion
              </span>
              <span className="text-base font-black text-purple-900 leading-tight">
                {annualAnalytics.annualConvRate}%
                <span className="text-[11px] font-normal text-purple-700 ml-1">
                  ({annualAnalytics.yearConverted}/{annualAnalytics.yearTotal} leads)
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* 4 Annual KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Annual Total Leads */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block leading-tight">
                Annual Inquiries
              </span>
              <span className="text-2xl font-black text-slate-900 leading-tight">
                {annualAnalytics.yearTotal}
              </span>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                Total recorded leads
              </span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 border border-slate-200 shadow-2xs shrink-0">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>

          {/* Card 2: Annual Converted */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block leading-tight">
                Annual Converted
              </span>
              <span className="text-2xl font-black text-purple-700 leading-tight">
                {annualAnalytics.yearConverted}
              </span>
              <span className="text-[10px] font-bold text-purple-600/80 block mt-0.5">
                Orders & fittings
              </span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs shrink-0">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>

          {/* Card 3: Monthly Average Leads */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block leading-tight">
                Monthly Avg Leads
              </span>
              <span className="text-2xl font-black text-amber-800 leading-tight">
                ~{annualAnalytics.monthlyAverageLeads}
              </span>
              <span className="text-[10px] font-bold text-amber-700/80 block mt-0.5">
                Leads / month average
              </span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 border border-amber-200 shadow-2xs shrink-0">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>

          {/* Card 4: Monthly Avg Converted */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block leading-tight">
                Monthly Avg Conv.
              </span>
              <span className="text-2xl font-black text-emerald-800 leading-tight">
                ~{annualAnalytics.monthlyAverageConverted}
              </span>
              <span className="text-[10px] font-bold text-emerald-700/80 block mt-0.5">
                Conversions / month avg
              </span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-2xs shrink-0">
              <Target className="h-4.5 w-4.5" />
            </div>
          </div>
        </div>

        {/* Visual 12-Month Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
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
                <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-amber-500 to-amber-400" />
                <span>Total Inquiries</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-purple-600 to-purple-400" />
                <span>Converted</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-0.5 w-3 bg-red-400 border-b border-dashed border-red-500" />
                <span>Avg ({annualAnalytics.monthlyAverageLeads}/mo)</span>
              </div>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="relative pt-6 pb-2">
            {annualAnalytics.yearTotal > 0 && (
              <div
                className="absolute left-0 right-0 border-b-2 border-dashed border-red-400/70 z-10 pointer-events-none flex items-center justify-end pr-2"
                style={{
                  bottom: `${Math.min(
                    88,
                    Math.max(
                      12,
                      (Number(annualAnalytics.monthlyAverageLeads) /
                        annualAnalytics.maxMonthTotal) *
                        140
                    )
                  )}px`,
                }}
              >
                <span className="text-[9px] font-black bg-red-50 text-red-600 border border-red-200 px-1 py-0.2 rounded -translate-y-2.5 shadow-2xs">
                  Avg: {annualAnalytics.monthlyAverageLeads}
                </span>
              </div>
            )}

            {/* 12 Columns */}
            <div className="grid grid-cols-12 gap-1.5 sm:gap-2.5 items-end h-44">
              {annualAnalytics.monthlySeries.map((m) => {
                const totalHeight =
                  m.total > 0
                    ? Math.max(12, Math.round((m.total / annualAnalytics.maxMonthTotal) * 130))
                    : 4;
                const convertedHeight =
                  m.converted > 0
                    ? Math.max(8, Math.round((m.converted / annualAnalytics.maxMonthTotal) * 130))
                    : 0;
                const isSelected = selectedMonth === m.monthKey;

                return (
                  <div
                    key={m.monthKey}
                    onClick={() => handleOpenMonthSheet(m.monthKey)}
                    className={`flex flex-col items-center justify-end h-full group cursor-pointer p-1 rounded-lg transition-all duration-150 hover:bg-white hover:shadow-xs ${
                      isSelected ? 'bg-amber-100/40 ring-1 ring-amber-400' : ''
                    }`}
                    title={`${m.name} ${selectedYear}: ${m.total} Leads, ${m.converted} Converted (${m.conversionRate}% Conversion)`}
                  >
                    {/* Tooltip on top */}
                    <div className="mb-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap block">
                        {m.conversionRate}%
                      </span>
                    </div>

                    {/* Bars Group */}
                    <div className="w-full flex items-end justify-center space-x-0.5 sm:space-x-1">
                      {/* Total Leads Bar */}
                      <div
                        className={`w-2.5 sm:w-4 rounded-t-sm transition-all duration-300 ${
                          m.total > 0
                            ? 'bg-gradient-to-t from-amber-500 to-amber-400 group-hover:from-amber-600 group-hover:to-amber-500 shadow-2xs'
                            : 'bg-slate-200/60'
                        }`}
                        style={{ height: `${totalHeight}px` }}
                      />

                      {/* Converted Leads Bar */}
                      <div
                        className={`w-2.5 sm:w-4 rounded-t-sm transition-all duration-300 ${
                          m.converted > 0
                            ? 'bg-gradient-to-t from-purple-600 to-purple-400 group-hover:from-purple-700 group-hover:to-purple-500 shadow-2xs'
                            : 'bg-slate-100'
                        }`}
                        style={{ height: `${convertedHeight}px` }}
                      />
                    </div>

                    {/* Month Label */}
                    <div className="mt-2 text-center w-full">
                      <span
                        className={`text-[10px] font-black uppercase tracking-tight block ${
                          isSelected
                            ? 'text-amber-700 font-extrabold'
                            : 'text-slate-500 group-hover:text-slate-900'
                        }`}
                      >
                        {m.short}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">
                        {m.total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Status Breakdown & Studio Benchmarks in 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          {/* Annual Status Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Annual Status Distribution ({annualAnalytics.yearTotal} Leads)
              </h4>
              <span className="text-[10px] font-bold text-slate-400">
                5 Pipeline Categories
              </span>
            </div>

            {annualAnalytics.yearTotal > 0 ? (
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  {annualAnalytics.yearConverted > 0 && (
                    <div
                      className="h-full bg-purple-500 transition-all duration-300"
                      style={{
                        width: `${(annualAnalytics.yearConverted / annualAnalytics.yearTotal) * 100}%`,
                      }}
                      title={`Converted: ${annualAnalytics.yearConverted}`}
                    />
                  )}
                  {annualAnalytics.yearInterested > 0 && (
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{
                        width: `${(annualAnalytics.yearInterested / annualAnalytics.yearTotal) * 100}%`,
                      }}
                      title={`Interested: ${annualAnalytics.yearInterested}`}
                    />
                  )}
                  {annualAnalytics.yearFollowUp > 0 && (
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{
                        width: `${(annualAnalytics.yearFollowUp / annualAnalytics.yearTotal) * 100}%`,
                      }}
                      title={`Follow-up: ${annualAnalytics.yearFollowUp}`}
                    />
                  )}
                  {annualAnalytics.yearNotPicked > 0 && (
                    <div
                      className="h-full bg-amber-400 transition-all duration-300"
                      style={{
                        width: `${(annualAnalytics.yearNotPicked / annualAnalytics.yearTotal) * 100}%`,
                      }}
                      title={`Not Picked: ${annualAnalytics.yearNotPicked}`}
                    />
                  )}
                  {annualAnalytics.yearNotInterested > 0 && (
                    <div
                      className="h-full bg-rose-400 transition-all duration-300"
                      style={{
                        width: `${(annualAnalytics.yearNotInterested / annualAnalytics.yearTotal) * 100}%`,
                      }}
                      title={`Not Interested: ${annualAnalytics.yearNotInterested}`}
                    />
                  )}
                  {annualAnalytics.yearNotSelected > 0 && (
                    <div
                      className="h-full bg-slate-400 transition-all duration-300"
                      style={{
                        width: `${(annualAnalytics.yearNotSelected / annualAnalytics.yearTotal) * 100}%`,
                      }}
                      title={`Not Selected: ${annualAnalytics.yearNotSelected}`}
                    />
                  )}
                </div>

                {/* Breakdown legend pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700 bg-purple-50/70 border border-purple-100 rounded-md p-1.5">
                    <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                    <span className="truncate">Converted:</span>
                    <span className="font-black text-purple-700 ml-auto">
                      {annualAnalytics.yearConverted} (
                      {annualAnalytics.yearTotal > 0
                        ? Math.round((annualAnalytics.yearConverted / annualAnalytics.yearTotal) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700 bg-emerald-50/70 border border-emerald-100 rounded-md p-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">Interested:</span>
                    <span className="font-black text-emerald-700 ml-auto">
                      {annualAnalytics.yearInterested} (
                      {annualAnalytics.yearTotal > 0
                        ? Math.round((annualAnalytics.yearInterested / annualAnalytics.yearTotal) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700 bg-blue-50/70 border border-blue-100 rounded-md p-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="truncate">Follow-up:</span>
                    <span className="font-black text-blue-700 ml-auto">
                      {annualAnalytics.yearFollowUp} (
                      {annualAnalytics.yearTotal > 0
                        ? Math.round((annualAnalytics.yearFollowUp / annualAnalytics.yearTotal) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700 bg-amber-50/70 border border-amber-100 rounded-md p-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="truncate">Not Picked:</span>
                    <span className="font-black text-amber-700 ml-auto">
                      {annualAnalytics.yearNotPicked} (
                      {annualAnalytics.yearTotal > 0
                        ? Math.round((annualAnalytics.yearNotPicked / annualAnalytics.yearTotal) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700 bg-rose-50/70 border border-rose-100 rounded-md p-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-400 shrink-0" />
                    <span className="truncate">Not Interested:</span>
                    <span className="font-black text-rose-700 ml-auto">
                      {annualAnalytics.yearNotInterested} (
                      {annualAnalytics.yearTotal > 0
                        ? Math.round((annualAnalytics.yearNotInterested / annualAnalytics.yearTotal) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  {annualAnalytics.yearNotSelected > 0 && (
                    <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700 bg-slate-100/70 border border-slate-200 rounded-md p-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                      <span className="truncate">Not Selected:</span>
                      <span className="font-black text-slate-700 ml-auto">
                        {annualAnalytics.yearNotSelected} (
                        {annualAnalytics.yearTotal > 0
                          ? Math.round((annualAnalytics.yearNotSelected / annualAnalytics.yearTotal) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No leads registered in this year yet.</p>
            )}
          </div>

          {/* Studio Conversion Benchmarks */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Studio Conversion Benchmarks ({selectedYear})
              </h4>
              <span className="text-[10px] font-bold text-slate-400">
                Multi-Branch Comparison
              </span>
            </div>

            <div className="space-y-2">
              {studios.map((st) => {
                const stData = annualAnalytics.studioMap[st.slug] || { total: 0, converted: 0 };
                const rate =
                  stData.total > 0 ? Math.round((stData.converted / stData.total) * 100) : 0;

                return (
                  <div
                    key={st.slug}
                    className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-amber-600 shadow-2xs shrink-0">
                        <Building2 className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-900 block leading-tight">
                          {st.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {stData.total} leads • {stData.converted} orders
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <span className="text-xs font-black text-purple-700 block leading-tight">
                          {rate}% Conv.
                        </span>
                        <span className="text-[9px] text-slate-400">
                          Ratio: {stData.converted}/{stData.total}
                        </span>
                      </div>
                      <div className="w-14 h-2 bg-slate-200 rounded-full overflow-hidden shrink-0">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, rate)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
