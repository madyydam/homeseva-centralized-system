'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBusinessModule } from '@/businesses';
import { ArrowLeft, Building2 } from 'lucide-react';

interface DashboardPageProps {
  params: {
    businessSlug: string;
  };
}

export default function BusinessDashboardPage({ params }: DashboardPageProps) {
  const { businessSlug } = params;
  const searchParams = useSearchParams();
  const branchParam = searchParams.get('branch') || undefined;
  const divisionParam = searchParams.get('division') || undefined;
  const roleParam = searchParams.get('role') || undefined;

  const [activeRole, setActiveRole] = useState<string | undefined>(roleParam);
  const [activeMemberId, setActiveMemberId] = useState<string | undefined>(undefined);
  const [activeMemberName, setActiveMemberName] = useState<string | undefined>(undefined);
  const [activeMemberEmail, setActiveMemberEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:homeseva_user_session|homeseva_session)=([^;]+)/);
      if (match && match[1]) {
        const parts = match[1].split('.');
        if (parts[0]) {
          const json = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(json);
          if (payload.role) {
            setActiveRole(payload.role);
          }
          if (payload.memberId || payload.sub) {
            setActiveMemberId(payload.memberId || payload.sub);
          }
          if (payload.memberName || payload.username) {
            setActiveMemberName(payload.memberName || payload.username);
          }
          if (payload.email) {
            setActiveMemberEmail(payload.email);
          }
        }
      }
    } catch {
      // Fallback
    }
  }, [roleParam]);

  const businessModule = getBusinessModule(businessSlug);

  if (!businessModule) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-900">
        <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 mb-4 shadow-sm">
          <Building2 className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-black text-slate-900">Business Workspace Not Found</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          No isolated business module is registered for <code className="font-mono font-bold text-amber-800">{businessSlug}</code>.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center space-x-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold shadow-sm transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Central ERP v1.6</span>
        </Link>
      </div>
    );
  }

  const { Dashboard } = businessModule;

  return (
    <Dashboard
      branch={branchParam}
      division={divisionParam}
      role={activeRole || roleParam}
      memberId={activeMemberId}
      memberName={activeMemberName}
      memberEmail={activeMemberEmail}
    />
  );
}
