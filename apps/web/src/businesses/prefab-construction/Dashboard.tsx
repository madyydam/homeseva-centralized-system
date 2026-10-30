'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  Boxes,
  Users,
  Receipt,
  Plus,
  LogOut,
  MapPin,
  CheckCircle2,
  HardHat,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { BusinessDashboardProps } from '../types';
import { prefabConstructionConfig } from './config';
import { prefabConstructionDb } from './db';
import {
  ProjectSiteItem,
  BOQItem,
  LaborRosterItem,
  MilestoneBillItem,
  PrefabConstructionData,
} from './types';

export default function PrefabConstructionDashboard({
  branch = 'chakan-site',
  role = 'Site Supervising Engineer',
}: BusinessDashboardProps) {
  const currentBranch = branch || 'chakan-site';
  const branchInfo =
    prefabConstructionConfig.branches?.find((b) => b.slug === currentBranch) ||
    prefabConstructionConfig.branches![0]!;

  const [activeTab, setActiveTab] = useState<'overview' | 'sites' | 'boq' | 'labor' | 'billing'>('overview');
  const [data, setData] = useState<PrefabConstructionData>({
    sites: [],
    boqList: [],
    laborRoster: [],
    milestoneBills: [],
  });

  const refreshData = () => {
    setData({ ...prefabConstructionDb.getData() });
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Modals state
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showBOQModal, setShowBOQModal] = useState(false);
  const [showLaborModal, setShowLaborModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);

  // Form states: Site
  const [siteName, setSiteName] = useState('');
  const [siteClient, setSiteClient] = useState('');
  const [siteLocation, setSiteLocation] = useState(branchInfo.name);
  const [siteBudget, setSiteBudget] = useState('4500000');
  const [siteTarget, setSiteTarget] = useState('');

  // Form states: BOQ
  const [boqName, setBOQName] = useState('');
  const [boqCategory, setBOQCategory] = useState<BOQItem['category']>('Structural Steel');
  const [boqQtyReq, setBOQQtyReq] = useState('25');
  const [boqUnit, setBOQUnit] = useState('Metric Tons');
  const [boqRate, setBOQRate] = useState('72000');

  // Form states: Labor
  const [laborName, setLaborName] = useState('');
  const [laborTrade, setLaborTrade] = useState<LaborRosterItem['trade']>('Fitter');
  const [laborWage, setLaborWage] = useState('950');

  // Form states: Milestone Bill
  const [billSite, setBillSite] = useState('');
  const [billClient, setBillClient] = useState('');
  const [billMilestone, setBillMilestone] = useState('Completion of Steel Structure Framework (Stage 2)');
  const [billAmount, setBillAmount] = useState('850000');

  const totalContractValue = data.sites.reduce((sum, s) => sum + (Number(s.budget) || 0), 0);
  const activeSitesCount = data.sites.length;
  const todayLaborCount = data.laborRoster.filter((l) => l.attendanceStatus !== 'Absent').length;
  const certifiedBilling = data.milestoneBills.reduce((sum, b) => sum + (Number(b.totalPayable) || 0), 0);

  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) return;
    const newSite: ProjectSiteItem = {
      id: `SITE-${String(data.sites.length + 1).padStart(3, '0')}`,
      name: siteName.trim(),
      client: siteClient.trim() || 'Direct Client',
      location: siteLocation,
      budget: Number(siteBudget) || 0,
      stage: 'Foundation & Earthwork',
      startDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      targetHandover: siteTarget || 'Dec 2026',
    };
    prefabConstructionDb.addSite(newSite);
    refreshData();
    setShowSiteModal(false);
    setSiteName('');
    setSiteClient('');
  };

  const handleCreateBOQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boqName.trim()) return;
    const newBOQ: BOQItem = {
      id: `BOQ-${String(data.boqList.length + 1).padStart(3, '0')}`,
      materialName: boqName.trim(),
      category: boqCategory,
      quantityRequired: Number(boqQtyReq) || 0,
      quantityReceived: 0,
      unit: boqUnit,
      estimatedRate: Number(boqRate) || 0,
    };
    prefabConstructionDb.addBOQItem(newBOQ);
    refreshData();
    setShowBOQModal(false);
    setBOQName('');
  };

  const handleCreateLabor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!laborName.trim()) return;
    const newWorker: LaborRosterItem = {
      id: `LAB-${String(data.laborRoster.length + 1).padStart(3, '0')}`,
      workerName: laborName.trim(),
      trade: laborTrade,
      site: branchInfo.shortName,
      dailyWage: Number(laborWage) || 800,
      attendanceStatus: 'Present',
      shiftDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    prefabConstructionDb.addLaborWorker(newWorker);
    refreshData();
    setShowLaborModal(false);
    setLaborName('');
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const base = Number(billAmount) || 0;
    const gst = Math.round(base * 0.18);
    const newBill: MilestoneBillItem = {
      id: `RA-${String(data.milestoneBills.length + 1).padStart(3, '0')}`,
      billNumber: `RA/PREFAB/2026/${String(data.milestoneBills.length + 101)}`,
      siteName: billSite || (data.sites[0]?.name ?? branchInfo.name),
      clientName: billClient || 'Client Rep',
      milestoneTitle: billMilestone,
      billAmount: base,
      gstAmount: gst,
      totalPayable: base + gst,
      status: 'Draft RA Bill',
      billDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    prefabConstructionDb.addMilestoneBill(newBill);
    refreshData();
    setShowBillModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 md:h-screen md:sticky md:top-0 z-30">
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs font-black text-slate-900 truncate">Prefab Construction</h1>
                <p className="text-[10px] font-semibold text-blue-700 truncate">{branchInfo.name}</p>
              </div>
            </div>
          </div>

          <div className="p-3 space-y-4">
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Site Operations
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'overview'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 text-blue-600" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab('sites')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'sites'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span>Project Sites</span>
                  <span className="ml-auto rounded-full bg-blue-100 text-blue-800 px-1.5 text-[10px] font-mono font-bold">
                    {data.sites.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('boq')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'boq'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Boxes className="h-4 w-4 text-blue-600" />
                  <span>Materials &amp; BOQ</span>
                  <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                    {data.boqList.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('labor')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'labor'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <HardHat className="h-4 w-4 text-blue-600" />
                  <span>Labor Muster Roll</span>
                  <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                    {data.laborRoster.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('billing')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'billing'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <span>Milestone RA Bills</span>
                  <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                    {data.milestoneBills.length}
                  </span>
                </button>
              </nav>
            </div>

            <div className="rounded-xl border border-blue-200/70 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-3 text-xs">
              <span className="font-bold text-blue-900 text-[11px] flex items-center space-x-1">
                <MapPin className="h-3 w-3 text-blue-600" />
                <span>Active Project Site</span>
              </span>
              <p className="mt-1 text-[11px] font-medium text-slate-700">{branchInfo.name}</p>
              <div className="mt-2 pt-2 border-t border-blue-200/50 flex items-center justify-between text-[10px]">
                <span className="text-slate-500 font-semibold">{branchInfo.staffCount} Site Workers</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Isolated DB
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5 mb-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white shrink-0 shadow-2xs">
              PC
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-900 truncate leading-tight">Site Engineer</span>
              <span className="block text-[10px] text-blue-700 font-semibold truncate leading-tight">{role}</span>
            </div>
          </div>
          <Link
            href="/signin/prefab-construction"
            className="w-full flex items-center justify-center space-x-1.5 rounded-lg border border-slate-200 bg-white py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
          >
            <LogOut className="h-3 w-3" />
            <span>Switch Site / Exit</span>
          </Link>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div>
            <span className="text-sm font-extrabold text-slate-900 truncate">
              Prefab Construction · {branchInfo.name}
            </span>
            <p className="text-[11px] text-slate-500 font-medium">Session: {role} · Modular &amp; Civil Sites</p>
          </div>
          <button
            onClick={() => setShowSiteModal(true)}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Site Project</span>
          </button>
        </header>

        <div className="p-6 space-y-6 max-w-7xl">
          {/* SITES TAB */}
          {(activeTab === 'overview' || activeTab === 'sites') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Project Sites &amp; Modular Progress</h3>
                  <p className="text-xs text-slate-500">Live civil and modular site milestones</p>
                </div>
                <button onClick={() => setShowSiteModal(true)} className="text-xs font-bold text-blue-700 hover:text-blue-800">
                  + Add Project
                </button>
              </div>

              {data.sites.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Building2 className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No project sites entered yet</h4>
                  <p className="mt-1 text-[11px] text-slate-400">Click below to add your first civil or modular project site.</p>
                  <button
                    onClick={() => setShowSiteModal(true)}
                    className="mt-3 inline-flex items-center space-x-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white transition shadow-xs"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Create Project Site</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Site ID</th>
                        <th className="py-2.5 px-3">Project &amp; Client</th>
                        <th className="py-2.5 px-3">Location</th>
                        <th className="py-2.5 px-3 font-mono">Contract Budget</th>
                        <th className="py-2.5 px-3">Current Milestone</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.sites.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">{s.id}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{s.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Client: {s.client}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{s.location}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹ {s.budget.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3">
                            <span className="rounded bg-blue-50 text-blue-800 px-2 py-0.5 text-[10px] font-bold border border-blue-200">
                              {s.stage}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {s.stage !== 'Handover & Audit' ? (
                              <button
                                onClick={() => {
                                  prefabConstructionDb.advanceSiteStage(s.id);
                                  refreshData();
                                }}
                                className="inline-flex items-center space-x-1 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 px-2 py-1 text-[11px] font-bold text-blue-900 transition"
                              >
                                <span>Advance Stage</span>
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            ) : (
                              <span className="text-emerald-700 text-[11px] font-bold">Handed Over</span>
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

          {/* BOQ TAB */}
          {activeTab === 'boq' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Bill of Quantities (BOQ) &amp; Material Receipts</h3>
                  <p className="text-xs text-slate-500">Track steel beams, PUF panels, concrete, and roofing deliveries</p>
                </div>
                <button onClick={() => setShowBOQModal(true)} className="text-xs font-bold text-blue-700 hover:text-blue-800">
                  + Indent Material
                </button>
              </div>

              {data.boqList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Boxes className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No BOQ items indented</h4>
                  <p className="mt-1 text-[11px] text-slate-400">Indent raw materials and prefab components.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Item ID</th>
                        <th className="py-2.5 px-3">Material Spec</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 font-mono">Qty Required</th>
                        <th className="py-2.5 px-3 font-mono">Qty Received</th>
                        <th className="py-2.5 px-3 text-right">Log Delivery</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.boqList.map((i) => (
                        <tr key={i.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">{i.id}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{i.materialName}</td>
                          <td className="py-3 px-3 text-slate-600">{i.category}</td>
                          <td className="py-3 px-3 font-mono font-bold">{i.quantityRequired} {i.unit}</td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-700">{i.quantityReceived} {i.unit}</td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                prefabConstructionDb.updateReceivedBOQ(i.id, 5);
                                refreshData();
                              }}
                              className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800 hover:bg-blue-100"
                            >
                              + Receive 5 {i.unit}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* LABOR TAB */}
          {activeTab === 'labor' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Site Labor Muster Roll</h3>
                  <p className="text-xs text-slate-500">Daily attendance and wage ledger</p>
                </div>
                <button onClick={() => setShowLaborModal(true)} className="text-xs font-bold text-blue-700 hover:text-blue-800">
                  + Add Worker
                </button>
              </div>

              {data.laborRoster.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <HardHat className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No labor records logged</h4>
                  <p className="mt-1 text-[11px] text-slate-400">Add site technicians, welders, and fitters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Worker ID</th>
                        <th className="py-2.5 px-3">Worker Name</th>
                        <th className="py-2.5 px-3">Trade</th>
                        <th className="py-2.5 px-3">Site</th>
                        <th className="py-2.5 px-3 font-mono">Daily Wage</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.laborRoster.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">{w.id}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{w.workerName}</td>
                          <td className="py-3 px-3 text-slate-600">{w.trade}</td>
                          <td className="py-3 px-3 text-slate-600">{w.site}</td>
                          <td className="py-3 px-3 font-mono">₹ {w.dailyWage} / day</td>
                          <td className="py-3 px-3">
                            <span className="rounded bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                              {w.attendanceStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Milestone RA Bills &amp; Contractor Invoices</h3>
                  <p className="text-xs text-slate-500">Progress certificates with 18% GST calculation</p>
                </div>
                <button onClick={() => setShowBillModal(true)} className="text-xs font-bold text-blue-700 hover:text-blue-800">
                  + Raise RA Bill
                </button>
              </div>

              {data.milestoneBills.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Receipt className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No RA bills generated</h4>
                  <p className="mt-1 text-[11px] text-slate-400">Raise progress bills for completed modular milestones.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">RA Bill #</th>
                        <th className="py-2.5 px-3">Project Site</th>
                        <th className="py-2.5 px-3">Milestone</th>
                        <th className="py-2.5 px-3 font-mono">Base (₹)</th>
                        <th className="py-2.5 px-3 font-mono">Total with GST</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.milestoneBills.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">{b.billNumber}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{b.siteName}</td>
                          <td className="py-3 px-3 text-slate-700 max-w-[220px] truncate">{b.milestoneTitle}</td>
                          <td className="py-3 px-3 font-mono">₹ {b.billAmount.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹ {b.totalPayable.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold border inline-block ${
                                b.status === 'Certified by Engineer'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {b.status === 'Draft RA Bill' && (
                              <button
                                onClick={() => {
                                  prefabConstructionDb.certifyMilestoneBill(b.id);
                                  refreshData();
                                }}
                                className="rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                              >
                                Certify RA Bill
                              </button>
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
        </div>
      </main>

      {/* Modal: New Site */}
      {showSiteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Add New Project Site</h3>
            <form onSubmit={handleCreateSite} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. 5-Storey Modular Hospital Wing"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Organization</label>
                <input
                  type="text"
                  value={siteClient}
                  onChange={(e) => setSiteClient(e.target.value)}
                  placeholder="e.g. Maharashtra Health Corp"
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contract Budget (₹)</label>
                  <input
                    type="number"
                    value={siteBudget}
                    onChange={(e) => setSiteBudget(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Handover</label>
                  <input
                    type="text"
                    value={siteTarget}
                    onChange={(e) => setSiteTarget(e.target.value)}
                    placeholder="e.g. Q4 2026"
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSiteModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Save Project Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New BOQ */}
      {showBOQModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Indent Material BOQ</h3>
            <form onSubmit={handleCreateBOQ} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Material Name &amp; Grade *</label>
                <input
                  type="text"
                  value={boqName}
                  onChange={(e) => setBOQName(e.target.value)}
                  placeholder="e.g. IS 2062 Grade E250 Steel Columns"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={boqCategory}
                  onChange={(e) => setBOQCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none font-semibold"
                >
                  <option value="Structural Steel">Structural Steel</option>
                  <option value="Insulated PUF Panels">Insulated PUF Panels</option>
                  <option value="Cement & Concrete">Cement &amp; Concrete</option>
                  <option value="Fasteners & Anchor Bolts">Fasteners &amp; Anchor Bolts</option>
                  <option value="Roofing Sheets">Roofing Sheets</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity Required</label>
                  <input
                    type="number"
                    value={boqQtyReq}
                    onChange={(e) => setBOQQtyReq(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={boqUnit}
                    onChange={(e) => setBOQUnit(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBOQModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Indent BOQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Labor */}
      {showLaborModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Log Labor Attendance</h3>
            <form onSubmit={handleCreateLabor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Worker Name *</label>
                <input
                  type="text"
                  value={laborName}
                  onChange={(e) => setLaborName(e.target.value)}
                  placeholder="e.g. Ramesh Shinde"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trade</label>
                  <select
                    value={laborTrade}
                    onChange={(e) => setLaborTrade(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none font-semibold"
                  >
                    <option value="Fitter">Fitter</option>
                    <option value="Welder">Welder</option>
                    <option value="Mason">Mason</option>
                    <option value="Rigger">Rigger</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Helper">Helper</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Daily Wage (₹)</label>
                  <input
                    type="number"
                    value={laborWage}
                    onChange={(e) => setLaborWage(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLaborModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Add Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bill */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Raise Milestone RA Bill</h3>
            <form onSubmit={handleCreateBill} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Milestone Description *</label>
                <input
                  type="text"
                  value={billMilestone}
                  onChange={(e) => setBillMilestone(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Base Amount (₹) *</label>
                <input
                  type="number"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">18% GST will be added automatically.</p>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Generate RA Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

