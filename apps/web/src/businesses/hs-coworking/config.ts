import { BusinessConfig } from '../types';

export const hsCoworkingConfig: BusinessConfig = {
  id: '5',
  name: 'HS Co-working',
  slug: 'hs-coworking',
  subtitle: 'Flexible Desks & Workspaces',
  description: 'Managed Shared Workspaces, Private Acoustic Cabins & Conference Facilities',
  themeColor: 'indigo',
  roles: [
    {
      id: 'Community & Hub Manager',
      label: 'Community & Hub Manager',
      desc: 'Hub hospitality, member onboarding, events & desk allocation',
      badge: 'Community',
    },
    {
      id: 'Leasing & Enterprise Accounts Lead',
      label: 'Leasing & Enterprise Accounts Lead',
      desc: 'Corporate cabin leases, startup team contracts & renewals',
      badge: 'Leasing',
    },
    {
      id: 'Facility & IT Infrastructure Lead',
      label: 'Facility & IT Infrastructure Lead',
      desc: 'Gigabit fiber, biometric access, meeting room tech & power',
      badge: 'Operations',
    },
  ],
};

