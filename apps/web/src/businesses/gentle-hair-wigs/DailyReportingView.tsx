'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Calendar,
  Send,
  History,
  Trophy,
  Sparkles,
  Edit3,
  UserCheck,
  Palmtree,
  Coffee,
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
  status: 'PRESENT' | 'HALF_DAY' | 'HOLIDAY' | 'LEAVE' | 'IN_PROGRESS' | 'PENDING';
  isHoliday: boolean;
  updatedAt?: string;
}

export function parse12HourParts(
  str: string | null | undefined,
  defaultAmPm: 'AM' | 'PM' = 'AM'
): {
  hour: string;
  minute: string;
  ampm: 'AM' | 'PM';
  isSet: boolean;
} {
  if (!str || !str.trim()) {
    return {
      hour: defaultAmPm === 'AM' ? '09' : '06',
      minute: '30',
      ampm: defaultAmPm,
      isSet: false,
    };
  }
  const clean = str.trim();
  const m12 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (m12 && m12[1] && m12[2] && m12[3]) {
    const h = parseInt(m12[1], 10);
    const m = m12[2];
    const ampm = m12[3].toUpperCase() === 'PM' ? 'PM' : 'AM';
    return {
      hour: h.toString().padStart(2, '0'),
      minute: m,
      ampm,
      isSet: true,
    };
  }
  const m24 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (m24 && m24[1] && m24[2]) {
    let h = parseInt(m24[1], 10);
    const m = m24[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return {
      hour: h.toString().padStart(2, '0'),
      minute: m,
      ampm,
      isSet: true,
    };
  }
  return {
    hour: defaultAmPm === 'AM' ? '09' : '06',
    minute: '30',
    ampm: defaultAmPm,
    isSet: false,
  };
}

export function calculateMinutesFromParts(hour: string, minute: string, ampm: 'AM' | 'PM'): number {
  let h = parseInt(hour, 10);
  const m = parseInt(minute, 10);
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

export function computeWorkedHours(inStr: string, outStr: string): number | null {
  const inParts = parse12HourParts(inStr, 'AM');
  const outParts = parse12HourParts(outStr, 'PM');
  if (!inParts.isSet || !outParts.isSet) return null;

  let minIn = calculateMinutesFromParts(inParts.hour, inParts.minute, inParts.ampm);
  let minOut = calculateMinutesFromParts(outParts.hour, outParts.minute, outParts.ampm);

  if (minOut < minIn) {
    minOut += 24 * 60; // Overnight shift
  }

  const diffHours = Math.round(((minOut - minIn) / 60) * 10) / 10;
  return diffHours;
}

export function to24HourTime(str: string | null | undefined): string {
  if (!str) return '';
  const clean = str.trim();
  const match12 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (match12 && match12[1] && match12[2] && match12[3]) {
    let h = parseInt(match12[1], 10);
    const m = match12[2];
    const isPM = match12[3].toUpperCase() === 'PM';
    const isAM = match12[3].toUpperCase() === 'AM';
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m}`;
  }
  const match24 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24 && match24[1] && match24[2]) {
    const h = match24[1].padStart(2, '0');
    const m = match24[2];
    return `${h}:${m}`;
  }
  return '';
}

export function to12HourDisplay(str: string | null | undefined): string {
  if (!str) return '';
  const clean = str.trim();
  const matchWithAmPm = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (matchWithAmPm && matchWithAmPm[1] && matchWithAmPm[2] && matchWithAmPm[3]) {
    const h = matchWithAmPm[1].padStart(2, '0');
    const m = matchWithAmPm[2];
    const mod = matchWithAmPm[3].toUpperCase();
    return `${h}:${m} ${mod}`;
  }
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match && match[1] && match[2]) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
  }
  return clean;
}

interface ClockNumberPickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  quickPresets: string[];
  theme: 'emerald' | 'amber';
}

function ClockNumberPicker({
  label,
  value,
  onChange,
  onClear,
  quickPresets,
  theme,
}: ClockNumberPickerProps) {
  const defaultAmPm = label.toLowerCase().includes('in') ? 'AM' : 'PM';
  const parsed = parse12HourParts(value, defaultAmPm);

  const hoursList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutesList = [
    '00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'
  ];

  const handleHourSelect = (newH: string) => {
    const formatted = `${newH}:${parsed.minute} ${parsed.ampm}`;
    onChange(formatted);
  };

  const handleMinuteSelect = (newM: string) => {
    const formatted = `${parsed.hour}:${newM} ${parsed.ampm}`;
    onChange(formatted);
  };

  const handleAmPmToggle = (newAmPm: 'AM' | 'PM') => {
    const formatted = `${parsed.hour}:${parsed.minute} ${newAmPm}`;
    onChange(formatted);
  };

  const handleNowClick = () => {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const formatted = `${String(h).padStart(2, '0')}:${m} ${ampm}`;
    onChange(formatted);
  };

  return (
    <div
      className={`rounded-2xl border p-3.5 space-y-2.5 transition shadow-2xs ${
        parsed.isSet
          ? theme === 'emerald'
            ? 'border-emerald-300 bg-emerald-50/40'
            : 'border-amber-300 bg-amber-50/40'
          : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
      }`}
    >
      {/* Top Header: Label + Status Badge + Clear */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Clock
            className={`h-3.5 w-3.5 ${
              parsed.isSet
                ? theme === 'emerald'
                  ? 'text-emerald-600'
                  : 'text-amber-600'
                : 'text-slate-400'
            }`}
          />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
            {label}
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          {parsed.isSet ? (
            <>
              <span
                className={`text-[10.5px] font-mono font-black px-2 py-0.5 rounded-full border ${
                  theme === 'emerald'
                    ? 'text-emerald-800 bg-emerald-100/80 border-emerald-300'
                    : 'text-amber-900 bg-amber-100/80 border-amber-300'
                }`}
              >
                ● {parsed.hour}:{parsed.minute} {parsed.ampm}
              </span>
              <button
                type="button"
                onClick={onClear}
                className="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition cursor-pointer px-1"
                title="Clear time"
              >
                ✕ Clear
              </button>
            </>
          ) : (
            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
              Not Set
            </span>
          )}
        </div>
      </div>

      {/* Clock & Number Chooser (ZERO typing needed) */}
      <div className="flex items-center justify-between gap-1.5 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
        {/* Hour Dropdown */}
        <div className="flex-1 min-w-0">
          <label className="block text-[8.5px] font-black uppercase tracking-wider text-slate-400 mb-0.5 text-center">
            Hour
          </label>
          <select
            value={parsed.hour}
            onChange={(e) => handleHourSelect(e.target.value)}
            className="w-full text-center font-mono font-black text-xs text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg py-1.5 px-1 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            {hoursList.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <span className="font-mono font-black text-slate-400 text-sm pt-3">:</span>

        {/* Minute Dropdown */}
        <div className="flex-1 min-w-0">
          <label className="block text-[8.5px] font-black uppercase tracking-wider text-slate-400 mb-0.5 text-center">
            Minute
          </label>
          <select
            value={parsed.minute}
            onChange={(e) => handleMinuteSelect(e.target.value)}
            className="w-full text-center font-mono font-black text-xs text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg py-1.5 px-1 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            {minutesList.map((m) => (
              <option key={m} value={m}>
                :{m}
              </option>
            ))}
          </select>
        </div>

        {/* AM / PM Segmented Toggle */}
        <div className="flex flex-col items-center">
          <label className="block text-[8.5px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
            AM/PM
          </label>
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[10px] font-black">
            <button
              type="button"
              onClick={() => handleAmPmToggle('AM')}
              className={`px-2 py-1 rounded-md transition cursor-pointer ${
                parsed.ampm === 'AM'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => handleAmPmToggle('PM')}
              className={`px-2 py-1 rounded-md transition cursor-pointer ${
                parsed.ampm === 'PM'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PM
            </button>
          </div>
        </div>
      </div>

      {/* Quick 1-Tap Presets */}
      <div className="flex items-center flex-wrap gap-1 text-[9.5px]">
        <span className="text-slate-400 font-semibold mr-0.5">Quick:</span>
        {quickPresets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`px-1.5 py-0.5 rounded border transition font-bold cursor-pointer ${
              value === preset
                ? 'bg-amber-600 border-amber-600 text-white shadow-2xs'
                : 'bg-white border-slate-200 hover:bg-amber-50 text-slate-700'
            }`}
          >
            {preset}
          </button>
        ))}
        <button
          type="button"
          onClick={handleNowClick}
          className="px-1.5 py-0.5 rounded bg-white border border-slate-200 hover:bg-amber-50 text-slate-700 font-bold cursor-pointer"
        >
          Now
        </button>
      </div>
    </div>
  );
}

interface DailyReportingViewProps {
  branch: string;
  currentTelecallerName?: string;
  currentTelecallerId?: string;
  onReportUpdated?: () => void;
}

export function DailyReportingView({
  branch,
  currentTelecallerName = '',
  currentTelecallerId = '',
  onReportUpdated,
}: DailyReportingViewProps) {
  const todayYMD = new Date().toISOString().slice(0, 10);

  // Staff member name - enterable by telecaller, ZERO fake defaults
  const [staffName, setStaffName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`telecaller_name_${branch}`) || currentTelecallerName || '';
    }
    return currentTelecallerName || '';
  });

  // Form State - ZERO fake/dummy prefill values
  const [selectedDate, setSelectedDate] = useState<string>(todayYMD);
  const [status, setStatus] = useState<'PRESENT' | 'HALF_DAY' | 'HOLIDAY' | 'LEAVE'>('PRESENT');
  const [punchInTime, setPunchInTime] = useState<string>('');
  const [punchOutTime, setPunchOutTime] = useState<string>('');
  const [totalHours, setTotalHours] = useState<string>('');
  const [callsMade, setCallsMade] = useState<string>('');
  const [callsConnected, setCallsConnected] = useState<string>('');
  const [appointmentsBooked, setAppointmentsBooked] = useState<string>('');
  const [convertedClients, setConvertedClients] = useState<string>('');
  const [followUpsDue, setFollowUpsDue] = useState<string>('');
  const [workSummary, setWorkSummary] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedRecord, setSavedRecord] = useState<TelecallerDailyRecord | null>(null);
  const [historyList, setHistoryList] = useState<TelecallerDailyRecord[]>([]);

  // Live real-time clock
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

  // Calculate worked hours & auto-classify status:
  // - >= 5.0 hours -> PRESENT ("Present (Full Day)")
  // - < 5.0 hours (and > 0) -> HALF_DAY ("Half Day")
  const calculateHoursAndClassifyStatus = (inStr: string, outStr: string) => {
    const diff = computeWorkedHours(inStr, outStr);
    if (diff !== null && diff >= 0) {
      setTotalHours(String(diff));
      if (diff >= 5.0) {
        setStatus('PRESENT');
      } else if (diff > 0) {
        setStatus('HALF_DAY');
      }
    }
  };

  const handleWorkedHoursChange = (val: string) => {
    setTotalHours(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      if (num >= 5.0) {
        setStatus('PRESENT');
      } else if (num > 0) {
        setStatus('HALF_DAY');
      }
    }
  };

  // Fetch report for selectedDate
  const fetchReport = useCallback(async (targetDate: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/gentle-hair-wigs/daily-reports?branch=${branch}&date=${targetDate}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.reports)) {
        const myReport = data.reports.find((r: any) =>
          (currentTelecallerId && r.staffId === currentTelecallerId) ||
          (staffName && r.staffName && r.staffName.toLowerCase() === staffName.toLowerCase()) ||
          (!currentTelecallerId && r.branch === branch)
        );
        // Only populate if report actually exists and was submitted by user (not just auto holiday placeholder)
        if (myReport && (myReport.punchInTime || myReport.callsMade > 0 || myReport.workSummary)) {
          setSavedRecord(myReport);
          setStatus(myReport.status === 'HOLIDAY' ? 'HOLIDAY' : myReport.status === 'HALF_DAY' ? 'HALF_DAY' : myReport.status === 'LEAVE' ? 'LEAVE' : 'PRESENT');
          setPunchInTime(to12HourDisplay(myReport.punchInTime));
          setPunchOutTime(to12HourDisplay(myReport.punchOutTime));
          setTotalHours(myReport.totalHours ? String(myReport.totalHours) : '');
          setCallsMade(myReport.callsMade ? String(myReport.callsMade) : '');
          setCallsConnected(myReport.callsConnected ? String(myReport.callsConnected) : '');
          setAppointmentsBooked(myReport.appointmentsBooked ? String(myReport.appointmentsBooked) : '');
          setConvertedClients(myReport.convertedClients ? String(myReport.convertedClients) : '');
          setFollowUpsDue(myReport.followUpsDue ? String(myReport.followUpsDue) : '');
          setWorkSummary(myReport.workSummary || '');
          if (myReport.staffName && myReport.staffName !== 'Telecaller' && !staffName) {
            setStaffName(myReport.staffName);
          }
          setIsSaved(true);
        } else {
          // Reset fields to blank for this date
          setSavedRecord(null);
          setStatus('PRESENT');
          setPunchInTime('');
          setPunchOutTime('');
          setTotalHours('');
          setCallsMade('');
          setCallsConnected('');
          setAppointmentsBooked('');
          setConvertedClients('');
          setFollowUpsDue('');
          setWorkSummary('');
          setIsSaved(false);
        }
      }

      // Fetch history for this telecaller
      const histRes = await fetch(`/api/gentle-hair-wigs/daily-reports?branch=${branch}&allDates=true`);
      const histData = await histRes.json();
      if (histData.success && Array.isArray(histData.reports)) {
        const myReports = histData.reports
          .filter((r: any) => (!branch || r.branch === branch) && (r.punchInTime || r.callsMade > 0 || r.workSummary))
          .sort((a: any, b: any) => (b.reportDate || '').localeCompare(a.reportDate || ''));
        setHistoryList(myReports);
      }
    } catch (err: any) {
      console.warn('Could not load report for date:', err);
    } finally {
      setIsLoading(false);
    }
  }, [branch, currentTelecallerId, staffName]);

  useEffect(() => {
    fetchReport(selectedDate);
  }, [fetchReport, selectedDate]);

  // Save / Submit Daily Report
  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const isHolidayOrLeave = status === 'HOLIDAY' || status === 'LEAVE';
    const formattedIn = punchInTime ? to12HourDisplay(punchInTime) : null;
    const formattedOut = punchOutTime ? to12HourDisplay(punchOutTime) : null;
    const effectiveStaffName = staffName.trim() || 'Telecaller';
    const effectiveStaffId = currentTelecallerId || `tc_${branch}_${effectiveStaffName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const payload = {
      staffId: effectiveStaffId,
      staffName: effectiveStaffName,
      branch,
      reportDate: selectedDate,
      punchInTime: isHolidayOrLeave ? null : formattedIn,
      punchOutTime: isHolidayOrLeave ? null : formattedOut,
      totalHours: isHolidayOrLeave ? 0 : (Number(totalHours) || 0),
      callsMade: isHolidayOrLeave ? 0 : (Number(callsMade) || 0),
      callsConnected: isHolidayOrLeave ? 0 : (Number(callsConnected) || 0),
      appointmentsBooked: isHolidayOrLeave ? 0 : (Number(appointmentsBooked) || 0),
      convertedClients: isHolidayOrLeave ? 0 : (Number(convertedClients) || 0),
      followUpsDue: isHolidayOrLeave ? 0 : (Number(followUpsDue) || 0),
      workSummary: workSummary.trim(),
      status: status,
      isHoliday: status === 'HOLIDAY',
    };

    try {
      const res = await fetch('/api/gentle-hair-wigs/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to save daily report');
      }

      setSuccessMsg(`Daily report for ${selectedDate} saved successfully!`);
      setSavedRecord({ ...payload, updatedAt: new Date().toISOString() });
      setIsSaved(true);
      if (onReportUpdated) onReportUpdated();
      fetchReport(selectedDate);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving daily report');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150 pb-12">
      {/* 1. Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full border border-white/25">
                Telecaller Tab
              </span>
              <span className="text-xs text-amber-100 font-bold uppercase">
                {branch.replace('-', ' ')} Studio
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Daily Work Reporting
            </h1>
            <p className="text-xs text-amber-100 font-medium">
              Studio: <span className="capitalize font-bold text-white">{branch.replace('-', ' ')}</span>
              {staffName && (
                <> · Staff: <span className="font-bold text-white">{staffName}</span></>
              )}
            </p>
          </div>

          {/* Right Header Widget: Live Clock, Shift Status, Date Selector */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Live Clock */}
            <div className="bg-black/25 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20 text-center">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-200 block">
                Live Clock
              </span>
              <span className="text-xs font-mono font-extrabold text-white">
                {currentTimeStr || '--:--:--'}
              </span>
            </div>

            {/* Shift Status */}
            <div className="bg-white px-3 py-1.5 rounded-xl text-center shadow-xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                Shift Status
              </span>
              <span className="text-xs font-bold text-amber-800 flex items-center justify-center space-x-1">
                <span className={`h-1.5 w-1.5 rounded-full ${punchOutTime ? 'bg-emerald-500' : punchInTime ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                <span>{punchOutTime ? 'Shift Completed' : punchInTime ? 'Shift Active' : 'Not Started'}</span>
              </span>
            </div>

            {/* Date Selector */}
            <div className="flex items-center space-x-1.5 bg-black/25 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-white/20">
              <Calendar className="h-3.5 w-3.5 text-amber-200" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-mono text-xs font-bold focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center space-x-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-bold shadow-xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="flex items-center space-x-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-bold shadow-xs">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Submitted Report Summary Card (Shown when a report exists for this date) */}
      {savedRecord && (
        <div className="rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-100">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h2 className="text-sm font-black text-slate-900">
                Report Submitted for {savedRecord.reportDate}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full uppercase bg-emerald-600 text-white shadow-2xs">
                Status: {savedRecord.status}
              </span>
              <button
                type="button"
                onClick={() => {
                  const elem = document.getElementById('reporting-form');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer inline-flex items-center space-x-1"
              >
                <Edit3 className="h-3 w-3" />
                <span>Edit / Update</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl bg-white border border-emerald-200/80 p-3 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Worked Hours</span>
              <span className="text-lg font-black font-mono text-slate-900">
                {savedRecord.totalHours || 0} hrs
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                {savedRecord.punchInTime ? to12HourDisplay(savedRecord.punchInTime) : '--'} → {savedRecord.punchOutTime ? to12HourDisplay(savedRecord.punchOutTime) : '--'}
              </span>
            </div>

            <div className="rounded-xl bg-white border border-emerald-200/80 p-3 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Calls Handled</span>
              <span className="text-lg font-black font-mono text-amber-700">
                {savedRecord.callsMade || 0}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {savedRecord.callsConnected || 0} connected
              </span>
            </div>

            <div className="rounded-xl bg-white border border-emerald-200/80 p-3 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Appointments</span>
              <span className="text-lg font-black font-mono text-emerald-700">
                {savedRecord.appointmentsBooked || 0} Booked
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {savedRecord.convertedClients || 0} Converted Sales
              </span>
            </div>

            <div className="rounded-xl bg-white border border-emerald-200/80 p-3 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Follow-ups</span>
              <span className="text-lg font-black font-mono text-blue-700">
                {savedRecord.followUpsDue || 0} Scheduled
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                For next callbacks
              </span>
            </div>
          </div>

          {savedRecord.workSummary && (
            <div className="rounded-xl bg-white border border-emerald-100 p-3 text-xs text-slate-700 font-medium">
              <span className="font-bold text-slate-900 block mb-1">Work Description / Summary:</span>
              <p className="whitespace-pre-line leading-relaxed">{savedRecord.workSummary}</p>
            </div>
          )}
        </div>
      )}

      {/* 3. Daily Reporting Input Form (Full Manual Freedom) */}
      <form id="reporting-form" onSubmit={handleSaveReport} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900">
              {savedRecord ? `Update Report for ${selectedDate}` : `Enter Daily Work Report for ${selectedDate}`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fill in your worked hours, times, and phone calling numbers. You can submit this at any time.
            </p>
          </div>

          {/* Status Selection */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-600">Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="text-xs font-bold rounded-xl border border-slate-300 p-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="PRESENT">Present (Full Day)</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="LEAVE">Leave</option>
              <option value="HOLIDAY">Holiday / Off</option>
            </select>
          </div>
        </div>

        {/* Staff Member Name (No fake defaults, enterable by staff) */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
            Staff Member Name
          </label>
          <input
            type="text"
            value={staffName}
            onChange={(e) => {
              const val = e.target.value;
              setStaffName(val);
              if (typeof window !== 'undefined') {
                localStorage.setItem(`telecaller_name_${branch}`, val);
              }
            }}
            className="w-full sm:max-w-xs rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {status !== 'HOLIDAY' && status !== 'LEAVE' ? (
          <>
            {/* Shift Punch In & Punch Out Section (Small & 2 in a row) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">Shift Punch In &amp; Punch Out</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Record your working hours for studio attendance</p>
                  </div>
                </div>

                {/* Worked Hours Pill (Editable) */}
                <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500">Worked Hours:</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={totalHours}
                    onChange={(e) => handleWorkedHoursChange(e.target.value)}
                    className="w-14 rounded-md border border-slate-300 px-1.5 py-0.5 text-xs font-mono font-black text-slate-900 text-center bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="text-[11px] font-bold text-slate-600">hrs</span>
                </div>
              </div>

              {/* 2 Cards in a Row: Clock & Number Chooser (ZERO typing needed) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* CARD 1: PUNCH IN */}
                <ClockNumberPicker
                  label="Punch In"
                  value={punchInTime}
                  onChange={(val) => {
                    setPunchInTime(val);
                    calculateHoursAndClassifyStatus(val, punchOutTime);
                  }}
                  onClear={() => {
                    setPunchInTime('');
                    calculateHoursAndClassifyStatus('', punchOutTime);
                  }}
                  quickPresets={['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM']}
                  theme="emerald"
                />

                {/* CARD 2: PUNCH OUT */}
                <ClockNumberPicker
                  label="Punch Out"
                  value={punchOutTime}
                  onChange={(val) => {
                    setPunchOutTime(val);
                    calculateHoursAndClassifyStatus(punchInTime, val);
                  }}
                  onClear={() => {
                    setPunchOutTime('');
                    calculateHoursAndClassifyStatus(punchInTime, '');
                  }}
                  quickPresets={['05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM']}
                  theme="amber"
                />
              </div>

              {/* Auto-Classification Feedback & Rules Banner */}
              <div className="space-y-1.5 pt-1">
                {totalHours && Number(totalHours) > 0 ? (
                  <div
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 shadow-2xs ${
                      Number(totalHours) >= 5.0
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-amber-50 border-amber-300 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircle2
                        className={`h-4 w-4 shrink-0 ${
                          Number(totalHours) >= 5.0 ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      />
                      <span>
                        {Number(totalHours) >= 5.0
                          ? `Total Worked: ${totalHours} hrs (≥ 5 hrs) · Marked as Present (Full Day)`
                          : `Total Worked: ${totalHours} hrs (< 5 hrs) · Marked as Half Day`}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        Number(totalHours) >= 5.0
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-amber-600 text-white shadow-2xs'
                      }`}
                    >
                      {status === 'HALF_DAY' ? 'Half Day' : status === 'PRESENT' ? 'Present' : status}
                    </span>
                  </div>
                ) : null}

                {/* Studio Attendance Rule Guidance */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                  <span>
                    Rule: <span className="font-bold text-slate-700">≥ 5 hrs = Present (Full Day)</span> ·{' '}
                    <span className="font-bold text-slate-700">&lt; 5 hrs = Half Day</span> ·{' '}
                    <span className="font-bold text-slate-700">No report = Leave</span>
                  </span>
                  <span className="text-slate-400">Click dropdown or numbers to set time</span>
                </div>
              </div>
            </div>

            {/* ROW 2: Calling & Lead Metrics (Manual Inputs) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  Calls Dialed
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={callsMade}
                  onChange={(e) => setCallsMade(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  Connected
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={callsConnected}
                  onChange={(e) => setCallsConnected(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  Appts Booked
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={appointmentsBooked}
                  onChange={(e) => setAppointmentsBooked(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  Converted Sales
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={convertedClients}
                  onChange={(e) => setConvertedClients(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder:text-slate-400"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  Follow-ups Set
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={followUpsDue}
                  onChange={(e) => setFollowUpsDue(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder:text-slate-400"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs font-bold text-amber-900 flex items-center space-x-3">
            <Palmtree className="h-5 w-5 text-amber-700 shrink-0" />
            <span>Marked as {status === 'HOLIDAY' ? 'Holiday / Off' : 'Leave'}. Timings and call numbers will be saved as 0.</span>
          </div>
        )}

        {/* ROW 3: Work Description & Calling Notes */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
            Work Description / Calling Notes (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Enter calling notes, customer inquiries, wig trials discussed, objections handled, etc..."
            value={workSummary}
            onChange={(e) => setWorkSummary(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder:text-slate-400 leading-relaxed font-medium"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end space-x-3">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 hover:opacity-95 text-xs font-extrabold text-white shadow-md transition cursor-pointer disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>{isLoading ? 'Saving...' : 'Save Daily Report'}</span>
          </button>
        </div>
      </form>

      {/* 4. Past Attendance & Reporting Records */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Your Past Attendance & Reports</h3>
              <p className="text-[11px] text-slate-500">Click any date row to load and view or edit that day&apos;s submission</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-400">Recent Records</span>
        </div>

        {historyList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            No saved reports yet. Once you submit a report above, it will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">In / Out</th>
                  <th className="py-2.5 px-3">Hours</th>
                  <th className="py-2.5 px-3">Calls</th>
                  <th className="py-2.5 px-3">Appts</th>
                  <th className="py-2.5 px-3">Sales</th>
                  <th className="py-2.5 px-3">Work Summary</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {historyList.map((hist, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {hist.reportDate}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          hist.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : hist.status === 'HALF_DAY'
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : hist.status === 'HOLIDAY'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {hist.status === 'HALF_DAY'
                          ? 'Half Day'
                          : hist.status === 'PRESENT'
                          ? 'Present'
                          : hist.status === 'HOLIDAY'
                          ? 'Holiday'
                          : 'Leave'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {hist.punchInTime ? to12HourDisplay(hist.punchInTime) : '--'} - {hist.punchOutTime ? to12HourDisplay(hist.punchOutTime) : '--'}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {hist.totalHours || 0} hrs
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-700 whitespace-nowrap">
                      {hist.callsMade || 0} <span className="text-[10px] text-slate-400 font-normal">({hist.callsConnected || 0})</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {hist.appointmentsBooked || 0}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-purple-700 whitespace-nowrap">
                      {hist.convertedClients || 0}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {hist.workSummary || '-'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedDate(hist.reportDate)}
                        className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
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
