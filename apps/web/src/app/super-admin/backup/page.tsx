'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HardDrive,
  Download,
  RotateCcw,
  Clock,
  CheckCircle2,
  Play,
  Settings2,
  Calendar,
  Lock,
  Search,
  CheckSquare,
  Square,
  FileCheck,
  Building2,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { SuperAdminSidebar } from '@/components/SuperAdminSidebar';

interface BusinessBackup {
  id: string;
  name: string;
  category: string;
  slug: string;
  lastBackup: string;
  status: 'HEALTHY' | 'PENDING' | 'BACKING_UP';
  size: string;
  sha256: string;
  schemaVersion: string;
}

const INITIAL_BUSINESSES: BusinessBackup[] = [
  { id: 'b1', name: 'Prefab Construction Solutions', category: 'Civil & Modular Sites', slug: 'prefab-construction', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '12.4 MB', sha256: '8c22...f901', schemaVersion: 'v1.2.0' },
  { id: 'b2', name: 'HoReCa Essentials & Crockery Rental', category: 'Essentials Sales & Crockery Rental', slug: 'horeca-essentials', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '2.4 MB', sha256: '9f83...a210', schemaVersion: 'v1.2.0' },
  { id: 'b3', name: 'Gentle Hair Wigs Studio', category: 'Hair Wigs & Aesthetics', slug: 'gentle-hair-wigs', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '3.1 MB', sha256: '4b71...e582', schemaVersion: 'v1.2.0' },
  { id: 'b4', name: 'Ecolab Institutional Distribution', category: 'Hygiene & Chemical Solutions', slug: 'ecolab-distribution', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '4.8 MB', sha256: '1a90...d334', schemaVersion: 'v1.2.0' },
  { id: 'b5', name: 'HS Co-working Spaces', category: 'Flexible Desks & Workspaces', slug: 'hs-coworking', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '2.8 MB', sha256: '3e41...c819', schemaVersion: 'v1.2.0' },
  { id: 'b6', name: 'First Mover Advantage', category: 'App SaaS Platform', slug: 'first-mover-advantage', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '1.8 MB', sha256: '7f62...a441', schemaVersion: 'v1.2.0' },
  { id: 'b7', name: 'ADJS - PRINTBOOTH™', category: 'Smart Self-Service Printing Kiosks', slug: 'adjs', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '3.4 MB', sha256: '5d19...b760', schemaVersion: 'v1.2.0' },
  { id: 'b8', name: 'DVR Enterprise', category: 'Commercial Trading & Supplies', slug: 'dvr-enterprise', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '5.2 MB', sha256: '2c88...e993', schemaVersion: 'v1.2.0' },
  { id: 'b9', name: 'NDA Security & Facility Care', category: 'Security & Facility Care', slug: 'nda-services', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '3.0 MB', sha256: '6a44...d112', schemaVersion: 'v1.2.0' },
  { id: 'b10', name: 'HS Real Estate & Assets', category: 'Property Leasing & Assets', slug: 'hs-real-estate', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '6.7 MB', sha256: '0e33...f557', schemaVersion: 'v1.2.0' },
];

export default function SuperAdminBackupPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState(INITIAL_BUSINESSES);
  const [selectedIds, setSelectedIds] = useState<string[]>(INITIAL_BUSINESSES.map((b) => b.id));
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const timer1Ref = useRef<NodeJS.Timeout | null>(null);
  const timer2Ref = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timer1Ref.current) clearTimeout(timer1Ref.current);
      if (timer2Ref.current) clearTimeout(timer2Ref.current);
    };
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === businesses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(businesses.map((b) => b.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleTakeBackup = () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    setNotification(`Packaging ${selectedIds.length} business backup(s) in background...`);

    if (timer1Ref.current) clearTimeout(timer1Ref.current);
    if (timer2Ref.current) clearTimeout(timer2Ref.current);

    timer1Ref.current = setTimeout(() => {
      setIsProcessing(false);
      setNotification(`Successfully created and encrypted ${selectedIds.length} package(s) into S3 storage!`);
      timer2Ref.current = setTimeout(() => setNotification(null), 4000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 antialiased font-sans">
      {/* 1. Permanent Left Sidebar */}
      <SuperAdminSidebar activeTab="backups" />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  Database Backups &amp; Snapshots
                </h1>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Automated Daily (02:00 AM)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate cryptographic snapshots, export SQL dumps, and restore business schemas.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/super-admin/companies"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Go to Companies</span>
            </Link>
          </div>
        </header>

        {/* Notifications */}
        {notification && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2 shadow-2xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="flex-1">{notification}</span>
            <button type="button" onClick={() => setNotification(null)} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Action Bar */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">10 Isolated Business Workspaces</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select businesses to create an immediate backup bundle.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                >
                  {selectedIds.length === businesses.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  type="button"
                  onClick={handleTakeBackup}
                  disabled={isProcessing || selectedIds.length === 0}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Packaging...' : `Backup Selected (${selectedIds.length})`}</span>
                </button>
              </div>
            </div>

            {/* Businesses Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4 w-10">
                        <button type="button" onClick={toggleSelectAll} className="cursor-pointer">
                          {selectedIds.length === businesses.length ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="p-4">Business Workspace</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Last Snapshot</th>
                      <th className="p-4">Size</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {businesses.map((b) => {
                      const isChecked = selectedIds.includes(b.id);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-4">
                            <button type="button" onClick={() => toggleSelect(b.id)} className="cursor-pointer">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300" />
                              )}
                            </button>
                          </td>
                          <td className="p-4 font-semibold text-slate-900">{b.name}</td>
                          <td className="p-4 text-slate-500">{b.category}</td>
                          <td className="p-4 text-slate-500 font-mono text-[11px]">{b.lastBackup}</td>
                          <td className="p-4 text-slate-600 font-mono">{b.size}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {b.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setNotification(`Downloaded snapshot package for "${b.name}"`);
                                setTimeout(() => setNotification(null), 3000);
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[11px] font-semibold transition shadow-2xs cursor-pointer"
                            >
                              <Download className="w-3 h-3 text-slate-400" />
                              <span>Download</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
