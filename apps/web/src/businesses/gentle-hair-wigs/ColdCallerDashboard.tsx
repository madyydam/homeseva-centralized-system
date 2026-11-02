'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  CalendarRange,
  Clock,
  CheckCircle2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  ClipboardCheck,
} from 'lucide-react';
import { BusinessDashboardProps } from '../types';
import { gentleHairWigsConfig } from './config';
import { CrmView } from './CrmView';
import { DailyReportingView } from './DailyReportingView';

const COLD_CALLER_NAV_ITEMS = [
  {
    id: 'sheet',
    label: 'Monthly Leads Sheet',
    sub: 'Spreadsheet & call notes',
    icon: FileSpreadsheet,
  },
  {
    id: 'annual',
    label: 'Annual 12-Month Sheets',
    sub: 'All months at a glance',
    icon: CalendarRange,
  },
  {
    id: 'follow-up',
    label: 'Scheduled Follow-ups',
    sub: 'Due callback pipeline',
    icon: Clock,
  },
  {
    id: 'converted',
    label: 'Converted Clients',
    sub: 'Studio order handoffs',
    icon: CheckCircle2,
  },
  {
    id: 'daily-reporting',
    label: 'Daily Reporting',
    sub: 'Punch in/out & attendance',
    icon: ClipboardCheck,
  },
] as const;

