import { PrintboothLeadStatusType, LocationCategoryType, KioskModelType, PrintboothLeadItem } from '../types';

export const MONTHS_LIST = [
  { value: '01', name: 'January', short: 'Jan' },
  { value: '02', name: 'February', short: 'Feb' },
  { value: '03', name: 'March', short: 'Mar' },
  { value: '04', name: 'April', short: 'Apr' },
  { value: '05', name: 'May', short: 'May' },
  { value: '06', name: 'June', short: 'Jun' },
  { value: '07', name: 'July', short: 'Jul' },
  { value: '08', name: 'August', short: 'Aug' },
  { value: '09', name: 'September', short: 'Sep' },
  { value: '10', name: 'October', short: 'Oct' },
  { value: '11', name: 'November', short: 'Nov' },
  { value: '12', name: 'December', short: 'Dec' },
];

export const AVAILABLE_YEARS = ['2026', '2025', '2024'];

export const LOCATION_CATEGORIES: LocationCategoryType[] = [
  'Stationery & Xerox',
  'College / University',
  'Office & IT Park',
  'Hospital & Medical',
  'Mall & Retail',
  'Public Space & Transit',
  'Entrepreneur / Other',
];

export const KIOSK_MODELS: KioskModelType[] = [
  'PRINTBOOTH™ Compact (Standard)',
  'PRINTBOOTH™ Dual-Tray High Speed',
  'PRINTBOOTH™ Desktop Countertop',
  'PRINTBOOTH™ Custom Kiosk',
];

export interface ParsedImportLead {
  clientName: string;
  phone: string;
  shopName?: string | undefined;
  locationCategory?: string | undefined;
  status: PrintboothLeadStatusType;
  callCount: number;
  notesList: [string, string, string, string, string];
  leadDate: string;
  kioskModel?: string | undefined;
  unitsOrdered?: number | undefined;
  installationCity?: string | undefined;
}

const STATUS_NORM_MAP: Record<string, string> = {
  'Interested': 'interested',
  'Follow-up': 'followup',
  'Negotiation': 'negotiation',
  'Converted': 'converted',
  'Not Picked': 'notpicked',
  'Not Interested': 'notinterested',
  'Not Selected': 'notselected',
  'all': 'all',
  'interested': 'interested',
  'followup': 'followup',
  'negotiation': 'negotiation',
  'converted': 'converted',
  'notpicked': 'notpicked',
  'notinterested': 'notinterested',
  'notselected': 'notselected',
};

export const normalizeStatus = (s?: string | null): string => {
  if (!s) return '';
  const cached = STATUS_NORM_MAP[s];
  if (cached) return cached;
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, '');
};

export const getStatusBadgeClass = (status: PrintboothLeadStatusType | string) => {
  const norm = normalizeStatus(status);
  switch (norm) {
    case 'interested':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'followup':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'negotiation':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'converted':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'notinterested':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'notpicked':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'notselected':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export const formatDateToDMY = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const trimmed = String(dateStr).trim();
  if (!trimmed) return '';

  if (trimmed.length === 10 && trimmed[4] === '-' && trimmed[7] === '-') {
    return `${trimmed.slice(8, 10)}/${trimmed.slice(5, 7)}/${trimmed.slice(0, 4)}`;
  }

  if (trimmed.length === 10 && trimmed[2] === '/' && trimmed[5] === '/') {
    return trimmed;
  }

  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(trimmed)) {
    const parts = trimmed.split(/[\/\-]/);
    const day = parts[0]!.padStart(2, '0');
    const month = parts[1]!.padStart(2, '0');
    const year = parts[2]!;
    return `${day}/${month}/${year}`;
  }

  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(trimmed)) {
    const parts = trimmed.split(/[\/\-]/);
    const year = parts[0]!;
    const month = parts[1]!.padStart(2, '0');
    const day = parts[2]!.slice(0, 2).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear());
      return `${day}/${month}/${year}`;
    }
  } catch {
    // Fallback
  }

  return trimmed;
};

export const normalizeDateToYMD = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const trimmed = String(dateStr).trim();
  if (!trimmed) return '';

  if (trimmed.length === 10 && trimmed[4] === '-' && trimmed[7] === '-') {
    return trimmed;
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(trimmed)) {
    const parts = trimmed.split(/[\/\-]/);
    const day = parts[0]!.padStart(2, '0');
    const month = parts[1]!.padStart(2, '0');
    const year = parts[2]!;
    return `${year}-${month}-${day}`;
  }

  // Handle YYYY/MM/DD or YYYY-MM-DD
  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(trimmed)) {
    const parts = trimmed.split(/[\/\-]/);
    const year = parts[0]!;
    const month = parts[1]!.padStart(2, '0');
    const day = parts[2]!.slice(0, 2).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fallback
  }

  return '';
};

