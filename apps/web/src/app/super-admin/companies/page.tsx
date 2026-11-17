'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Users, ChevronRight, Plus, Trash2,
  ArrowLeft, Edit2, Check, X, Eye, EyeOff, ShieldCheck, LogOut, HardDrive
} from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  // Add member form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('12345678');
  const [newPin, setNewPin] = useState('1234');
  const [isSaving, setIsSaving] = useState(false);

  // Edit member state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPin, setEditPin] = useState('');
  const [showEditPass, setShowEditPass] = useState(false);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  // Fetch companies and their roles
  useEffect(() => {
    setIsLoading(true);
    fetch('/api/admin/credentials')
      .then(r => {
        if (r.status === 401) {
          router.push('/super-admin/signin');
          return null;
        }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        if (data.companies) {
          // De-duplicate companies by businessSlug
          const seen = new Set<string>();
          const unique: Company[] = [];
          for (const c of data.companies) {
            if (!seen.has(c.businessSlug)) {
              seen.add(c.businessSlug);
              unique.push(c);
            }
          }
          setCompanies(unique);
          if (unique.length > 0) {
            setSelectedCompany(unique[0]);
            if (unique[0].roles?.length > 0) {
              setSelectedRole(unique[0].roles[0]);
            }
          }
        }
        setIsLoading(false);
      })
      .catch(() => {
        setError('Failed to load companies from server.');
        setIsLoading(false);
      });
  }, [router]);

  // Fetch members when company or role changes
  useEffect(() => {
    if (!selectedCompany || !selectedRole) {
      setMembers([]);
      return;
    }
    const roleId = selectedRole.role || selectedRole.label;
    fetch(`/api/members?businessId=${selectedCompany.businessId}&roleId=${encodeURIComponent(roleId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setMembers(data.members || []);
        } else {
          setMembers([]);
        }
      })
      .catch(() => setMembers([]));
  }, [selectedCompany, selectedRole]);

  const handleAddMember = async () => {
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
        }),
      }).then(r => r.json());

      setIsSaving(false);
      if (res.success) {
        setMembers(prev => [...prev, res.member]);
        setNewName('');
        setNewEmail('');
        setNewPassword('12345678');
        setNewPin('1234');
        setShowAddForm(false);
        notify(`Member "${res.member.name}" added successfully!`);
      } else {
        setError(res.error || 'Failed to add member to database.');
      }
    } catch (err: any) {
      setIsSaving(false);
      setError(err.message || 'Network error while adding member.');
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove member "${name}"? They will no longer be able to log in.`)) return;
    try {
      const res = await fetch(`/api/members?id=${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setMembers(prev => prev.filter(m => m.id !== id));
        notify(`Member "${name}" removed from database.`);
      } else {
        setError(res.error || 'Failed to delete member.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while deleting member.');
    }
  };

  const handleEditSave = async (id: string) => {
    try {
      const res = await fetch('/api/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: editName,
          email: editEmail,
          password: editPassword,
          pin: editPin,
        }),
      }).then(r => r.json());

      if (res.success) {
        setMembers(prev => prev.map(m => m.id === id ? { ...m, name: editName, email: editEmail } : m));
        setEditingId(null);
        notify('Member updated successfully in live database!');
      } else {
        setError(res.error || 'Update failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while updating member.');
    }
  };

  const handleSignOut = async () => {
    document.cookie = 'homeseva_sa_token=; Max-Age=0; path=/;';
    router.push('/super-admin/signin');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 rounded-full border-3 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/super-admin/credentials"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Credentials Console</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="flex h-6 items-center rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 text-xs font-bold">
            COMPANIES &amp; MEMBERS
          </span>
        </div>

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
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Lock Console</span>
          </button>
        </div>
      </header>

      {/* Notifications */}
      {notification && (
        <div className="mx-6 mt-4 px-4 py-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-medium flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}
      {error && (
        <div className="mx-6 mt-4 px-4 py-2.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tri-Column Layout: Companies -> Roles -> Members */}
      <div className="flex h-[calc(100vh-65px)]">
        {/* Column 1: Companies (Deduplicated) */}
        <div className="w-72 border-r border-slate-800 bg-slate-900/60 overflow-y-auto">
          <div className="px-4 py-3 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Companies</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">{companies.length}</span>
          </div>
          <div className="divide-y divide-slate-800/60">
            {companies.map(c => {
              const isSelected = selectedCompany?.businessSlug === c.businessSlug;
              return (
                <button
                  key={c.businessSlug}
                  onClick={() => {
                    setSelectedCompany(c);
                    if (c.roles?.length > 0) {
                      setSelectedRole(c.roles[0]);
                    } else {
                      setSelectedRole(null);
                    }
                    setShowAddForm(false);
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-amber-500/10 text-amber-300 font-semibold border-l-2 border-amber-500'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="truncate">
                    <div className="text-sm truncate">{c.businessName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">/{c.businessSlug}</div>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 2: Roles of Selected Company */}
        <div className="w-80 border-r border-slate-800 bg-slate-900/40 overflow-y-auto">
          {selectedCompany ? (
            <>
              <div className="px-4 py-3 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Roles ({selectedCompany.roles?.length || 0})</span>
                <span className="text-[11px] text-amber-400 truncate max-w-[150px]">{selectedCompany.businessName}</span>
              </div>
              <div className="divide-y divide-slate-800/60">
                {(selectedCompany.roles || []).map(r => {
                  const roleId = r.role || r.label;
                  const isSelected = (selectedRole?.role || selectedRole?.label) === roleId;
                  return (
                    <button
                      key={roleId}
                      onClick={() => {
                        setSelectedRole(r);
                        setShowAddForm(false);
                      }}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-amber-500/15 text-amber-300 font-semibold border-l-2 border-amber-400'
                          : 'text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-sm font-medium truncate">{r.label || r.role}</div>
                        <div className="text-[11px] text-slate-500">{r.department || 'General'}</div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-600'}`} />
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">Select a company from the left column.</div>
          )}
        </div>

        {/* Column 3: Active Members in Selected Role */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {selectedRole && selectedCompany ? (
            <>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {selectedCompany.businessName} &bull; {selectedRole.department || 'Role'}
                  </div>
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2 mt-0.5">
                    <Users className="w-5 h-5 text-amber-400" />
                    <span>{selectedRole.label || selectedRole.role}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage active members. Each member logs in with their own registered email, password &amp; PIN.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddForm(prev => !prev)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>
              </div>

              {/* Add Member Form Modal / Drawer */}
              {showAddForm && (
                <div className="mb-6 p-5 rounded-2xl border border-amber-500/40 bg-slate-900 shadow-xl">
                  <h3 className="text-sm font-bold text-amber-300 mb-4 flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add New Member to {selectedRole.label || selectedRole.role}</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Registered Email</label>
                      <input
                        type="email"
                        placeholder="e.g. rahul@company.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
                      <input
                        type="text"
                        placeholder="Default: 12345678"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">4-Digit Security PIN</label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Default: 1234"
                        value={newPin}
                        onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleAddMember}
                      disabled={isSaving}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-emerald-400 disabled:opacity-50 transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSaving ? 'Saving to Database...' : 'Save Member Instantly'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-slate-700 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Members List */}
              {members.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
                  <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-400">No individual members added to this role yet.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Click &ldquo;Add Member&rdquo; above to register individual coldcallers or staff accounts.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map(m => {
                    const isEditing = editingId === m.id;
                    return (
                      <div
                        key={m.id}
                        className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition"
                      >
                        {isEditing ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              placeholder="Name"
                              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                            />
                            <input
                              type="email"
                              value={editEmail}
                              onChange={e => setEditEmail(e.target.value)}
                              placeholder="Email"
                              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                            />
                            <div className="relative">
                              <input
                                type={showEditPass ? 'text' : 'password'}
                                value={editPassword}
                                onChange={e => setEditPassword(e.target.value)}
                                placeholder="New password (leave blank to keep current)"
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-mono pr-9"
                              />
                              <button
                                type="button"
                                onClick={() => setShowEditPass(!showEditPass)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                              >
                                {showEditPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <input
                              type="text"
                              maxLength={4}
                              value={editPin}
                              onChange={e => setEditPin(e.target.value.replace(/\D/g, ''))}
                              placeholder="New PIN (leave blank to keep current)"
                              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                            />
                            <div className="col-span-full flex items-center space-x-2 mt-2">
                              <button
                                type="button"
                                onClick={() => handleEditSave(m.id)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-emerald-400"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Save Changes</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 border border-slate-700 bg-slate-800 text-slate-300 rounded-lg text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-sm">
                                {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-white flex items-center space-x-2">
                                  <span>{m.name}</span>
                                  {m.email === 'abc@xyz.com' && (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                                      UNIVERSAL DEMO
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 font-mono mt-0.5">{m.email}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  Password: <span className="font-mono text-slate-400">••••••••</span> &bull; PIN: <span className="font-mono text-slate-400">••••</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(m.id);
                                  setEditName(m.name);
                                  setEditEmail(m.email);
                                  setEditPassword('');
                                  setEditPin('');
                                }}
                                className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
                                title="Edit Member Credentials"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMember(m.id, m.name)}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                                title="Remove Member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Building2 className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm font-medium">Select a company and role to inspect and manage members</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
