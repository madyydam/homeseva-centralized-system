import { CrmLeadStatusType } from '../types';

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

export interface ParsedImportLead {
  clientName: string;
  phone: string;
  status: CrmLeadStatusType;
  callCount: number;
  notesList: string[];
  nextFollowUpDate?: string | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
  studioSlug?: string | undefined;
  studioName?: string | undefined;
}

// Fast status normalization lookup map for instant O(1) checks without regex allocations
const STATUS_NORM_MAP: Record<string, string> = {
  'Interested': 'interested',
  'Follow-up': 'followup',
  'Converted': 'converted',
  'Not Interested': 'notinterested',
  'Not Picked': 'notpicked',
  'Not Selected': 'notselected',
  'all': 'all',
  'interested': 'interested',
  'followup': 'followup',
  'converted': 'converted',
  'notinterested': 'notinterested',
  'notpicked': 'notpicked',
  'notselected': 'notselected',
};

// Helper to normalize status strings for robust, bulletproof filtering & comparison
export const normalizeStatus = (s?: string | null): string => {
  if (!s) return '';
  const cached = STATUS_NORM_MAP[s];
  if (cached) return cached;
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, '');
};

// Helper for Status Badge styling
export const getStatusBadgeClass = (status: CrmLeadStatusType | string) => {
  const norm = normalizeStatus(status);
  switch (norm) {
    case 'interested':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'followup':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'converted':
      return 'bg-purple-50 text-purple-700 border-purple-200';
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

// Helper to format any date string into date/month/year (DD/MM/YYYY)
export const formatDateToDMY = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const trimmed = String(dateStr).trim();
  if (!trimmed) return '';

  // Ultra-fast path: If ISO format YYYY-MM-DD (e.g. 2026-10-30)
  if (trimmed.length === 10 && trimmed[4] === '-' && trimmed[7] === '-') {
    return `${trimmed.slice(8, 10)}/${trimmed.slice(5, 7)}/${trimmed.slice(0, 4)}`;
  }

  // Ultra-fast path: If already DD/MM/YYYY
  if (trimmed.length === 10 && trimmed[2] === '/' && trimmed[5] === '/') {
    return trimmed;
  }

  // If already DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(trimmed)) {
    const parts = trimmed.split(/[\/\-]/);
    const day = parts[0]!.padStart(2, '0');
    const month = parts[1]!.padStart(2, '0');
    const year = parts[2]!;
    return `${day}/${month}/${year}`;
  }

  // If YYYY-MM-DD or YYYY/MM/DD
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
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {}

  return trimmed;
};

// Helper to normalize imported date strings into YYYY-MM-DD for internal storage & sorting
export const normalizeDateToYMD = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const trimmed = String(dateStr).trim();
  if (!trimmed) return '';

  // Ultra-fast path: If already YYYY-MM-DD
  if (trimmed.length === 10 && trimmed[4] === '-' && trimmed[7] === '-') {
    return trimmed;
  }

  // Ultra-fast path: If DD/MM/YYYY
  if (trimmed.length === 10 && trimmed[2] === '/' && trimmed[5] === '/') {
    return `${trimmed.slice(6, 10)}-${trimmed.slice(3, 5)}-${trimmed.slice(0, 2)}`;
  }

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // If DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(trimmed)) {
    const parts = trimmed.split(/[\/\-]/);
    const day = parts[0]!.padStart(2, '0');
    const month = parts[1]!.padStart(2, '0');
    const year = parts[2]!;
    return `${year}-${month}-${day}`;
  }

  // If YYYY/MM/DD
  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split(/[\/\-]/);
    const year = parts[0]!;
    const month = parts[1]!.padStart(2, '0');
    const day = parts[2]!.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Handle Excel serial date numbers (e.g. 46325)
  const num = Number(trimmed);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + num * 86400000);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
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
  } catch {}

  return trimmed;
};

