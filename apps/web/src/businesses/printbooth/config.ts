import { BusinessConfig } from '../types';

export const printboothConfig: BusinessConfig = {
  id: '7',
  name: 'Printbooth',
  slug: 'printbooth',
  subtitle: 'Digital & Commercial Printing',
  description: 'High-Speed Commercial Printing, Packaging Boxes, Vinyl Signage & Offset Press',
  themeColor: 'purple',
  roles: [
    {
      id: 'Press Production Manager',
      label: 'Press Production Manager',
      desc: 'Print scheduling, machine uptime & color proof calibration',
      badge: 'Production',
    },
    {
      id: 'Pre-Press & DTP Specialist',
      label: 'Pre-Press & DTP Specialist',
      desc: 'CMYK color separation, plate making & artwork proofing',
      badge: 'Pre-Press',
    },
    {
      id: 'Paper Stock & Post-Press Controller',
      label: 'Paper Stock & Post-Press Controller',
      desc: 'GSM paper reams, lamination, die-cutting & binding',
      badge: 'Inventory',
    },
  ],
};

