'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Home,
  Key,
  Receipt,
  Building2,
  Plus,
  LogOut,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { BusinessDashboardProps } from '../types';
import { hsRealEstateConfig } from './config';
import { hsRealEstateDb } from './db';
import {
  PropertyUnitItem,
  TenantLeaseAgreementItem,
  RentReceiptItem,
  HsRealEstateData,
} from './types';

export default function HsRealEstateDashboard({
  role = 'Asset Portfolio Director',
}: BusinessDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'leases' | 'rent'>('overview');
  const [data, setData] = useState<HsRealEstateData>({
    properties: [],
    leases: [],
    receipts: [],
  });

  const refreshData = () => {
    setData({ ...hsRealEstateDb.getData() });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showLeaseModal, setShowLeaseModal] = useState(false);

  // Form states: Property
  const [propTitle, setPropTitle] = useState('');
  const [propType, setPropType] = useState<PropertyUnitItem['propertyType']>('Commercial IT Office');
  const [propArea, setPropArea] = useState('2400');
  const [propLocation, setPropLocation] = useState('Kalyani Nagar Prime Corridor');
  const [propRent, setPropRent] = useState('145000');

  // Form states: Lease
  const [leaseTenant, setLeaseTenant] = useState('');
  const [leasePhone, setLeasePhone] = useState('');
  const [leaseProp, setLeaseProp] = useState('');
  const [leaseRent, setLeaseRent] = useState('145000');
  const [leaseDeposit, setLeaseDeposit] = useState('870000');

  const monthlyRentRoll = data.leases.reduce((sum, l) => sum + (Number(l.monthlyRent) || 0), 0);
  const totalSquareFeet = data.properties.reduce((sum, p) => sum + (Number(p.carpetAreaSqFt) || 0), 0);
  const leasedUnitsCount = data.properties.filter((p) => p.occupancyStatus === 'Leased').length;

  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle.trim()) return;
    const newProp: PropertyUnitItem = {
      id: `PROP-${String(data.properties.length + 1).padStart(3, '0')}`,
      propertyCode: `HS-RE-${String(data.properties.length + 101)}`,
      title: propTitle.trim(),
      propertyType: propType,
      carpetAreaSqFt: Number(propArea) || 0,
      location: propLocation,
      monthlyRent: Number(propRent) || 0,
      occupancyStatus: 'Vacant Available',
    };
    hsRealEstateDb.addProperty(newProp);
    refreshData();
    setShowPropertyModal(false);
    setPropTitle('');
  };

  const handleCreateLease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaseTenant.trim()) return;
    const newLease: TenantLeaseAgreementItem = {
      id: `LSE-${String(data.leases.length + 1).padStart(3, '0')}`,
      leaseRef: `LSE/2026/${String(data.leases.length + 101)}`,
      tenantName: leaseTenant.trim(),
      propertyCode: leaseProp || (data.properties[0]?.propertyCode ?? 'HS-RE-101'),
      phone: leasePhone.trim() || '+91 99220 55667',
      leaseStart: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      leaseExpiry: 'Dec 2029',
      monthlyRent: Number(leaseRent) || 0,
      securityDeposit: Number(leaseDeposit) || 0,
      lockInPeriodMonths: 36,
      status: 'Active Lease',
    };
    hsRealEstateDb.addLease(newLease);
    refreshData();
    setShowLeaseModal(false);
    setLeaseTenant('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 font-sans selection:bg-rose-600 selection:text-white">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 lg:h-screen lg:sticky lg:top-0 z-30">
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
                <Home className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs font-black text-slate-900 truncate">HS Real Estate</h1>
                <p className="text-[10px] font-semibold text-rose-700 truncate">Leasing &amp; Assets</p>
              </div>
            </div>
          </div>

          <div className="p-3 space-y-4">
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Real Estate Portfolio
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'overview'
                      ? 'bg-rose-50 text-rose-900 border border-rose-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 text-rose-600" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab('properties')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'properties'
                      ? 'bg-rose-50 text-rose-900 border border-rose-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="h-4 w-4 text-rose-600" />
                  <span>Properties &amp; Units</span>
                  <span className="ml-auto rounded-full bg-rose-100 text-rose-800 px-1.5 text-[10px] font-mono font-bold">
                    {data.properties.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('leases')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'leases'
                      ? 'bg-rose-50 text-rose-900 border border-rose-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Key className="h-4 w-4 text-rose-600" />
                  <span>Lease Agreements</span>
                  <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                    {data.leases.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('rent')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'rent'
                      ? 'bg-rose-50 text-rose-900 border border-rose-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Receipt className="h-4 w-4 text-rose-600" />
                  <span>Rent Roll Receipts</span>
                  <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                    {data.receipts.length}
                  </span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5 mb-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-xs font-black text-white shrink-0 shadow-2xs">
              RE
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-900 truncate leading-tight">Asset Lead</span>
              <span className="block text-[10px] text-rose-700 font-semibold truncate leading-tight">{role}</span>
            </div>
          </div>
          <Link
            href="/signin/hs-real-estate"
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
            <span className="text-sm font-extrabold text-slate-900">HS Real Estate · Asset Leasing</span>
            <p className="text-[11px] text-slate-500 font-medium">Session: {role} · Isolated Business DB</p>
          </div>
          <button
            onClick={() => setShowPropertyModal(true)}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Property Asset</span>
          </button>
        </header>

        <div className="p-6 space-y-6 max-w-7xl">
          {/* PROPERTIES TABLE */}
          {(activeTab === 'overview' || activeTab === 'properties') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Commercial &amp; Residential Real Estate Portfolio</h3>
                  <p className="text-xs text-slate-500">Asset registry, carpet area, and occupancy status</p>
                </div>
                <button onClick={() => setShowPropertyModal(true)} className="text-xs font-bold text-rose-700 hover:text-rose-800">
                  + Add Property
                </button>
              </div>

              {data.properties.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Home className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No properties added yet</h4>
                  <p className="mt-1 text-[11px] text-slate-400">Add commercial offices, retail outlets, or luxury apartments.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Property Code</th>
                        <th className="py-2.5 px-3">Title &amp; Type</th>
                        <th className="py-2.5 px-3">Location</th>
                        <th className="py-2.5 px-3 font-mono">Area (Sq Ft)</th>
                        <th className="py-2.5 px-3 font-mono">Monthly Rent</th>
                        <th className="py-2.5 px-3">Occupancy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.properties.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-rose-700">{p.propertyCode}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{p.title}</span>
                            <span className="text-[10px] text-slate-400">{p.propertyType}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{p.location}</td>
                          <td className="py-3 px-3 font-mono font-bold">{p.carpetAreaSqFt.toLocaleString('en-IN')} sq ft</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹ {p.monthlyRent.toLocaleString('en-IN')} / mo
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold border inline-block ${
                                p.occupancyStatus === 'Leased'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {p.occupancyStatus}
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

      {/* Modal: Property */}
      {showPropertyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Add Property Asset</h3>
            <form onSubmit={handleCreateProperty} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Property Title *</label>
                <input
                  type="text"
                  value={propTitle}
                  onChange={(e) => setPropTitle(e.target.value)}
                  placeholder="e.g. Tower 3, 5th Floor IT Wing"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Property Type</label>
                  <select
                    value={propType}
                    onChange={(e) => setPropType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-rose-500 focus:outline-none font-semibold"
                  >
                    <option value="Commercial IT Office">Commercial IT Office</option>
                    <option value="Retail Showroom">Retail Showroom</option>
                    <option value="Residential Luxury 3BHK">Residential Luxury 3BHK</option>
                    <option value="Industrial Warehouse">Industrial Warehouse</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Carpet Area (Sq Ft)</label>
                  <input
                    type="number"
                    value={propArea}
                    onChange={(e) => setPropArea(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-rose-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={propLocation}
                    onChange={(e) => setPropLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Rent (₹)</label>
                  <input
                    type="number"
                    value={propRent}
                    onChange={(e) => setPropRent(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-rose-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPropertyModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

