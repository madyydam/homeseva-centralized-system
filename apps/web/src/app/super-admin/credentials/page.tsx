'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Save,
  Building2,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { SuperAdminSidebar } from '@/components/SuperAdminSidebar';

export default function SuperAdminCredentialsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Super Admin Master Credentials Rotation Form
  const [adminUsername, setAdminUsername] = useState('madyydam');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPin4, setAdminPin4] = useState('');
  const [adminPin8, setAdminPin8] = useState('');
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [showAdminPin4, setShowAdminPin4] = useState(false);
  const [showAdminPin8, setShowAdminPin8] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const notifTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setNotification({ type, message });
    notifTimerRef.current = setTimeout(() => setNotification(null), 4000);
  };

  const fetchCredentials = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/credentials?action=get-super-admin');
      if (res.status === 401) {
        router.push('/super-admin/signin');
        return;
      }
      const data = await res.json();
      if (data.superAdmin) {
        setAdminUsername(data.superAdmin.username);
        setLastUpdated(data.superAdmin.lastUpdated);
      }
    } catch {
      showNotification('error', 'Failed to connect to authentication server.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleSaveAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim()) {
      showNotification('error', 'Master username is required.');
      return;
    }
    if (!adminPassword && !adminPin4 && !adminPin8) {
      showNotification('error', 'Please enter at least one new value (Password, 4-Digit PIN, or 8-Digit PIN) to update.');
      return;
    }
    if (adminPin4 && adminPin4.length !== 4) {
      showNotification('error', 'PIN 1 must be exactly 4 digits.');
      return;
    }
    if (adminPin8 && adminPin8.length !== 8) {
      showNotification('error', 'PIN 2 must be exactly 8 digits.');
      return;
    }

    setIsSavingAdmin(true);
    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-super-admin',
          username: adminUsername.trim(),
          password: adminPassword || undefined,
          pin4: adminPin4 || undefined,
          pin8: adminPin8 || undefined,
        }),
      });

      if (res.status === 401) {
        router.push('/super-admin/signin');
        return;
      }

      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Master Super Admin 4-Factor Credentials updated & hashed successfully in PostgreSQL!');
        setAdminPassword('');
        setAdminPin4('');
        setAdminPin8('');
        fetchCredentials();
      } else {
        showNotification('error', data.error || 'Failed to update master credentials');
      }
    } catch {
      showNotification('error', 'Network error updating master credentials.');
    } finally {
      setIsSavingAdmin(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 antialiased font-sans">
      {/* 1. Permanent Left Sidebar */}
      <SuperAdminSidebar activeTab="security" />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  Security &amp; Master Keys
                </h1>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Level 4 Root Authority
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rotate master 4-factor root credentials for the Super Admin console. Values are cryptographically hashed with Bcrypt before storage.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/super-admin/companies"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Go to Companies</span>
            </Link>
            <button
              type="button"
              onClick={fetchCredentials}
              className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Notifications */}
        {notification && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl border text-xs font-medium flex items-center space-x-2 shadow-2xs animate-fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span className="flex-1">{notification.message}</span>
            <button type="button" onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Master Credentials Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Rotate Master Super Admin 4-Factor Credentials
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Used to authenticate at <code className="text-indigo-600 font-mono">/super-admin/signin</code>.
                    {lastUpdated && ` Last rotated: ${new Date(lastUpdated).toLocaleString()}`}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveAdminCredentials} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* 1. Master Username */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      1. Master Username
                    </label>
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                      placeholder="Root username"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Primary root identifier</p>
                  </div>

                  {/* 2. New Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">2. New Password</label>
                      <button
                        type="button"
                        onClick={() => setShowAdminPass(!showAdminPass)}
                        className="text-[11px] text-indigo-600 font-semibold"
                      >
                        {showAdminPass ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showAdminPass ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Bcrypt hashed before saving</p>
                  </div>

                  {/* 3. New 4-Digit PIN */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">3. New 4-Digit PIN</label>
                      <button
                        type="button"
                        onClick={() => setShowAdminPin4(!showAdminPin4)}
                        className="text-[11px] text-indigo-600 font-semibold"
                      >
                        {showAdminPin4 ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showAdminPin4 ? 'text' : 'password'}
                      maxLength={4}
                      value={adminPin4}
                      onChange={(e) => setAdminPin4(e.target.value)}
                      placeholder="••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">4-digit factor PIN</p>
                  </div>

                  {/* 4. New 8-Digit PIN */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">4. New 8-Digit PIN</label>
                      <button
                        type="button"
                        onClick={() => setShowAdminPin8(!showAdminPin8)}
                        className="text-[11px] text-indigo-600 font-semibold"
                      >
                        {showAdminPin8 ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showAdminPin8 ? 'text' : 'password'}
                      maxLength={8}
                      value={adminPin8}
                      onChange={(e) => setAdminPin8(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">8-digit master authority key</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Active Authority: <strong className="text-slate-800">{adminUsername}</strong>
                  </span>
                  <button
                    type="submit"
                    disabled={isSavingAdmin}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingAdmin ? 'Encrypting & Saving...' : 'Save & Lock Master Keys'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Link Card to Companies */}
            <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-indigo-950">Manage Company Roles &amp; Members</h3>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Individual multi-member accounts, emails, passwords, and PINs have moved to the Companies module.
                  </p>
                </div>
              </div>
              <Link
                href="/super-admin/companies"
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <span>Open Companies</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
