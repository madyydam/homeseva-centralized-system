'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBusinessModule } from '@/businesses';
import { ArrowLeft, Building2 } from 'lucide-react';
import { saveActiveSubcompany } from '@/lib/clientAuth';

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
  const subcompanyParam = searchParams.get('subcompany') || (businessSlug === 'adjs' || businessSlug === 'printbooth' ? 'printbooth' : undefined);
  const roleParam = searchParams.get('role') || undefined;

  const [activeRole, setActiveRole] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`homeseva_session_${businessSlug}`) || localStorage.getItem('homeseva_current_user');
        if (cached) {
          const p = JSON.parse(cached);
          if (p.role) return p.role;
        }
      } catch {}
    }
    return undefined;
  });
  const [activeMemberId, setActiveMemberId] = useState<string | undefined>(undefined);
  const [activeMemberName, setActiveMemberName] = useState<string | undefined>(undefined);
  const [activeMemberEmail, setActiveMemberEmail] = useState<string | undefined>(undefined);

  // If user navigated directly to /app/printbooth/..., canonicalize to /app/adjs/dashboard?subcompany=printbooth
  useEffect(() => {
    if (businessSlug === 'printbooth' && typeof window !== 'undefined') {
      const q = new URLSearchParams(searchParams.toString());
      q.set('subcompany', 'printbooth');
      window.location.replace(`/app/adjs/dashboard?${q.toString()}`);
    }
  }, [businessSlug, searchParams]);

  useEffect(() => {
    // 1. Instant local cache hydration for zero layout shift
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`homeseva_session_${businessSlug}`) || localStorage.getItem('homeseva_current_user');
        if (cached) {
          const p = JSON.parse(cached);
          if (p.role) setActiveRole(p.role);
          if (p.memberId) setActiveMemberId(p.memberId);
          if (p.memberName) setActiveMemberName(p.memberName);
          if (p.email) setActiveMemberEmail(p.email);
        }
      } catch {}
    }

    // 2. Authoritative server verification via /api/auth/me (reads secure httpOnly cookie)
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated) {
          if (data.role) setActiveRole(data.role);
          if (data.memberId) setActiveMemberId(data.memberId);
          if (data.memberName) setActiveMemberName(data.memberName);
          if (data.email) setActiveMemberEmail(data.email);

          // Update local cache and remember this subcompany as active
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(`homeseva_session_${businessSlug}`, JSON.stringify({
                role: data.role,
                memberId: data.memberId,
                memberName: data.memberName,
                email: data.email,
                businessSlug,
              }));
              saveActiveSubcompany({
                slug: businessSlug === 'printbooth' ? 'adjs' : businessSlug,
                role: data.role,
                branch: branchParam,
                division: divisionParam,
                subcompany: subcompanyParam,
              });
            } catch {}
          }
        } else {
          // After logout or invalid session, protected pages cannot be accessed
          if (typeof window !== 'undefined') {
            window.location.replace(`/signin/${businessSlug}`);
          }
        }
      })
      .catch(() => {});
  }, [businessSlug, branchParam, divisionParam, subcompanyParam]);

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
      division={divisionParam || subcompanyParam}
      role={activeRole}
      memberId={activeMemberId}
      memberName={activeMemberName}
      memberEmail={activeMemberEmail}
    />
  );
}
