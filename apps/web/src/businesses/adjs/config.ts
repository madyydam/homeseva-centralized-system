import { BusinessConfig } from '../types';

export const adjsConfig: BusinessConfig = {
  id: '7',
  name: 'ADJS',
  slug: 'adjs',
  subtitle: 'Smart Self-Service Printing Kiosks',
  description: 'Direct B2B Sales of Smart Self-Service Printing Kiosks, Cloud Print Software & Merchant Solutions',
  themeColor: 'purple',
  divisions: [
    {
      slug: 'printbooth',
      name: 'PRINTBOOTH™',
      desc: 'Smart, self-service printing kiosk business. Think It. Print It.',
      badge: 'Self-Service Kiosk',
    },
  ],
  roles: [
    {
      id: 'Owner',
      label: 'Owner',
      desc: 'Executive business P&L, machine sales revenue & network expansion',
      badge: 'Executive',
    },
    {
      id: 'Manager',
      label: 'Manager',
      desc: 'Machine order pipeline, merchant onboarding & dispatch operations',
      badge: 'Operations',
    },
    {
      id: 'Coldcaller',
      label: 'Coldcaller',
      desc: 'Dedicated B2B merchant acquisition, calling desk & centralized CRM',
      badge: 'Sales / CRM',
    },
    {
      id: 'Developer',
      label: 'Developer',
      desc: 'Kiosk touchscreen OS, Cloud Print APIs & payment gateway systems',
      badge: 'Engineering',
    },
    {
      id: 'Staff',
      label: 'Staff',
      desc: 'Freight dispatch logistics, invoicing challans & merchant helpdesk',
      badge: 'Support',
    },
  ],
};