export function ColdCallerDashboard({
  branch = 'viman-nagar',
  role = 'Cold Caller',
}: BusinessDashboardProps) {
  const BRANCH_LIST = gentleHairWigsConfig.branches!;

  const currentBranch =
    branch === 'ravet' ? 'ravet' : branch === 'kolhapur' ? 'kolhapur' : 'viman-nagar';

  const currentBranchInfo =
    BRANCH_LIST.find((b) => b.slug === currentBranch) || BRANCH_LIST[0]!;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active navigation tab for the Cold Caller
  const [activeTab, setActiveTab] = useState<'sheet' | 'annual' | 'follow-up' | 'converted' | 'daily-reporting'>('sheet');
  const [todayStatus, setTodayStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'PRESENT' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY'>('PENDING');

  const checkStatus = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(`/api/gentle-hair-wigs/daily-reports?branch=${currentBranch}&date=${today}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.reports) && data.reports.length > 0) {
        const myReport = data.reports[0];
        setTodayStatus(myReport.status || 'PENDING');
      }
    } catch {}
  }, [currentBranch]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const navItems = COLD_CALLER_NAV_ITEMS;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans selection:bg-amber-500 selection:text-white">
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <img
            src="/logos/gentle-hair-wigs-logo.jpg"
            alt="Gentle Hair Wigs"
            className="h-8 w-8 rounded-lg object-contain border border-amber-200/80 p-0.5"
          />
          <div>
            <span className="block text-xs font-black text-slate-900 leading-tight">Gentle Hair Wigs</span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200/80">
              {currentBranchInfo.shortName} Studio
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150">
          <div className="bg-white rounded-t-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">Navigation</span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as typeof activeTab);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl font-bold transition text-xs ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-amber-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.id === 'daily-reporting' && (
                      <span
                        className={`text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase ${
                          todayStatus === 'PRESENT'
                            ? isActive ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                            : todayStatus === 'HALF_DAY'
                            ? isActive ? 'bg-white text-amber-900' : 'bg-amber-100 text-amber-900'
                            : todayStatus === 'IN_PROGRESS'
                            ? isActive ? 'bg-white text-amber-900' : 'bg-amber-100 text-amber-900'
                            : isActive ? 'bg-white text-rose-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {todayStatus === 'PRESENT'
                          ? 'Reported'
                          : todayStatus === 'HALF_DAY'
                          ? 'Half Day'
                          : todayStatus === 'LEAVE'
                          ? 'Leave'
                          : todayStatus === 'HOLIDAY'
                          ? 'Holiday'
                          : todayStatus === 'IN_PROGRESS'
                          ? 'Active'
                          : 'Pending'}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-100">
              <Link
                href="/signin/gentle-hair-wigs"
                className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                <LogOut className="h-3 w-3" />
                <span>Sign In As Another User / Exit</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Responsive Sidebar - Graceful Vertical Rhythm & Generous Tab Breathing Room */}
      <aside
        className={`hidden md:flex bg-white border-r border-slate-200 flex-col justify-between shrink-0 h-screen sticky top-0 z-30 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Header Brand & Collapse Toggle */}
          <div
            className={`h-14 flex items-center border-b border-slate-200/80 bg-white shrink-0 px-3 transition-all ${
              isSidebarCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            {!isSidebarCollapsed ? (
              <>
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-200/90 bg-amber-50/30 p-0.5 shadow-2xs overflow-hidden">
                    <img
                      src="/logos/gentle-hair-wigs-logo.jpg"
                      alt="Gentle Hair Wigs"
                      width={32}
                      height={32}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-black text-slate-900 truncate leading-tight">
                      Gentle Hair Wigs
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200/80 leading-none">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      {currentBranchInfo.shortName}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-amber-800 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition cursor-pointer"
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200/90 bg-amber-50/30 p-0.5 hover:bg-amber-100 hover:border-amber-400 transition cursor-pointer group shadow-2xs"
                  title="Expand Sidebar"
                >
                  <img
                    src="/logos/gentle-hair-wigs-logo.jpg"
                    alt="Logo"
                    className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                  />
                </button>
              </div>
            )}
          </div>

          {/* Sub-header expand trigger when collapsed */}
          {isSidebarCollapsed && (
            <div className="flex justify-center py-1 border-b border-slate-100 bg-slate-50/60">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-100/70 transition cursor-pointer"
                title="Click to Expand Sidebar"
              >
                <PanelLeftOpen className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Spacious Navigation - Utilizing Vertical Height Without Cramming */}
          <div className="p-3.5 overflow-y-auto flex-1 flex flex-col">
            <nav className="space-y-3 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as typeof activeTab)}
                    title={item.label}
                    className={`group relative w-full flex items-center rounded-xl font-bold transition-all duration-150 cursor-pointer overflow-hidden ${
                      isSidebarCollapsed
                        ? 'justify-center py-3 px-2'
                        : 'justify-start px-3.5 py-3 text-[12.5px]'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-amber-50/80 active:scale-98'
                    }`}
                  >
                    {/* Active & Hover Left Edge Bar */}
                    {!isSidebarCollapsed && (
                      <span
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-150 ${
                          isActive
                            ? 'h-6 bg-white opacity-100 shadow-xs'
                            : 'h-0 bg-amber-500 opacity-0 group-hover:h-4 group-hover:opacity-100'
                        }`}
                      />
                    )}

                    <div
                      className={`flex items-center min-w-0 ${
                        isSidebarCollapsed ? 'justify-center' : 'gap-3 pr-0.5 pl-1 flex-1'
                      }`}
                    >
                      <div className="relative flex items-center justify-center shrink-0">
                        <Icon
                          className={`shrink-0 transition-transform duration-150 ${
                            isSidebarCollapsed ? 'h-5 w-5' : 'h-4.5 w-4.5'
                          } ${
                            isActive
                              ? 'text-white'
                              : 'text-amber-700/80 group-hover:text-amber-600 group-hover:scale-105'
                          }`}
                        />
                        {isSidebarCollapsed && item.id === 'daily-reporting' && todayStatus === 'PENDING' && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                          </span>
                        )}
                      </div>
                      {!isSidebarCollapsed && (
                        <div className="flex flex-col text-left min-w-0 flex-1">
                          <span className="truncate whitespace-nowrap tracking-tight text-[12px] font-black">
                            {item.label}
                          </span>
                          <span
                            className={`text-[9.5px] truncate font-medium ${
                              isActive ? 'text-amber-100' : 'text-slate-400'
                            }`}
                          >
                            {item.sub}
                          </span>
                        </div>
                      )}
                      {!isSidebarCollapsed && item.id === 'daily-reporting' && (
                        <span
                          className={`ml-auto shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                            todayStatus === 'PRESENT'
                              ? isActive ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                              : todayStatus === 'HALF_DAY'
                              ? isActive ? 'bg-white text-amber-900' : 'bg-amber-100 text-amber-900'
                              : todayStatus === 'IN_PROGRESS'
                              ? isActive ? 'bg-white text-amber-900' : 'bg-amber-100 text-amber-900'
                              : isActive ? 'bg-white text-rose-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {todayStatus === 'PRESENT' ? '✓' : todayStatus === 'HALF_DAY' ? '½' : todayStatus === 'IN_PROGRESS' ? '●' : '!'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Profile Footer (Role: Cold Caller, No Switch Role Buttons) */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/80 shrink-0">
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center space-x-2.5 mb-2.5 px-0.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-black text-white shrink-0 shadow-xs bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-500 shadow-amber-500/20">
                  CC
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-slate-900 truncate leading-tight">
                    {role || 'Cold Caller'}
                  </span>
                  <span className="block text-[10px] font-semibold truncate leading-tight text-slate-500">
                    {currentBranchInfo.shortName} Studio
                  </span>
                </div>
              </div>

              <div>
                <Link
                  href="/signin/gentle-hair-wigs"
                  className="w-full flex items-center justify-center space-x-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 py-1.5 text-[10.5px] font-bold text-slate-600 hover:text-slate-900 transition-all duration-150 shadow-2xs cursor-pointer group"
                >
                  <LogOut className="h-3 w-3 text-slate-400 group-hover:text-rose-600 transition-transform" />
                  <span>Sign In As Another User / Exit</span>
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-black text-white shadow-xs bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-500"
                title={`User Role: ${role}`}
              >
                CC
              </div>
              <Link
                href="/signin/gentle-hair-wigs"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-slate-200 transition cursor-pointer"
                title="Sign In As Another User / Exit"
              >
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main CRM Canvas */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Top Header Bar - Centered Title & Studio Branch Selector */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          {/* Left spacer / expand trigger */}
          <div className="flex items-center">
            {isSidebarCollapsed && (
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="hidden md:flex p-2 rounded-xl text-slate-500 hover:text-amber-800 hover:bg-amber-50 border border-slate-200 transition cursor-pointer"
                title="Expand Sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Centered Middle Section: Title & Studio Selector ("center me middle me kar") */}
          <div className="flex items-center justify-center space-x-3.5 mx-auto">
            <h1 className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-tight whitespace-nowrap">
              Client CRM & Monthly Sheets
            </h1>

            {/* Studio Branch Switcher */}
            <div className="inline-flex items-center space-x-1 bg-amber-50/90 border border-amber-200/80 rounded-lg p-0.5 shadow-2xs">
              {BRANCH_LIST.map((b) => (
                <Link
                  key={b.slug}
                  href={`/app/gentle-hair-wigs/dashboard?branch=${b.slug}&role=${encodeURIComponent(role)}`}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition ${
                    currentBranch === b.slug
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  {b.shortName}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Header Action: Quick Daily Reporting status */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('daily-reporting')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition shadow-2xs cursor-pointer ${
                activeTab === 'daily-reporting'
                  ? 'bg-amber-600 border-amber-600 text-white shadow-amber-600/30'
                  : todayStatus === 'PRESENT'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : todayStatus === 'HALF_DAY'
                  ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                  : todayStatus === 'IN_PROGRESS'
                  ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                  : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
              }`}
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Daily Reporting:</span>
              <span>
                {todayStatus === 'PRESENT'
                  ? 'Reported (Present)'
                  : todayStatus === 'HALF_DAY'
                  ? 'Half Day'
                  : todayStatus === 'LEAVE'
                  ? 'Leave'
                  : todayStatus === 'HOLIDAY'
                  ? 'Holiday'
                  : todayStatus === 'IN_PROGRESS'
                  ? 'Shift Active'
                  : 'Not Submitted'}
              </span>
            </button>
          </div>
        </header>

        {/* Workspace Content */}
        <div className="p-3.5 sm:p-5 max-w-[1720px] w-full">
          {activeTab === 'daily-reporting' ? (
            <DailyReportingView
              branch={currentBranch}
              onReportUpdated={checkStatus}
            />
          ) : (
            <CrmView
              branch={currentBranch}
              initialViewMode={activeTab === 'annual' ? 'month-selector' : 'month-sheet'}
              initialStatusFilter={
                activeTab === 'follow-up'
                  ? 'Follow-up'
                  : activeTab === 'converted'
                  ? 'Converted'
                  : 'all'
              }
            />
          )}
        </div>
      </main>
    </div>
  );
}

