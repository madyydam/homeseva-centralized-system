import { BusinessConfig } from '../types';

export const gentleHairWigsConfig: BusinessConfig = {
  id: '3',
  name: 'Gentle Hair Wigs',
  slug: 'gentle-hair-wigs',
  subtitle: 'Viman Nagar, Ravet & Kolhapur',
  description: 'Custom Hair Systems, Medical Prosthetics & Aesthetic Salons',
  logoImg: '/logos/gentle-hair-wigs-logo.jpg',
  themeColor: 'amber',
  branches: [
    {
      slug: 'viman-nagar',
      name: 'Studio of Viman Nagar (Pune East)',
      shortName: 'Viman Nagar',
      address: 'Phoenix Marketcity Corridor, Viman Nagar, Pune 411014',
      suites: 4,
      staffCount: 24,
      tag: 'Flagship Private Fitting Lounge',
    },
    {
      slug: 'ravet',
      name: 'Studio of Ravet (PCMC Lounge)',
      shortName: 'Ravet',
      address: 'Kiwale-Ravet BRTS Corridor, Ravet, PCMC 412101',
      suites: 3,
      staffCount: 18,
      tag: 'PCMC Express Styling Center',
    },
    {
      slug: 'kolhapur',
      name: 'Studio of Kolhapur (South Maharashtra)',
      shortName: 'Kolhapur',
      address: 'Near Station Road, Tarabai Park, Kolhapur 416003',
      suites: 3,
      staffCount: 16,
      tag: 'South Maharashtra Regional Studio',
    },
  ],
  roles: [
    {
      id: 'Studio Manager',
      label: 'Studio Manager',
      desc: 'Studio operations, staff roster & desk oversight',
      badge: 'Operations',
    },
    {
      id: 'Senior Wig Specialist & Stylist',
      label: 'Senior Wig Specialist & Stylist',
      desc: 'Custom hair fittings, styling & cutting suites',
      badge: 'Styling',
    },
    {
      id: 'Scalp & Measurement Consultant',
      label: 'Scalp & Measurement Consultant',
      desc: 'Head contouring, base templates & scalp scans',
      badge: 'Consultant',
    },
    {
      id: 'Billing & Front Desk',
      label: 'Billing & Front Desk',
      desc: 'Counter POS, appointments & invoicing register',
      badge: 'Front Desk',
    },
    {
      id: 'Inventory Coordinator (Wigs & Patches)',
      label: 'Inventory Coordinator (Wigs & Patches)',
      desc: 'Lace systems, patch stock, tapes & adhesives',
      badge: 'Inventory',
    },
    {
      id: 'Studio Partner / Owner',
      label: 'Studio Partner / Owner',
      desc: 'Executive P&L oversight, studio audits & reports',
      badge: 'Executive',
    },
  ],
};

