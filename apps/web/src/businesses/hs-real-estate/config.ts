import { BusinessConfig } from '../types';

export const hsRealEstateConfig: BusinessConfig = {
  id: '10',
  name: 'HS Real Estate',
  slug: 'hs-real-estate',
  subtitle: 'Property Leasing & Assets',
  description: 'Commercial Office Leasing, Retail High-Street Shops, Premium Residential & Asset Portfolios',
  themeColor: 'rose',
  roles: [
    {
      id: 'Asset Portfolio Director',
      label: 'Asset Portfolio Director',
      desc: 'Capital cap-rates, lease agreements & high-value property acquisitions',
      badge: 'Executive',
    },
    {
      id: 'Leasing & Tenant Relations Manager',
      label: 'Leasing & Tenant Relations Manager',
      desc: 'Tenant onboarding, rent roll collection & lease renewals',
      badge: 'Leasing',
    },
    {
      id: 'Property Facility & Maintenance Lead',
      label: 'Property Facility & Maintenance Lead',
      desc: 'HVAC audits, plumbing, civil maintenance & tenant work orders',
      badge: 'Facility',
    },
  ],
};