export const formatWhatsAppLink = (phone?: string | null): string => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D+/g, '');
  if (!digits) return '';
  // Strip leading trunk zero(s)
  digits = digits.replace(/^0+/, '');
  // If standard 10-digit Indian mobile, prefix 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return `https://wa.me/${digits}`;
};

export const normalizePhoneNumber = (phone?: string | null): string => {
  if (!phone) return '';
  return String(phone).replace(/\D+/g, '');
};

export const findDuplicateLead = (
  phone: string,
  leads: PrintboothLeadItem[],
  excludeLeadId?: string
): PrintboothLeadItem | null => {
  const normTarget = normalizePhoneNumber(phone);
  if (!normTarget || normTarget.length < 6) return null;

  for (const lead of leads) {
    if (excludeLeadId && lead.id === excludeLeadId) continue;
    const normExisting = normalizePhoneNumber(lead.phone);
    if (!normExisting) continue;

    if (normTarget === normExisting) {
      return lead;
    }

    if (normTarget.length >= 10 && normExisting.length >= 10) {
      const targetLast10 = normTarget.slice(-10);
      const existingLast10 = normExisting.slice(-10);
      if (targetLast10 === existingLast10) {
        return lead;
      }
    }
  }

  return null;
};

/**
 * Downloads a pre-formatted sample Excel sheet (.xlsx) for ADJS / PRINTBOOTH CRM Leads.
 * Matches the format and behavior of Gentle Hair Wigs CRM sample download.
 */
export async function downloadPrintboothSampleExcel(): Promise<void> {
  const XLSX = await import('xlsx');

  const headers = [
    'Merchant Name',
    'Phone Number',
    'Shop / Store Name',
    'Location Category',
    'Status',
    'Date (DD/MM/YYYY)',
    'Calls (0-5)',
    'Note 1',
    'Note 2',
    'Note 3',
    'Note 4',
    'Note 5',
  ];

  const sampleRows = [
    [
      'Rahul Sharma',
      '9822114455',
      'Apex Xerox & Stationery',
      'Stationery & Xerox',
      'Interested',
      '25/10/2026',
      2,
      'Inquired about compact kiosk for college entrance',
      'Requested brochure and pricing details on WhatsApp',
      '',
      '',
      '',
    ],
    [
      'Amit Patel',
      '9890123456',
      'Campus Cyber Cafe',
      'College / University',
      'Follow-up',
      '26/10/2026',
      1,
      'Needs dual-tray high speed unit for semester exams',
      'Requested callback on Friday morning',
      '',
      '',
      '',
    ],
    [
      'Suresh Kulkarni',
      '9881778899',
      'City Tech Hub',
      'Office & IT Park',
      'Converted',
      '18/10/2026',
      4,
      'Looking for self-service print machine for IT cafeteria',
      'Approved purchase for 2 Compact units',
      'Advance booking deposit received',
      '',
      '',
    ],
    [
      'Mahesh Patil',
      '9764556677',
      'Om Xerox Corner',
      'Stationery & Xerox',
      'Not Picked',
      '22/10/2026',
      1,
      'Attempted call at 11 AM; phone ringing not answered',
      'Follow up planned tomorrow',
      '',
      '',
      '',
    ],
    [
      'Vijay Shinde',
      '9422334455',
      'Metro Print Station',
      'Public Space & Transit',
      'Not Interested',
      '20/10/2026',
      3,
      'Inquired about kiosk lease model',
      'Prefers manual color laser printer for now',
      '',
      '',
      '',
    ],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  worksheet['!cols'] = [
    { wch: 22 }, // Merchant Name
    { wch: 16 }, // Phone Number
    { wch: 26 }, // Shop Name
    { wch: 24 }, // Category
    { wch: 16 }, // Status
    { wch: 18 }, // Date
    { wch: 14 }, // Calls
    { wch: 36 }, // Note 1
    { wch: 36 }, // Note 2
    { wch: 30 }, // Note 3
    { wch: 30 }, // Note 4
    { wch: 30 }, // Note 5
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Kiosk Leads');
  XLSX.writeFile(workbook, 'ADJS_Printbooth_Sample_Leads_Template.xlsx');
}

