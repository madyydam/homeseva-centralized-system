'use client';

import dynamic from 'next/dynamic';
import { BusinessDashboardProps } from '../types';

const ColdCallerDashboard = dynamic(
  () => import('./ColdCallerDashboard').then((m) => m.ColdCallerDashboard),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-600 border-t-transparent" />
      </div>
    ),
    ssr: false,
  }
);

const ManagerDashboard = dynamic(
  () => import('./ManagerDashboard').then((m) => m.ManagerDashboard),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-600 border-t-transparent" />
      </div>
    ),
    ssr: false,
  }
);

export default function Dashboard(props: BusinessDashboardProps) {
  const role = props.role?.toLowerCase() || '';
  const isColdCaller = role.includes('cold') || role.includes('telecaller');

  if (isColdCaller) {
    return <ColdCallerDashboard {...props} />;
  }

  return <ManagerDashboard {...props} />;
}
