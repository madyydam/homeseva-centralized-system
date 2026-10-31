'use client';

import { useState, useEffect, useRef } from 'react';
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
  ArrowLeft,
  HardDrive,
  ExternalLink,
  ShieldCheck,
  Check,
  Fingerprint,
  UserCheck,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { RoleCredential, BusinessCredentials, SuperAdminConfig } from '../../api/auth/role-credentials/route';

export default function SuperAdminCredentialsPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<BusinessCredentials[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('gentle-hair-wigs');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Super Admin Master Credentials Rotation Form
  const [adminUsername, setAdminUsername] = useState('superadmin@homeseva.internal');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPin4, setAdminPin4] = useState('');
  const [adminPin8, setAdminPin8] = useState('');
  const [adminStatus, setAdminStatus] = useState<SuperAdminConfig | null>(null);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [showAdminPin4, setShowAdminPin4] = useState(false);
  const [showAdminPin8, setShowAdminPin8] = useState(false);

  // Password / PIN input buffers for roles: { [roleName]: { password, pin } }
  const [roleInputs, setRoleInputs] = useState<Record<string, { password: string; pin: string }>>({});
  const [visibleInputs, setVisibleInputs] = useState<Record<string, boolean>>({});

  const notifTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setNotification({ type, message });
    notifTimerRef.current = setTimeout(() => setNotification(null), 3500);
  };

  // Fetch all credentials on mount (strictly guarded)
  const fetchCredentials = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/role-credentials?action=all');
      if (res.status === 401) {
        router.push('/super-admin/signin');
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.companies)) {
        setCompanies(data.companies);
      }
      if (data.superAdmin) {
        setAdminStatus(data.superAdmin);
        setAdminUsername(data.superAdmin.username);
      }
    } catch (err: any) {
      console.error('Failed to load credentials:', err);
      showNotification('error', 'Failed to connect to authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/role-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch (err) {
      // ignore
    }
    router.push('/super-admin/signin');
  };

  const handleSaveSuperAdmin = async () => {
    if (!adminUsername.trim()) {
      showNotification('error', 'Master Username cannot be empty.');
      return;
    }
    if (!adminPassword.trim()) {
      showNotification('error', 'Please enter the new Master Password.');
      return;
    }
    if (adminPin4.trim().length !== 4) {
      showNotification('error', '4-digit Terminal Security PIN must be exactly 4 digits.');
      return;
    }
    if (adminPin8.trim().length !== 8) {
      showNotification('error', '8-digit Master Authority Key must be exactly 8 digits.');
      return;
    }

    setIsSavingAdmin(true);
    try {
      const res = await fetch('/api/auth/role-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-super-admin',
          newUsername: adminUsername.trim(),
          newPassword: adminPassword.trim(),
          newPin4: adminPin4.trim(),
          newPin8: adminPin8.trim(),
        }),
      });

      if (res.status === 401) {
        router.push('/super-admin/signin');
        return;
      }

      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Master Super Admin 4-Factor Credentials locked in database successfully!');
        setAdminPassword('');
        setAdminPin4('');
        setAdminPin8('');
        fetchCredentials();
      } else {
        showNotification('error', data.error || 'Failed to update master credentials');
      }
    } catch (err) {
      showNotification('error', 'Network error updating master credentials.');
    } finally {
      setIsSavingAdmin(false);
    }
  };

  const handleRoleInputChange = (role: string, field: 'password' | 'pin', val: string) => {
    setRoleInputs((prev) => ({
      ...prev,
      [role]: {
        password: field === 'password' ? val : prev[role]?.password || '',
        pin: field === 'pin' ? val : prev[role]?.pin || '',
      },
    }));
  };

  // Save single role
  const handleSaveRole = async (roleName: string) => {
    const item = roleInputs[roleName];
    if (!item || !item.password.trim()) {
      showNotification('error', `Please enter a new password for "${roleName}" to update.`);
      return;
    }

    setSavingRoleId(roleName);
    try {
      const res = await fetch('/api/auth/role-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          businessSlug: selectedSlug,
          role: roleName,
          newPassword: item.password.trim(),
          newPin: item.pin.trim(),
        }),
      });

      if (res.status === 401) {
        router.push('/super-admin/signin');
        return;
      }

      const data = await res.json();
      if (!data.success) {
        showNotification('error', data.error || 'Failed to update credentials');
      } else {
        showNotification('success', `Saved! Password & PIN for "${roleName}" locked in database.`);
        // Clear input buffer for this role
        setRoleInputs((prev) => ({
          ...prev,
          [roleName]: { password: '', pin: '' },
        }));
        fetchCredentials();
      }
    } catch (err: any) {
      showNotification('error', 'Network error while updating credentials.');
    } finally {
      setSavingRoleId(null);
    }
  };

  // Save all changed roles for this company
  const handleSaveAll = async () => {
    const currentCompany = companies.find((c) => c.businessSlug === selectedSlug);
    if (!currentCompany) return;

    const changedRoles = Object.entries(roleInputs).filter(([_, val]) => val.password.trim());
    if (changedRoles.length === 0) {
      showNotification('error', 'No new passwords entered to save. Enter a new password for at least one role.');
      return;
    }

    setIsSavingAll(true);
    try {
      const credentialsPayload = changedRoles.map(([role, val]) => ({
        role,
        password: val.password.trim(),
        pin: val.pin.trim(),
      }));

      const res = await fetch('/api/auth/role-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch-update',
          businessSlug: selectedSlug,
          credentials: credentialsPayload,
        }),
      });

      if (res.status === 401) {
        router.push('/super-admin/signin');
        return;
      }

      const data = await res.json();
      if (!data.success) {
        showNotification('error', data.error || 'Failed to save credentials');
      } else {
        showNotification('success', `All updated role credentials for "${currentCompany.businessName}" saved in database!`);
        setRoleInputs({});
        fetchCredentials();
      }
    } catch (err) {
      showNotification('error', 'Network error while saving all credentials.');
    } finally {
      setIsSavingAll(false);
    }
  };

  const currentCompany = companies.find((c) => c.businessSlug === selectedSlug) || companies[0];

  return (
    <div className="min-h-screen bg-[#050609] text-white selection:bg-indigo-500 selection:text-white font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md">
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
              <h1 className="text-sm font-bold text-white">Central Security &amp; Role Credentials Console</h1>
            </div>
          </div>

          {/* Console Tab Links & Logout */}
          <div className="flex items-center space-x-2">
            <Link
              href="/super-admin/backup"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <HardDrive className="h-3.5 w-3.5 text-slate-400" />
              <span>Backups &amp; S3</span>
            </Link>
            <Link
              href="/super-admin/credentials"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-indigo-500 bg-indigo-600/30 text-xs font-bold text-indigo-300 shadow-glow-indigo"
            >
              <KeyRound className="h-3.5 w-3.5 text-indigo-400" />
              <span>Role Passwords &amp; PINs</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:text-white transition cursor-pointer"
              title="Lock Console & Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Lock Console</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`rounded-2xl p-4 flex items-center justify-between text-xs font-semibold shadow-2xl transition animate-in fade-in duration-150 ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-200 shadow-emerald-950/50'
                : 'bg-rose-950/90 border border-rose-500 text-rose-200 shadow-rose-950/50'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {notification.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white cursor-pointer ml-3 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Master Super Admin 4-Factor Credentials Rotation Card */}
        <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-amber-500/20">
            <div>
              <div className="flex items-center space-x-2">
                <span className="flex h-6 items-center px-2.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300 tracking-wider uppercase">
                  Level 4 Root Authority
                </span>
                <span className="text-xs text-slate-400">Database Encrypted · 4-Factor Authentication</span>
              </div>
              <h2 className="text-lg font-black text-white mt-1.5 flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-amber-400" />
                <span>Rotate Master Super Admin 4-Factor Credentials</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Set new master credentials to unlock root access at{' '}
                <Link href="/super-admin/signin" className="text-amber-300 underline font-medium hover:text-amber-200">
                  /super-admin/signin
                </Link>
                . Credentials are encrypted in Supabase and never exposed to clients.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                type="button"
                onClick={handleSaveSuperAdmin}
                disabled={isSavingAdmin}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                <span>{isSavingAdmin ? 'Locking in Database...' : 'Save & Lock New Master Keys'}</span>
              </button>
            </div>
          </div>

          {/* 4 Factor Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
            {/* Factor 1: Username */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                <span>1. Master Username</span>
              </label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="superadmin@homeseva.internal"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <p className="text-[10px] text-slate-500">Root identifier or admin email</p>
            </div>

            {/* Factor 2: New Password */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                  <span>2. New Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="text-slate-500 hover:text-white"
                >
                  {showAdminPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <input
                type={showAdminPass ? 'text' : 'password'}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter new master password"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <p className="text-[10px] text-slate-500">High entropy master password</p>
            </div>

            {/* Factor 3: New 4-Digit PIN */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <Fingerprint className="h-3.5 w-3.5 text-emerald-400" />
                  <span>3. New 4-Digit PIN</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAdminPin4(!showAdminPin4)}
                  className="text-slate-500 hover:text-white"
                >
                  {showAdminPin4 ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <input
                type={showAdminPin4 ? 'text' : 'password'}
                maxLength={4}
                value={adminPin4}
                onChange={(e) => setAdminPin4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center text-xs font-mono font-bold tracking-widest text-emerald-400 placeholder-slate-600 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
              <p className="text-[10px] text-slate-500 text-center">Terminal security PIN</p>
            </div>

            {/* Factor 4: New 8-Digit PIN */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                  <span>4. New 8-Digit Key</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAdminPin8(!showAdminPin8)}
                  className="text-slate-500 hover:text-white"
                >
                  {showAdminPin8 ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <input
                type={showAdminPin8 ? 'text' : 'password'}
                maxLength={8}
                value={adminPin8}
                onChange={(e) => setAdminPin8(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center text-xs font-mono font-bold tracking-widest text-purple-400 placeholder-slate-600 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
              <p className="text-[10px] text-slate-500 text-center">Master recovery key</p>
            </div>
          </div>
        </div>

        {/* Company Selector Ribbon */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Building2 className="h-4 w-4 text-indigo-400" />
                <span>Select Company to Manage Passwords &amp; PINs</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage passwords and PINs securely. Passwords are saved directly to Supabase.
              </p>
            </div>

            {currentCompany && (
              <div className="flex items-center space-x-2">
                <Link
                  href={`/signin/${currentCompany.businessSlug}`}
                  target="_blank"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  title="Open live sign in page to test"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  <span>Test Sign In</span>
                </Link>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSavingAll}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-black text-white shadow-glow-indigo transition cursor-pointer disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSavingAll ? 'Saving All...' : 'Save All Updated Roles'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Company Badges Carousel / Grid */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {companies.map((comp) => {
              const isSelected = selectedSlug === comp.businessSlug;
              return (
                <button
                  key={comp.businessSlug}
                  type="button"
                  onClick={() => setSelectedSlug(comp.businessSlug)}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer flex items-center space-x-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/80'
                  }`}
                >
                  <span>{comp.businessName}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {comp.roles.length} roles
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Roles & Credentials Card Grid */}
        {isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-3" />
            <p className="text-xs font-bold font-mono">Loading company security credentials...</p>
          </div>
        ) : !currentCompany || currentCompany.roles.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400">
            <ShieldAlert className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">No roles registered for this company.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                Managing credentials for: <strong className="text-white">{currentCompany.businessName}</strong> ({currentCompany.roles.length} configured roles)
              </span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Supabase Database Sync Active</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentCompany.roles.map((roleItem) => {
                const roleKey = roleItem.role;
                const buffer = roleInputs[roleKey] || { password: '', pin: '' };
                const isPassVisible = !!visibleInputs[`pass-${roleKey}`];
                const isPinVisible = !!visibleInputs[`pin-${roleKey}`];
                const isSaving = savingRoleId === roleKey;

                return (
                  <div
                    key={roleKey}
                    className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Role Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-black text-white truncate leading-snug">
                            {roleItem.label || roleItem.role}
                          </h3>
                          <span className="text-[10px] font-mono text-indigo-400">
                            Role ID: {roleItem.role}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 shrink-0">
                          {roleItem.department}
                        </span>
                      </div>

                      {/* Security Status Badges */}
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 font-mono font-medium">
                          <Lock className="h-2.5 w-2.5" />
                          <span>Password Active</span>
                        </span>
                        {roleItem.hasPin && (
                          <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-800/80 text-amber-400 font-mono font-medium">
                            <KeyRound className="h-2.5 w-2.5" />
                            <span>PIN Active</span>
                          </span>
                        )}
                      </div>

                      {/* Set New Password */}
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center justify-between text-[11px]">
                          <label className="font-bold text-slate-300 flex items-center space-x-1">
                            <Lock className="h-3 w-3 text-slate-400" />
                            <span>Set New Password</span>
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setVisibleInputs((prev) => ({ ...prev, [`pass-${roleKey}`]: !prev[`pass-${roleKey}`] }))
                            }
                            className="text-slate-400 hover:text-white p-0.5"
                          >
                            {isPassVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                        </div>

                        <div className="relative">
                          <input
                            type={isPassVisible ? 'text' : 'password'}
                            value={buffer.password}
                            onChange={(e) => handleRoleInputChange(roleKey, 'password', e.target.value)}
                            placeholder="Enter new password to change"
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs font-mono text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>

                      {/* Set New 4-Digit Security PIN */}
                      <div className="space-y-1 mb-4">
                        <div className="flex items-center justify-between text-[11px]">
                          <label className="font-bold text-slate-300 flex items-center space-x-1">
                            <KeyRound className="h-3 w-3 text-amber-400" />
                            <span>Set New 4-Digit PIN</span>
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setVisibleInputs((prev) => ({ ...prev, [`pin-${roleKey}`]: !prev[`pin-${roleKey}`] }))
                            }
                            className="text-slate-400 hover:text-white p-0.5"
                          >
                            {isPinVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                        </div>

                        <div className="relative">
                          <input
                            type={isPinVisible ? 'text' : 'password'}
                            value={buffer.pin}
                            maxLength={4}
                            onChange={(e) => handleRoleInputChange(roleKey, 'pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="4-digit PIN (leave empty to keep)"
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs font-mono tracking-widest text-amber-300 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">
                        {buffer.password ? 'Ready to update' : 'Encrypted in Supabase'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSaveRole(roleKey)}
                        disabled={isSaving || !buffer.password.trim()}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Save className="h-3 w-3" />
                        <span>{isSaving ? 'Saving...' : 'Update Role'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
