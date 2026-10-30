import { BusinessConfig } from '../types';

export const ecolabDistributionConfig: BusinessConfig = {
  id: '4',
  name: 'Ecolab Distribution',
  slug: 'ecolab-distribution',
  subtitle: 'Hygiene & Chemical Solutions',
  description: 'Industrial Cleaning Chemicals, Food Safety & Water Sanitization Systems',
  logoImg: '/logos/ecolab-logo.jpg',
  themeColor: 'blue',
  roles: [
    {
      id: 'Territory Sales Manager',
      label: 'Territory Sales Manager',
      desc: 'Institutional key accounts, hospital & hotel chemical supply contracts',
      badge: 'Sales',
    },
    {
      id: 'Technical Chemical Specialist',
      label: 'Technical Chemical Specialist',
      desc: 'Dispenser calibration, chemical dosage audit & wash quality',
      badge: 'Technical',
    },
    {
      id: 'Warehouse & Hazchem Officer',
      label: 'Warehouse & Hazchem Officer',
      desc: 'Chemical barrel inventory, MSDS compliance & safe dispatch',
      badge: 'Safety',
    },
    {
      id: 'Institutional Billing Lead',
      label: 'Institutional Billing Lead',
      desc: 'Corporate accounts, monthly rate contracts & GST invoicing',
      badge: 'Finance',
    },
  ],
};

