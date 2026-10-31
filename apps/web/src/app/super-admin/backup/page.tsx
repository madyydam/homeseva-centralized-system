'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  HardDrive,
  Download,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Settings2,
  Calendar,
  Lock,
  ArrowLeft,
  Search,
  Filter,
  CheckSquare,
  Square,
  FileCheck,
  KeyRound,
} from 'lucide-react';

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
  { id: 'b1', name: 'Prefab Construction', category: 'Civil & Modular Sites', slug: 'prefab-construction', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '12.4 MB', sha256: '8c22...f901', schemaVersion: 'v1.2.0' },
  { id: 'b2', name: 'HORECA Essentials', category: 'Essentials Sales & Crockery Rental', slug: 'horeca-essentials', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '2.4 MB', sha256: '9f83...a210', schemaVersion: 'v1.2.0' },
  { id: 'b3', name: 'Gentle Hair Wigs', category: 'Hair Wigs & Aesthetics', slug: 'gentle-hair-wigs', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '3.1 MB', sha256: '4b71...e582', schemaVersion: 'v1.2.0' },
  { id: 'b4', name: 'Ecolab Distribution', category: 'Hygiene & Chemical Solutions', slug: 'ecolab-distribution', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '4.8 MB', sha256: '1a90...d334', schemaVersion: 'v1.2.0' },
  { id: 'b5', name: 'HS Co-working', category: 'Flexible Desks & Workspaces', slug: 'hs-coworking', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '2.8 MB', sha256: '3e41...c819', schemaVersion: 'v1.2.0' },
  { id: 'b6', name: 'First Mover Advantage', category: 'App SaaS Platform', slug: 'first-mover-advantage', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '1.8 MB', sha256: '7f62...a441', schemaVersion: 'v1.2.0' },
  { id: 'b7', name: 'Printbooth', category: 'Digital & Commercial Printing', slug: 'printbooth', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '3.4 MB', sha256: '5d19...b760', schemaVersion: 'v1.2.0' },
  { id: 'b8', name: 'DVE Enterprises', category: 'Commercial Trading & Supplies', slug: 'dve-enterprises', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '5.2 MB', sha256: '2c88...e993', schemaVersion: 'v1.2.0' },
  { id: 'b9', name: 'NDA Services', category: 'Security & Facility Care', slug: 'nda-services', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '3.0 MB', sha256: '6a44...d112', schemaVersion: 'v1.2.0' },
  { id: 'b10', name: 'HS Real Estate', category: 'Property Leasing & Assets', slug: 'hs-real-estate', lastBackup: 'Today, 02:00 AM', status: 'HEALTHY', size: '6.7 MB', sha256: '0e33...f557', schemaVersion: 'v1.2.0' },
];

