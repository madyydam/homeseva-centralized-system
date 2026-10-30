'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShieldCheck,
  Boxes,
  Users,
  Receipt,
  Plus,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { BusinessDashboardProps } from '../types';
import { ecolabDistributionConfig } from './config';
import { ecolabDistributionDb } from './db';
import {
  ChemicalProductItem,
  InstitutionalAccountItem,
  DispatchOrderItem,
  EcolabDistributionData,
} from './types';

export default function EcolabDistributionDashboard({
  role = 'Territory Sales Manager',
}: BusinessDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'chemicals' | 'dispatches'>('overview');
  const [data, setData] = useState<EcolabDistributionData>({
    chemicals: [],
    accounts: [],
    dispatches: [],
  });

  const refreshData = () => {
    setData({ ...ecolabDistributionDb.getData() });
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Modals state
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showChemicalModal, setShowChemicalModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  // Form states: Account
  const [accName, setAccName] = useState('');
  const [accSegment, setAccSegment] = useState<InstitutionalAccountItem['segment']>('Hospital & Healthcare');
  const [accContact, setAccContact] = useState('');
  const [accMonthly, setAccMonthly] = useState('85000');
  const [accDispenser, setAccDispenser] = useState('Ecolab Apex Dishwashing Chemical Station');

  // Form states: Chemical
  const [chemName, setChemName] = useState('');
  const [chemCode, setChemCode] = useState('');
  const [chemCat, setChemCat] = useState<ChemicalProductItem['category']>('Kitchen Warewashing');
  const [chemBarrels, setChemBarrels] = useState('15');
  const [chemRate, setChemRate] = useState('12500');

  // Form states: Dispatch
  const [dispClient, setDispClient] = useState('');
  const [dispSummary, setDispSummary] = useState('Solid Power XL Warewash Chemical (4x4kg) + Rinse Max (20L)');
  const [dispTotal, setDispTotal] = useState('65000');
  const [dispBarrels, setDispBarrels] = useState('8');

  const totalContractRevenue = data.accounts.reduce((sum, a) => sum + (Number(a.monthlySupplyValue) || 0), 0);
  const totalStockBarrels = data.chemicals.reduce((sum, c) => sum + (Number(c.stockBarrels) || 0), 0);
  const totalDispatchesValue = data.dispatches.reduce((sum, d) => sum + (Number(d.totalInvoice) || 0), 0);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;
    const newAcc: InstitutionalAccountItem = {
      id: `ACC-${String(data.accounts.length + 1).padStart(3, '0')}`,
      accountName: accName.trim(),
      segment: accSegment,
      contactPerson: accContact.trim() || 'Facility Manager',
      phone: '+91 98900 11223',
      monthlySupplyValue: Number(accMonthly) || 0,
      dispenserInstalled: accDispenser,
      contractStatus: 'Active Contract',
    };
    ecolabDistributionDb.addAccount(newAcc);
    refreshData();
    setShowAccountModal(false);
    setAccName('');
  };

  const handleCreateChemical = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chemName.trim()) return;
    const newChem: ChemicalProductItem = {
      id: `CHM-${String(data.chemicals.length + 1).padStart(3, '0')}`,
      productCode: chemCode || `ECO-${Date.now().toString().slice(-4)}`,
      name: chemName.trim(),
      category: chemCat,
      stockBarrels: Number(chemBarrels) || 0,
      reorderLevel: 5,
      ratePerDrum: Number(chemRate) || 0,
      msdsCompliance: true,
    };
    ecolabDistributionDb.addChemical(newChem);
    refreshData();
    setShowChemicalModal(false);
    setChemName('');
  };

  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispClient.trim()) return;
    const newDisp: DispatchOrderItem = {
      id: `DSP-${String(data.dispatches.length + 1).padStart(3, '0')}`,
      dispatchId: `ECO/DSP/2026/${String(data.dispatches.length + 101)}`,
      clientName: dispClient.trim(),
      chemicalSummary: dispSummary.trim(),
      barrelsCount: Number(dispBarrels) || 0,
      totalInvoice: Number(dispTotal) || 0,
      paymentTerms: 'Net 30 Days',
      dispatchDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    ecolabDistributionDb.addDispatch(newDisp);
    refreshData();
    setShowDispatchModal(false);
    setDispClient('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 md:h-screen md:sticky md:top-0 z-30">
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden border border-blue-200 bg-[#005eb8] p-1 shadow-2xs" style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px' }}>
                <img src="/logos/ecolab-logo.jpg" alt="Ecolab" width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'contain' }} className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs font-black text-slate-900 truncate">Ecolab Distribution</h1>
                <p className="text-[10px] font-semibold text-blue-700 truncate">Institutional Division</p>
              </div>
            </div>
          </div>

          <div className="p-3 space-y-4">
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Hygiene Solutions
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
                  onClick={() => setActiveTab('accounts')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'accounts'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>Institutional Accounts</span>
                  <span className="ml-auto rounded-full bg-blue-100 text-blue-800 px-1.5 text-[10px] font-mono font-bold">
                    {data.accounts.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('chemicals')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'chemicals'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Boxes className="h-4 w-4 text-blue-600" />
                  <span>Chemical Inventory</span>
                  <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                    {data.chemicals.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('dispatches')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'dispatches'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <span>Dispatches &amp; Invoices</span>
                  <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                    {data.dispatches.length}
                  </span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5 mb-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white shrink-0 shadow-2xs">
              EL
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-900 truncate leading-tight">Territory Lead</span>
              <span className="block text-[10px] text-blue-700 font-semibold truncate leading-tight">{role}</span>
            </div>
          </div>
          <Link
            href="/signin/ecolab-distribution"
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
            <span className="text-sm font-extrabold text-slate-900">Ecolab Distribution · Hygiene Solutions</span>
            <p className="text-[11px] text-slate-500 font-medium">Session: {role} · Isolated Business DB</p>
          </div>
          <button
            onClick={() => setShowAccountModal(true)}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Institutional Account</span>
          </button>
        </header>

        <div className="p-6 space-y-6 max-w-7xl">
          {/* ACCOUNTS TABLE */}
          {(activeTab === 'overview' || activeTab === 'accounts') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Institutional Key Accounts Roster</h3>
                  <p className="text-xs text-slate-500">Hospitals, star hotels, and commercial laundries</p>
                </div>
                <button onClick={() => setShowAccountModal(true)} className="text-xs font-bold text-blue-700 hover:text-blue-800">
                  + Add Account
                </button>
              </div>

              {data.accounts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Users className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No institutional accounts added</h4>
                  <p className="mt-1 text-[11px] text-slate-400">Add hospital or hotel chemical supply agreements.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Account ID</th>
                        <th className="py-2.5 px-3">Hospital / Client</th>
                        <th className="py-2.5 px-3">Industry Segment</th>
                        <th className="py-2.5 px-3">Installed Dispenser Station</th>
                        <th className="py-2.5 px-3 font-mono">Monthly Run-Rate</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.accounts.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">{a.id}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{a.accountName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Contact: {a.contactPerson}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{a.segment}</td>
                          <td className="py-3 px-3 text-slate-700 max-w-[200px] truncate">{a.dispenserInstalled}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹ {a.monthlySupplyValue.toLocaleString('en-IN')} / mo
                          </td>
                          <td className="py-3 px-3">
                            <span className="rounded bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                              {a.contractStatus}
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

      {/* Modal: Account */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Add Institutional Account</h3>
            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Organization Name *</label>
                <input
                  type="text"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="e.g. Ruby Hall Clinic Hospital"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Industry Segment</label>
                <select
                  value={accSegment}
                  onChange={(e) => setAccSegment(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none font-semibold"
                >
                  <option value="Hospital & Healthcare">Hospital &amp; Healthcare</option>
                  <option value="5-Star Hotel / Resort">5-Star Hotel / Resort</option>
                  <option value="Commercial Laundry">Commercial Laundry</option>
                  <option value="Food Processing Plant">Food Processing Plant</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={accContact}
                    onChange={(e) => setAccContact(e.target.value)}
                    placeholder="Chief Pharmacist / GM"
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Value (₹)</label>
                  <input
                    type="number"
                    value={accMonthly}
                    onChange={(e) => setAccMonthly(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ecolab Dispenser Station</label>
                <input
                  type="text"
                  value={accDispenser}
                  onChange={(e) => setAccDispenser(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

