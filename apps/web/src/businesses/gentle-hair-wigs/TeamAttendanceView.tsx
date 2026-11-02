'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Calendar,
  Clock,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Palmtree,
  ArrowRight,
  TrendingUp,
  X,
  MapPin,
  ClipboardList,
} from 'lucide-react';
import { to12HourDisplay } from './DailyReportingView';

interface TelecallerReportItem {
  id: string;
  staffId: string;
  staffName: string;
  branch: string;
  reportDate: string;
  punchInTime: string | null;
  punchOutTime: string | null;
  totalHours: number;
  callsMade: number;
  callsConnected: number;
  appointmentsBooked: number;
  convertedClients: number;
  followUpsDue: number;
  workSummary: string;
  status: 'PRESENT' | 'IN_PROGRESS' | 'HOLIDAY' | 'PENDING' | 'LEAVE';
  isHoliday: boolean;
  updatedAt: string;
}

interface TeamAttendanceViewProps {
  currentBranch?: string;
  role?: string;
}

export function TeamAttendanceView({
  currentBranch = 'viman-nagar',
  role = 'Studio Manager',
}: TeamAttendanceViewProps) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedBranch, setSelectedBranch] = useState<string>(currentBranch || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PRESENT' | 'IN_PROGRESS' | 'HOLIDAY'>('all');

  const [reports, setReports] = useState<TelecallerReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReportForView, setSelectedReportForView] = useState<TelecallerReportItem | null>(null);

  // Fetch reports from API
  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/gentle-hair-wigs/daily-reports?branch=${selectedBranch}&date=${selectedDate}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.reports)) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error('Failed to load team daily reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch, selectedDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch =
        r.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.workSummary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'HOLIDAY'
          ? r.status === 'HOLIDAY' || r.isHoliday
          : r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reports, searchQuery, statusFilter]);

  // Aggregate KPI summary
  const summary = useMemo(() => {
    const totalTeam = reports.length;
    const present = reports.filter((r) => r.status === 'PRESENT').length;
    const active = reports.filter((r) => r.status === 'IN_PROGRESS').length;
    const holiday = reports.filter((r) => r.status === 'HOLIDAY' || r.isHoliday).length;
    const totalCalls = reports.reduce((acc, curr) => acc + (curr.callsMade || 0), 0);
    const totalAppointments = reports.reduce((acc, curr) => acc + (curr.appointmentsBooked || 0), 0);
    const totalConverted = reports.reduce((acc, curr) => acc + (curr.convertedClients || 0), 0);

    return { totalTeam, present, active, holiday, totalCalls, totalAppointments, totalConverted };
  }, [reports]);

  // Quick Manager/Owner override: mark leave or mark present
  const handleOverrideStatus = async (staffId: string, newStatus: 'PRESENT' | 'HOLIDAY') => {
    const target = reports.find((r) => r.staffId === staffId);
    if (!target) return;

    const payload = {
      ...target,
      status: newStatus,
      isHoliday: newStatus === 'HOLIDAY',
      punchInTime: newStatus === 'PRESENT' && !target.punchInTime ? '09:30 AM' : target.punchInTime,
      punchOutTime: newStatus === 'PRESENT' && !target.punchOutTime ? '06:30 PM' : target.punchOutTime,
      totalHours: newStatus === 'PRESENT' ? 8.0 : 0,
      workSummary:
        newStatus === 'HOLIDAY'
          ? 'Marked as Leave / Holiday by Studio Manager'
          : target.workSummary || 'Manually approved by Studio Manager',
    };

    try {
      await fetch('/api/gentle-hair-wigs/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      fetchReports();
      setSelectedReportForView(null);
    } catch (err) {
      console.error('Failed to override status:', err);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Team Attendance &amp; Daily Reports
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Live telecaller shift tracking, calling metrics &amp; work reporting desk
              </p>
            </div>
          </div>
        </div>

        {/* Date & Branch Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Date Toggle (Today / Yesterday) */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold text-slate-700">
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedDate === todayStr ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                setSelectedDate(y.toISOString().slice(0, 10));
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedDate !== todayStr ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Past Date
            </button>
          </div>

          {/* Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Branch Filter Dropdown */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-amber-500 focus:outline-none"
          >
            <option value="all">All Studio Branches</option>
            <option value="viman-nagar">Studio of Viman Nagar</option>
            <option value="ravet">Studio of Ravet</option>
            <option value="kolhapur">Studio of Kolhapur</option>
          </select>

          {/* Refresh */}
          <button
            type="button"
            onClick={fetchReports}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {/* Total Roster */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Telecaller Staff</span>
            <Users className="h-4 w-4 text-slate-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{summary.totalTeam}</div>
          <div className="text-[11px] font-bold text-slate-500 mt-0.5">Assigned callers</div>
        </div>

        {/* Present & Reported */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold uppercase tracking-wider">Present &amp; Reported</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-950">{summary.present}</div>
          <div className="text-[11px] font-bold text-emerald-700 mt-0.5">Report submitted</div>
        </div>

        {/* Shift Active */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-bold uppercase tracking-wider">Active Shifts</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-950">{summary.active}</div>
          <div className="text-[11px] font-bold text-amber-800 mt-0.5">Currently on shift</div>
        </div>

        {/* Holiday / Unreported */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-bold uppercase tracking-wider">Holiday / Absent</span>
            <Palmtree className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-950">{summary.holiday}</div>
          <div className="text-[11px] font-bold text-rose-700 mt-0.5">Unreported / Off</div>
        </div>

        {/* Total Calls Made */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Calls Logged</span>
            <PhoneCall className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{summary.totalCalls}</div>
          <div className="text-[11px] font-bold text-slate-500 mt-0.5">
            {summary.totalAppointments} appts · {summary.totalConverted} sales
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff name or notes..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Staff' },
            { id: 'PRESENT', label: 'Present' },
            { id: 'IN_PROGRESS', label: 'In-Progress' },
            { id: 'HOLIDAY', label: 'Holiday / Unreported' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === f.id
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Attendance & Reporting Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500 font-mono">
              <tr>
                <th className="px-5 py-3.5">Telecaller / Staff</th>
                <th className="px-4 py-3.5">Studio Branch</th>
                <th className="px-4 py-3.5">Punch-In</th>
                <th className="px-4 py-3.5">Punch-Out</th>
                <th className="px-4 py-3.5 text-center">Shift Hours</th>
                <th className="px-4 py-3.5 text-center">Calls Made</th>
                <th className="px-4 py-3.5 text-center">Appts Booked</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-6 w-6 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
                      <span>Loading team attendance records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No telecaller records found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => {
                  const isPresent = r.status === 'PRESENT';
                  const isInProgress = r.status === 'IN_PROGRESS';
                  const isHoliday = r.status === 'HOLIDAY' || r.isHoliday;

                  return (
                    <tr key={r.id || r.staffId} className="hover:bg-slate-50/80 transition">
                      {/* Telecaller Name */}
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-slate-900">{r.staffName}</div>
                        <div className="text-[10.5px] text-slate-400">Staff ID: {r.staffId}</div>
                      </td>

                      {/* Branch */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center space-x-1 text-xs font-bold text-slate-700">
                          <MapPin className="h-3 w-3 text-amber-600" />
                          <span>
                            {r.branch === 'viman-nagar'
                              ? 'Viman Nagar'
                              : r.branch === 'ravet'
                              ? 'Ravet'
                              : 'Kolhapur'}
                          </span>
                        </span>
                      </td>

                      {/* Punch In */}
                      <td className="px-4 py-3.5 font-mono font-bold">
                        {r.punchInTime ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                            {to12HourDisplay(r.punchInTime)}
                          </span>
                        ) : (
                          <span className="text-slate-400">--:--</span>
                        )}
                      </td>

                      {/* Punch Out */}
                      <td className="px-4 py-3.5 font-mono font-bold">
                        {r.punchOutTime ? (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                            {to12HourDisplay(r.punchOutTime)}
                          </span>
                        ) : (
                          <span className="text-slate-400">--:--</span>
                        )}
                      </td>

                      {/* Shift Hours */}
                      <td className="px-4 py-3.5 text-center font-mono font-extrabold text-slate-800">
                        {r.totalHours ? `${r.totalHours} hrs` : '--'}
                      </td>

                      {/* Calls Made */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-mono font-black text-slate-900">
                          {r.callsMade || 0}
                        </span>
                        {r.callsConnected > 0 && (
                          <span className="text-[10px] text-slate-400 block font-medium">
                            ({r.callsConnected} connected)
                          </span>
                        )}
                      </td>

                      {/* Appts Booked */}
                      <td className="px-4 py-3.5 text-center font-mono font-black text-slate-900">
                        {r.appointmentsBooked || 0}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isPresent
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : isInProgress
                              ? 'bg-amber-50 border-amber-200 text-amber-900 animate-pulse'
                              : isHoliday
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          {isPresent ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>Present (Reported)</span>
                            </>
                          ) : isInProgress ? (
                            <>
                              <Clock className="h-3 w-3 text-amber-600" />
                              <span>Shift In-Progress</span>
                            </>
                          ) : isHoliday ? (
                            <>
                              <Palmtree className="h-3 w-3 text-rose-600" />
                              <span>Holiday / Absent</span>
                            </>
                          ) : (
                            <span>Pending</span>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedReportForView(r)}
                          className="inline-flex items-center space-x-1 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Report</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Detailed Report View & Inspection Drawer / Modal */}
      {selectedReportForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="text-base font-black">Daily Calling &amp; Work Report</h3>
                <p className="text-xs text-amber-100 font-medium">
                  {selectedReportForView.staffName} · {selectedReportForView.reportDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportForView(null)}
                className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/25 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {/* Timing & Duration Card */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Punch In
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 font-mono">
                    {to12HourDisplay(selectedReportForView.punchInTime) || '--'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Punch Out
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 font-mono">
                    {to12HourDisplay(selectedReportForView.punchOutTime) || '--'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Shift Hours
                  </span>
                  <span className="text-xs font-extrabold text-emerald-800 font-mono">
                    {selectedReportForView.totalHours ? `${selectedReportForView.totalHours}h` : '--'}
                  </span>
                </div>
              </div>

              {/* Calling Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">Calls Made</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {selectedReportForView.callsMade || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">Connected</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {selectedReportForView.callsConnected || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">Appts Booked</span>
                  <span className="text-lg font-black text-amber-800 font-mono">
                    {selectedReportForView.appointmentsBooked || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">Converted</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">
                    {selectedReportForView.convertedClients || 0}
                  </span>
                </div>
              </div>

              {/* Work Description / Notes */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  Telecaller Work Summary &amp; Notes
                </span>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-wrap min-h-[80px]">
                  {selectedReportForView.workSummary || 'No work description entered.'}
                </div>
              </div>

              {/* Manager Status Override */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Manager Override:</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleOverrideStatus(selectedReportForView.staffId, 'HOLIDAY')}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
                  >
                    Mark Holiday / Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOverrideStatus(selectedReportForView.staffId, 'PRESENT')}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer"
                  >
                    Approve as Present
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

