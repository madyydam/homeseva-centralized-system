'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShieldCheck,
  Building,
  AlertTriangle,
  Users,
  Plus,
  LogOut,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { BusinessDashboardProps } from '../types';
import { ndaServicesConfig } from './config';
import { ndaServicesDb } from './db';
import {
  SecurityGuardItem,
  ClientFacilitySiteItem,
  SecurityIncidentLogItem,
  NdaServicesData,
} from './types';

export default function NdaServicesDashboard({
  role = 'Chief Security Officer (CSO)',
}: BusinessDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'guards' | 'sites' | 'incidents'>('overview');
  const [data, setData] = useState<NdaServicesData>({
    guards: [],
    clientSites: [],
    incidents: [],
  });

  const refreshData = () => {
    setData({ ...ndaServicesDb.getData() });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const [showGuardModal, setShowGuardModal] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);

  // Form states: Guard
  const [gName, setGName] = useState('');
  const [gRank, setGRank] = useState<SecurityGuardItem['rank']>('Security Guard');
  const [gSite, setGSite] = useState('Penta IT Park Phase 1');
  const [gShift, setGShift] = useState<SecurityGuardItem['shift']>('Day Shift (08:00 - 20:00)');

  // Form states: Site
  const [siteName, setSiteName] = useState('');
  const [siteType, setSiteType] = useState<ClientFacilitySiteItem['facilityType']>('Corporate IT Park');
  const [siteGuards, setSiteGuards] = useState('8');
  const [siteMonthly, setSiteMonthly] = useState('160000');

  const totalMonthlyBilling = data.clientSites.reduce((sum, s) => sum + (Number(s.monthlyServiceFee) || 0), 0);
  const totalGuardsOnDuty = data.guards.filter((g) => g.status === 'On Duty').length;

  const handleCreateGuard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName.trim()) return;
    const newGuard: SecurityGuardItem = {
      id: `GRD-${String(data.guards.length + 1).padStart(3, '0')}`,
      badgeNumber: `NDA-SEC-${String(data.guards.length + 101)}`,
      guardName: gName.trim(),
      rank: gRank,
      assignedSite: gSite,
      shift: gShift,
      psaraVerified: true,
      status: 'On Duty',
    };
    ndaServicesDb.addGuard(newGuard);
    refreshData();
    setShowGuardModal(false);
    setGName('');
  };

  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) return;
    const newSite: ClientFacilitySiteItem = {
      id: `CLI-${String(data.clientSites.length + 1).padStart(3, '0')}`,
      clientName: siteName.trim(),
      facilityType: siteType,
      guardsDeployedCount: Number(siteGuards) || 4,
      monthlyServiceFee: Number(siteMonthly) || 0,
      contractStatus: 'Active Deployment',
    };
    ndaServicesDb.addClientSite(newSite);
    refreshData();
    setShowSiteModal(false);
    setSiteName('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 font-sans selection:bg-sky-600 selection:text-white">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 lg:h-screen lg:sticky lg:top-0 z-30">
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs font-black text-slate-900 truncate">NDA Services</h1>
                <p className="text-[10px] font-semibold text-sky-700 truncate">Security &amp; Facility Care</p>
              </div>
            </div>
          </div>

          <div className="p-3 space-y-4">
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Security Roster
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'overview'
                      ? 'bg-sky-50 text-sky-900 border border-sky-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 text-sky-600" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab('guards')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'guards'
                      ? 'bg-sky-50 text-sky-900 border border-sky-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Users className="h-4 w-4 text-sky-600" />
                  <span>Guards Deployment</span>
                  <span className="ml-auto rounded-full bg-sky-100 text-sky-800 px-1.5 text-[10px] font-mono font-bold">
                    {data.guards.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('sites')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'sites'
                      ? 'bg-sky-50 text-sky-900 border border-sky-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Building className="h-4 w-4 text-sky-600" />
                  <span>Client Facility Sites</span>
                  <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                    {data.clientSites.length}
                  </span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5 mb-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-xs font-black text-white shrink-0 shadow-2xs">
              NS
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-900 truncate leading-tight">Security Officer</span>
              <span className="block text-[10px] text-sky-700 font-semibold truncate leading-tight">{role}</span>
            </div>
          </div>
          <Link
            href="/signin/nda-services"
            className="w-full flex items-center justify-center space-x-1.5 rounded-lg border border-slate-200 bg-white py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
          >
            <LogOut className="h-3 w-3" />
            <span>Switch Business / Exit</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div>
            <span className="text-sm font-extrabold text-slate-900">NDA Services · Security &amp; Facility Care</span>
            <p className="text-[11px] text-slate-500 font-medium">Session: {role} · Isolated Business DB</p>
          </div>
          <button
            onClick={() => setShowGuardModal(true)}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Deploy Guard</span>
          </button>
        </header>

        <div className="p-6 space-y-6 max-w-7xl">
          {/* GUARDS TABLE */}
          {(activeTab === 'overview' || activeTab === 'guards') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Guards Muster Roll &amp; Beat Deployment</h3>
                  <p className="text-xs text-slate-500">Live shift assignment and post locations</p>
                </div>
                <button onClick={() => setShowGuardModal(true)} className="text-xs font-bold text-sky-700 hover:text-sky-800">
                  + Add Guard
                </button>
              </div>

              {data.guards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <ShieldCheck className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No security guards deployed</h4>
                  <p className="mt-1 text-[11px] text-slate-400">Deploy guards to client sites.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Badge #</th>
                        <th className="py-2.5 px-3">Guard Name</th>
                        <th className="py-2.5 px-3">Rank / Designation</th>
                        <th className="py-2.5 px-3">Assigned Site</th>
                        <th className="py-2.5 px-3">Shift Timing</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.guards.map((g) => (
                        <tr key={g.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-sky-700">{g.badgeNumber}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{g.guardName}</td>
                          <td className="py-3 px-3 text-slate-700">{g.rank}</td>
                          <td className="py-3 px-3 text-slate-600">{g.assignedSite}</td>
                          <td className="py-3 px-3 text-slate-600">{g.shift}</td>
                          <td className="py-3 px-3">
                            <span className="rounded bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                              {g.status}
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
        </div>
      </main>

      {/* Modal: Guard */}
      {showGuardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Deploy Security Personnel</h3>
            <form onSubmit={handleCreateGuard} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Guard Full Name *</label>
                <input
                  type="text"
                  value={gName}
                  onChange={(e) => setGName(e.target.value)}
                  placeholder="e.g. Subedar Santosh Patil"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rank</label>
                  <select
                    value={gRank}
                    onChange={(e) => setGRank(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-sky-500 focus:outline-none font-semibold"
                  >
                    <option value="Security Guard">Security Guard</option>
                    <option value="Head Guard">Head Guard</option>
                    <option value="Armed Gunman">Armed Gunman</option>
                    <option value="Facility Marshal">Facility Marshal</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift</label>
                  <select
                    value={gShift}
                    onChange={(e) => setGShift(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-sky-500 focus:outline-none font-semibold"
                  >
                    <option value="Day Shift (08:00 - 20:00)">Day Shift</option>
                    <option value="Night Shift (20:00 - 08:00)">Night Shift</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Client Site</label>
                <input
                  type="text"
                  value={gSite}
                  onChange={(e) => setGSite(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGuardModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Deploy Personnel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

