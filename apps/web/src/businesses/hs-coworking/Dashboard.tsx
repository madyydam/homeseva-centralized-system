'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Laptop,
  Users,
  Calendar,
  Ticket,
  Plus,
  LogOut,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { BusinessDashboardProps } from '../types';
import { hsCoworkingConfig } from './config';
import { hsCoworkingDb } from './db';
import {
  CoworkingMemberItem,
  MeetingRoomBookingItem,
  DayPassItem,
  HsCoworkingData,
} from './types';

export default function HsCoworkingDashboard({
  role = 'Community & Hub Manager',
}: BusinessDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'rooms' | 'daypasses'>('overview');
  const [data, setData] = useState<HsCoworkingData>({
    members: [],
    roomBookings: [],
    dayPasses: [],
  });

  const refreshData = () => {
    setData({ ...hsCoworkingDb.getData() });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);

  // Form states: Member
  const [mName, setMName] = useState('');
  const [mCompany, setMCompany] = useState('');
  const [mPlan, setMPlan] = useState<CoworkingMemberItem['planType']>('Dedicated Desk');
  const [mFee, setMFee] = useState('8500');

  // Form states: Room
  const [roomTitle, setRoomTitle] = useState<MeetingRoomBookingItem['roomName']>('Boardroom Odyssey (12 Pax)');
  const [roomBy, setRoomBy] = useState('');
  const [roomTime, setRoomTime] = useState('02:00 PM - 04:00 PM');

  // Form states: Day Pass
  const [passVisitor, setPassVisitor] = useState('');
  const [passPhone, setPassPhone] = useState('');
  const [passDesk, setPassDesk] = useState('Flex Desk Zone B-14');

  const monthlyRunRate = data.members.reduce((sum, m) => sum + (Number(m.monthlyFee) || 0), 0);
  const totalDayPassRevenue = data.dayPasses.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim()) return;
    const newMember: CoworkingMemberItem = {
      id: `MEM-${String(data.members.length + 1).padStart(3, '0')}`,
      memberCode: `HS-CW-${String(data.members.length + 101)}`,
      name: mName.trim(),
      company: mCompany.trim() || 'Independent Consultant',
      phone: '+91 98222 33445',
      planType: mPlan,
      monthlyFee: Number(mFee) || 0,
      startDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Active Member',
    };
    hsCoworkingDb.addMember(newMember);
    refreshData();
    setShowMemberModal(false);
    setMName('');
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomBy.trim()) return;
    const newBooking: MeetingRoomBookingItem = {
      id: `ROOM-${String(data.roomBookings.length + 1).padStart(3, '0')}`,
      roomName: roomTitle,
      bookedBy: roomBy.trim(),
      date: new Date().toISOString().split('T')[0] || '',
      timeSlot: roomTime,
      creditsUsed: 2,
      status: 'Confirmed',
    };
    hsCoworkingDb.addRoomBooking(newBooking);
    refreshData();
    setShowRoomModal(false);
    setRoomBy('');
  };

  const handleCreatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passVisitor.trim()) return;
    const newPass: DayPassItem = {
      id: `PASS-${String(data.dayPasses.length + 1).padStart(3, '0')}`,
      visitorName: passVisitor.trim(),
      phone: passPhone.trim(),
      deskAssigned: passDesk,
      amount: 499,
      passDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      accessStatus: 'Checked-In',
    };
    hsCoworkingDb.addDayPass(newPass);
    refreshData();
    setShowPassModal(false);
    setPassVisitor('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 md:h-screen md:sticky md:top-0 z-30">
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <Laptop className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs font-black text-slate-900 truncate">HS Co-working</h1>
                <p className="text-[10px] font-semibold text-indigo-700 truncate">Managed Workspaces</p>
              </div>
            </div>
          </div>

          <div className="p-3 space-y-4">
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Hub Navigation
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'overview'
                      ? 'bg-indigo-50 text-indigo-900 border border-indigo-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 text-indigo-600" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'members'
                      ? 'bg-indigo-50 text-indigo-900 border border-indigo-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Users className="h-4 w-4 text-indigo-600" />
                  <span>Members &amp; Cabins</span>
                  <span className="ml-auto rounded-full bg-indigo-100 text-indigo-800 px-1.5 text-[10px] font-mono font-bold">
                    {data.members.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('rooms')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'rooms'
                      ? 'bg-indigo-50 text-indigo-900 border border-indigo-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span>Conference Rooms</span>
                  <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                    {data.roomBookings.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('daypasses')}
                  className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === 'daypasses'
                      ? 'bg-indigo-50 text-indigo-900 border border-indigo-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Ticket className="h-4 w-4 text-indigo-600" />
                  <span>Day Passes</span>
                  <span className="ml-auto rounded-full bg-slate-100 text-slate-700 px-1.5 text-[10px] font-mono font-bold">
                    {data.dayPasses.length}
                  </span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5 mb-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white shrink-0 shadow-2xs">
              CW
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-900 truncate leading-tight">Hub Specialist</span>
              <span className="block text-[10px] text-indigo-700 font-semibold truncate leading-tight">{role}</span>
            </div>
          </div>
          <Link
            href="/signin/hs-coworking"
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
            <span className="text-sm font-extrabold text-slate-900">HS Co-working · Managed Spaces</span>
            <p className="text-[11px] text-slate-500 font-medium">Session: {role} · Isolated Business DB</p>
          </div>
          <button
            onClick={() => setShowMemberModal(true)}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Onboard Member</span>
          </button>
        </header>

        <div className="p-6 space-y-6 max-w-7xl">
          {/* MEMBERS TABLE */}
          {(activeTab === 'overview' || activeTab === 'members') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Hub Members &amp; Cabin Leases</h3>
                  <p className="text-xs text-slate-500">Dedicated workstations, startup pods, and hot desks</p>
                </div>
                <button onClick={() => setShowMemberModal(true)} className="text-xs font-bold text-indigo-700 hover:text-indigo-800">
                  + Add Member
                </button>
              </div>

              {data.members.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Users className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-2 text-xs font-bold text-slate-700">No members onboarded</h4>
                  <p className="mt-1 text-[11px] text-slate-400">Onboard startup teams or dedicated desk members.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Member ID</th>
                        <th className="py-2.5 px-3">Member &amp; Company</th>
                        <th className="py-2.5 px-3">Plan / Workspace</th>
                        <th className="py-2.5 px-3 font-mono">Monthly Fee</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.members.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-indigo-700">{m.memberCode}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{m.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{m.company}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-700">{m.planType}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹ {m.monthlyFee.toLocaleString('en-IN')} / mo
                          </td>
                          <td className="py-3 px-3">
                            <span className="rounded bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                              {m.status}
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

      {/* Modal: Member */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Onboard Co-working Member</h3>
            <form onSubmit={handleCreateMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Member Name *</label>
                <input
                  type="text"
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  placeholder="e.g. Alok Verma"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company / Startup</label>
                <input
                  type="text"
                  value={mCompany}
                  onChange={(e) => setMCompany(e.target.value)}
                  placeholder="e.g. CloudStack AI"
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plan</label>
                  <select
                    value={mPlan}
                    onChange={(e) => setMPlan(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none font-semibold"
                  >
                    <option value="Hot Desk">Hot Desk</option>
                    <option value="Dedicated Desk">Dedicated Desk</option>
                    <option value="Private 6-Pax Cabin">Private 6-Pax Cabin</option>
                    <option value="Virtual Office Prime">Virtual Office Prime</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Fee (₹)</label>
                  <input
                    type="number"
                    value={mFee}
                    onChange={(e) => setMFee(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

