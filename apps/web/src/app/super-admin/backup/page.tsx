'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HardDrive,
  Download,
  CheckCircle2,
  Play,
  Building2,
  RefreshCw,
  X,
  CheckSquare,
  Square,
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
  recordsCount?: number;
}

export default function SuperAdminBackupPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessBackup[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchBackupStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/backup');
      const data = await res.json();
      if (data.success && Array.isArray(data.stats)) {
        setBusinesses(data.stats);
        setSelectedIds(data.stats.map((b: BusinessBackup) => b.id));
      }
    } catch (err) {
      console.error('Failed to load backup stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupStats();
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

  const handleTakeBackup = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    setNotification(`Packaging ${selectedIds.length} live database backup(s)...`);

    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessIds: selectedIds }),
      });
      const data = await res.json();

      if (data.success) {
        setNotification(`Successfully created & verified ${data.packages?.length || selectedIds.length} backup packages!`);
      } else {
        setNotification(`Backup warning: ${data.error || 'Check server logs'}`);
      }
    } catch (err: any) {
      setNotification(`Failed to complete backup: ${err.message || 'Network error'}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setNotification(null), 5000);
      fetchBackupStats();
    }
  };

  const handleDownload = (slug: string, name: string) => {
    const downloadUrl = `/api/admin/backup?download=${encodeURIComponent(slug)}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `homeseva_backup_${slug}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setNotification(`Initiated download for "${name}" snapshot.`);
    setTimeout(() => setNotification(null), 4000);
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
                Generate cryptographic snapshots, export SQL/JSON dumps, and preserve business data.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={fetchBackupStats}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>
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
                <h2 className="text-sm font-bold text-slate-900">
                  {businesses.length} Isolated Business Workspaces
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select businesses to create an immediate encrypted backup archive.
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
                          {selectedIds.length > 0 && selectedIds.length === businesses.length ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="p-4">Business Workspace</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Live Records</th>
                      <th className="p-4">Estimated Size</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                          <span>Connecting to PostgreSQL and fetching business stats...</span>
                        </td>
                      </tr>
                    ) : businesses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          <span>No businesses registered yet.</span>
                        </td>
                      </tr>
                    ) : (
                      businesses.map((b) => {
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
                            <td className="p-4 font-mono text-[11px] text-slate-600">
                              {b.recordsCount ?? 0} rows
                            </td>
                            <td className="p-4 text-slate-600 font-mono">{b.size}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {b.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleDownload(b.slug, b.name)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[11px] font-semibold transition shadow-2xs cursor-pointer"
                              >
                                <Download className="w-3 h-3 text-slate-400" />
                                <span>Download</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
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
