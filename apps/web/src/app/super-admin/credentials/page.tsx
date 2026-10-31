'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Save,
  RotateCcw,
  Building2,
  Search,
  ArrowLeft,
  HardDrive,
  Copy,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { RoleCredential, BusinessCredentials } from '../../api/auth/role-credentials/route';

export default function SuperAdminCredentialsPage() {
  const [companies, setCompanies] = useState<BusinessCredentials[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('gentle-hair-wigs');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Visibility states for passwords and PINs: { [roleKey]: boolean }
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  // Local editing buffer for currently selected company: { [roleName]: { password, pin } }
  const [editingRoles, setEditingRoles] = useState<Record<string, { password: string; pin: string }>>({});

  const notifTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setNotification({ type, message });
    notifTimerRef.current = setTimeout(() => setNotification(null), 3500);
  };

  // Fetch all credentials on mount
  const fetchCredentials = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/role-credentials?action=all');
      const data = await res.json();
      if (data.success && Array.isArray(data.companies)) {
        setCompanies(data.companies);
        initEditingBuffer(data.companies, selectedSlug);
      }
    } catch (err: any) {
      console.error('Failed to load credentials:', err);
      showNotification('error', 'Failed to connect to credentials server.');
    } finally {
      setIsLoading(false);
    }
  };

  const initEditingBuffer = (companyList: BusinessCredentials[], slug: string) => {
    const comp = companyList.find((c) => c.businessSlug === slug);
    if (!comp) return;
    const buffer: Record<string, { password: string; pin: string }> = {};
    comp.roles.forEach((r) => {
      buffer[r.role] = { password: r.password, pin: r.pin };
    });
    setEditingRoles(buffer);
  };

  useEffect(() => {
    fetchCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When selected company changes
  const handleSelectCompany = (slug: string) => {
    setSelectedSlug(slug);
    initEditingBuffer(companies, slug);
  };

  const handleRoleInputChange = (role: string, field: 'password' | 'pin', val: string) => {
    setEditingRoles((prev) => ({
      ...prev,
      [role]: {
        password: field === 'password' ? val : prev[role]?.password || '',
        pin: field === 'pin' ? val : prev[role]?.pin || '',
      },
    }));
  };

  // Save single role
  const handleSaveRole = async (roleName: string) => {
    const item = editingRoles[roleName];
    if (!item) return;

    if (!item.password.trim()) {
      showNotification('error', `Password cannot be empty for ${roleName}`);
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

      const data = await res.json();
      if (!data.success) {
        showNotification('error', data.error || 'Failed to update credentials');
      } else {
        showNotification('success', `Saved! Password and PIN updated for "${roleName}".`);
        // Refresh companies state
        setCompanies((prev) =>
          prev.map((c) => {
            if (c.businessSlug !== selectedSlug) return c;
            return {
              ...c,
              roles: c.roles.map((r) =>
                r.role === roleName
                  ? { ...r, password: item.password.trim(), pin: item.pin.trim(), lastUpdated: data.lastUpdated }
                  : r
              ),
            };
          })
        );
      }
    } catch (err: any) {
      showNotification('error', 'Network error while updating credentials.');
    } finally {
      setSavingRoleId(null);
    }
  };

  // Save all roles for this company
  const handleSaveAll = async () => {
    const currentCompany = companies.find((c) => c.businessSlug === selectedSlug);
    if (!currentCompany) return;

    const credentialsPayload = currentCompany.roles.map((r) => ({
      role: r.role,
      password: editingRoles[r.role]?.password || r.password,
      pin: editingRoles[r.role]?.pin || r.pin,
    }));

    setIsSavingAll(true);
    try {
      const res = await fetch('/api/auth/role-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch-update',
          businessSlug: selectedSlug,
          credentials: credentialsPayload,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        showNotification('error', data.error || 'Failed to save all credentials');
      } else {
        showNotification('success', `All role passwords and PINs for "${currentCompany.businessName}" saved successfully!`);
        fetchCredentials();
      }
    } catch (err) {
      showNotification('error', 'Network error while saving all credentials.');
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const currentCompany = companies.find((c) => c.businessSlug === selectedSlug) || companies[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500 selection:text-white font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
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

          {/* Console Tab Links */}
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
            <Link
              href="/"
              className="rounded-xl border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              Exit
            </Link>
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

        {/* Company Selector Ribbon */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Building2 className="h-4 w-4 text-indigo-400" />
                <span>Select Company to Manage Passwords &amp; PINs</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Changes made here immediately take effect on the company sign-in portal.
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
                  <span>{isSavingAll ? 'Saving All...' : 'Save All Company Roles'}</span>
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
                  onClick={() => handleSelectCompany(comp.businessSlug)}
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
                <span>Database Sync Active</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentCompany.roles.map((roleItem) => {
                const roleKey = roleItem.role;
                const buffer = editingRoles[roleKey] || { password: roleItem.password, pin: roleItem.pin };
                const isPassVisible = !!visiblePasswords[roleKey];
                const isPinVisible = !!visiblePins[roleKey];
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
                                setVisiblePasswords((prev) => ({ ...prev, [roleKey]: !prev[roleKey] }))
                              }
                              className="text-slate-400 hover:text-white p-0.5"
                              title={isPassVisible ? 'Hide password' : 'Show password'}
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

                      {/* 4-Digit Security PIN Field */}
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
                                setVisiblePins((prev) => ({ ...prev, [roleKey]: !prev[roleKey] }))
                              }
                              className="text-slate-400 hover:text-white p-0.5"
                              title={isPinVisible ? 'Hide PIN' : 'Show PIN'}
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
                        {roleItem.lastUpdated ? 'Configured' : 'Default'}
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
        )}
      </main>
    </div>
  );
}
