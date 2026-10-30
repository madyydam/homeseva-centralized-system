import { BusinessConfig } from '../types';

export const horecaEssentialsConfig: BusinessConfig = {
  id: '2',
  name: 'HORECA Essentials',
  slug: 'horeca-essentials',
  subtitle: 'Essentials Sales & Crockery Rental',
  description: 'Hospitality Supplies, B2B Kitchen Essentials & Banquet Crockery Rental',
  themeColor: 'emerald',
  divisions: [
    {
      slug: 'essentials-sales',
      name: 'Essentials Sales Division',
      desc: 'B2B Wholesale commercial cookware, buffet chafers & kitchenware supplies',
      badge: 'Wholesale B2B',
    },
    {
      slug: 'crockery-rental',
      name: 'Crockery Rental Practice',
      desc: 'High-volume banquet bone china, glassware, luxury cutlery & chafing rentals',
      badge: 'Event Rentals',
    },
  ],
  roles: [
    {
      id: 'General Manager (HORECA)',
      label: 'General Manager (HORECA)',
      desc: 'Commercial operations, corporate hospitality accounts & fleet',
      badge: 'Executive',
    },
    {
      id: 'Wholesale Sales Executive',
      label: 'Wholesale Sales Executive',
      desc: 'Hotel, restaurant & cafe supply agreements',
      badge: 'Sales',
    },
    {
      id: 'Banquet Rental Coordinator',
      label: 'Banquet Rental Coordinator',
      desc: 'Event booking, security deposit & returns dispatch',
      badge: 'Rentals',
    },
    {
      id: 'Warehousing & Quality Inspector',
      label: 'Warehousing & Quality Inspector',
      desc: 'Washing, sanitization, breakages audit & pack count',
      badge: 'Warehouse',
    },
    {
      id: 'Billing & POS Cashier',
      label: 'Billing & POS Cashier',
      desc: 'Wholesale tax invoices, rental deposits & GST billing',
      badge: 'Accounts',
    },
  ],
};

