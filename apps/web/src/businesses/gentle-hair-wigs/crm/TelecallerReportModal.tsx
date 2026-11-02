'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Calendar,
  UserCheck,
  Send,
  X,
  Palmtree,
  Sparkles,
  ClipboardCheck,
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

interface TelecallerReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: string;
  currentTelecallerName?: string;
  currentTelecallerId?: string;
  onReportUpdated?: () => void;
}

export function TelecallerReportModal({
  isOpen,
  onClose,
  branch,
  currentTelecallerName = 'Priya Sharma (Lead Telecaller)',
  currentTelecallerId = 'tc-vn-1',
  onReportUpdated,
}: TelecallerReportModalProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  // Load today's report on open
  useEffect(() => {
    if (!isOpen) return;

    // Check localStorage cache first for immediate UI responsiveness
    const storageKey = `gentle_tc_report_${currentTelecallerId}_${today}`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        setReport(JSON.parse(cached));
      } catch {}
    }

    // Fetch latest from API
    async function fetchTodayReport() {
      try {
        const res = await fetch(`/api/gentle-hair-wigs/daily-reports?branch=${branch}&date=${today}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.reports)) {
          const myReport = data.reports.find((r: any) => r.staffId === currentTelecallerId);
          if (myReport && myReport.punchInTime) {
            setReport(myReport);
            localStorage.setItem(storageKey, JSON.stringify(myReport));
          }
        }
      } catch (err) {
        console.error('Failed to fetch today report:', err);
      }
    }
    fetchTodayReport();
  }, [isOpen, branch, currentTelecallerId, today]);

  if (!isOpen) return null;

  // Punch In handler
  const handlePunchIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const updated: TelecallerDailyRecord = {
      ...report,
      punchInTime: nowTime,
      status: 'IN_PROGRESS',
      isHoliday: false,
    };

    try {
      const res = await fetch('/api/gentle-hair-wigs/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setReport(updated);
        localStorage.setItem(`gentle_tc_report_${currentTelecallerId}_${today}`, JSON.stringify(updated));
        setSuccessMsg(`Punched In successfully at ${nowTime}!`);
        setTimeout(() => setSuccessMsg(''), 4000);
        onReportUpdated?.();
      } else {
        setErrorMsg(data.error || 'Failed to punch in');
      }
    } catch {
      // Offline fallback
      setReport(updated);
      localStorage.setItem(`gentle_tc_report_${currentTelecallerId}_${today}`, JSON.stringify(updated));
      setSuccessMsg(`Punched In locally at ${nowTime}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      onReportUpdated?.();
    } finally {
      setIsLoading(false);
    }
  };

  // Submit daily report & Punch Out
  const handleSubmitReport = async (markPunchOut: boolean = false) => {
    setIsLoading(true);
    setErrorMsg('');

    let punchOut = report.punchOutTime;
    let hours = report.totalHours;

    if (markPunchOut) {
      punchOut = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      hours = 8.0; // Default full-day shift or duration
    }

    const updated: TelecallerDailyRecord = {
      ...report,
      punchOutTime: punchOut,
      totalHours: hours,
      status: 'PRESENT',
      isHoliday: false,
    };

    try {
      const res = await fetch('/api/gentle-hair-wigs/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setReport(updated);
        localStorage.setItem(`gentle_tc_report_${currentTelecallerId}_${today}`, JSON.stringify(updated));
        setSuccessMsg(markPunchOut ? 'Daily report submitted and Punched Out!' : 'Work report saved successfully!');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
        onReportUpdated?.();
      } else {
        setErrorMsg(data.error || 'Failed to save report');
      }
    } catch {
      setReport(updated);
      localStorage.setItem(`gentle_tc_report_${currentTelecallerId}_${today}`, JSON.stringify(updated));
      setSuccessMsg('Report saved locally');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
      onReportUpdated?.();
    } finally {
      setIsLoading(false);
    }
  };

  // Mark Holiday / Leave
  const handleMarkHoliday = async () => {
    if (!confirm('Are you sure you want to mark today as Leave / Off?')) return;
    setIsLoading(true);

    const updated: TelecallerDailyRecord = {
      ...report,
      status: 'HOLIDAY',
      isHoliday: true,
      workSummary: 'Telecaller marked Planned Leave / Holiday for today.',
    };

    try {
      await fetch('/api/gentle-hair-wigs/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setReport(updated);
      localStorage.setItem(`gentle_tc_report_${currentTelecallerId}_${today}`, JSON.stringify(updated));
      onReportUpdated?.();
      onClose();
    } catch {
      setReport(updated);
      onReportUpdated?.();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const isPunchedIn = Boolean(report.punchInTime);
  const isPunchedOut = Boolean(report.punchOutTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-xs">
              <ClipboardCheck className="h-5 w-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black">Daily Telecaller Reporting</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/25">
                  Today · {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                {report.staffName} · {branch === 'viman-nagar' ? 'Viman Nagar' : branch === 'ravet' ? 'Ravet' : 'Kolhapur'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/25 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Punch-In / Punch-Out Shift Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">
                Shift Attendance
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  report.status === 'HOLIDAY'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : isPunchedOut
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : isPunchedIn
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {report.status === 'HOLIDAY'
                  ? 'Holiday / Off'
                  : isPunchedOut
                  ? 'Shift Completed'
                  : isPunchedIn
                  ? 'Shift In-Progress'
                  : 'Punch-In Awaiting'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Punch-In Box */}
              <div className="rounded-xl bg-white border border-slate-200/90 p-3 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Punch-In Time
                </span>
                <div className="mt-1 flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-extrabold text-slate-900">
                    {report.punchInTime || '--:--'}
                  </span>
                </div>
              </div>

              {/* Punch-Out Box */}
              <div className="rounded-xl bg-white border border-slate-200/90 p-3 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Punch-Out Time
                </span>
                <div className="mt-1 flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-extrabold text-slate-900">
                    {report.punchOutTime || '--:--'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Punch-In Action if not yet punched in */}
            {!isPunchedIn && (
              <button
                type="button"
                onClick={handlePunchIn}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center space-x-2 rounded-xl py-3 text-xs font-bold text-white shadow-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 transition cursor-pointer disabled:opacity-50"
              >
                <Clock className="h-4 w-4" />
                <span>Punch In Now (Start My Shift)</span>
              </button>
            )}
          </div>

          {/* 2. Today's Calling & Conversion Numbers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">
                Today's Work Numbers
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Log your phone &amp; lead metrics</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Calls Made */}
              <div className="rounded-xl border border-slate-200 p-3 bg-white">
                <label className="text-[10.5px] font-bold text-slate-500 block mb-1">
                  Calls Made
                </label>
                <input
                  type="number"
                  min="0"
                  value={report.callsMade || ''}
                  onChange={(e) =>
                    setReport({ ...report, callsMade: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  placeholder="0"
                  className="w-full font-mono text-base font-extrabold text-slate-900 focus:outline-none border-b border-slate-200 focus:border-amber-500 pb-0.5"
                />
              </div>

              {/* Calls Connected */}
              <div className="rounded-xl border border-slate-200 p-3 bg-white">
                <label className="text-[10.5px] font-bold text-slate-500 block mb-1">
                  Connected Calls
                </label>
                <input
                  type="number"
                  min="0"
                  value={report.callsConnected || ''}
                  onChange={(e) =>
                    setReport({ ...report, callsConnected: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  placeholder="0"
                  className="w-full font-mono text-base font-extrabold text-slate-900 focus:outline-none border-b border-slate-200 focus:border-amber-500 pb-0.5"
                />
              </div>

              {/* Appointments Booked */}
              <div className="rounded-xl border border-slate-200 p-3 bg-white">
                <label className="text-[10.5px] font-bold text-slate-500 block mb-1">
                  Appointments Booked
                </label>
                <input
                  type="number"
                  min="0"
                  value={report.appointmentsBooked || ''}
                  onChange={(e) =>
                    setReport({ ...report, appointmentsBooked: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  placeholder="0"
                  className="w-full font-mono text-base font-extrabold text-slate-900 focus:outline-none border-b border-slate-200 focus:border-amber-500 pb-0.5"
                />
              </div>

              {/* Converted Clients */}
              <div className="rounded-xl border border-slate-200 p-3 bg-white">
                <label className="text-[10.5px] font-bold text-slate-500 block mb-1">
                  Converted Sales
                </label>
                <input
                  type="number"
                  min="0"
                  value={report.convertedClients || ''}
                  onChange={(e) =>
                    setReport({ ...report, convertedClients: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  placeholder="0"
                  className="w-full font-mono text-base font-extrabold text-slate-900 focus:outline-none border-b border-slate-200 focus:border-amber-500 pb-0.5"
                />
              </div>

              {/* Follow-ups Due */}
              <div className="rounded-xl border border-slate-200 p-3 bg-white col-span-2 sm:col-span-1">
                <label className="text-[10.5px] font-bold text-slate-500 block mb-1">
                  Follow-ups Set
                </label>
                <input
                  type="number"
                  min="0"
                  value={report.followUpsDue || ''}
                  onChange={(e) =>
                    setReport({ ...report, followUpsDue: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  placeholder="0"
                  className="w-full font-mono text-base font-extrabold text-slate-900 focus:outline-none border-b border-slate-200 focus:border-amber-500 pb-0.5"
                />
              </div>
            </div>
          </div>

          {/* 3. Daily Work Description & Highlights */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Work Description &amp; Calling Highlights
            </label>
            <textarea
              rows={3}
              value={report.workSummary}
              onChange={(e) => setReport({ ...report, workSummary: e.target.value })}
              placeholder="e.g. Followed up with 18 weekend inquiries for Viman Nagar fitting suites. Booked 2 full lace consultations for tomorrow."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleMarkHoliday}
            disabled={isLoading}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition cursor-pointer"
          >
            <Palmtree className="h-3.5 w-3.5" />
            <span>Mark Leave / Off Today</span>
          </button>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            {/* Save interim progress */}
            <button
              type="button"
              onClick={() => handleSubmitReport(false)}
              disabled={isLoading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              <span>Save Progress</span>
            </button>

            {/* Punch-Out & Submit Daily Report */}
            <button
              type="button"
              onClick={() => handleSubmitReport(true)}
              disabled={isLoading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:opacity-95 text-xs font-bold text-white shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Punch-Out &amp; Submit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

