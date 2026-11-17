'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  CalendarRange,
  Clock,
  CheckCircle2,
  LogOut,
  PhoneCall,
  Menu,
  X,
  Printer,
} from 'lucide-react';
import { BusinessDashboardProps } from '../types';
import { CrmView } from './CrmView';

const COLD_CALLER_TABS = [
  {
    id: 'sheet',
    label: 'Monthly Leads Sheet',
    sub: 'Merchant inquiries & call notes',
    icon: FileSpreadsheet,
  },
  {
    id: 'annual',
    label: 'Annual 12-Month Sheets',
    sub: 'All months calling overview',
    icon: CalendarRange,
  },
  {
    id: 'follow-up',
    label: 'Scheduled Follow-ups',
    sub: 'Pending callback pipeline',
    icon: Clock,
  },
  {
    id: 'converted',
    label: 'Converted Machines (Sold)',
    sub: 'Closed kiosk sales',
    icon: CheckCircle2,
  },
] as const;

export function ColdcallerDashboard({
  role = 'Coldcaller',
  memberId,
  memberName,
  memberEmail,
}: BusinessDashboardProps) {
  const [activeTab, setActiveTab] = useState<'sheet' | 'annual' | 'follow-up' | 'converted'>('sheet');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Mobile Top Navigation */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-200">
            <Printer className="h-4 w-4" />
          </div>
          <div>
            <span className="block text-xs font-black text-slate-900 leading-tight">ADJS · PRINTBOOTH™</span>
            <span className="block text-[10px] font-bold text-blue-700">Telecalling Desk</span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 p-3 space-y-1 z-30">
          {COLD_CALLER_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4 text-blue-600" />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/signin/adjs"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4 text-slate-400" />
              <span>Sign Out / Exit</span>
            </Link>
          </div>
        </div>
      )}

      {/* Desktop Dedicated Sidebar: Strictly Coldcalling Desk ONLY */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col justify-between shrink-0 h-screen sticky top-0 z-30">
        <div>
          {/* Header Brand */}
          <div className="h-16 flex items-center px-4 border-b border-slate-200">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-200">
                <Printer className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs font-black text-slate-900 tracking-tight">ADJS · PRINTBOOTH™</h1>
                <p className="text-[10px] font-bold text-blue-700">Dedicated Calling Desk</p>
              </div>
            </div>
          </div>

          {/* Navigation Items (STRICTLY NO OVERVIEW, NO REVENUE, NO DISPATCH, NO DEV APIS) */}
          <div className="p-3.5 space-y-3">
            <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Telecalling Workspaces
            </span>
            <nav className="space-y-1.5">
              {COLD_CALLER_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-start space-x-2.5 rounded-xl px-3 py-2.5 text-left transition ${
                      isActive
                        ? 'bg-blue-50/90 text-blue-900 border border-blue-200 shadow-2xs font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold leading-tight">{tab.label}</span>
                      <span className="block text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        {tab.sub}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Session Footer (Role: Coldcaller - Strictly Sandboxed) */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-start space-x-2.5 mb-2.5 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-black text-white shrink-0 shadow-2xs mt-0.5">
              CC
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <span className="block text-xs font-bold text-slate-900 truncate leading-tight">
                {role || 'Coldcaller'}
              </span>
              <span className="block text-[11px] font-semibold text-slate-700 truncate leading-tight">
                {memberName || 'Active Caller'}
              </span>
              <span className="block text-[10px] text-blue-700 font-mono truncate leading-tight">
                {memberEmail || 'caller@printbooth.in'}
              </span>
            </div>
          </div>
          <Link
            href="/signin/adjs"
            className="w-full flex items-center justify-center space-x-1.5 rounded-lg border border-slate-200 bg-white py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
          >
            <LogOut className="h-3 w-3" />
            <span>Sign Out / Exit</span>
          </Link>
        </div>
      </aside>

      {/* Main Calling Workspace Canvas */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
          <div>
            <span className="text-sm font-extrabold text-slate-900">
              ADJS · PRINTBOOTH™
            </span>
          </div>
        </header>

        {/* Body Canvas */}
        <div className="p-6 max-w-7xl">
          {activeTab === 'sheet' && (
            <CrmView
              telecallerId={memberId}
              telecallerName={memberName}
              telecallerEmail={memberEmail}
              initialViewMode="month-sheet"
              initialStatusFilter="all"
            />
          )}

          {activeTab === 'annual' && (
            <CrmView
              telecallerId={memberId}
              telecallerName={memberName}
              telecallerEmail={memberEmail}
              initialViewMode="month-selector"
              initialStatusFilter="all"
            />
          )}

          {activeTab === 'follow-up' && (
            <CrmView
              telecallerId={memberId}
              telecallerName={memberName}
              telecallerEmail={memberEmail}
              initialViewMode="month-sheet"
              initialStatusFilter="followup"
            />
          )}

          {activeTab === 'converted' && (
            <CrmView
              telecallerId={memberId}
              telecallerName={memberName}
              telecallerEmail={memberEmail}
              initialViewMode="month-sheet"
              initialStatusFilter="converted"
            />
          )}
        </div>
      </main>
    </div>
  );
}

