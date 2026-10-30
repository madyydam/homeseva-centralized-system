'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Smartphone,
  Key,
  Cpu,
  Receipt,
  Plus,
  LogOut,
  Sparkles,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { BusinessDashboardProps } from '../types';
import { firstMoverAdvantageConfig } from './config';
import { firstMoverAdvantageDb } from './db';
import {
  SaasTenantItem,
  ApiKeyItem,
  AppBuildJobItem,
  FirstMoverAdvantageData,
} from './types';

export default function FirstMoverAdvantageDashboard({
  role = 'SaaS Product Architect',
}: BusinessDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'apikeys' | 'builds'>('overview');
  const [data, setData] = useState<FirstMoverAdvantageData>({
    tenants: [],
    apiKeys: [],
    builds: [],
  });

  const refreshData = () => {
    setData({ ...firstMoverAdvantageDb.getData() });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Form states: Tenant
  const [appName, setAppName] = useState('');
  const [devOrg, setDevOrg] = useState('');
  const [tier, setTier] = useState<SaasTenantItem['tier']>('Pro Growth ($299/mo)');
  const [billing, setBilling] = useState('24500');

  // Form states: Key
  const [keyLabel, setKeyLabel] = useState('');
  const [keyTenant, setKeyTenant] = useState('');

  const totalSaaSMrr = data.tenants.reduce((sum, t) => sum + (Number(t.monthlyBilling) || 0), 0);
  const totalApiHitsToday = data.tenants.reduce((sum, t) => sum + (Number(t.apiRequestsToday) || 0), 0);

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) return;
    const newTenant: SaasTenantItem = {
      id: `TNT-${String(data.tenants.length + 1).padStart(3, '0')}`,
      tenantCode: `FMA-APP-${String(data.tenants.length + 101)}`,
      appName: appName.trim(),
      developerOrg: devOrg.trim() || 'Core Labs Ltd',
      tier,
      monthlyBilling: Number(billing) || 0,
      apiRequestsToday: 0,
      status: 'Healthy',
      createdDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    firstMoverAdvantageDb.addTenant(newTenant);
    refreshData();
    setShowTenantModal(false);
    setAppName('');
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyLabel.trim()) return;
    const newKey: ApiKeyItem = {
      id: `KEY-${String(data.apiKeys.length + 1).padStart(3, '0')}`,
      keyLabel: keyLabel.trim(),
      tenantName: keyTenant || (data.tenants[0]?.appName ?? 'Core API Tenant'),
      keyPrefix: `fma_live_${Math.random().toString(36).substring(2, 10)}`,
      rateLimitPerMin: 1200,
      lastUsed: 'Just now',
      status: 'Active',
    };
    firstMoverAdvantageDb.addApiKey(newKey);
    refreshData();
    setShowKeyModal(false);
    setKeyLabel('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 font-sans selection:bg-cyan-600 selection:text-white">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 lg:h-screen lg:sticky lg:top-0 z-30">
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-sm">
                <Smartphone className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs font-black text-slate-900 truncate">First Mover Advantage</h1>
                <p className="text-[10px] font-semibold text-cyan-700 truncate">App SaaS Platform</p>
              </div>
            </div>
          </div>

          <div className="p-3 space-y-4">
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                SaaS Cloud
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'overview'
                      ? 'bg-cyan-50 text-cyan-900 border border-cyan-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 text-cyan-600" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab('tenants')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'tenants'
                      ? 'bg-cyan-50 text-cyan-900 border border-cyan-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="h-4 w-4 text-cyan-600" />
                  <span>SaaS App Tenants</span>
                  <span className="ml-auto rounded-full bg-cyan-100 text-cyan-800 px-1.5 text-[10px] font-mono font-bold">
                    {data.tenants.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('apikeys')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'apikeys'
                      ? 'bg-cyan-50 text-cyan-900 border border-cyan-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Key className="h-4 w-4 text-cyan-600" />
                  <span>API Key Vault</span>
                  <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                    {data.apiKeys.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('builds')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'builds'
                      ? 'bg-cyan-50 text-cyan-900 border border-cyan-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Cpu className="h-4 w-4 text-cyan-600" />
                  <span>CI/CD App Builds</span>
                  <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                    {data.builds.length}
                  </span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5 mb-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-xs font-black text-white shrink-0 shadow-2xs">
              FA
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-900 truncate leading-tight">Platform Lead</span>
              <span className="block text-[10px] text-cyan-700 font-semibold truncate leading-tight">{role}</span>
            </div>
          </div>
          <Link
            href="/signin/first-mover-advantage"
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
            <span className="text-sm font-extrabold text-slate-900">First Mover Advantage · App SaaS</span>
            <p className="text-[11px] text-slate-500 font-medium">Session: {role} · Isolated Business DB</p>
          </div>
          <button
            onClick={() => setShowTenantModal(true)}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create App Tenant</span>
          </button>
        </header>

        <div className="p-6 space-y-6 max-w-7xl">
          {/* TENANTS TABLE */}
          {(activeTab === 'overview' || activeTab === 'tenants') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">SaaS App Tenants &amp; Subscription Tiers</h3>
                  <p className="text-xs text-slate-500">Live mobile &amp; web apps running on the cloud platform</p>
                </div>
                <button onClick={() => setShowTenantModal(true)} className="text-xs font-bold text-cyan-700 hover:text-cyan-800">
                  + Add Tenant
                </button>
              </div>

              {data.tenants.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Smartphone className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No SaaS app tenants registered</h4>
                  <p className="mt-1 text-[11px] text-slate-400">Deploy your first app tenant with custom API quota.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Tenant Code</th>
                        <th className="py-2.5 px-3">App Name &amp; Developer</th>
                        <th className="py-2.5 px-3">Subscription Tier</th>
                        <th className="py-2.5 px-3 font-mono">Monthly Rate</th>
                        <th className="py-2.5 px-3">Gateway Health</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.tenants.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-cyan-700">{t.tenantCode}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{t.appName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{t.developerOrg}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-700">{t.tier}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹ {t.monthlyBilling.toLocaleString('en-IN')} / mo
                          </td>
                          <td className="py-3 px-3">
                            <span className="rounded bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                              {t.status}
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

      {/* Modal: Tenant */}
      {showTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Create SaaS App Tenant</h3>
            <form onSubmit={handleCreateTenant} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">App Name *</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. QuickFin Mobile App"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Developer / Client Org</label>
                <input
                  type="text"
                  value={devOrg}
                  onChange={(e) => setDevOrg(e.target.value)}
                  placeholder="e.g. Vertex Technologies"
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-cyan-500 focus:outline-none font-semibold"
                  >
                    <option value="Pro Growth ($299/mo)">Pro Growth ($299/mo)</option>
                    <option value="Enterprise Dedicated ($1,499/mo)">Enterprise Dedicated ($1,499/mo)</option>
                    <option value="Developer Free">Developer Free</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Billing (₹)</label>
                  <input
                    type="number"
                    value={billing}
                    onChange={(e) => setBilling(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTenantModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 hover:bg-cyan-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Create Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

