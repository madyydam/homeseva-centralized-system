import { BusinessConfig } from '../types';

export const prefabConstructionConfig: BusinessConfig = {
  id: '1',
  name: 'Prefab Construction',
  slug: 'prefab-construction',
  subtitle: 'Civil & Modular Sites',
  description: 'Modular Prefabricated Buildings, Civil Engineering & Project Sites',
  themeColor: 'blue',
  branches: [
    {
      slug: 'chakan-site',
      name: 'Chakan Industrial Modular Facility',
      shortName: 'Chakan Site',
      address: 'MIDC Phase II, Chakan, Pune 410501',
      suites: 8,
      staffCount: 42,
      tag: 'Heavy Modular Assembly Plant',
    },
    {
      slug: 'tathawade-civil',
      name: 'Tathawade Commercial Civil Project',
      shortName: 'Tathawade Site',
      address: 'Mumbai-Pune Expressway Bypass, Tathawade 411033',
      suites: 5,
      staffCount: 35,
      tag: 'Multi-Storey Civil Site',
    },
  ],
  roles: [
    {
      id: 'Project Director',
      label: 'Project Director',
      desc: 'Overall sites oversight, master scheduling & client handovers',
      badge: 'Executive',
    },
    {
      id: 'Site Supervising Engineer',
      label: 'Site Supervising Engineer',
      desc: 'Daily site execution, structural checks & contractor coordination',
      badge: 'Engineering',
    },
    {
      id: 'BOQ & Estimation Specialist',
      label: 'BOQ & Estimation Specialist',
      desc: 'Bill of quantities, raw steel & panel procurement',
      badge: 'Procurement',
    },
    {
      id: 'Labor & Safety Marshal',
      label: 'Labor & Safety Marshal',
      desc: 'Site labor muster roll, safety audits & ESI logs',
      badge: 'Safety',
    },
    {
      id: 'Milestone Billing Accountant',
      label: 'Milestone Billing Accountant',
      desc: 'Progress billing, RA bills & subcontractor payments',
      badge: 'Finance',
    },
  ],
};

