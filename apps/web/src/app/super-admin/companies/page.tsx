'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Search,
  KeyRound,
  Mail,
  UserCheck,
  Sparkles,
  RefreshCw,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { SuperAdminSidebar } from '@/components/SuperAdminSidebar';

interface Member {
  id: string;
  business_id: string;
  role_id: string;
  name: string;
  email: string;
  password: string;
  pin: string;
  is_active: boolean;
}

interface Role {
  id?: string;
  role: string;
  label: string;
  department: string;
}

interface Company {
  businessId: string;
  businessSlug: string;
  businessName: string;
  roles: Role[];
}

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  const [isSendingEmailId, setIsSendingEmailId] = useState<string | null>(null);

  // Password visibility map { [memberId]: boolean }
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({});
  const [showPinMap, setShowPinMap] = useState<Record<string, boolean>>({});

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('12345678');
  const [newPin, setNewPin] = useState('1234');
  const [showNewPass, setShowNewPass] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPin, setEditPin] = useState('');
  const [showEditPass, setShowEditPass] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // 1. Fetch companies
  const fetchCompanies = useCallback(async () => {
    setIsLoadingCompanies(true);
    setError('');
    try {
      const res = await fetch('/api/admin/credentials');
      if (res.status === 401) {
        router.push('/super-admin/signin');
        return;
      }
      const data = await res.json();
      if (data.companies) {
        // Strict deduplication & normalization
        const seen = new Set<string>();
        const unique: Company[] = [];
        for (const c of data.companies) {
          if (!seen.has(c.businessSlug)) {
            seen.add(c.businessSlug);
            unique.push(c);
          }
        }
        setCompanies(unique);

        // Auto-select first company and its first role if available
        if (unique.length > 0 && unique[0]) {
          const first = unique[0];
          setSelectedCompany(first);
          if (first.roles && first.roles.length > 0 && first.roles[0]) {
            setSelectedRole(first.roles[0]);
          }
        }
      }
    } catch {
      setError('Failed to load companies from server.');
    } finally {
      setIsLoadingCompanies(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // 2. Fetch members when selectedCompany or selectedRole changes
  useEffect(() => {
    if (!selectedCompany || !selectedRole) {
      setMembers([]);
      return;
    }
    setIsLoadingMembers(true);
    const roleId = selectedRole.role || selectedRole.label;
    fetch(`/api/members?businessId=${selectedCompany.businessId}&roleId=${encodeURIComponent(roleId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setMembers(data.members || []);
        } else {
          setMembers([]);
        }
      })
      .catch(() => setMembers([]))
      .finally(() => setIsLoadingMembers(false));
  }, [selectedCompany, selectedRole]);

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    const q = searchQuery.toLowerCase();
    return companies.filter((c) => c.businessName.toLowerCase().includes(q));
  }, [companies, searchQuery]);

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !selectedRole) return;
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim() || !newPin.trim()) {
      setError('All fields (Name, Email, Password, PIN) are required.');
      return;
    }
    setIsSaving(true);
    setError('');
    const roleId = selectedRole.role || selectedRole.label;

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: selectedCompany.businessId,
          role_id: roleId,
          name: newName,
          email: newEmail,
          password: newPassword,
          pin: newPin,
          company_name: selectedCompany.businessName,
          subcompany: selectedRole.department || '',
        }),
      }).then((r) => r.json());

      setIsSaving(false);
      if (res.success) {
        setMembers((prev) => [...prev, res.member]);
        setNewName('');
        setNewEmail('');
        setNewPassword('12345678');
        setNewPin('1234');
        setShowAddModal(false);
        notify(res.message || `Member "${res.member.name}" added successfully and credentials emailed!`);
      } else {
        setError(res.error || 'Failed to add member to database.');
      }
    } catch (err: any) {
      setIsSaving(false);
      setError(err.message || 'Network error while adding member.');
    }
  };

  // Resend Credentials Card Email via SMTP
  const handleResendEmail = async (m: Member) => {
    if (!selectedCompany) return;
    setIsSendingEmailId(m.id);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend_email',
          member_id: m.id,
          company_name: selectedCompany.businessName,
          subcompany: selectedRole?.department || '',
        }),
      }).then((r) => r.json());

      if (res.success && res.emailDispatched) {
        notify(`Credentials card email dispatched to ${m.email} successfully!`);
      } else {
        notify(res.message || res.emailError || 'Email dispatch failed. Please check SMTP settings.');
      }
    } catch (err: any) {
      notify('Failed to send email: ' + (err?.message || 'Network error'));
    } finally {
      setIsSendingEmailId(null);
    }
  };

  // Open Edit Modal
  const startEdit = (m: Member) => {
    setEditingMember(m);
    setEditName(m.name);
    setEditEmail(m.email);
    setEditPassword(m.password === '••••••••' ? '' : m.password);
    setEditPin(m.pin === '••••' ? '' : m.pin);
    setShowEditPass(false);
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsUpdating(true);
    setError('');

    try {
      const res = await fetch('/api/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMember.id,
          name: editName,
          email: editEmail,
          password: editPassword || undefined,
          pin: editPin || undefined,
        }),
      }).then((r) => r.json());

      setIsUpdating(false);
      if (res.success) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === editingMember.id
              ? {
                  ...m,
                  name: editName,
                  email: editEmail,
                  password: editPassword || m.password,
                  pin: editPin || m.pin,
                }
              : m
          )
        );
        setEditingMember(null);
        notify(`Member "${editName}" updated successfully in Supabase!`);
      } else {
        setError(res.error || 'Failed to update member.');
      }
    } catch (err: any) {
      setIsUpdating(false);
      setError(err.message || 'Network error while updating member.');
    }
  };

  // Handle Delete Member
  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete member "${name}"? They will permanently lose access.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/members?id=${id}`, { method: 'DELETE' }).then((r) => r.json());
      if (res.success) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        notify(`Member "${name}" removed from database.`);
      } else {
        setError(res.error || 'Failed to delete member.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while deleting member.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 antialiased font-sans">
      {/* 1. Permanent Left Sidebar Navigation */}
      <SuperAdminSidebar activeTab="companies" />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Companies &amp; Multi-Member Management
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchCompanies}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Refresh</span>
          </button>
        </header>

        {/* Notification Toast */}
        {notification && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2 shadow-2xs animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center space-x-2 shadow-2xs animate-fade-in">
            <X className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 3. Tri-Column Work Area */}
        <div className="flex-1 p-6 overflow-hidden flex gap-5 min-h-0">
          {/* COLUMN 1: Companies Directory */}
          <div className="w-72 xl:w-80 flex-shrink-0 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Companies Directory
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  {filteredCompanies.length} Active
                </span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoadingCompanies ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs">Loading companies...</p>
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No matching companies</div>
              ) : (
                filteredCompanies.map((c) => {
                  const isSelected = selectedCompany?.businessSlug === c.businessSlug;
                  return (
                    <button
                      key={c.businessSlug}
                      type="button"
                      onClick={() => {
                        setSelectedCompany(c);
                        if (c.roles && c.roles.length > 0 && c.roles[0]) {
                          setSelectedRole(c.roles[0]);
                        } else {
                          setSelectedRole(null);
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/90 border border-indigo-200/90 shadow-2xs'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/80 group-hover:text-slate-900'
                          }`}
                        >
                          {c.businessName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold truncate leading-tight ${
                              isSelected ? 'text-indigo-950' : 'text-slate-800'
                            }`}
                          >
                            {c.businessName}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {c.roles?.length || 0} configured roles
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 flex-shrink-0 transition-transform ${
                          isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: Operational Roles */}
          <div className="w-72 xl:w-80 flex-shrink-0 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Operational Roles
                </span>
                <p className="text-xs text-slate-800 font-semibold truncate mt-0.5">
                  {selectedCompany ? selectedCompany.businessName : 'Select a company'}
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                {selectedCompany?.roles?.length || 0}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {!selectedCompany ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Choose a company to see its roles
                </div>
              ) : selectedCompany.roles.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No roles registered</div>
              ) : (
                selectedCompany.roles.map((r) => {
                  const isSelected = selectedRole?.role === r.role;
                  return (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/90 border border-indigo-200/90 shadow-2xs'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center space-x-2">
                          <p
                            className={`text-xs font-semibold truncate ${
                              isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'
                            }`}
                          >
                            {r.label}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {r.department}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {r.role}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 flex-shrink-0 transition-transform ${
                          isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 3: Members Desk */}
          <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    {selectedRole ? selectedRole.label : 'Select a Role'}
                  </h2>
                  {selectedRole && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                      {selectedRole.department}
                    </span>
                  )}
                </div>
              </div>

              {selectedRole && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingMembers ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs">Loading members from Supabase...</p>
                </div>
              ) : !selectedRole ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  Please select an operational role from the middle column.
                </div>
              ) : members.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">No members registered yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click &ldquo;+ Add Member&rdquo; above to create the first authorized account for this role.
                    </p>
                  </div>
                </div>
              ) : (
                members.map((m) => {
                  const showPass = !!showPassMap[m.id];
                  const showPin = !!showPinMap[m.id];
                  return (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex items-start justify-between gap-4"
                    >
                      {/* Line-by-Line Member Details */}
                      <div className="space-y-2 min-w-0 flex-1">
                        {/* Line 1: Name */}
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-semibold text-slate-400 w-14 flex-shrink-0">Name:</span>
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="text-xs font-bold text-slate-900">{m.name}</span>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                              Active
                            </span>
                          </div>
                        </div>

                        {/* Line 2: Email */}
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-semibold text-slate-400 w-14 flex-shrink-0">Email:</span>
                          <span className="font-mono text-xs text-slate-700 select-all">{m.email}</span>
                        </div>

                      {/* Line 3: Password */}
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-semibold text-slate-400 w-14 flex-shrink-0">Pass:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
                              {showPass ? m.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setShowPassMap((prev) => ({ ...prev, [m.id]: !prev[m.id] }))
                              }
                              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition cursor-pointer"
                              title={showPass ? 'Hide Password' : 'Show Password'}
                            >
                              {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Line 4: PIN */}
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-semibold text-slate-400 w-14 flex-shrink-0">PIN:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
                              {showPin ? m.pin : '••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setShowPinMap((prev) => ({ ...prev, [m.id]: !prev[m.id] }))
                              }
                              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition cursor-pointer"
                              title={showPin ? 'Hide PIN' : 'Show PIN'}
                            >
                              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1.5 flex-shrink-0 pt-0.5">
                        <button
                          type="button"
                          disabled={isSendingEmailId === m.id}
                          onClick={() => handleResendEmail(m)}
                          className="p-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition shadow-2xs cursor-pointer disabled:opacity-50"
                          title="Resend Welcome Credentials Email"
                        >
                          {isSendingEmailId === m.id ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(m)}
                          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs cursor-pointer"
                          title="Edit Member"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(m.id, m.name)}
                          className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 transition shadow-2xs cursor-pointer"
                          title="Delete Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Add Member Modal (White Theme) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Authorized Member</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Role: <span className="font-semibold text-slate-800">{selectedRole?.label}</span> &bull; {selectedCompany?.businessName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Login Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="member@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="text-[10px] text-indigo-600 font-semibold"
                    >
                      {showNewPass ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    4-Digit PIN
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save to Live Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Member Modal (White Theme) */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Edit Member Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update credentials for <span className="font-semibold">{editingMember.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">New Password</label>
                    <button
                      type="button"
                      onClick={() => setShowEditPass(!showEditPass)}
                      className="text-[10px] text-indigo-600 font-semibold"
                    >
                      {showEditPass ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showEditPass ? 'text' : 'password'}
                    placeholder="Leave blank to keep"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Leave blank to keep"
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Update Member in Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
