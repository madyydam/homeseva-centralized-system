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
  Copy,
  Fingerprint,
  UserCheck,
  LogOut,
  PlusCircle,
  Sliders,
  X,
} from 'lucide-react';

interface RoleItem {
  id?: string;
  role: string;
  label: string;
  department: string;
  password?: string;
  pin?: string;
  lastUpdated?: string;
}

interface CompanyItem {
  businessId: string;
  businessSlug: string;
  businessName: string;
  roles: RoleItem[];
}

interface TabItem {
  id: string;
  tab_key: string;
  label: string;
  description?: string;
}

interface RoleTabAccess {
  role_id: string;
  tab_id: string;
  can_view: boolean;
  can_edit: boolean;
}

export default function SuperAdminCredentialsPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('gentle-hair-wigs');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Tab View Mode: 'roles' | 'tab-access'
  const [viewMode, setViewMode] = useState<'roles' | 'tab-access'>('roles');

  // Super Admin Master Credentials Rotation Form
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPin4, setAdminPin4] = useState('');
  const [adminPin8, setAdminPin8] = useState('');
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [showAdminPin4, setShowAdminPin4] = useState(false);
  const [showAdminPin8, setShowAdminPin8] = useState(false);

  // Password / PIN input buffers for roles: { [roleName]: { password, pin } }
  const [roleInputs, setRoleInputs] = useState<Record<string, { password: string; pin: string }>>({});
  const [visibleInputs, setVisibleInputs] = useState<Record<string, boolean>>({});

  // Tab Access State
  const [tabsList, setTabsList] = useState<TabItem[]>([]);
  const [tabAccessMap, setTabAccessMap] = useState<Record<string, Record<string, boolean>>>({}); // { [roleId]: { [tabId]: boolean } }
  const [selectedAccessRoleId, setSelectedAccessRoleId] = useState<string>('');
  const [isSavingTabAccess, setIsSavingTabAccess] = useState(false);

  // Create Role Modal State
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [newRoleDept, setNewRoleDept] = useState('');
  const [newRolePass, setNewRolePass] = useState('');
  const [newRolePin, setNewRolePin] = useState('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  const notifTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setNotification({ type, message });
    notifTimerRef.current = setTimeout(() => setNotification(null), 3500);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Fetch all credentials on mount
  const fetchCredentials = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/credentials');
      if (res.status === 401) {
        router.push('/super-admin/signin');
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.companies)) {
        setCompanies(data.companies);
      }
      if (data.superAdmin) {
        setAdminUsername(data.superAdmin.username);
      }
    } catch (err: any) {
      console.error('Failed to load credentials:', err);
      showNotification('error', 'Failed to connect to authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tab access for current company
  const fetchTabAccess = async (slug: string) => {
    try {
      const res = await fetch(`/api/admin/tab-access?businessSlug=${slug}`);
      const data = await res.json();
      if (data.success) {
        setTabsList(data.tabs || []);
        const map: Record<string, Record<string, boolean>> = {};
        (data.access || []).forEach((item: RoleTabAccess) => {
          if (!map[item.role_id]) map[item.role_id] = {};
          const roleEntry = map[item.role_id];
          if (roleEntry) {
            roleEntry[item.tab_id] = item.can_view;
          }
        });
        setTabAccessMap(map);
        if (data.roles && data.roles.length > 0 && !selectedAccessRoleId) {
          setSelectedAccessRoleId(data.roles[0].id || data.roles[0].role_id);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  useEffect(() => {
    if (viewMode === 'tab-access') {
      fetchTabAccess(selectedSlug);
    }
  }, [selectedSlug, viewMode]);

  const handleSignOut = async () => {
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
      const res = await fetch('/api/admin/credentials', {
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
    } catch {
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
      showNotification('error', `Please enter a password for "${roleName}".`);
      return;
    }

    setSavingRoleId(roleName);
    try {
      const res = await fetch('/api/admin/credentials', {
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
        showNotification('success', `Saved! Password & PIN for "${roleName}" updated in Supabase.`);
        setRoleInputs((prev) => ({
          ...prev,
          [roleName]: { password: '', pin: '' },
        }));
        fetchCredentials();
      }
    } catch {
      showNotification('error', 'Network error while updating credentials.');
    } finally {
      setSavingRoleId(null);
    }
  };

  // Save all changed roles
  const handleSaveAll = async () => {
    const currentCompany = companies.find((c) => c.businessSlug === selectedSlug);
    if (!currentCompany) return;

    const changedRoles = Object.entries(roleInputs).filter(([_, val]) => val.password.trim());
    if (changedRoles.length === 0) {
      showNotification('error', 'No new passwords entered to save. Enter a password for at least one role.');
      return;
    }

    setIsSavingAll(true);
    try {
      const credentialsPayload = changedRoles.map(([role, val]) => ({
        role,
        password: val.password.trim(),
        pin: val.pin.trim(),
      }));

      const res = await fetch('/api/admin/credentials', {
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
        showNotification('success', `All updated role credentials for "${currentCompany.businessName}" saved in Supabase!`);
        setRoleInputs({});
        fetchCredentials();
      }
    } catch {
      showNotification('error', 'Network error while saving all credentials.');
    } finally {
      setIsSavingAll(false);
    }
  };

  // Handle Create Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim() || !newRolePass.trim()) {
      showNotification('error', 'Role ID and Password are required.');
      return;
    }

    setIsCreatingRole(true);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-role',
          businessSlug: selectedSlug,
          roleId: newRoleName.trim(),
          label: (newRoleLabel || newRoleName).trim(),
          department: (newRoleDept || 'General').trim(),
          password: newRolePass.trim(),
          pin: (newRolePin || '1111').trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification('success', `Role "${newRoleName}" created successfully!`);
        setIsCreateRoleOpen(false);
        setNewRoleName('');
        setNewRoleLabel('');
        setNewRoleDept('');
        setNewRolePass('');
        setNewRolePin('');
        fetchCredentials();
      } else {
        showNotification('error', data.error || 'Failed to create role');
      }
    } catch {
      showNotification('error', 'Network error creating role');
    } finally {
      setIsCreatingRole(false);
    }
  };

  // Save Tab Access
  const handleSaveTabAccess = async () => {
    if (!selectedAccessRoleId) return;
    setIsSavingTabAccess(true);

    try {
      const roleMap = tabAccessMap[selectedAccessRoleId] || {};
      const payload = Object.entries(roleMap).map(([tabId, canView]) => ({
        tabId,
        canView,
      }));

      const res = await fetch('/api/admin/tab-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug: selectedSlug,
          roleId: selectedAccessRoleId,
          tabAccessList: payload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Tab access configuration saved successfully!');
      } else {
        showNotification('error', data.error || 'Failed to save tab access');
      }
    } catch {
      showNotification('error', 'Network error saving tab access');
    } finally {
      setIsSavingTabAccess(false);
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
              <h1 className="text-sm font-bold text-white">Central Security &amp; Role Management Console</h1>
            </div>
          </div>

          {/* Console Tab Links & Logout */}
          <div className="flex items-center space-x-2">
            <Link
              href="/super-admin/backup"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <HardDrive className="h-3.5 w-3.5 text-slate-400" />
              <span>Backups</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:text-white transition cursor-pointer"
              title="Sign Out"
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
                . Values are cryptographically hashed using Bcrypt before storage.
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
                <span>{isSavingAdmin ? 'Hashing & Locking...' : 'Save & Lock Master Keys'}</span>
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
                placeholder="madyydam"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <p className="text-[10px] text-slate-500">Root identifier or master username</p>
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
              <p className="text-[10px] text-slate-500">Bcrypt hashed before saving</p>
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
              <p className="text-[10px] text-slate-500 text-center">4-digit security PIN</p>
            </div>

            {/* Factor 4: New 8-Digit PIN */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                  <span>4. New 8-Digit PIN</span>
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
              <p className="text-[10px] text-slate-500 text-center">8-digit master authority key</p>
            </div>
          </div>
        </div>

        {/* Company Selector Ribbon & Controls */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Building2 className="h-4 w-4 text-indigo-400" />
                <span>Select Company Workspace</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure roles, tab access, passwords, and security PINs for any of the 10 businesses.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {/* Mode Toggle: Roles vs Tab Access */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('roles')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    viewMode === 'roles' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Roles &amp; Credentials
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('tab-access')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    viewMode === 'tab-access' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tab Access Control
                </button>
              </div>

              {/* Add Custom Role Button */}
              <button
                type="button"
                onClick={() => setIsCreateRoleOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/50 bg-indigo-600/20 text-xs font-bold text-indigo-300 hover:bg-indigo-600/30 transition cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Add Role</span>
              </button>

              {currentCompany && (
                <Link
                  href={`/signin/${currentCompany.businessSlug}`}
                  target="_blank"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  title="Test Sign In"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  <span>Test Sign In</span>
                </Link>
              )}
            </div>
          </div>

          {/* Company Badges Carousel */}
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

        {/* VIEW MODE 1: ROLES & CREDENTIALS */}
        {viewMode === 'roles' ? (
          isLoading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-3" />
              <p className="text-xs font-bold font-mono">Loading company security credentials...</p>
            </div>
          ) : !currentCompany || currentCompany.roles.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400">
              <ShieldAlert className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No roles registered for this company.</p>
              <button
                type="button"
                onClick={() => setIsCreateRoleOpen(true)}
                className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-xs font-bold text-white"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Create First Role</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>
                  Managing roles &amp; credentials for: <strong className="text-white">{currentCompany.businessName}</strong> ({currentCompany.roles.length} roles)
                </span>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSavingAll}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-black text-white shadow-glow-indigo transition cursor-pointer disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSavingAll ? 'Saving All...' : 'Save All Updated Roles'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentCompany.roles.map((roleItem) => {
                  const roleKey = roleItem.role;
                  const buffer = roleInputs[roleKey] || { password: roleItem.password || '', pin: roleItem.pin || '' };
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

                        {/* Password Field */}
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center justify-between text-[11px]">
                            <label className="font-bold text-slate-300 flex items-center space-x-1">
                              <Lock className="h-3 w-3 text-slate-400" />
                              <span>Role Password</span>
                            </label>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleCopy(buffer.password, `pass-${roleKey}`)}
                                className="text-slate-400 hover:text-white p-0.5"
                                title="Copy password"
                              >
                                {copiedKey === `pass-${roleKey}` ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
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
                          </div>

                          <div className="relative">
                            <input
                              type={isPassVisible ? 'text' : 'password'}
                              value={buffer.password}
                              onChange={(e) => handleRoleInputChange(roleKey, 'password', e.target.value)}
                              placeholder="Enter role password"
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs font-mono text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>
                        </div>

                        {/* 4-Digit Security PIN */}
                        <div className="space-y-1 mb-4">
                          <div className="flex items-center justify-between text-[11px]">
                            <label className="font-bold text-slate-300 flex items-center space-x-1">
                              <KeyRound className="h-3 w-3 text-amber-400" />
                              <span>Security PIN</span>
                            </label>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleCopy(buffer.pin, `pin-${roleKey}`)}
                                className="text-slate-400 hover:text-white p-0.5"
                                title="Copy PIN"
                              >
                                {copiedKey === `pin-${roleKey}` ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
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
                          </div>

                          <div className="relative">
                            <input
                              type={isPinVisible ? 'text' : 'password'}
                              value={buffer.pin}
                              maxLength={6}
                              onChange={(e) => handleRoleInputChange(roleKey, 'pin', e.target.value)}
                              placeholder="4-digit PIN"
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs font-mono tracking-widest text-amber-300 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          {roleItem.lastUpdated ? 'Synced' : 'Default'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSaveRole(roleKey)}
                          disabled={isSaving}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Save className="h-3 w-3" />
                          <span>{isSaving ? 'Saving...' : 'Save Role'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          /* VIEW MODE 2: TAB ACCESS CONTROL */
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <Sliders className="h-4 w-4 text-indigo-400" />
                  <span>Configure Tab Visibility &amp; Module Access</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose which tabs and workspaces each role is authorized to see inside{' '}
                  <strong className="text-white">{currentCompany?.businessName || selectedSlug}</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveTabAccess}
                disabled={isSavingTabAccess}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-black text-white shadow-glow-indigo transition cursor-pointer disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isSavingTabAccess ? 'Saving Access...' : 'Save Tab Access'}</span>
              </button>
            </div>

            {/* Select Role for Tab Configuration */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                1. Select Role to Configure Tab Permissions:
              </label>
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
                {(currentCompany?.roles || []).map((r) => {
                  const rId = r.id || r.role;
                  const isSelected = selectedAccessRoleId === rId;
                  return (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setSelectedAccessRoleId(rId)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>{r.label || r.role}</span>
                      <span className="text-[10px] text-slate-400">({r.department})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tabs Checklist */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-300 mb-2">
                2. Enable/Disable Tab Access:
              </label>
              {tabsList.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-400">
                  Tabs for this business are dynamically inherited. All core tabs active by default.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {tabsList.map((tab) => {
                    const isChecked = tabAccessMap[selectedAccessRoleId]?.[tab.id] ?? true;
                    return (
                      <label
                        key={tab.id}
                        className={`flex items-start space-x-3 p-3.5 rounded-xl border transition cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setTabAccessMap((prev) => ({
                              ...prev,
                              [selectedAccessRoleId]: {
                                ...(prev[selectedAccessRoleId] || {}),
                                [tab.id]: val,
                              },
                            }));
                          }}
                          className="mt-0.5 h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                        />
                        <div>
                          <div className="text-xs font-bold">{tab.label}</div>
                          {tab.description && (
                            <div className="text-[10px] text-slate-400 mt-0.5">{tab.description}</div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* CREATE CUSTOM ROLE MODAL */}
      {isCreateRoleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-white relative">
            <button
              type="button"
              onClick={() => setIsCreateRoleOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-black text-white mb-1 flex items-center space-x-2">
              <PlusCircle className="h-5 w-5 text-indigo-400" />
              <span>Create Custom Role</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a new role to <strong className="text-indigo-300">{currentCompany?.businessName || selectedSlug}</strong>.
            </p>

            <form onSubmit={handleCreateRole} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Role ID *</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Lead Hair Consultant"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Role Display Label</label>
                <input
                  type="text"
                  value={newRoleLabel}
                  onChange={(e) => setNewRoleLabel(e.target.value)}
                  placeholder="e.g. Senior Hair Specialist"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={newRoleDept}
                  onChange={(e) => setNewRoleDept(e.target.value)}
                  placeholder="e.g. Styling / Operations"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                  <input
                    type="text"
                    value={newRolePass}
                    onChange={(e) => setNewRolePass(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">4-Digit PIN</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newRolePin}
                    onChange={(e) => setNewRolePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="1111"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono tracking-widest text-center text-amber-300 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRole}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-black text-white shadow-glow-indigo transition disabled:opacity-50"
                >
                  {isCreatingRole ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
