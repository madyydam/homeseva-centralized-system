import { BusinessConfig } from '../../types';

export const crockeryRentalConfig: BusinessConfig = {
  id: 'crockery-rental',
  name: 'Crockery Rentals',
  slug: 'crockery-rental',
  subtitle: 'Banquet Tableware & Buffet Hire Operations',
  description: 'High-volume banquet bone china, glassware, luxury cutlery & chafing dish rentals',
  themeColor: 'amber',
  roles: [
    {
      id: 'owner',
      label: 'Owner',
      desc: 'Full access to all modules and settings',
      badge: 'Owner',
    },
    {
      id: 'manager',
      label: 'Manager',
      desc: 'Manage bookings, invoices, customers and reports',
      badge: 'Manager',
    },
    {
      id: 'counter',
      label: 'Counter Staff',
      desc: 'Bookings, dispatch and returns',
      badge: 'Counter',
    },
    {
      id: 'godown',
      label: 'Godown Staff',
      desc: 'Stock movement, cleaning and dispatch only',
      badge: 'Godown',
    },
    {
      id: 'accountant',
      label: 'Accountant',
      desc: 'Invoices, payments and ledger',
      badge: 'Accounts',
    },
  ],
};
