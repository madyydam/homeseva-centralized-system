import { BusinessConfig } from '../types';

export const dveEnterprisesConfig: BusinessConfig = {
  id: '8',
  name: 'DVE Enterprises',
  slug: 'dve-enterprises',
  subtitle: 'Commercial Trading & Supplies',
  description: 'Bulk Commercial Trading, Industrial Hardware, Electrical Supplies & Vendor Distribution',
  themeColor: 'orange',
  roles: [
    {
      id: 'Commercial Trading Director',
      label: 'Commercial Trading Director',
      desc: 'Wholesale trading margins, vendor MOUs & credit terms',
      badge: 'Executive',
    },
    {
      id: 'Procurement & Vendor Manager',
      label: 'Procurement & Vendor Manager',
      desc: 'Factory bulk purchase orders, price negotiations & logistics',
      badge: 'Procurement',
    },
    {
      id: 'Dispatch & Billing Supervisor',
      label: 'Dispatch & Billing Supervisor',
      desc: 'E-way bills, commercial tax invoices & goods transport notes',
      badge: 'Logistics',
    },
  ],
};

