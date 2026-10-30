export interface SaasTenantItem {
  id: string;
  tenantCode: string;
  appName: string;
  developerOrg: string;
  tier: 'Developer Free' | 'Pro Growth ($299/mo)' | 'Enterprise Dedicated ($1,499/mo)';
  monthlyBilling: number;
  apiRequestsToday: number;
  status: 'Healthy' | 'Rate Limited' | 'Overdue';
  createdDate: string;
}

export interface ApiKeyItem {
  id: string;
  keyLabel: string;
  tenantName: string;
  keyPrefix: string;
  rateLimitPerMin: number;
  lastUsed: string;
  status: 'Active' | 'Revoked';
}

export interface AppBuildJobItem {
  id: string;
  buildId: string;
  appName: string;
  platform: 'iOS (IPA)' | 'Android (AAB)' | 'Web (PWA)';
  duration: string;
  status: 'Success' | 'Building' | 'Failed';
}

export interface FirstMoverAdvantageData {
  tenants: SaasTenantItem[];
  apiKeys: ApiKeyItem[];
  builds: AppBuildJobItem[];
}

