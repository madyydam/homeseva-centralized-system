import React from 'react';

export interface BusinessRole {
  id: string;
  label: string;
  desc: string;
  badge: string;
}

export interface BusinessBranch {
  slug: string;
  name: string;
  shortName: string;
  address?: string;
  suites?: number;
  staffCount?: number;
  tag?: string;
}

export interface BusinessDivision {
  slug: string;
  name: string;
  desc: string;
  badge: string;
}

export interface BusinessConfig {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  logoImg?: string;
  themeColor: 'amber' | 'blue' | 'emerald' | 'indigo' | 'cyan' | 'purple' | 'orange' | 'sky' | 'rose';
  roles: BusinessRole[];
  branches?: BusinessBranch[];
  divisions?: BusinessDivision[];
}

export interface BusinessDashboardProps {
  branch?: string | undefined;
  division?: string | undefined;
  role?: string | undefined;
}

export interface BusinessModule {
  config: BusinessConfig;
  Dashboard: React.ComponentType<BusinessDashboardProps>;
}
