'use client';

import { useState, useEffect } from 'react';
import { Clock, PhoneCall, Printer, ClipboardCheck, LogOut, ChevronLeft } from 'lucide-react';
import { BusinessDashboardProps } from '../types';

interface PrintBoothDailyReport {
  id?: string;
  member_id: string;
  member_name: string;
  report_date: string;
  punch_in: string | null;
  punch_out: string | null;
  calls_made: number;
  machines_sold: number;
  notes: string;
  created_at?: string;
}

export function PrintBoothColdcallerDashboard({
  memberId,
  memberName,
  role = 'Coldcaller',
}: BusinessDashboardProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [activeTab, setActiveTab] = useState<'daily' | 'history'>('daily');
  const [report, setReport] = useState<PrintBoothDailyReport>({
    member_id: memberId || 'demo-printbooth-coldcaller',
    member_name: memberName || 'Coldcaller Staff',
    report_date: today,
    punch_in: null,
    punch_out: null,
    calls_made: 0,
    machines_sold: 0,
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<PrintBoothDailyReport[]>([]);

  const resolvedMemberId = memberId || 'demo-printbooth-coldcaller';

  // Load today's report
  useEffect(() => {
    fetch(`/api/printbooth/daily-report?memberId=${encodeURIComponent(resolvedMemberId)}&date=${today}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.report) {
          setReport(data.report);
        }
      })
      .catch(() => {});

    fetch(`/api/printbooth/daily-report?memberId=${encodeURIComponent(resolvedMemberId)}&history=true`)
      .then(r => r.json())
      .then(data => {
        if (data && data.reports) {
          setHistory(data.reports);
        }
      })
      .catch(() => {});
  }, [resolvedMemberId, today]);

  const punchIn = () => {
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    setReport(prev => ({ ...prev, punch_in: now }));
  };

  const punchOut = () => {
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    setReport(prev => ({ ...prev, punch_out: now }));
  };

  const saveReport = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/printbooth/daily-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...report,
          member_id: resolvedMemberId,
          member_name: memberName || report.member_name,
        }),
      });
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'homeseva_user_session=; Max-Age=0; path=/;';
    document.cookie = 'homeseva_session=; Max-Age=0; path=/;';
    window.location.href = '/signin/printbooth';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-sm">
            PB
          </div>
          <div>
            <h1 className="font-bold text-white text-base">PrintBooth &bull; Coldcaller Desk</h1>
            <p className="text-xs text-slate-400">
              Logged in as: <span className="text-amber-400 font-semibold">{memberName || 'Staff Member'}</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 px-6 pt-5 max-w-xl mx-auto">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'daily'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Today&apos;s Daily Reporting
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'history'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Past Attendance &amp; History
        </button>
      </div>

      <div className="p-6 max-w-xl mx-auto">
        {activeTab === 'daily' ? (
          <div className="space-y-4">
            {/* Attendance & Punch card */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg">
              <h2 className="font-bold text-white text-sm mb-3 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Attendance &bull; {today}</span>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={punchIn}
                  disabled={!!report.punch_in}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition ${
                    report.punch_in
                      ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                      : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  }`}
                >
                  {report.punch_in ? `In: ${report.punch_in}` : 'Punch In'}
                </button>
                <button
                  type="button"
                  onClick={punchOut}
                  disabled={!report.punch_in || !!report.punch_out}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition ${
                    report.punch_out
                      ? 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                      : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40'
                  }`}
                >
                  {report.punch_out ? `Out: ${report.punch_out}` : 'Punch Out'}
                </button>
              </div>
            </div>

            {/* Daily Calls & Machines Sold */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
              <h2 className="font-bold text-white text-sm flex items-center space-x-2">
                <ClipboardCheck className="w-4 h-4 text-amber-400" />
                <span>Sales &amp; Calling Activity</span>
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                  <span>Number of Calls Made</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={report.calls_made}
                  onChange={e => setReport(prev => ({ ...prev, calls_made: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Machines Sold</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={report.machines_sold}
                  onChange={e => setReport(prev => ({ ...prev, machines_sold: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Summary / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={report.notes}
                  onChange={e => setReport(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes on client objections, conversions, followups..."
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={saveReport}
              disabled={isSaving}
              className={`w-full py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition shadow-lg ${
                saved
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50'
              }`}
            >
              {saved ? 'Saved Successfully to Database!' : isSaving ? 'Saving...' : 'Save Daily Report'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-10 text-center text-xs text-slate-500">
                No past daily reports recorded yet.
              </div>
            ) : (
              history.map((h, i) => (
                <div key={i} className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-white">{h.report_date}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      h.punch_in ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950 text-rose-300'
                    }`}>
                      {h.punch_in ? 'PRESENT' : 'NO PUNCH'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                    <div>Hours: {h.punch_in || '-'} &rarr; {h.punch_out || '-'}</div>
                    <div>Calls: <span className="text-white font-semibold">{h.calls_made}</span></div>
                    <div>Machines: <span className="text-emerald-400 font-semibold">{h.machines_sold}</span></div>
                  </div>
                  {h.notes && (
                    <div className="mt-2 text-[11px] text-slate-500 italic border-t border-slate-800/80 pt-1.5">
                      &ldquo;{h.notes}&rdquo;
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
