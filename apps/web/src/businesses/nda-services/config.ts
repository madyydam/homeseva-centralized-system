import { BusinessConfig } from '../types';

export const ndaServicesConfig: BusinessConfig = {
  id: '9',
  name: 'NDA Services',
  slug: 'nda-services',
  subtitle: 'Security & Facility Care',
  description: 'Armed & Unarmed Security Guards, Corporate Facility Care, Housekeeping & Guard Rostering',
  themeColor: 'sky',
  roles: [
    {
      id: 'Chief Security Officer (CSO)',
      label: 'Chief Security Officer (CSO)',
      desc: 'Guard deployment, PSARA regulatory compliance & emergency response',
      badge: 'Command',
    },
    {
      id: 'Field Operations Patrol Officer',
      label: 'Field Operations Patrol Officer',
      desc: 'Night patrols, beat inspections & guard attendance muster',
      badge: 'Field',
    },
    {
      id: 'Facility Maintenance Supervisor',
      label: 'Facility Maintenance Supervisor',
      desc: 'Housekeeping crews, pest control audits & deep cleaning schedules',
      badge: 'Facility',
    },
  ],
};

