'use client';

import { useState, useMemo, useEffect, useCallback, useDeferredValue, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { CrmLeadItem, CrmLeadStatusType, StudioInfoItem, ClientCallLogItem } from './types';
import { gentleHairWigsDb } from './db';
import {
  MONTHS_LIST,
  AVAILABLE_YEARS,
  ParsedImportLead,
  normalizeStatus,
  formatDateToDMY,
  normalizeDateToYMD,
} from './crm/crmUtils';
import { CrmKpiCards, MonthKpiStats } from './crm/CrmKpiCards';
import { CrmTable } from './crm/CrmTable';
import { CrmMonthsView } from './crm/CrmMonthsView';
import { LeadNotesModal } from './crm/LeadNotesModal';
import { AddLeadModal } from './crm/AddLeadModal';
import { ConversionModal } from './crm/ConversionModal';
import { ImportExcelModal } from './crm/ImportExcelModal';

export * from './crm/crmUtils';

interface CrmViewProps {
  branch: string;
  crmLeads?: CrmLeadItem[];
  callLogs?: ClientCallLogItem[];
  onRefresh?: () => void;
  onConvertToOrder?: (clientName: string, phone: string) => void;
  initialViewMode?: 'month-selector' | 'month-sheet';
  initialStatusFilter?: string;
}

export function CrmView({
  branch,
  crmLeads: _propLeads = [],
  onRefresh,
  initialViewMode = 'month-sheet',
  initialStatusFilter = 'all',
}: CrmViewProps) {
  // Centralized Leads state
  const [leads, setLeads] = useState<CrmLeadItem[]>(() => gentleHairWigsDb.getCentralCrmLeads());
  const [studios, setStudios] = useState<StudioInfoItem[]>(() => gentleHairWigsDb.getStudiosList());

  const refreshCentralData = useCallback(() => {
    setLeads([...gentleHairWigsDb.getCentralCrmLeads()]);
    setStudios([...gentleHairWigsDb.getStudiosList()]);
    if (onRefresh) onRefresh();
  }, [onRefresh]);

  useEffect(() => {
    refreshCentralData();
    gentleHairWigsDb.syncFromDatabase();
    const unsubscribe = gentleHairWigsDb.subscribe(() => {
      refreshCentralData();
    });
    return () => unsubscribe();
  }, [branch, refreshCentralData]);

  // NAVIGATION / VIEW MODE: 'month-selector' vs 'month-sheet'
  const [viewMode, setViewMode] = useState<'month-selector' | 'month-sheet'>(initialViewMode);
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('10'); // Default to October

  // Table Filters (within month sheet - Status, Date & Sort)
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Modals & Feedback
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeNotesLead, setActiveNotesLead] = useState<CrmLeadItem | null>(null);
  const [conversionModalLead, setConversionModalLead] = useState<CrmLeadItem | null>(null);
  const [editingNotes, setEditingNotes] = useState<[string, string, string, string, string]>(['', '', '', '', '']);
  const [editingFollowUpDate, setEditingFollowUpDate] = useState<string>('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ParsedImportLead[]>([]);
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Lead Form State
  const [newClientName, setNewClientName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStatus, setNewStatus] = useState<CrmLeadStatusType>('Interested');
  const [newCallCount, setNewCallCount] = useState<number>(1);
  const [newFollowUpDate, setNewFollowUpDate] = useState<string>('');
  const [newNotesList, setNewNotesList] = useState<[string, string, string, string, string]>(['', '', '', '', '']);
  const [newLeadDate, setNewLeadDate] = useState<string>('2026-10-30');
  const [newStudioSlug, setNewStudioSlug] = useState<string>('viman-nagar');

  // Auto-dismiss notification
  useEffect(() => {
    if (!notificationMsg) return;
    const timer = setTimeout(() => setNotificationMsg(null), 3500);
    return () => clearTimeout(timer);
  }, [notificationMsg]);

  // Month info helper
  const selectedMonthObj = MONTHS_LIST.find((m) => m.value === selectedMonth) || MONTHS_LIST[9]!;

  // Month-wise stats for all 12 months in the selected year (only computed in month-selector view)
  const yearMonthsStats = useMemo(() => {
    if (viewMode !== 'month-selector') {
      return {} as any;
    }

    const statsMap: Record<
      string,
      {
        total: number;
        notSelected: number;
        interested: number;
        followUp: number;
        converted: number;
        notInterested: number;
        notPicked: number;
      }
    > = {};

    MONTHS_LIST.forEach((m) => {
      statsMap[m.value] = {
        total: 0,
        notSelected: 0,
        interested: 0,
        followUp: 0,
        converted: 0,
        notInterested: 0,
        notPicked: 0,
      };
    });

    leads.forEach((l) => {
      const dateStr = l.createdAt || '';
      if (dateStr.startsWith(selectedYear)) {
        const monthPart = dateStr.slice(5, 7);
        if (statsMap[monthPart]) {
          statsMap[monthPart].total += 1;
          if (l.status === 'Interested') statsMap[monthPart].interested += 1;
          else if (l.status === 'Follow-up') statsMap[monthPart].followUp += 1;
          else if (l.status === 'Converted') statsMap[monthPart].converted += 1;
          else if (l.status === 'Not Interested') statsMap[monthPart].notInterested += 1;
          else if (l.status === 'Not Picked') statsMap[monthPart].notPicked += 1;
          else if (l.status === 'Not Selected') statsMap[monthPart].notSelected += 1;
        }
      }
    });

    return statsMap;
  }, [leads, selectedYear, viewMode]);

  // Leads for the selected Year & Month
  const currentMonthLeads = useMemo(() => {
    return leads.filter((item) => {
      const createdDate = item.createdAt || '2026-10-15';
      const createdInMonth = createdDate.startsWith(`${selectedYear}-${selectedMonth}`);
      const updatedInMonth = item.updatedAt ? item.updatedAt.startsWith(`${selectedYear}-${selectedMonth}`) : false;
      return createdInMonth || updatedInMonth;
    });
  }, [leads, selectedYear, selectedMonth]);

  // TOP KPI METRICS FOR SELECTED MONTH
  const monthKpis: MonthKpiStats = useMemo(() => {
    let notSelected = 0;
    let interested = 0;
    let followUp = 0;
    let converted = 0;
    let notInterested = 0;
    let notPicked = 0;

    for (let i = 0; i < currentMonthLeads.length; i++) {
      const norm = normalizeStatus(currentMonthLeads[i]?.status);
      if (!norm || norm === 'notselected') notSelected++;
      else if (norm === 'interested') interested++;
      else if (norm === 'followup') followUp++;
      else if (norm === 'converted') converted++;
      else if (norm === 'notinterested') notInterested++;
      else if (norm === 'notpicked') notPicked++;
      else notSelected++;
    }

    return {
      total: currentMonthLeads.length,
      notSelected,
      interested,
      followUp,
      converted,
      notInterested,
      notPicked,
    };
  }, [currentMonthLeads]);

  // ANNUAL CRM ANALYTICS & TRAJECTORY (only computed in month-selector view)
  const annualAnalytics = useMemo(() => {
    if (viewMode !== 'month-selector') {
      return {
        yearTotal: 0,
        yearNotSelected: 0,
        yearInterested: 0,
        yearFollowUp: 0,
        yearConverted: 0,
        yearNotInterested: 0,
        yearNotPicked: 0,
        annualConvRate: '0',
        monthlyAverageLeads: '0',
        monthlyAverageConverted: '0',
        monthlySeries: [],
        maxMonthTotal: 6,
        studioMap: {},
      };
    }

    let yearTotal = 0;
    let yearNotSelected = 0;
    let yearInterested = 0;
    let yearFollowUp = 0;
    let yearConverted = 0;
    let yearNotInterested = 0;
    let yearNotPicked = 0;

    const studioMap: Record<string, { total: number; converted: number }> = {};
    studios.forEach((s) => {
      studioMap[s.slug] = { total: 0, converted: 0 };
    });

    const monthlySeries = MONTHS_LIST.map((m) => {
      const stats = yearMonthsStats[m.value] || {
        total: 0,
        notSelected: 0,
        interested: 0,
        followUp: 0,
        converted: 0,
        notInterested: 0,
        notPicked: 0,
      };

      yearTotal += stats.total;
      yearNotSelected += stats.notSelected;
      yearInterested += stats.interested;
      yearFollowUp += stats.followUp;
      yearConverted += stats.converted;
      yearNotInterested += stats.notInterested;
      yearNotPicked += stats.notPicked;

      const rate = stats.total > 0 ? (stats.converted / stats.total) * 100 : 0;

      return {
        monthKey: m.value,
        name: m.name,
        short: m.short,
        total: stats.total,
        converted: stats.converted,
        conversionRate: Math.round(rate * 10) / 10,
      };
    });

    leads.forEach((l) => {
      if (l.createdAt?.startsWith(selectedYear) && l.studioSlug) {
        const currentEntry = studioMap[l.studioSlug] || { total: 0, converted: 0 };
        currentEntry.total += 1;
        if (l.status === 'Converted') {
          currentEntry.converted += 1;
        }
        studioMap[l.studioSlug] = currentEntry;
      }
    });

    const annualConvRate = yearTotal > 0 ? ((yearConverted / yearTotal) * 100).toFixed(1) : '0';
    const monthlyAverageLeads = (yearTotal / 12).toFixed(1);
    const monthlyAverageConverted = (yearConverted / 12).toFixed(1);
    const maxMonthTotal = Math.max(...monthlySeries.map((s) => s.total), 6);

    return {
      yearTotal,
      yearNotSelected,
      yearInterested,
      yearFollowUp,
      yearConverted,
      yearNotInterested,
      yearNotPicked,
      annualConvRate,
      monthlyAverageLeads,
      monthlyAverageConverted,
      monthlySeries,
      maxMonthTotal,
      studioMap,
    };
  }, [leads, yearMonthsStats, selectedYear, studios, viewMode]);

  // Filtered Leads in active Month Sheet Table
  const tableLeads = useMemo(() => {
    const q = deferredSearchTerm.trim().toLowerCase();

    const filtered = currentMonthLeads.filter((item) => {
      if (statusFilter !== 'all') {
        const target = normalizeStatus(statusFilter);
        const current = normalizeStatus(item.status);
        if (target === 'notselected') {
          if (current && current !== 'notselected') {
            return false;
          }
        } else if (current !== target) {
          return false;
        }
      }

      if (dateFilter) {
        const createdMatch = item.createdAt === dateFilter;
        const updatedMatch = item.updatedAt === dateFilter;
        if (!createdMatch && !updatedMatch) {
          return false;
        }
      }

      if (q) {
        const inName = item.clientName.toLowerCase().includes(q);
        const inPhone = item.phone.includes(q);
        const inNotes = (item.notesList || []).some((n) => n.toLowerCase().includes(q));
        if (!inName && !inPhone && !inNotes) {
          return false;
        }
      }

      return true;
    });

    return filtered.sort((a, b) => {
      if (normalizeStatus(statusFilter) === 'followup') {
        const dateA = a.nextFollowUpDate || '9999-99-99';
        const dateB = b.nextFollowUpDate || '9999-99-99';
        if (dateA !== dateB) {
          return dateA > dateB ? 1 : -1;
        }
      }

      if (dateFilter) {
        const timeA = a.updatedAt || a.createdAt || '';
        const timeB = b.updatedAt || b.createdAt || '';
        return timeB > timeA ? 1 : timeB < timeA ? -1 : 0;
      }

      if (sortBy === 'newest') {
        const timeA = a.updatedAt || a.createdAt || '';
        const timeB = b.updatedAt || b.createdAt || '';
        return timeB > timeA ? 1 : timeB < timeA ? -1 : 0;
      }
      if (sortBy === 'oldest') {
        const timeA = a.createdAt || '';
        const timeB = b.createdAt || '';
        return timeA > timeB ? 1 : timeA < timeB ? -1 : 0;
      }
      if (sortBy === 'name') {
        return a.clientName.localeCompare(b.clientName);
      }
      return 0;
    });
  }, [currentMonthLeads, statusFilter, dateFilter, sortBy, deferredSearchTerm]);

  const handleOpenMonthSheet = useCallback((monthValue: string) => {
    setSelectedMonth(monthValue);
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('');
    setSortBy('newest');
    setViewMode('month-sheet');
  }, []);

  const handlePrevMonth = useCallback(() => {
    setDateFilter('');
    const num = parseInt(selectedMonth, 10);
    if (num > 1) {
      setSelectedMonth(String(num - 1).padStart(2, '0'));
    } else {
      const yr = parseInt(selectedYear, 10);
      setSelectedYear(String(yr - 1));
      setSelectedMonth('12');
    }
  }, [selectedMonth, selectedYear]);

  const handleNextMonth = useCallback(() => {
    setDateFilter('');
    const num = parseInt(selectedMonth, 10);
    if (num < 12) {
      setSelectedMonth(String(num + 1).padStart(2, '0'));
    } else {
      const yr = parseInt(selectedYear, 10);
      setSelectedYear(String(yr + 1));
      setSelectedMonth('01');
    }
  }, [selectedMonth, selectedYear]);

  const handleUpdateStatus = useCallback((lead: CrmLeadItem, status: CrmLeadStatusType) => {
    if (status === 'Converted') {
      setConversionModalLead(lead);
      return;
    }
    const todayYMD = new Date().toISOString().split('T')[0] || '2026-10-30';
    const updates: Partial<CrmLeadItem> = { status, updatedAt: todayYMD };
    if (status !== 'Follow-up') {
      updates.nextFollowUpDate = undefined;
    }
    gentleHairWigsDb.updateCentralCrmLead(lead.id, updates);
    setNotificationMsg(`Status updated to "${status}" (Activity recorded)!`);
  }, []);

  const handleConfirmConversion = useCallback((leadId: string, studioSlug: string, studioName: string) => {
    const todayYMD = new Date().toISOString().split('T')[0] || '2026-10-30';
    gentleHairWigsDb.updateCentralCrmLead(leadId, {
      status: 'Converted',
      studioSlug,
      studioName,
      nextFollowUpDate: '',
      updatedAt: todayYMD,
    });
    setConversionModalLead(null);
    setNotificationMsg(`🎉 Lead marked Converted at ${studioName}! Main dashboard updated.`);
  }, []);

  const handleUpdateCalls = useCallback((leadId: string, callCount: number) => {
    const todayYMD = new Date().toISOString().split('T')[0] || '2026-10-30';
    gentleHairWigsDb.updateCentralCrmLead(leadId, { callCount, updatedAt: todayYMD });
    setNotificationMsg(`Calls updated to ${callCount} (Activity recorded)!`);
  }, []);

  const handleDeleteLead = useCallback((leadId: string, leadName: string) => {
    if (confirm(`Are you sure you want to delete lead "${leadName}" from this sheet?`)) {
      gentleHairWigsDb.deleteCentralCrmLead(leadId);
    }
  }, []);

  const handleOpenNotes = useCallback((lead: CrmLeadItem) => {
    const list = lead.notesList || [];
    setEditingNotes([
      list[0] || '',
      list[1] || '',
      list[2] || '',
      list[3] || '',
      list[4] || '',
    ]);
    setEditingFollowUpDate(lead.status === 'Follow-up' ? (lead.nextFollowUpDate || '') : '');
    setActiveNotesLead(lead);
  }, []);

  const handleSaveNotes = useCallback(() => {
    if (!activeNotesLead) return;
    const cleanList = editingNotes.map((n) => n.trim()).filter((n) => n.length > 0);
    const todayYMD = new Date().toISOString().split('T')[0] || '2026-10-30';
    const updates: Partial<CrmLeadItem> = {
      status: activeNotesLead.status,
      studioSlug: activeNotesLead.studioSlug,
      studioName: activeNotesLead.studioName,
      notesList: cleanList,
      nextFollowUpDate: activeNotesLead.status === 'Follow-up' && editingFollowUpDate ? editingFollowUpDate : undefined,
      updatedAt: todayYMD,
    };
    gentleHairWigsDb.updateCentralCrmLead(activeNotesLead.id, updates);
    setActiveNotesLead(null);
    setNotificationMsg(
      activeNotesLead.status === 'Follow-up' && editingFollowUpDate
        ? `Notes & Follow-up date (${formatDateToDMY(editingFollowUpDate)}) saved!`
        : 'Notes saved successfully!'
    );
  }, [activeNotesLead, editingNotes, editingFollowUpDate]);

  const handleCreateLead = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newPhone.trim()) return;

    const notesArr = newNotesList.map((n) => n.trim()).filter((n) => n.length > 0);
    const targetStudio =
      studios.find((s) => s.slug === (newStatus === 'Converted' ? newStudioSlug : branch)) ||
      studios[0]!;

    const todayYMD = new Date().toISOString().split('T')[0] || '2026-10-30';
    const leadDate = newLeadDate || todayYMD;

    gentleHairWigsDb.addCentralCrmLead({
      clientName: newClientName.trim(),
      phone: newPhone.trim(),
      studioSlug: targetStudio.slug,
      studioName: targetStudio.name,
      status: newStatus,
      callCount: newCallCount,
      notesList: notesArr,
      nextFollowUpDate: newStatus === 'Follow-up' && newFollowUpDate ? newFollowUpDate : undefined,
      createdAt: leadDate,
      updatedAt: leadDate,
    });

    setShowAddLeadModal(false);
    setNewClientName('');
    setNewPhone('');
    setNewStatus('Interested');
    setNewStudioSlug('viman-nagar');
    setNewCallCount(1);
    setNewFollowUpDate('');
    setNewNotesList(['', '', '', '', '']);
    setNotificationMsg('Lead added successfully!');
  }, [newClientName, newPhone, newNotesList, newStatus, newStudioSlug, branch, studios, newLeadDate, newCallCount, newFollowUpDate]);

  const handleExportExcel = useCallback(async () => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();

    const headers = [
      '#',
      'Client Name',
      'Phone Number',
      'Status',
      'Added Date (DD/MM/YYYY)',
      'Last Updated Date (DD/MM/YYYY)',
      'Follow-up Date (DD/MM/YYYY)',
      'Calls (0-5)',
      'Studio Branch',
      'Note 1',
      'Note 2',
      'Note 3',
      'Note 4',
      'Note 5',
    ];

    const formatRow = (l: CrmLeadItem, index: number) => [
      index + 1,
      l.clientName,
      l.phone,
      l.status,
      formatDateToDMY(l.createdAt) || '',
      formatDateToDMY(l.updatedAt || l.createdAt) || '',
      l.status === 'Follow-up' && l.nextFollowUpDate ? formatDateToDMY(l.nextFollowUpDate) : '',
      l.status === 'Converted' ? 'Converted' : (l.callCount || 0),
      l.studioName || 'Studio of Viman Nagar',
      (l.notesList && l.notesList[0]) || '',
      (l.notesList && l.notesList[1]) || '',
      (l.notesList && l.notesList[2]) || '',
      (l.notesList && l.notesList[3]) || '',
      (l.notesList && l.notesList[4]) || '',
    ];

    const colWidths = [
      { wch: 6 },
      { wch: 24 },
      { wch: 18 },
      { wch: 16 },
      { wch: 24 },
      { wch: 26 },
      { wch: 26 },
      { wch: 12 },
      { wch: 26 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
    ];

    // Sheet 1: Active Month Sheet
    const monthRows = tableLeads.map(formatRow);
    const monthSheet = XLSX.utils.aoa_to_sheet([headers, ...monthRows]);
    monthSheet['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, monthSheet, `${selectedMonthObj.name} ${selectedYear}`);

    // Sheet 2: Master Backup (All Leads across all months end-to-end A to Z)
    const allRows = leads.map(formatRow);
    const allSheet = XLSX.utils.aoa_to_sheet([headers, ...allRows]);
    allSheet['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, allSheet, 'Master Backup (All Leads)');

    XLSX.writeFile(workbook, `Gentle_Hair_Wigs_CRM_${selectedMonthObj.name}_${selectedYear}_Full_Backup.xlsx`);
    setNotificationMsg(`Full Excel Backup exported with Added/Updated dates & logs (${leads.length} Total Leads)!`);
  }, [tableLeads, leads, selectedMonthObj, selectedYear]);

  const handleDownloadSampleExcel = useCallback(async () => {
    const XLSX = await import('xlsx');
    const headers = [
      'Client Name',
      'Phone Number',
      'Status',
      'Added Date (DD/MM/YYYY)',
      'Last Updated Date (DD/MM/YYYY)',
      'Follow-up Date (DD/MM/YYYY)',
      'Calls (0-5)',
      'Studio Branch',
      'Note 1',
      'Note 2',
      'Note 3',
      'Note 4',
      'Note 5',
    ];
    const sampleRows = [
      ['Arjun Verma', '9823112233', 'Interested', '25/10/2026', '29/10/2026', '', 2, 'Studio of Viman Nagar', 'Inquired about breathable HD lace toupee', 'Scheduled private trial for Saturday', '', '', ''],
      ['Vikram Deshmukh', '9881122334', 'Follow-up', '26/10/2026', '30/10/2026', '01/11/2026', 1, 'Studio of Ravet', 'Comparing mono base vs poly skin membrane', 'Requested follow-up call on Tuesday', '', '', ''],
      ['Pooja Deshmukh', '9890445566', 'Converted', '18/10/2026', '28/10/2026', '', 4, 'Studio of Kolhapur', 'Oncologist recommendation for cranial wig', 'Base circumference measured 21.5 in', 'Advance deposit ₹20,000 paid', '', ''],
      ['Pravin Joshi', '9763223344', 'Not Selected', '20/10/2026', '20/10/2026', '', 0, 'Studio of Viman Nagar', 'New web form inquiry; status not selected yet', '', '', '', ''],
      ['Rohan Shinde', '9765123456', 'Not Picked', '22/10/2026', '27/10/2026', '', 1, 'Studio of Viman Nagar', 'Attempted morning call; did not pick up', 'Left WhatsApp message with brochure', '', '', ''],
      ['Kishore More', '9422987654', 'Not Interested', '20/10/2026', '25/10/2026', '', 3, 'Studio of Ravet', 'Inquired about patch pricing', 'Decided to go for hair transplant surgery', '', '', ''],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    worksheet['!cols'] = [
      { wch: 22 },
      { wch: 16 },
      { wch: 14 },
      { wch: 24 },
      { wch: 26 },
      { wch: 26 },
      { wch: 12 },
      { wch: 26 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample CRM Leads');
    XLSX.writeFile(workbook, 'Gentle_Hair_Wigs_CRM_Sample_Template.xlsx');
    setNotificationMsg('Sample Excel Template (.xlsx) downloaded with full date logs!');
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportError('');
    setImportPreview([]);

    try {
      const buffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      // Auto-detect best sheet to parse: prefer 'Master Backup (All Leads)' or first sheet
      let sheetToParse = workbook.SheetNames[0];
      if (!sheetToParse) {
        setImportError('No worksheet found in the selected Excel file.');
        return;
      }
      const masterSheet = workbook.SheetNames.find((s) =>
        s.toLowerCase().includes('master') || s.toLowerCase().includes('all') || s.toLowerCase().includes('backup')
      );
      if (masterSheet && workbook.Sheets[masterSheet]) {
        sheetToParse = masterSheet;
      }

      const worksheet = workbook.Sheets[sheetToParse];
      if (!worksheet) {
        setImportError('Worksheet is empty.');
        return;
      }
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      if (!rawRows || rawRows.length === 0) {
        setImportError('No rows found in this sheet.');
        return;
      }

      const validRows = rawRows.filter(
        (r) => Array.isArray(r) && r.some((c) => String(c ?? '').trim() !== '')
      );

      if (validRows.length === 0) {
        setImportError('All rows in this sheet are empty.');
        return;
      }

      const firstRowCells = (validRows[0] || []).map((c) =>
        String(c ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
      );

      let hasHeader = false;
      let nameIdx = 0;
      let phoneIdx = 1;
      let statusIdx = 2;
      let studioIdx = -1;
      let callsIdx = 3;
      let followUpDateIdx = -1;
      let addedDateIdx = -1;
      let updatedDateIdx = -1;
      let noteIndices: number[] = [];

      if (
        firstRowCells.some((c) => c.includes('name') || c.includes('client') || c.includes('customer')) ||
        firstRowCells.some((c) => c.includes('phone') || c.includes('mobile') || c.includes('contact'))
      ) {
        hasHeader = true;
        firstRowCells.forEach((c, idx) => {
          if (c.includes('name') || c.includes('client') || c.includes('customer')) {
            nameIdx = idx;
          } else if (c.includes('phone') || c.includes('mobile') || c.includes('contact') || c.includes('tel')) {
            phoneIdx = idx;
          } else if (c.includes('status')) {
            statusIdx = idx;
          } else if (c.includes('studio') || c.includes('branch') || c.includes('location')) {
            studioIdx = idx;
          } else if (c.includes('call') && !c.includes('callback') && !c.includes('follow')) {
            callsIdx = idx;
          } else if (c.includes('follow') || c.includes('due') || c.includes('callback')) {
            followUpDateIdx = idx;
          } else if (c.includes('updated') || c.includes('modified') || c.includes('activity')) {
            updatedDateIdx = idx;
          } else if (c.includes('added') || c.includes('created') || c.includes('entry') || c.includes('registration') || c === 'date' || c.includes('leaddate')) {
            addedDateIdx = idx;
          } else if (c.includes('note')) {
            noteIndices.push(idx);
          }
        });
      }

      const rowsToParse = hasHeader ? validRows.slice(1) : validRows;
      const parsedResults: ParsedImportLead[] = [];

      for (const cells of rowsToParse) {
        if (!Array.isArray(cells) || cells.length < 2) continue;

        const clientName = String(cells[nameIdx] ?? '').trim();
        const phone = String(cells[phoneIdx] ?? '').replace(/[^0-9+]/g, '').trim();

        if (!clientName || !phone) continue;

        const rawStatus = String(cells[statusIdx] ?? '').trim().toLowerCase();
        let status: CrmLeadStatusType = 'Not Selected';
        if (rawStatus.includes('follow') || rawStatus.includes('callback') || rawStatus.includes('call back')) {
          status = 'Follow-up';
        } else if (rawStatus.includes('convert') || rawStatus.includes('applied') || rawStatus.includes('order')) {
          status = 'Converted';
        } else if (rawStatus.includes('not int') || rawStatus.includes('drop') || rawStatus.includes('transplant')) {
          status = 'Not Interested';
        } else if (rawStatus.includes('pick') || rawStatus.includes('unanswer') || rawStatus.includes('busy') || rawStatus.includes('no ans')) {
          status = 'Not Picked';
        } else if (rawStatus.includes('interest')) {
          status = 'Interested';
        } else if (rawStatus === '' || rawStatus.includes('not select') || rawStatus.includes('none') || rawStatus.includes('empty') || rawStatus.includes('unselect')) {
          status = 'Not Selected';
        }

        const rawCalls = String(cells[callsIdx] ?? '').replace(/[^0-9]/g, '');
        const callCount = rawCalls ? Math.min(5, Math.max(0, parseInt(rawCalls, 10))) : 0;

        const rawAddedDate = addedDateIdx >= 0 ? String(cells[addedDateIdx] ?? '').trim() : '';
        const parsedAddedDate = rawAddedDate ? normalizeDateToYMD(rawAddedDate) : `${selectedYear}-${selectedMonth}-15`;

        const rawUpdatedDate = updatedDateIdx >= 0 ? String(cells[updatedDateIdx] ?? '').trim() : '';
        const parsedUpdatedDate = rawUpdatedDate ? normalizeDateToYMD(rawUpdatedDate) : parsedAddedDate;

        const rawFollowUp = followUpDateIdx >= 0 ? String(cells[followUpDateIdx] ?? '').trim() : '';
        const parsedFollowUpDate = status === 'Follow-up' && rawFollowUp ? normalizeDateToYMD(rawFollowUp) : undefined;

        let parsedStudioSlug: string | undefined = undefined;
        let parsedStudioName: string | undefined = undefined;
        if (studioIdx >= 0) {
          const rawStudio = String(cells[studioIdx] ?? '').toLowerCase();
          const matchStudio = studios.find(
            (s) =>
              rawStudio.includes(s.slug) ||
              rawStudio.includes(s.shortName.toLowerCase()) ||
              rawStudio.includes(s.name.toLowerCase())
          );
          if (matchStudio) {
            parsedStudioSlug = matchStudio.slug;
            parsedStudioName = matchStudio.name;
          }
        }

        const notesList: string[] = [];
        if (noteIndices.length > 0) {
          noteIndices.forEach((nIdx) => {
            const noteText = String(cells[nIdx] ?? '').trim();
            if (noteText && notesList.length < 5) notesList.push(noteText);
          });
        } else {
          for (let i = 0; i < cells.length && notesList.length < 5; i++) {
            if (
              i !== nameIdx &&
              i !== phoneIdx &&
              i !== statusIdx &&
              i !== studioIdx &&
              i !== callsIdx &&
              i !== followUpDateIdx &&
              i !== addedDateIdx &&
              i !== updatedDateIdx
            ) {
              const val = String(cells[i] ?? '').trim();
              if (val) notesList.push(val);
            }
          }
        }

        parsedResults.push({
          clientName,
          phone,
          status,
          callCount,
          notesList,
          nextFollowUpDate: parsedFollowUpDate,
          createdAt: parsedAddedDate,
          updatedAt: parsedUpdatedDate,
          studioSlug: parsedStudioSlug,
          studioName: parsedStudioName,
        });
      }

      if (parsedResults.length === 0) {
        setImportError('Could not find valid lead rows. Please ensure rows have Client Name and Phone.');
        return;
      }

      setImportPreview(parsedResults);
    } catch (err: any) {
      setImportError('Failed to parse Excel file: ' + (err.message || 'Unknown format error'));
    }
  }, [selectedYear, selectedMonth, studios]);

  const handleConfirmImport = useCallback(() => {
    if (importPreview.length === 0) return;

    const targetStudio = studios.find((s) => s.slug === branch) || studios[0]!;
    const monthDate = `${selectedYear}-${selectedMonth}-15`;

    const batchPayload = importPreview.map((lead) => {
      const assignedStudio = lead.studioSlug
        ? (studios.find((s) => s.slug === lead.studioSlug) || targetStudio)
        : targetStudio;

      const finalCreatedAt = lead.createdAt || monthDate;
      const finalUpdatedAt = lead.updatedAt || lead.createdAt || monthDate;

      return {
        clientName: lead.clientName,
        phone: lead.phone,
        studioSlug: assignedStudio.slug,
        studioName: assignedStudio.name,
        status: lead.status,
        callCount: lead.callCount,
        notesList: lead.notesList,
        nextFollowUpDate: lead.status === 'Follow-up' && lead.nextFollowUpDate ? lead.nextFollowUpDate : undefined,
        createdAt: finalCreatedAt,
        updatedAt: finalUpdatedAt,
      };
    });

    gentleHairWigsDb.addCentralCrmLeadsBatch(batchPayload);

    setShowImportModal(false);
    setImportFile(null);
    setImportPreview([]);
    setImportError('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    setNotificationMsg(`Successfully imported ${importPreview.length} leads with dates & activity logs!`);
  }, [importPreview, studios, branch, selectedYear, selectedMonth]);

  return (
    <div className="space-y-3.5">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center space-x-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 shadow-xl text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* 1. MONTH & YEAR HUB / SELECTION VIEW */}
      {viewMode === 'month-selector' && (
        <CrmMonthsView
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMonth={selectedMonth}
          yearMonthsStats={yearMonthsStats}
          annualAnalytics={annualAnalytics}
          studios={studios}
          handleOpenMonthSheet={handleOpenMonthSheet}
          setShowImportModal={setShowImportModal}
          setShowAddLeadModal={setShowAddLeadModal}
          setNewLeadDate={setNewLeadDate}
          setImportFile={setImportFile}
          setImportPreview={setImportPreview}
          setImportError={setImportError}
          handleExportExcel={handleExportExcel}
        />
      )}

      {/* 2. INSIDE MONTH SHEET VIEW */}
      {viewMode === 'month-sheet' && (
        <div className="space-y-3">
          {/* Top Compact Navigation Ribbon */}
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Left: Back Button + Sheet Title */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setViewMode('month-selector')}
                  className="inline-flex items-center space-x-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 text-xs font-black text-slate-700 transition cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Months</span>
                </button>

                <div className="h-4 w-px bg-slate-200" />

                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">
                    {selectedMonthObj.name} {selectedYear} Leads Sheet
                  </h2>
                  <span className="text-[10px] font-black bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.2 rounded">
                    {currentMonthLeads.length} Total
                  </span>
                </div>
              </div>

              {/* Right: Stepper + Import + Export + Add Lead */}
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center space-x-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>

                  <span className="px-2 text-xs font-black text-slate-800 font-mono">
                    {selectedMonthObj.short} {selectedYear}
                  </span>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setImportFile(null);
                    setImportPreview([]);
                    setImportError('');
                    setShowImportModal(true);
                  }}
                  className="inline-flex items-center space-x-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 px-2.5 py-1 text-xs font-bold transition cursor-pointer"
                  title="Import Leads from Excel Sheet (.xlsx, .xls)"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
                  <span>Import Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="inline-flex items-center space-x-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-2.5 py-1 text-xs font-bold transition cursor-pointer"
                  title="Export Current Month Leads to Microsoft Excel (.xlsx)"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Export Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewLeadDate(`${selectedYear}-${selectedMonth}-15`);
                    setShowAddLeadModal(true);
                  }}
                  className="inline-flex items-center space-x-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-3 py-1 text-xs font-black text-white shadow-2xs transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Add Lead</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive KPI Status Filter Tiles */}
          <CrmKpiCards
            monthKpis={monthKpis}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          {/* The Strictly 7 Columns Sheet Table */}
          <CrmTable
            tableLeads={tableLeads}
            currentMonthLeads={currentMonthLeads}
            selectedMonthName={selectedMonthObj.name}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            setSelectedYear={setSelectedYear}
            setSelectedMonth={setSelectedMonth}
            handleUpdateStatus={handleUpdateStatus}
            handleUpdateCalls={handleUpdateCalls}
            handleOpenNotes={handleOpenNotes}
            handleDeleteLead={handleDeleteLead}
            setShowAddLeadModal={setShowAddLeadModal}
            setShowImportModal={setShowImportModal}
            setNewLeadDate={setNewLeadDate}
          />
        </div>
      )}

      {/* MODALS */}
      <ImportExcelModal
        showImportModal={showImportModal}
        setShowImportModal={setShowImportModal}
        selectedMonthName={selectedMonthObj.name}
        selectedYear={selectedYear}
        importFile={importFile}
        importPreview={importPreview}
        importError={importError}
        fileInputRef={fileInputRef}
        handleFileChange={handleFileChange}
        handleDownloadSampleExcel={handleDownloadSampleExcel}
        handleConfirmImport={handleConfirmImport}
      />

      {activeNotesLead && (
        <LeadNotesModal
          activeNotesLead={activeNotesLead}
          setActiveNotesLead={setActiveNotesLead}
          studios={studios}
          editingNotes={editingNotes}
          setEditingNotes={setEditingNotes}
          editingFollowUpDate={editingFollowUpDate}
          setEditingFollowUpDate={setEditingFollowUpDate}
          handleSaveNotes={handleSaveNotes}
        />
      )}

      <AddLeadModal
        showAddLeadModal={showAddLeadModal}
        setShowAddLeadModal={setShowAddLeadModal}
        selectedMonthName={selectedMonthObj.name}
        selectedYear={selectedYear}
        studios={studios}
        newClientName={newClientName}
        setNewClientName={setNewClientName}
        newPhone={newPhone}
        setNewPhone={setNewPhone}
        newStatus={newStatus}
        setNewStatus={setNewStatus}
        newCallCount={newCallCount}
        setNewCallCount={setNewCallCount}
        newLeadDate={newLeadDate}
        setNewLeadDate={setNewLeadDate}
        newFollowUpDate={newFollowUpDate}
        setNewFollowUpDate={setNewFollowUpDate}
        newStudioSlug={newStudioSlug}
        setNewStudioSlug={setNewStudioSlug}
        newNotesList={newNotesList}
        setNewNotesList={setNewNotesList} 
        handleCreateLead={handleCreateLead}
      />

      {conversionModalLead && (
        <ConversionModal
          conversionModalLead={conversionModalLead}
          setConversionModalLead={setConversionModalLead}
          studios={studios}
          handleConfirmConversion={handleConfirmConversion}
        />
      )}
    </div>
  );
}