export default function SuperAdminBackupPage() {
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
    setNotification(`Packaging ${selectedIds.length} business backup(s) in background... (BK-5)`);

    if (timer1Ref.current) clearTimeout(timer1Ref.current);
    if (timer2Ref.current) clearTimeout(timer2Ref.current);

    timer1Ref.current = setTimeout(() => {
      setIsProcessing(false);
      setNotification(`Successfully created and encrypted ${selectedIds.length} package(s) into S3 storage!`);
      timer2Ref.current = setTimeout(() => setNotification(null), 4000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Return Home"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center space-x-2">
              <span className="flex h-7 items-center rounded-md bg-indigo-600 px-2.5 text-xs font-bold text-white shadow-glow-indigo">
                SUPER ADMIN
              </span>
              <h1 className="text-sm font-bold text-white">Backup &amp; Restore Command Center</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/super-admin/backup"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-indigo-500 bg-indigo-600/30 text-xs font-bold text-indigo-300 shadow-glow-indigo"
            >
              <HardDrive className="h-3.5 w-3.5 text-indigo-400" />
              <span>Backups &amp; S3</span>
            </Link>
            <Link
              href="/super-admin/credentials"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <KeyRound className="h-3.5 w-3.5 text-slate-400" />
              <span>Role Passwords &amp; PINs</span>
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              Exit
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Notification Toast */}
        {notification && (
          <div className="rounded-2xl bg-indigo-900/60 border border-indigo-500 p-4 flex items-center justify-between text-xs text-indigo-200 shadow-glow-indigo">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-indigo-400 hover:text-white font-bold">
              ✕
            </button>
          </div>
        )}

        {/* PRD v1.2 Feature Overview Header */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="rounded bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
                PRD v1.2 TOP-LEVEL CAPABILITY
              </span>
              <span className="text-xs text-slate-400">Section 4 · BK-1 to BK-13</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Per-Business Selective Backup &amp; Recovery
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl">
              Create independent backup packages for individual businesses or the entire group. Scoped database export, encrypted S3 file snapshots, and isolated rollback guarantees.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleTakeBackup}
              disabled={isProcessing || selectedIds.length === 0}
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-xs font-bold text-white shadow-glow-indigo hover:from-indigo-500 hover:to-purple-500 transition disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-white" />
              )}
              <span>Take Backup Now ({selectedIds.length})</span>
            </button>

            <button className="inline-flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition">
              <Calendar className="h-3.5 w-3.5" />
              <span>Schedules (BK-4)</span>
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <span className="text-[11px] font-mono uppercase text-slate-400">Total Group Backup Size</span>
            <p className="mt-2 text-2xl font-extrabold text-white font-mono">45.4 MB</p>
            <span className="mt-1 block text-[11px] text-emerald-400">All 10 workspaces covered</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <span className="text-[11px] font-mono uppercase text-slate-400">Retention Policy (BK-10)</span>
            <p className="mt-2 text-xl font-bold text-indigo-300 font-mono">7D / 4W / 12M</p>
            <span className="mt-1 block text-[11px] text-slate-400">Automated prune active</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <span className="text-[11px] font-mono uppercase text-slate-400">Encryption &amp; Checksums</span>
            <p className="mt-2 text-xl font-bold text-emerald-400 font-mono">AES-256 + SHA256</p>
            <span className="mt-1 block text-[11px] text-slate-400">Stored outside main VPS</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <span className="text-[11px] font-mono uppercase text-slate-400">Last Automated Run</span>
            <p className="mt-2 text-xl font-bold text-white font-mono">02:00 AM Today</p>
            <span className="mt-1 block text-[11px] text-emerald-400">Zero errors reported</span>
          </div>
        </div>

        {/* 10 Businesses Checklist Table (BK-1) */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
          <div className="border-b border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleSelectAll}
                className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
              >
                {selectedIds.length === businesses.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4 text-slate-600" />
                )}
                <span>Select All ({selectedIds.length}/{businesses.length})</span>
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Restoring over live business requires 2FA confirmation (BK-8, BK-9)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">Select</th>
                  <th className="py-3.5 px-4">Workspace Name</th>
                  <th className="py-3.5 px-4">Industry Category</th>
                  <th className="py-3.5 px-4">Last Backup Timestamp</th>
                  <th className="py-3.5 px-4">Integrity Status</th>
                  <th className="py-3.5 px-4">Size &amp; Checksum</th>
                  <th className="py-3.5 px-4 text-right">Actions (BK-7, BK-8)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300 font-medium">
                {businesses.map((biz) => {
                  const isChecked = selectedIds.includes(biz.id);
                  return (
                    <tr
                      key={biz.id}
                      className={`hover:bg-slate-900/60 transition ${
                        isChecked ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <button onClick={() => toggleSelect(biz.id)} className="text-slate-400 hover:text-indigo-400">
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-indigo-500" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-700" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center space-x-2">
                          <span>{biz.name}</span>
                          <span className="font-mono text-[10px] text-slate-500">[{biz.slug}]</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{biz.category}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">{biz.lastBackup}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 font-mono">
                          <CheckCircle2 className="h-3 w-3" />
                          {biz.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {biz.size} · <span className="text-slate-500">{biz.sha256}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 font-semibold">
                        <button
                          onClick={() => alert(`Downloading verified encrypted package for ${biz.name} (BK-7)`)}
                          className="inline-flex items-center space-x-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 px-2.5 py-1 text-[11px] transition"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download</span>
                        </button>
                        <button
                          onClick={() =>
                            confirm(`Restore ${biz.name}? This strictly restores only this business without modifying any other (BK-8, BK-9).`)
                          }
                          className="inline-flex items-center space-x-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 px-2.5 py-1 text-[11px] transition"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Restore</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
