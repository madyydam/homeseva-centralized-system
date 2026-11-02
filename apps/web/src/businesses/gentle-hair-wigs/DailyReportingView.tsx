'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Calendar,
  UserCheck,
  Send,
  Palmtree,
  Sparkles,
  ClipboardCheck,
  ArrowRight,
  TrendingUp,
  History,
  PhoneForwarded,
  Trophy,
} from 'lucide-react';

export interface TelecallerDailyRecord {
  id?: string;
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
}

interface DailyReportingViewProps {
  branch: string;
  currentTelecallerName?: string;
  currentTelecallerId?: string;
  onReportUpdated?: () => void;
}

export function DailyReportingView({
  branch,
  currentTelecallerName = 'Priya Sharma (Lead Telecaller)',
  currentTelecallerId = 'tc-vn-1',
  onReportUpdated,
}: DailyReportingViewProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [historyList, setHistoryList] = useState<TelecallerDailyRecord[]>([]);

  // Daily report form states
  const [report, setReport] = useState<TelecallerDailyRecord>({
    staffId: currentTelecallerId,
    staffName: currentTelecallerName,
    branch,
    reportDate: today,
    punchInTime: null,
    punchOutTime: null,
    totalHours: 0,
    callsMade: 0,
    callsConnected: 0,
    appointmentsBooked: 0,
    convertedClients: 0,
    followUpsDue: 0,
    workSummary: '',
    status: 'PENDING',
    isHoliday: false,
  });

  // Current real-time clock
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch today's report & recent history
  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch today's report
      const res = await fetch(`/api/gentle-hair-wigs/daily-reports?branch=${branch}&date=${today}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.reports)) {
        const myReport = data.reports.find((r: any) => r.staffId === currentTelecallerId);
        if (myReport && myReport.punchInTime) {
          setReport(myReport);
        }
      }

      // Fetch last 7 days history
      const historyRes = await fetch(`/api/gentle-hair-wigs/daily-reports?branch=${branch}`);
      const historyData = await historyRes.json();
      if (historyData.success && Array.isArray(historyData.reports)) {
        const myPast = historyData.reports
          .filter((r: any) => r.staffId === currentTelecallerId)
          .sort((a: any, b: any) => (b.reportDate || '').localeCompare(a.reportDate || ''));
        setHistoryList(myPast.slice(0, 7));
      }
    } catch (err: any) {
      console.warn('Failed to load daily report data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [branch, today, currentTelecallerId]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Handle Punch In
  const handlePunchIn = async () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const updated: TelecallerDailyRecord = {
      ...report,
      punchInTime: timeStr,
      status: 'IN_PROGRESS',
      isHoliday: false,
    };

    setReport(updated);
    saveReport(updated, 'Punched In successfully! Your shift is now active.');
  };

  // Handle Punch Out
  const handlePunchOut = async () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    let totalHrs = report.totalHours;
    if (report.punchInTime) {
      try {
        const [inH, inM] = report.punchInTime.split(':').map(Number);
        const [outH, outM] = timeStr.split(':').map(Number);
        const inMinutes = (inH || 0) * 60 + (inM || 0);
        const outMinutes = (outH || 0) * 60 + (outM || 0);
        const diff = Math.max(0, outMinutes - inMinutes);
        totalHrs = Math.round((diff / 60) * 10) / 10;
      } catch {}
    }

    const updated: TelecallerDailyRecord = {
      ...report,
      punchOutTime: timeStr,
      totalHours: totalHrs,
      status: 'PRESENT',
    };

    setReport(updated);
    saveReport(updated, `Punched Out at ${timeStr}. Total shift: ${totalHrs} hrs.`);
  };

  // Handle Mark Holiday / Leave
  const handleMarkHoliday = async () => {
    if (!window.confirm('Mark today as Holiday / Leave? Your attendance will be saved as off.')) {
      return;
    }

    const updated: TelecallerDailyRecord = {
      ...report,
      punchInTime: null,
      punchOutTime: null,
      totalHours: 0,
      callsMade: 0,
      callsConnected: 0,
      appointmentsBooked: 0,
      convertedClients: 0,
      followUpsDue: 0,
      workSummary: 'Marked on leave / holiday by staff',
      status: 'HOLIDAY',
      isHoliday: true,
    };

    setReport(updated);
    saveReport(updated, 'Marked today as Holiday / Leave.');
  };

  // Save report to server
  const saveReport = async (dataToSave: TelecallerDailyRecord, customSuccess?: string) => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/gentle-hair-wigs/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to save daily report');
      }

      setSuccessMsg(customSuccess || 'Daily report submitted successfully!');
      if (onReportUpdated) onReportUpdated();
      fetchReportData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving daily report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalStatus = report.punchInTime ? 'PRESENT' : 'PENDING';
    const updated: TelecallerDailyRecord = {
      ...report,
      status: finalStatus,
    };
    setReport(updated);
    saveReport(updated, 'Daily work report submitted successfully for manager review!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full border border-white/25">
                Daily Operations
              </span>
              <span className="text-xs text-amber-100 font-mono">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Telecaller Daily Reporting
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 font-medium">
              {report.staffName} · Studio Branch:{' '}
              <span className="capitalize font-bold text-white">
                {branch === 'viman-nagar' ? 'Viman Nagar' : branch === 'ravet' ? 'Ravet' : 'Kolhapur'}
              </span>
            </p>
          </div>

          {/* Status Pill & Live Clock */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="rounded-2xl bg-black/20 backdrop-blur-xs px-4 py-2 border border-white/15 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-200 block">Live Clock</span>
              <span className="text-base font-black font-mono tracking-wider">{currentTimeStr || '--:--:--'}</span>
            </div>

            <div className="rounded-2xl bg-white px-4 py-2.5 text-slate-900 shadow-md">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Shift Status</span>
              <span
                className={`text-xs font-black inline-flex items-center space-x-1 ${
                  report.status === 'PRESENT'
                    ? 'text-emerald-700'
                    : report.status === 'IN_PROGRESS'
                    ? 'text-amber-800'
                    : report.status === 'HOLIDAY'
                    ? 'text-purple-700'
                    : 'text-rose-700'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full mr-1.5 ${
                    report.status === 'PRESENT'
                      ? 'bg-emerald-500'
                      : report.status === 'IN_PROGRESS'
                      ? 'bg-amber-500 animate-pulse'
                      : report.status === 'HOLIDAY'
                      ? 'bg-purple-500'
                      : 'bg-rose-500 animate-ping'
                  }`}
                />
                {report.status === 'PRESENT'
                  ? 'Present & Reported'
                  : report.status === 'IN_PROGRESS'
                  ? 'Shift Active'
                  : report.status === 'HOLIDAY'
                  ? 'Holiday / Off'
                  : 'Pending Punch-In'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center space-x-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-bold shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center space-x-2 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-bold shadow-xs animate-in fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2. Punch In / Punch Out Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Shift Punch In & Punch Out</h2>
                <p className="text-xs text-slate-500">Record your working hours for studio attendance</p>
              </div>
            </div>

            {report.totalHours > 0 && (
              <span className="text-xs font-black font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Total: {report.totalHours} hrs
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Punch In Box */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Punch In</span>
                {report.punchInTime && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Recorded
                  </span>
                )}
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                {report.punchInTime || '--:--'}
              </div>
              <button
                type="button"
                disabled={Boolean(report.punchInTime) || isLoading}
                onClick={handlePunchIn}
                className="w-full inline-flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <UserCheck className="h-4 w-4" />
                <span>{report.punchInTime ? 'Punched In' : 'Punch In Now'}</span>
              </button>
            </div>

            {/* Punch Out Box */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Punch Out</span>
                {report.punchOutTime && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Shift Ended
                  </span>
                )}
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                {report.punchOutTime || '--:--'}
              </div>
              <button
                type="button"
                disabled={!report.punchInTime || Boolean(report.punchOutTime) || isLoading}
                onClick={handlePunchOut}
                className="w-full inline-flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Clock className="h-4 w-4" />
                <span>{report.punchOutTime ? 'Shift Completed' : 'Punch Out Now'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Daily Work Performance Counters */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Work Metrics Done Today</h2>
                <p className="text-xs text-slate-500">Input your completed calls, inquiries, and bookings</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              Live Counters
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Calls Made */}
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60 hover:border-amber-400 transition">
              <label className="text-xs font-bold text-slate-600 block mb-1">Calls Dialed</label>
              <input
                type="number"
                min="0"
                value={report.callsMade}
                onChange={(e) => setReport({ ...report, callsMade: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="w-full font-mono text-2xl font-black text-slate-900 focus:outline-none border-b-2 border-slate-200 focus:border-amber-500 pb-1 bg-transparent"
              />
              <div className="flex space-x-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setReport((r) => ({ ...r, callsMade: r.callsMade + 1 }))}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setReport((r) => ({ ...r, callsMade: r.callsMade + 5 }))}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Calls Connected */}
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60 hover:border-amber-400 transition">
              <label className="text-xs font-bold text-slate-600 block mb-1">Answered / Connected</label>
              <input
                type="number"
                min="0"
                value={report.callsConnected}
                onChange={(e) => setReport({ ...report, callsConnected: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="w-full font-mono text-2xl font-black text-slate-900 focus:outline-none border-b-2 border-slate-200 focus:border-amber-500 pb-1 bg-transparent"
              />
              <div className="flex space-x-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setReport((r) => ({ ...r, callsConnected: r.callsConnected + 1 }))}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setReport((r) => ({ ...r, callsConnected: r.callsConnected + 5 }))}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Appointments Booked */}
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60 hover:border-amber-400 transition">
              <label className="text-xs font-bold text-slate-600 block mb-1">Appointments Booked</label>
              <input
                type="number"
                min="0"
                value={report.appointmentsBooked}
                onChange={(e) => setReport({ ...report, appointmentsBooked: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="w-full font-mono text-2xl font-black text-slate-900 focus:outline-none border-b-2 border-slate-200 focus:border-amber-500 pb-1 bg-transparent"
              />
              <div className="flex space-x-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setReport((r) => ({ ...r, appointmentsBooked: r.appointmentsBooked + 1 }))}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200"
                >
                  +1
                </button>
              </div>
            </div>

            {/* Converted Orders */}
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60 hover:border-amber-400 transition">
              <label className="text-xs font-bold text-slate-600 block mb-1">Converted Orders</label>
              <input
                type="number"
                min="0"
                value={report.convertedClients}
                onChange={(e) => setReport({ ...report, convertedClients: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="w-full font-mono text-2xl font-black text-slate-900 focus:outline-none border-b-2 border-slate-200 focus:border-amber-500 pb-1 bg-transparent"
              />
              <div className="flex space-x-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setReport((r) => ({ ...r, convertedClients: r.convertedClients + 1 }))}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200"
                >
                  +1
                </button>
              </div>
            </div>

            {/* Follow-ups Due */}
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60 hover:border-amber-400 transition col-span-2 sm:col-span-1">
              <label className="text-xs font-bold text-slate-600 block mb-1">Follow-ups Due</label>
              <input
                type="number"
                min="0"
                value={report.followUpsDue}
                onChange={(e) => setReport({ ...report, followUpsDue: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="w-full font-mono text-2xl font-black text-slate-900 focus:outline-none border-b-2 border-slate-200 focus:border-amber-500 pb-1 bg-transparent"
              />
              <div className="flex space-x-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setReport((r) => ({ ...r, followUpsDue: r.followUpsDue + 1 }))}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200"
                >
                  +1
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Daily Work Summary Notes */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-extrabold text-slate-900 mb-1">
            Work Summary &amp; Key Highlights
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Add notes on key leads contacted, client wig customization requirements, objections, or trial schedules.
          </p>
          <textarea
            rows={4}
            value={report.workSummary}
            onChange={(e) => setReport({ ...report, workSummary: e.target.value })}
            placeholder="e.g. Handled 32 calls for Viman Nagar leads. Scheduled 3 scalp trials for custom lace patches. Two clients confirmed fitting on Thursday..."
            className="w-full rounded-2xl border border-slate-300 p-4 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 leading-relaxed font-medium"
          />

          {/* Action Row */}
          <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleMarkHoliday}
              className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-rose-600 transition cursor-pointer px-3 py-2 rounded-xl hover:bg-rose-50"
            >
              <Palmtree className="h-4 w-4" />
              <span>Mark Today as Holiday / Leave</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:opacity-95 text-xs font-extrabold text-white shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>Submit Daily Work Report</span>
            </button>
          </div>
        </div>
      </form>

      {/* 5. Past Attendance History (Last 7 Days) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Your Attendance History</h2>
              <p className="text-xs text-slate-500">Recent submissions and verified manager records</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400">Recent 7 Days</span>
        </div>

        {historyList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-semibold">
            No past reporting history found yet. Today&apos;s submission will be recorded here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Punch In</th>
                  <th className="py-2.5 px-3">Punch Out</th>
                  <th className="py-2.5 px-3">Shift Hours</th>
                  <th className="py-2.5 px-3">Calls Made</th>
                  <th className="py-2.5 px-3">Appts</th>
                  <th className="py-2.5 px-3">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {historyList.map((hist, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{hist.reportDate}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          hist.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : hist.status === 'IN_PROGRESS'
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : hist.status === 'HOLIDAY'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {hist.status === 'PRESENT'
                          ? 'Present'
                          : hist.status === 'IN_PROGRESS'
                          ? 'In Progress'
                          : hist.status === 'HOLIDAY'
                          ? 'Holiday / Off'
                          : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{hist.punchInTime || '--:--'}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{hist.punchOutTime || '--:--'}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{hist.totalHours || 0} hrs</td>
                    <td className="py-3 px-3 font-mono text-amber-700 font-bold">{hist.callsMade || 0}</td>
                    <td className="py-3 px-3 font-mono text-emerald-700 font-bold">{hist.appointmentsBooked || 0}</td>
                    <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{hist.workSummary || 'No notes'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
