'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Building2,
  TrendingUp,
  DollarSign,
  PieChart,
  Award,
  Layers,
  Scale,
  FileText,
  Clock,
  ClipboardCheck,
  CheckCircle2,
  Circle,
  Boxes,
  Sparkles,
  PhoneCall,
  Plus,
  Wrench,
  Camera,
  Wifi,
  Scissors,
  Droplets,
  AlertCircle,
  Check,
  Users,
  Eye,
  Lock,
} from 'lucide-react';
import { GentleHairWigsStudioData, AssetRegisterItem, DailyTaskItem, ClientCallLogItem } from './types';
import { gentleHairWigsDb } from './db';

interface SopViewProps {
  branch: string;
  data: GentleHairWigsStudioData;
  onDataChange: () => void;
  userRole: string;
}

export function SopView({ branch, data, onDataChange, userRole }: SopViewProps) {
  // Navigation for Franchise & Investor SOP sub-tabs
  const [subTab, setSubTab] = useState<
    'economics' | 'architecture' | 'operations' | 'supply-chain' | 'quality' | 'audit'
  >('economics');

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);

  // New task form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<DailyTaskItem['category']>('Opening Checklist');
  const [newTaskAssignee, setNewTaskAssignee] = useState(userRole || 'Staff');
  const [newTaskTime, setNewTaskTime] = useState('11:00 AM');

  // New asset form
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState<AssetRegisterItem['category']>('Styling Equipment');
  const [assetQty, setAssetQty] = useState(1);
  const [assetCost, setAssetCost] = useState(15000);
  const [assetLocation, setAssetLocation] = useState('Suite 1');
  const [assetCondition, setAssetCondition] = useState<AssetRegisterItem['condition']>('Excellent');

  // New call log form
  const [callClient, setCallClient] = useState('');
  const [callPhone, setCallPhone] = useState('');
  const [callType, setCallType] = useState<ClientCallLogItem['callType']>('Appointment Booking');
  const [callStatus, setCallStatus] = useState<ClientCallLogItem['status']>('Completed');
  const [callNotes, setCallNotes] = useState('');

  // Interactive audit scorecard state (for Investor / Auditor review)
  const [auditScores, setAuditScores] = useState({
    brandCompliance: 25,
    hygieneSterilization: 24,
    posReconciliation: 25,
    staffCertification: 23,
  });

  const totalAuditScore =
    auditScores.brandCompliance +
    auditScores.hygieneSterilization +
    auditScores.posReconciliation +
    auditScores.staffCertification;

  // Task actions
  const handleToggleTask = (id: string) => {
    gentleHairWigsDb.toggleDailyTask(branch, id);
    onDataChange();
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const task: DailyTaskItem = {
      id: `TSK-${Date.now().toString().slice(-4)}`,
      taskTitle: newTaskTitle.trim(),
      category: newTaskCategory,
      assignedTo: newTaskAssignee,
      timeSlot: newTaskTime,
      completed: false,
    };
    gentleHairWigsDb.addDailyTask(branch, task);
    setNewTaskTitle('');
    setShowTaskModal(false);
    onDataChange();
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) return;
    const asset: AssetRegisterItem = {
      id: `AST-${Date.now().toString().slice(-4)}`,
      name: assetName.trim(),
      category: assetCategory,
      quantity: Number(assetQty) || 1,
      condition: assetCondition,
      purchaseCost: Number(assetCost) || 0,
      location: assetLocation,
      lastServiceDate: new Date().toISOString().split('T')[0]!,
    };
    gentleHairWigsDb.addAsset(branch, asset);
    setAssetName('');
    setShowAssetModal(false);
    onDataChange();
  };

  const handleToggleAssetCondition = (id: string, current: AssetRegisterItem['condition']) => {
    const next: AssetRegisterItem['condition'] =
      current === 'Excellent' ? 'Good' : current === 'Good' ? 'Needs Maintenance' : 'Excellent';
    gentleHairWigsDb.updateAssetCondition(branch, id, next);
    onDataChange();
  };

  const handleCreateCallLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callPhone.trim()) return;
    const callLog: ClientCallLogItem = {
      id: `CAL-${Date.now().toString().slice(-4)}`,
      clientName: callClient.trim() || "Don't know",
      phone: callPhone.trim(),
      callType: callType,
      status: callStatus,
      notes: callNotes.trim() || 'No additional notes',
      date: new Date().toISOString().split('T')[0]!,
    };
    gentleHairWigsDb.addCallLog(branch, callLog);
    setCallClient('');
    setCallPhone('');
    setCallNotes('');
    setShowCallModal(false);
    onDataChange();
  };

  // Metrics (memoized for instantaneous rendering and smoothness)
  const totalTasks = data.dailyTasks.length;
  const completedTasks = useMemo(() => data.dailyTasks.filter((t) => t.completed).length, [data.dailyTasks]);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalAssetsValue = useMemo(() => data.assets.reduce((sum, a) => sum + a.purchaseCost, 0), [data.assets]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Franchise & Investor Blueprint */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-400/30 rounded-full px-3 py-1 text-[11px] font-bold text-amber-300 mb-3">
              <Award className="h-3.5 w-3.5 text-amber-300" />
              <span>Franchise Standard Operating Procedures (SOP) &amp; Investor Blueprint</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Gentle Hair Wigs Studio — Franchise Model &amp; Unit Economics
            </h2>
            <p className="text-xs text-amber-100/90 mt-1 leading-relaxed">
              Standardized franchise operations manual, studio Capex/Opex blueprint, recurring subscription-like client
              retention model, central supply chain compliance, and investor audit scorecard.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center shrink-0">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
              <span className="text-[10px] text-amber-300 font-bold block uppercase tracking-wider">Gross Margin</span>
              <span className="text-sm font-black font-mono text-white">65% – 85%</span>
              <span className="text-[9px] text-amber-200/70 block mt-0.5">High Margin Services</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
              <span className="text-[10px] text-amber-300 font-bold block uppercase tracking-wider">Payback Period</span>
              <span className="text-sm font-black font-mono text-emerald-400">4 – 6 Months</span>
              <span className="text-[9px] text-amber-200/70 block mt-0.5">Fast Breakeven</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-amber-300 font-bold block uppercase tracking-wider">Audit Rating</span>
              <span className="text-sm font-black text-amber-200 font-mono">{totalAuditScore}/100 Grade A</span>
              <span className="text-[9px] text-amber-200/70 block mt-0.5">Investor Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Franchise Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setSubTab('economics')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'economics'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>1. Franchise Economics &amp; ROI</span>
        </button>

        <button
          onClick={() => setSubTab('architecture')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'architecture'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>2. Studio Architecture &amp; Fit-out</span>
        </button>

        <button
          onClick={() => setSubTab('operations')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'operations'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>3. Daily Store Operations &amp; Checklists</span>
        </button>

        <button
          onClick={() => setSubTab('supply-chain')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'supply-chain'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Boxes className="h-3.5 w-3.5" />
          <span>4. Central Supply Chain &amp; Stock</span>
        </button>

        <button
          onClick={() => setSubTab('quality')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'quality'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>5. Service Quality &amp; Privacy Protocols</span>
        </button>

        <button
          onClick={() => setSubTab('audit')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'audit'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>6. Investor Compliance Audit ({totalAuditScore}/100)</span>
        </button>
      </div>

      {/* SUB-TAB 1: FRANCHISE ECONOMICS & ROI (INVESTOR DECK) */}
      {subTab === 'economics' && (
        <div className="space-y-6">
          {/* Key Investment Value Propositions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-amber-800 font-extrabold text-xs">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <span>1. High Client Lifetime Value (LTV)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unlike one-time haircutting salons, non-surgical hair replacement clients return every <strong>3 to 4 weeks</strong> for re-bonding, maintenance, and solvent cleaning, generating predictable recurring subscription-like revenue.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-xs">
                <PieChart className="h-4 w-4 text-emerald-600" />
                <span>2. High Margin Product Mix</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Custom HD lace wigs yield <strong>65% – 70% gross margins</strong>, while monthly maintenance services yield <strong>85%+ gross margins</strong>. Consumables (Ghost Bond, C-22 solvent) provide ongoing retail cash flow.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-blue-800 font-extrabold text-xs">
                <Scale className="h-4 w-4 text-blue-600" />
                <span>3. Proven FOFO &amp; FOCO Models</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Investor can choose between <strong>FOFO</strong> (Franchise Owned, Franchise Operated — maximum profit retention) or <strong>FOCO</strong> (Franchise Owned, Company Operated — 100% hands-off managed by Head Office).
              </p>
            </div>
          </div>

          {/* Capital Expenditure (Capex) Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Franchise Unit Setup Cost (Capex Blueprint: ₹ 22.0 – ₹ 25.0 Lakhs)
                </h3>
                <p className="text-xs text-slate-500">
                  Estimated initial investment for a standard 700 - 900 sq.ft Gentle Hair Wigs Studio (e.g. Pune / Kolhapur)
                </p>
              </div>
              <span className="text-xs font-black font-mono text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Total Capex: ~₹ 23,70,000
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Investment Head</th>
                    <th className="py-2.5 px-3">Description &amp; Specifications</th>
                    <th className="py-2.5 px-3 font-mono text-right">Estimated Cost (₹)</th>
                    <th className="py-2.5 px-3 text-right">% of Capex</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">1. Studio Interior &amp; Acoustic Suites</td>
                    <td className="py-3 px-3 text-slate-600">
                      2 Private VIP acoustic consultation suites, luxury vinyl flooring, false ceiling &amp; high-CRI lighting
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-right">₹ 8,00,000</td>
                    <td className="py-3 px-3 text-slate-500 text-right">33.7%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">2. Salon Equipment &amp; Furniture</td>
                    <td className="py-3 px-3 text-slate-600">
                      4 Hydraulic styling chairs, ceramic shampoo wash station, LED touch mirrors &amp; mannequin stands
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-right">₹ 3,50,000</td>
                    <td className="py-3 px-3 text-slate-500 text-right">14.8%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">3. Initial Opening Inventory Stock</td>
                    <td className="py-3 px-3 text-slate-600">
                      Assortment of Virgin human hair wigs, mono toupees, thin skin patches, tapes &amp; C-22 solvents
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-right">₹ 5,00,000</td>
                    <td className="py-3 px-3 text-slate-500 text-right">21.1%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">4. Branding, Neon Signage &amp; Facade</td>
                    <td className="py-3 px-3 text-slate-600">
                      Outdoor acrylic 3D glow signboard, reception gold neon insignia &amp; marketing collaterals
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-right">₹ 1,50,000</td>
                    <td className="py-3 px-3 text-slate-500 text-right">6.3%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">5. IT, CCTV DVR, Wi-Fi &amp; POS Systems</td>
                    <td className="py-3 px-3 text-slate-600">
                      4-Cam HD CCTV with cloud recording &amp; mobile access, billing terminal, receipt printer &amp; router
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-right">₹ 1,20,000</td>
                    <td className="py-3 px-3 text-slate-500 text-right">5.1%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">6. Franchise Fee &amp; Academy Training</td>
                    <td className="py-3 px-3 text-slate-600">
                      Brand licensing, territory exclusivity, 14-day master stylist certification &amp; launch support
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-right">₹ 3,00,000</td>
                    <td className="py-3 px-3 text-slate-500 text-right">12.7%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">7. Working Capital &amp; Rent Deposit Reserve</td>
                    <td className="py-3 px-3 text-slate-600">
                      Buffer reserve for initial month operating utilities, local promotion &amp; staffing
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-right">₹ 1,50,000</td>
                    <td className="py-3 px-3 text-slate-500 text-right">6.3%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Operational Economics & Revenue Projections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly Opex Structure */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-rose-600" />
                <span>Monthly Opex Structure (~₹ 1.15 Lakhs)</span>
              </h4>
              <ul className="text-xs space-y-2 text-slate-700">
                <li className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold">Studio Commercial Rent (Prime Location)</span>
                  <span className="font-mono font-bold">₹ 35,000 – ₹ 40,000</span>
                </li>
                <li className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold">Staff Salaries (1 Senior Stylist, 1 Tech, 1 Desk)</span>
                  <span className="font-mono font-bold">₹ 45,000 – ₹ 55,000</span>
                </li>
                <li className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold">Electricity, Fiber Wi-Fi &amp; Utilities</span>
                  <span className="font-mono font-bold">₹ 6,500 – ₹ 8,000</span>
                </li>
                <li className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold">Local Hyperlocal Digital Ads &amp; Marketing</span>
                  <span className="font-mono font-bold">₹ 5,000 – ₹ 10,000</span>
                </li>
                <li className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold">Head Office Franchise Royalty</span>
                  <span className="font-mono font-bold text-amber-800">6% of Monthly Sales</span>
                </li>
              </ul>
            </div>

            {/* Projected Revenue & Profit Breakeven */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span>Projected Revenue &amp; Payback Milestones</span>
              </h4>
              <ul className="text-xs space-y-2 text-slate-700">
                <li className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">Months 1 – 3 (Ramp-up Phase)</span>
                    <span className="font-mono font-bold text-slate-700">Sales: ₹ 80,000 / mo</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Local awareness building, initial consultations, and introductory patch trials.
                  </p>
                </li>
                <li className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-emerald-900">Months 4 – 6 (Store Breakeven Achieved)</span>
                    <span className="font-mono font-bold text-emerald-700">Sales: ₹ 1,40,000 / mo</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Cash flow positive. First batch of custom wig clients return for 4-week re-bonding.
                  </p>
                </li>
                <li className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-amber-900">Months 7+ (Matured Studio: 35%+ Net ROI)</span>
                    <span className="font-mono font-bold text-amber-800">Sales: ₹ 2,20,000+ / mo</span>
                  </div>
                  <p className="text-[11px] text-amber-900">
                    Average monthly net profit ₹ 70,000 – ₹ 95,000 after all rent, salaries, and stock costs.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STUDIO ARCHITECTURE & FIT-OUT STANDARDS */}
      {subTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Studio Fit-out &amp; Architectural Specifications (Investor Standard)
              </h3>
              <p className="text-xs text-slate-500">
                To protect client privacy and ensure premium luxury perception, every Gentle Hair Wigs franchise must comply with these architectural guidelines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Specification 1: Private Suites */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 space-y-2">
                <span className="font-black text-amber-950 uppercase tracking-wider block text-[11px]">
                  1. Private VIP Consultation &amp; Fitting Suites (Mandatory)
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Hair loss is an intensely personal and sensitive issue. <strong>No client must ever be treated in open salon areas.</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Minimum 2 private suites (80 - 100 sq.ft each) with acoustic insulated partition walls.</li>
                  <li>Opaque door or heavy sound-dampening acoustic curtain for complete visual privacy.</li>
                  <li>Dedicated hydraulic reclining styling chair and full-length mirror inside each suite.</li>
                </ul>
              </div>

              {/* Specification 2: Lighting & Mirror Specs */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="font-black text-slate-900 uppercase tracking-wider block text-[11px]">
                  2. High-CRI Lighting for True Color Matching
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Color mismatch between client hair and hairpiece ruins customer satisfaction.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>Color Rendering Index (CRI):</strong> 95+ warm/neutral daylight LEDs (4000K).</li>
                  <li>Shadow-free backlit mirrors around styling perimeter.</li>
                  <li>No harsh fluorescent or yellow incandescent bulbs that distort human hair shades.</li>
                </ul>
              </div>

              {/* Specification 3: Washing & Spa Zone */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="font-black text-slate-900 uppercase tracking-wider block text-[11px]">
                  3. Dedicated Scalp Washing &amp; Wig Spa Basin
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Deep cleansing of biological scalp before adhesive bonding and delicate wig hair spa treatments.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Ceramic deep basin with hot &amp; cold water mixer tap.</li>
                  <li>In-line sediment water filter (prevents mineral buildup on delicate Swiss lace).</li>
                  <li>Ergonomic cushioned neck support for client comfort during 15-minute scalp massages.</li>
                </ul>
              </div>

              {/* Specification 4: Security & Chemical Storage */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 space-y-2">
                <span className="font-black text-rose-950 uppercase tracking-wider block text-[11px]">
                  4. CCTV Surveillance &amp; Chemical Fire Safety
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Ensuring store security, inventory loss prevention, and safe handling of adhesive solvents.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>CCTV Policy:</strong> 4 HD cameras covering Reception, Product Inventory Rack, Billing Desk, and Entry. (Strictly prohibited inside private fitting suites).</li>
                  <li>24/7 Mobile Live View credentials shared with Franchise Owner &amp; Head Office.</li>
                  <li>Fire-rated ventilated metal lockbox for C-22 solvent and Ultra-Hold chemical adhesives.</li>
                </ul>
              </div>
            </div>

            {/* Asset Inventory in this Studio */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Physical Assets Deployed in {branch.toUpperCase()} Studio
                  </h4>
                  <p className="text-[11px] text-slate-500">Total Asset Valuation: ₹ {totalAssetsValue.toLocaleString('en-IN')}</p>
                </div>
                <button
                  onClick={() => setShowAssetModal(true)}
                  className="inline-flex items-center space-x-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>+ Register Studio Asset</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Asset ID</th>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 font-mono">Purchase Cost</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {data.assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{asset.id}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{asset.name}</td>
                        <td className="py-2.5 px-3 text-slate-500">{asset.category}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{asset.quantity}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-900">₹ {asset.purchaseCost.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-slate-600">{asset.location}</td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => handleToggleAssetCondition(asset.id, asset.condition)}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-200 cursor-pointer"
                          >
                            <Wrench className="h-2.5 w-2.5" />
                            <span>{asset.condition}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DAILY STORE OPERATIONS & CHECKLISTS */}
      {subTab === 'operations' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Daily Franchise Operations &amp; Store Management SOP (10:00 AM – 09:00 PM)
                </h3>
                <p className="text-xs text-slate-500">
                  Mandatory store opening, client appointment scheduling, chemical safety &amp; cash closing audits.
                </p>
              </div>

              <button
                onClick={() => setShowTaskModal(true)}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add Operational Task</span>
              </button>
            </div>

            {/* Checklist Progress */}
            <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>

            {/* Daily Tasks Groups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Opening Checklist', 'Midday Operations', 'Client Follow-up', 'Closing Checklist'].map((cat) => {
                const tasksInCat = data.dailyTasks.filter((t) => t.category === cat);
                return (
                  <div key={cat} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span>{cat}</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        {tasksInCat.filter((t) => t.completed).length} / {tasksInCat.length} Done
                      </span>
                    </div>

                    <div className="space-y-2">
                      {tasksInCat.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => handleToggleTask(t.id)}
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition cursor-pointer ${
                            t.completed
                              ? 'bg-emerald-50/70 border-emerald-200 text-slate-700'
                              : 'bg-white border-slate-200 text-slate-900 hover:border-amber-300'
                          }`}
                        >
                          <button
                            type="button"
                            className="mt-0.5 shrink-0 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTask(t.id);
                            }}
                          >
                            {t.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-slate-300 hover:text-amber-500" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-xs block font-semibold leading-tight ${
                                t.completed ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}
                            >
                              {t.taskTitle}
                            </span>
                            <div className="mt-1 flex items-center space-x-2 text-[10px] text-slate-500">
                              <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded font-bold">
                                {t.timeSlot}
                              </span>
                              <span>·</span>
                              <span className="font-medium">Assigned: {t.assignedTo}</span>
                              {t.completed && t.completedAt && (
                                <>
                                  <span>·</span>
                                  <span className="text-emerald-700 font-bold">Done at {t.completedAt}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CENTRAL SUPPLY CHAIN & PROCUREMENT SOP */}
      {subTab === 'supply-chain' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Centralized Supply Chain &amp; Head Office Procurement Mandate
              </h3>
              <p className="text-xs text-slate-500">
                To guarantee zero counterfeit materials and uniform quality across all franchise studios, 100% of core raw materials must be procured centrally.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="font-black text-slate-900 uppercase tracking-wider block text-[11px]">
                  1. 100% Virgin Remy Human Hair
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Sourced from certified temple auctions in South India. Cuticles aligned in uniform direction to prevent tangling and matting.
                </p>
                <span className="inline-block bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px] font-bold text-slate-700">
                  Head Office Quality Seal (GHW-CERT)
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="font-black text-slate-900 uppercase tracking-wider block text-[11px]">
                  2. Swiss Lace &amp; Thin Skin Poly Bases
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Medical-grade ultra-breathable micro-mesh Swiss lace. Hand-knotted micro-knotting gives an undetectable, natural scalp hairline appearance.
                </p>
                <span className="inline-block bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px] font-bold text-slate-700">
                  Imported Base Materials
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="font-black text-slate-900 uppercase tracking-wider block text-[11px]">
                  3. Scalp Adhesives &amp; Citrus Solvents
                </span>
                <p className="text-slate-600 leading-relaxed">
                  FDA-compliant, non-toxic Ultra-Hold acrylic adhesive and C-22 fast-acting natural citrus solvent for painless residue removal.
                </p>
                <span className="inline-block bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px] font-bold text-slate-700">
                  Direct Importer Pricing
                </span>
              </div>
            </div>

            {/* Inventory Control Table */}
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                Stock Reorder Thresholds &amp; Minimum Holding Standards
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Swiss Lace Toupees</span>
                  <span className="font-extrabold text-slate-900 text-sm">Min 6 units in stock</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Adhesive C-22 Solvents</span>
                  <span className="font-extrabold text-slate-900 text-sm">Min 8 bottles in stock</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Contour Hair Tapes</span>
                  <span className="font-extrabold text-slate-900 text-sm">Min 12 rolls in stock</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Barbicide Disinfectant</span>
                  <span className="font-extrabold text-slate-900 text-sm">Min 2 liters in stock</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SERVICE QUALITY & PRIVACY PROTOCOLS */}
      {subTab === 'quality' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Client Privacy Code of Ethics &amp; Scalp Hygiene Standards
              </h3>
              <p className="text-xs text-slate-500">
                Standardized client consultation procedures to ensure highest client satisfaction and repeat business.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-2">
                <span className="font-extrabold text-blue-900 text-xs block">
                  1. Client Confidentiality Agreement
                </span>
                <p className="text-slate-700 leading-relaxed">
                  No photography, recording, or social media posting of clients without explicit written consent. All consultation records and head measurement scans are stored on isolated local studio database.
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
                <span className="font-extrabold text-amber-900 text-xs block">
                  2. 24-Hour Allergy Patch Test Rule
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Before applying full scalp bonding adhesive to a first-time client, a small drop of adhesive must be tested behind the ear or on forearm 24 hours prior to prevent skin dermatitis.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
                <span className="font-extrabold text-emerald-900 text-xs block">
                  3. Post-Service 3-Day Comfort Check Call
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Mandatory follow-up phone call to client exactly 3 days after custom wig fitting to ensure hairpiece comfort, adhesive hold, and offer maintenance tips.
                </p>
              </div>
            </div>

            {/* Client Calls Register */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Client Follow-up &amp; Retention Call Register
                </h4>
                <button
                  onClick={() => setShowCallModal(true)}
                  className="inline-flex items-center space-x-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>+ Log Follow-up Call</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Call ID</th>
                      <th className="py-2.5 px-3">Client Name</th>
                      <th className="py-2.5 px-3 font-mono">Phone</th>
                      <th className="py-2.5 px-3">Purpose</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3 font-mono text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {data.callLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{log.id}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{log.clientName?.trim() || "Don't know"}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{log.phone}</td>
                        <td className="py-2.5 px-3">{log.callType}</td>
                        <td className="py-2.5 px-3">
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-sm truncate">{log.notes}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-right">{log.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: INVESTOR AUDIT & COMPLIANCE SCORECARD */}
      {subTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Franchise Store Inspection &amp; Compliance Scorecard
                </h3>
                <p className="text-xs text-slate-500">
                  Monthly audit parameters evaluated by Head Office and Franchise Investors to ensure brand standards.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-600">Overall Store Score:</span>
                <span className="text-lg font-black font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  {totalAuditScore} / 100
                </span>
                <span className="text-xs font-bold text-white bg-emerald-600 px-2.5 py-1 rounded-lg">
                  Grade A
                </span>
              </div>
            </div>

            {/* Scorecard Parameters */}
            <div className="space-y-4">
              {/* Parameter 1 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="max-w-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-slate-900">1. Brand Identity &amp; Facade Aesthetics</span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      Weight: 25 Pts
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Neon signboard functional, clean facade, luxury gold/ivory color palette, acoustic curtains intact.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-600">Awarded:</span>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={auditScores.brandCompliance}
                    onChange={(e) =>
                      setAuditScores({ ...auditScores, brandCompliance: Number(e.target.value) })
                    }
                    className="w-16 rounded-lg border border-slate-300 p-1.5 text-center font-mono font-bold text-sm bg-white"
                  />
                  <span className="text-xs text-slate-400">/ 25</span>
                </div>
              </div>

              {/* Parameter 2 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="max-w-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-slate-900">2. Hygiene, Sterilization &amp; Suite Cleanliness</span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      Weight: 25 Pts
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Combs soaked in Barbicide jars, hair disposal protocols, UV box operational, fresh client towels.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-600">Awarded:</span>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={auditScores.hygieneSterilization}
                    onChange={(e) =>
                      setAuditScores({ ...auditScores, hygieneSterilization: Number(e.target.value) })
                    }
                    className="w-16 rounded-lg border border-slate-300 p-1.5 text-center font-mono font-bold text-sm bg-white"
                  />
                  <span className="text-xs text-slate-400">/ 25</span>
                </div>
              </div>

              {/* Parameter 3 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="max-w-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-slate-900">3. POS Billing &amp; 100% Tax Invoice Compliance</span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      Weight: 25 Pts
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    All client services billed with 18% GST in POS, zero cash leakage, isolated database reconciled daily.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-600">Awarded:</span>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={auditScores.posReconciliation}
                    onChange={(e) =>
                      setAuditScores({ ...auditScores, posReconciliation: Number(e.target.value) })
                    }
                    className="w-16 rounded-lg border border-slate-300 p-1.5 text-center font-mono font-bold text-sm bg-white"
                  />
                  <span className="text-xs text-slate-400">/ 25</span>
                </div>
              </div>

              {/* Parameter 4 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="max-w-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-slate-900">4. Staff Academy Certification &amp; Client NPS</span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      Weight: 25 Pts
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Stylists certified through Gentle Hair Wigs Academy, 3-day feedback calls executed, NPS &gt; 85%.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-600">Awarded:</span>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={auditScores.staffCertification}
                    onChange={(e) =>
                      setAuditScores({ ...auditScores, staffCertification: Number(e.target.value) })
                    }
                    className="w-16 rounded-lg border border-slate-300 p-1.5 text-center font-mono font-bold text-sm bg-white"
                  />
                  <span className="text-xs text-slate-400">/ 25</span>
                </div>
              </div>
            </div>

            {/* Audit Status Recommendation */}
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-xs text-emerald-950 flex items-center justify-between">
              <div>
                <span className="font-bold block text-sm">Franchise Operating License: Fully Compliant &amp; Active</span>
                <span className="text-emerald-800 text-[11px]">
                  Store satisfies all Head Office operational mandates, client confidentiality, and royalty terms.
                </span>
              </div>
              <span className="text-xs font-black uppercase tracking-wider bg-emerald-600 text-white px-3 py-1 rounded-lg">
                Verified Store
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD OPERATIONAL TASK */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Add Franchise Routine Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Audit C-22 solvent stock & lock cabinet"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="Opening Checklist">Opening Checklist</option>
                    <option value="Midday Operations">Midday Operations</option>
                    <option value="Client Follow-up">Client Follow-up</option>
                    <option value="Closing Checklist">Closing Checklist</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Time</label>
                  <input
                    type="text"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    placeholder="e.g. 11:30 AM"
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Staff Role</label>
                <input
                  type="text"
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  placeholder="e.g. Senior Stylist / Front Desk"
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER ASSET */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Register Studio Physical Asset</h3>
            <form onSubmit={handleCreateAsset} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="e.g. Hydraulic Reclining Styling Chair"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="Styling Equipment">Styling Equipment</option>
                    <option value="Wash & Spa">Wash &amp; Spa</option>
                    <option value="Fixtures & Mirrors">Fixtures &amp; Mirrors</option>
                    <option value="Display & Lighting">Display &amp; Lighting</option>
                    <option value="Electronics & Security">Electronics &amp; Security</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={assetQty}
                    onChange={(e) => setAssetQty(Number(e.target.value))}
                    min={1}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    value={assetCost}
                    onChange={(e) => setAssetCost(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location / Suite</label>
                  <input
                    type="text"
                    value={assetLocation}
                    onChange={(e) => setAssetLocation(e.target.value)}
                    placeholder="e.g. Suite 2 / Reception"
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Condition</label>
                <select
                  value={assetCondition}
                  onChange={(e) => setAssetCondition(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Needs Maintenance">Needs Maintenance</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LOG CLIENT CALL */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Log Client Follow-up Call</h3>
            <form onSubmit={handleCreateCallLog} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Name (Optional)</label>
                  <input
                    type="text"
                    value={callClient}
                    onChange={(e) => setCallClient(e.target.value)}
                    placeholder="e.g. Ramesh Kale (or leave blank for &quot;Don't know&quot;)"
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={callPhone}
                    onChange={(e) => setCallPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    required
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Call Purpose</label>
                  <select
                    value={callType}
                    onChange={(e) => setCallType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="Appointment Booking">Appointment Booking</option>
                    <option value="Post-Trial Feedback">Post-Trial Feedback</option>
                    <option value="Maintenance Reminder">Maintenance Reminder</option>
                    <option value="Inquiry">General Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Call Status</label>
                  <select
                    value={callStatus}
                    onChange={(e) => setCallStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Follow-up Needed">Follow-up Needed</option>
                    <option value="No Answer">No Answer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Call Notes / Feedback</label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Client confirmed scalp comfort. Wants hair oil consultation next week."
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCallModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Log Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
