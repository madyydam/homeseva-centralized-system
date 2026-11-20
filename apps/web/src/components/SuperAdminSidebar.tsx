'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/clientAuth';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';
import {
  Building2,
  ShieldCheck,
  KeyRound,
  HardDrive,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface SuperAdminSidebarProps {
  activeTab: 'companies' | 'security' | 'backups';
}

export function SuperAdminSidebar({ activeTab }: SuperAdminSidebarProps) {
  const router = useRouter();
  const { isSidebarCollapsed: isCollapsed, toggleSidebar } = useSidebarCollapse();

  const handleSignOut = async () => {
    await logoutUser();
    router.push('/super-admin/signin');
  };

  const navItems = [
    {
      id: 'companies',
      label: 'Companies',
      desc: 'Roles & Member Accounts',
      icon: Building2,
      href: '/super-admin/companies',
    },
    {
      id: 'security',
      label: 'Security & Master Keys',
      desc: 'Super Admin 4-Factor Auth',
      icon: KeyRound,
      href: '/super-admin/credentials',
    },
    {
      id: 'backups',
      label: 'Database Backups',
      desc: 'Snapshots & System Export',
      icon: HardDrive,
      href: '/super-admin/backup',
    },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-72'
      } flex-shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between min-h-screen select-none transition-all duration-200`}
    >
      {/* Top Header */}
      <div>
        <div
          className={`p-4 border-b border-slate-100 flex items-center ${
            isCollapsed ? 'justify-center flex-col space-y-3' : 'justify-between'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-900 leading-tight truncate">
                  Super Admin
                </h1>
              </div>
            )}
          </div>

          {/* Collapse Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer flex-shrink-0"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-indigo-600" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Section */}
        <div className="p-3 space-y-1">
          {!isCollapsed && (
            <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Control Modules
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                title={isCollapsed ? `${item.label} (${item.desc})` : undefined}
                className={`group flex items-center ${
                  isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-3'
                } rounded-xl transition-all ${
                  isActive
                    ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-xs border border-indigo-100/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {!isCollapsed && (
                    <div className="min-w-0">
                      <p className="text-sm truncate leading-tight">{item.label}</p>
                      <p
                        className={`text-[11px] truncate mt-0.5 ${
                          isActive ? 'text-indigo-500 font-normal' : 'text-slate-400'
                        }`}
                      >
                        {item.desc}
                      </p>
                    </div>
                  )}
                </div>
                {!isCollapsed && isActive && (
                  <ChevronRight className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Authority & Sign Out */}
      <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
        {!isCollapsed ? (
          <>
            <div className="px-3 py-2 rounded-xl bg-white border border-slate-200/80 flex items-center space-x-2.5 shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 leading-none">Authority Active</p>
                <p className="text-[10px] text-slate-400 truncate mt-1">PostgreSQL Engine</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-700 font-semibold text-xs hover:bg-rose-100 hover:border-rose-300 transition-colors shadow-2xs cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Lock Console</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs"
              title="Authority Active (PostgreSQL)"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50/80 text-rose-700 flex items-center justify-center hover:bg-rose-100 transition shadow-2xs cursor-pointer"
              title="Lock Console"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
