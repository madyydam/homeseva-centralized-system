'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Printer,
  Boxes,
  Receipt,
  Plus,
  LogOut,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';
import { BusinessDashboardProps } from '../types';
import { printboothConfig } from './config';
import { printboothDb } from './db';
import {
  PrintJobItem,
  PaperStockItem,
  PrintboothData,
} from './types';
import { PrintBoothColdcallerDashboard } from './ColdcallerDashboard';
import { logoutUser } from '@/lib/clientAuth';

export default function PrintboothDashboard(props: BusinessDashboardProps) {
  const isColdcaller = (props.role || '').toLowerCase().includes('cold');
  if (isColdcaller) {
    return <PrintBoothColdcallerDashboard {...props} />;
  }
  return <PrintboothManagerView {...props} />;
}

function PrintboothManagerView({
  role = 'Press Production Manager',
  memberId,
  memberName,
}: BusinessDashboardProps) {
  const { isSidebarCollapsed, toggleSidebar } = useSidebarCollapse();
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'paper' | 'coldcallers'>('overview');
  const [selectedCallerId, setSelectedCallerId] = useState<string | null>(null);
  const [selectedCallerName, setSelectedCallerName] = useState<string | null>(null);
  const [coldCallersList, setColdCallersList] = useState<{ id: string; name: string; email: string }[]>([]);
  const [data, setData] = useState<PrintboothData>({
    jobs: [],
    paperStock: [],
  });

  const refreshData = () => {
    setData({ ...printboothDb.getData() });
  };

  useEffect(() => {
    refreshData();
    fetch('/api/members?businessId=0d900d63-d53d-4870-a4a9-8fb0435fd55f&roleId=Coldcaller')
      .then(r => r.json())
      .then(d => {
        if (d && d.success) setColdCallersList(d.members || []);
      })
      .catch(() => {});
  }, []);

  const [showJobModal, setShowJobModal] = useState(false);
  const [showPaperModal, setShowPaperModal] = useState(false);

  // Form states: Job
  const [jobClient, setJobClient] = useState('');
  const [jobType, setJobType] = useState<PrintJobItem['jobType']>('Brochures & Catalogues');
  const [jobGsm, setJobGsm] = useState('300 GSM Gloss Art Board');
  const [jobCopies, setJobCopies] = useState('2500');
  const [jobInvoice, setJobInvoice] = useState('38000');
  const [jobDispatch, setJobDispatch] = useState('Tomorrow 4 PM');

  // Form states: Paper
  const [paperName, setPaperName] = useState('');
  const [paperGsmVal, setPaperGsmVal] = useState('300');
  const [paperFinish, setPaperFinish] = useState<PaperStockItem['finish']>('Gloss Art Paper');
  const [paperReams, setPaperReams] = useState('40');

  const totalPrintRevenue = data.jobs.reduce((sum, j) => sum + (Number(j.totalInvoice) || 0), 0);
  const activePressJobs = data.jobs.filter((j) => j.stage !== 'Dispatched').length;

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobClient.trim()) return;
    const newJob: PrintJobItem = {
      id: `PRT-${String(data.jobs.length + 1).padStart(3, '0')}`,
      jobTicket: `PB-JOB-2026-${String(data.jobs.length + 101)}`,
      clientName: jobClient.trim(),
      jobType,
      paperGsm: jobGsm,
      copiesCount: Number(jobCopies) || 0,
      totalInvoice: Number(jobInvoice) || 0,
      stage: 'Artwork Proofing',
      targetDispatch: jobDispatch || 'Standard 48 Hours',
    };
    printboothDb.addJob(newJob);
    refreshData();
    setShowJobModal(false);
    setJobClient('');
  };

  const handleCreatePaper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperName.trim()) return;
    const newPaper: PaperStockItem = {
      id: `PPR-${String(data.paperStock.length + 1).padStart(3, '0')}`,
      paperName: paperName.trim(),
      gsm: Number(paperGsmVal) || 300,
      finish: paperFinish,
      reamsInStock: Number(paperReams) || 0,
      minReams: 10,
    };
    printboothDb.addPaperStock(newPaper);
    refreshData();
    setShowPaperModal(false);
    setPaperName('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 font-sans selection:bg-purple-600 selection:text-white">
      {/* Sidebar */}
      <aside
        className={`w-full ${
          isSidebarCollapsed ? 'lg:w-18' : 'lg:w-64'
        } bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 lg:h-screen lg:sticky lg:top-0 z-30 transition-all duration-200`}
      >
        <div>
          <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-200">
            {!isSidebarCollapsed ? (
              <>
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
                    <Printer className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xs font-black text-slate-900 truncate">Printbooth</h1>
                    <p className="text-[10px] font-semibold text-purple-700 truncate">Press &amp; Packaging</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-center">
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm hover:scale-105 transition-transform cursor-pointer"
                  title="Click to Expand Sidebar"
                >
                  <PanelLeftOpen className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
          </div>

          <div className="p-2.5 space-y-4">
            <div>
              {!isSidebarCollapsed && (
                <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Press Shop
                </span>
              )}
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  title={isSidebarCollapsed ? 'Overview' : undefined}
                  className={`w-full flex items-center rounded-xl transition ${
                    isSidebarCollapsed ? 'justify-center p-2.5' : 'space-x-2.5 px-3 py-2 text-xs font-semibold'
                  } ${
                    activeTab === 'overview'
                      ? 'bg-purple-50 text-purple-900 border border-purple-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 text-purple-600 shrink-0" />
                  {!isSidebarCollapsed && <span>Overview</span>}
                </button>
                <button
                  onClick={() => setActiveTab('jobs')}
                  title={isSidebarCollapsed ? `Press Job Tickets (${data.jobs.length})` : undefined}
                  className={`w-full flex items-center rounded-xl transition ${
                    isSidebarCollapsed ? 'justify-center p-2.5 relative' : 'space-x-2.5 px-3 py-2 text-xs font-semibold'
                  } ${
                    activeTab === 'jobs'
                      ? 'bg-purple-50 text-purple-900 border border-purple-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Printer className="h-4 w-4 text-purple-600 shrink-0" />
                  {!isSidebarCollapsed ? (
                    <>
                      <span>Press Job Tickets</span>
                      <span className="ml-auto rounded-full bg-purple-100 text-purple-800 px-1.5 text-[10px] font-mono font-bold">
                        {data.jobs.length}
                      </span>
                    </>
                  ) : (
                    data.jobs.length > 0 && (
                      <span className="absolute top-1 right-1 flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
                      </span>
                    )
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('paper')}
                  title={isSidebarCollapsed ? `Paper Reams Inventory (${data.paperStock.length})` : undefined}
                  className={`w-full flex items-center rounded-xl transition ${
                    isSidebarCollapsed ? 'justify-center p-2.5 relative' : 'space-x-2.5 px-3 py-2 text-xs font-semibold'
                  } ${
                    activeTab === 'paper'
                      ? 'bg-purple-50 text-purple-900 border border-purple-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Boxes className="h-4 w-4 text-purple-600 shrink-0" />
                  {!isSidebarCollapsed ? (
                    <>
                      <span>Paper Reams Inventory</span>
                      <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                        {data.paperStock.length}
                      </span>
                    </>
                  ) : (
                    data.paperStock.length > 0 && (
                      <span className="absolute top-1 right-1 flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500" />
                      </span>
                    )
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('coldcallers')}
                  title={isSidebarCollapsed ? `Coldcallers & CRM (${coldCallersList.length})` : undefined}
                  className={`w-full flex items-center rounded-xl transition ${
                    isSidebarCollapsed ? 'justify-center p-2.5 relative' : 'space-x-2.5 px-3 py-2 text-xs font-semibold'
                  } ${
                    activeTab === 'coldcallers'
                      ? 'bg-purple-50 text-purple-900 border border-purple-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Users className="h-4 w-4 text-purple-600 shrink-0" />
                  {!isSidebarCollapsed ? (
                    <>
                      <span>Coldcallers &amp; CRM</span>
                      <span className="ml-auto rounded-full bg-amber-100 text-amber-800 px-1.5 text-[10px] font-mono font-bold">
                        {coldCallersList.length}
                      </span>
                    </>
                  ) : (
                    coldCallersList.length > 0 && (
                      <span className="absolute top-1 right-1 flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                      </span>
                    )
                  )}
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="p-2.5 border-t border-slate-200 bg-slate-50">
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center space-x-2.5 mb-2 px-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-xs font-black text-white shrink-0 shadow-2xs">
                  PB
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-slate-900 truncate leading-tight">Press Manager</span>
                  <span className="block text-[10px] text-purple-700 font-semibold truncate leading-tight">{role}</span>
                </div>
              </div>
              <button
                onClick={() => logoutUser('printbooth')}
                className="w-full flex items-center justify-center space-x-1.5 rounded-lg border border-slate-200 bg-white py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs cursor-pointer"
              >
                <LogOut className="h-3 w-3" />
                <span>Switch Business / Exit</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-xs font-black text-white shrink-0 shadow-2xs"
                title={`Printbooth (${role})`}
              >
                PB
              </div>
              <button
                onClick={() => logoutUser('printbooth')}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition shadow-2xs cursor-pointer"
                title="Switch Business / Exit"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div>
            <span className="text-sm font-extrabold text-slate-900">Printbooth · Commercial Press</span>
            <p className="text-[11px] text-slate-500 font-medium">Session: {role} · Isolated Business DB</p>
          </div>
          <button
            onClick={() => setShowJobModal(true)}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Print Job</span>
          </button>
        </header>

        <div className="p-6 space-y-6 max-w-7xl">
          {/* JOBS TABLE */}
          {(activeTab === 'overview' || activeTab === 'jobs') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Commercial Press Job Queue</h3>
                  <p className="text-xs text-slate-500">Live stages from artwork proofing to post-press binding</p>
                </div>
                <button onClick={() => setShowJobModal(true)} className="text-xs font-bold text-purple-700 hover:text-purple-800">
                  + New Job
                </button>
              </div>

              {data.jobs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Printer className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No print jobs entered</h4>
                  <p className="mt-1 text-[11px] text-slate-400">Create a job ticket for brochures, boxes or banners.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Ticket #</th>
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3">Job Specification</th>
                        <th className="py-2.5 px-3">Paper GSM</th>
                        <th className="py-2.5 px-3 font-mono">Copies</th>
                        <th className="py-2.5 px-3 font-mono">Total (₹)</th>
                        <th className="py-2.5 px-3">Stage</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.jobs.map((j) => (
                        <tr key={j.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-purple-700">{j.jobTicket}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{j.clientName}</td>
                          <td className="py-3 px-3 text-slate-700">{j.jobType}</td>
                          <td className="py-3 px-3 text-slate-600">{j.paperGsm}</td>
                          <td className="py-3 px-3 font-mono font-bold">{j.copiesCount.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹ {j.totalInvoice.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3">
                            <span className="rounded bg-purple-50 text-purple-800 px-2 py-0.5 text-[10px] font-bold border border-purple-200">
                              {j.stage}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {j.stage !== 'Dispatched' ? (
                              <button
                                onClick={() => {
                                  printboothDb.advanceJobStage(j.id);
                                  refreshData();
                                }}
                                className="inline-flex items-center space-x-1 rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 px-2 py-1 text-[11px] font-bold text-purple-900 transition"
                              >
                                <span>Advance</span>
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            ) : (
                              <span className="text-emerald-700 text-[11px] font-bold">Dispatched</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* COLDCALLERS MONITORING FOR OWNER */}
          {activeTab === 'coldcallers' && (
            <div className="space-y-4">
              {selectedCallerId ? (
                <div>
                  <button
                    onClick={() => {
                      setSelectedCallerId(null);
                      setSelectedCallerName(null);
                    }}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 mb-4 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 transition cursor-pointer"
                  >
                    <span>&larr; Back to all Coldcallers</span>
                  </button>
                  <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 mb-5 text-xs font-bold text-amber-900 flex items-center justify-between shadow-xs">
                    <span>
                      Viewing &amp; Editing Live Desk of:{' '}
                      <span className="text-amber-950 font-black underline">{selectedCallerName}</span>
                    </span>
                    <span className="rounded bg-amber-200/80 px-2 py-0.5 text-[10px] uppercase tracking-wider font-extrabold text-amber-950">
                      Owner Superpower Mode
                    </span>
                  </div>
                  <PrintBoothColdcallerDashboard
                    role="Coldcaller"
                    memberId={selectedCallerId}
                    memberName={selectedCallerName || ''}
                  />
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span>PrintBooth Coldcallers Roster &amp; Daily Desk</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Click on any individual coldcaller to open, inspect, and edit their daily calls, machines sold &amp; attendance.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-purple-50 text-purple-800 rounded-full text-xs font-bold font-mono border border-purple-200">
                      {coldCallersList.length} Active Caller(s)
                    </span>
                  </div>

                  {coldCallersList.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
                      <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      <h4 className="text-xs font-bold text-slate-700">No individual coldcallers registered yet</h4>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                        Open the Super Admin &ldquo;Companies &amp; Members&rdquo; module to add member accounts for PrintBooth.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                      {coldCallersList.map((caller) => (
                        <button
                          key={caller.id}
                          type="button"
                          onClick={() => {
                            setSelectedCallerId(caller.id);
                            setSelectedCallerName(caller.name);
                          }}
                          className="text-left p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-purple-50/50 hover:border-purple-300 transition group shadow-2xs cursor-pointer"
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center text-sm shadow-xs group-hover:scale-105 transition">
                              {caller.name ? caller.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-purple-900">
                                {caller.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-mono truncate">{caller.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px] font-semibold text-purple-700">
                            <span>Open Live Calling Desk</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Job */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Create Print Job Ticket</h3>
            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Name *</label>
                <input
                  type="text"
                  value={jobClient}
                  onChange={(e) => setJobClient(e.target.value)}
                  placeholder="e.g. Zenith Pharma Ltd"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Job Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-500 focus:outline-none font-semibold"
                  >
                    <option value="Brochures & Catalogues">Brochures &amp; Catalogues</option>
                    <option value="Custom Packaging Boxes">Custom Packaging Boxes</option>
                    <option value="Vinyl Flex Banners">Vinyl Flex Banners</option>
                    <option value="Corporate Business Cards">Corporate Business Cards</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paper GSM</label>
                  <input
                    type="text"
                    value={jobGsm}
                    onChange={(e) => setJobGsm(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity (Copies)</label>
                  <input
                    type="number"
                    value={jobCopies}
                    onChange={(e) => setJobCopies(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice Value (₹)</label>
                  <input
                    type="number"
                    value={jobInvoice}
                    onChange={(e) => setJobInvoice(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-purple-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Save Job Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

