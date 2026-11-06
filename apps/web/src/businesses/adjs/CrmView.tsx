'use client';

import { useState, useMemo, useEffect, useCallback, useDeferredValue } from 'react';
import {
  FileSpreadsheet,
  Download,
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { PrintboothLeadItem, PrintboothLeadStatusType, KioskModelType } from './types';
import { adjsDb } from './db';
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
  initialViewMode?: 'month-selector' | 'month-sheet';
  initialStatusFilter?: string;
  onRefresh?: () => void;
}

export function CrmView({
  initialViewMode = 'month-sheet',
  initialStatusFilter = 'all',
  onRefresh,
}: CrmViewProps) {
  // Centralized Leads state
  const [leads, setLeads] = useState<PrintboothLeadItem[]>(() => adjsDb.getCrmLeads());

  const refreshCentralData = useCallback(() => {
    setLeads([...adjsDb.getCrmLeads()]);
    if (onRefresh) onRefresh();
  }, [onRefresh]);

  useEffect(() => {
    refreshCentralData();
    const unsubscribe = adjsDb.subscribe(() => {
      refreshCentralData();
    });
    return () => unsubscribe();
  }, [refreshCentralData]);

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

  // Modals & Feedback
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeNotesLead, setActiveNotesLead] = useState<PrintboothLeadItem | null>(null);
  const [conversionModalLead, setConversionModalLead] = useState<PrintboothLeadItem | null>(null);

  const activeMonthObj = useMemo(() => {
    return MONTHS_LIST.find((m) => m.value === selectedMonth) || MONTHS_LIST[9]!;
  }, [selectedMonth]);

  // Leads for the selected month and year
  const currentMonthLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (!lead.leadDate) return false;
      const parts = lead.leadDate.split('-');
      if (parts.length >= 2) {
        return parts[0] === selectedYear && parts[1] === selectedMonth;
      }
      return false;
    });
  }, [leads, selectedYear, selectedMonth]);

  // KPI calculations for the selected month
  const monthKpis: MonthKpiStats = useMemo(() => {
    let converted = 0;
    let interested = 0;
    let followUp = 0;
    let notPicked = 0;
    let notInterested = 0;

    for (const lead of currentMonthLeads) {
      const norm = normalizeStatus(lead.status);
      if (norm === 'converted') converted++;
      else if (norm === 'interested') interested++;
      else if (norm === 'followup' || norm === 'negotiation') followUp++;
      else if (norm === 'notpicked') notPicked++;
      else if (norm === 'notinterested') notInterested++;
    }

    return {
      total: currentMonthLeads.length,
      converted,
      interested,
      followUp,
      notPicked,
      notInterested,
    };
  }, [currentMonthLeads]);

  // Filtered Leads for Table
  const tableLeads = useMemo(() => {
    return currentMonthLeads
      .filter((lead) => {
        // Status filter
        if (statusFilter !== 'all') {
          const leadNorm = normalizeStatus(lead.status);
          const filterNorm = normalizeStatus(statusFilter);
          if (leadNorm !== filterNorm) {
            // Handle combined filter if needed
            if (!(filterNorm === 'followup' && leadNorm === 'negotiation')) {
              return false;
            }
          }
        }

        // Date filter
        if (dateFilter) {
          const leadYmd = normalizeDateToYMD(lead.leadDate);
          if (leadYmd !== dateFilter) return false;
        }

        // Search term filter
        if (deferredSearchTerm.trim()) {
          const q = deferredSearchTerm.toLowerCase();
          const matchName = lead.clientName.toLowerCase().includes(q);
          const matchPhone = lead.phone.toLowerCase().includes(q);
          const matchShop = (lead.shopName || '').toLowerCase().includes(q);
          const matchModel = (lead.kioskModel || '').toLowerCase().includes(q);
          const matchCity = (lead.installationCity || '').toLowerCase().includes(q);
          const matchNotes = lead.notesList.some((n) => n.toLowerCase().includes(q));
          if (!matchName && !matchPhone && !matchShop && !matchModel && !matchCity && !matchNotes) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.clientName.localeCompare(b.clientName);
        }
        if (sortBy === 'oldest') {
          return new Date(a.leadDate).getTime() - new Date(b.leadDate).getTime();
        }
        // default newest
        return new Date(b.leadDate).getTime() - new Date(a.leadDate).getTime();
      });
  }, [currentMonthLeads, statusFilter, dateFilter, deferredSearchTerm, sortBy]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    const curIdx = MONTHS_LIST.findIndex((m) => m.value === selectedMonth);
    if (curIdx > 0) {
      setSelectedMonth(MONTHS_LIST[curIdx - 1]!.value);
    } else {
      setSelectedMonth('12');
      const curYearNum = Number(selectedYear);
      if (curYearNum > 2024) setSelectedYear(String(curYearNum - 1));
    }
  };

  const handleNextMonth = () => {
    const curIdx = MONTHS_LIST.findIndex((m) => m.value === selectedMonth);
    if (curIdx < MONTHS_LIST.length - 1) {
      setSelectedMonth(MONTHS_LIST[curIdx + 1]!.value);
    } else {
      setSelectedMonth('01');
      const curYearNum = Number(selectedYear);
      if (curYearNum < 2026) setSelectedYear(String(curYearNum + 1));
    }
  };

  // Status change handler
  const handleUpdateStatus = (leadId: string, newStatus: PrintboothLeadStatusType) => {
    if (newStatus === 'Converted') {
      const target = leads.find((l) => l.id === leadId);
      if (target) {
        setConversionModalLead(target);
        return;
      }
    }

    adjsDb.updateCrmLead(leadId, { status: newStatus });
  };

  // Confirm conversion with Kiosk details
  const handleConfirmConversion = (
    leadId: string,
    kioskModel: KioskModelType,
    installationCity: string,
    unitsOrdered: number
  ) => {
    adjsDb.updateCrmLead(leadId, {
      status: 'Converted',
      kioskModel,
      installationCity,
      unitsOrdered,
    });

    // Auto-create order in machine sales pipeline
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      adjsDb.addOrder({
        id: `PB-ORD-${Date.now().toString().slice(-4)}`,
        orderNumber: `PB/2026/${String(leads.length + 101)}`,
        merchantName: lead.clientName,
        phone: lead.phone,
        shopName: lead.shopName || lead.clientName,
        kioskModel,
        units: unitsOrdered || 1,
        unitPrice: 285000,
        totalAmount: (unitsOrdered || 1) * 285000,
        stage: 'Order Booked',
        city: installationCity,
        orderDate: new Date().toISOString().split('T')[0] || '',
      });
    }
  };

  const handleUpdateCalls = (leadId: string, calls: number) => {
    adjsDb.updateCrmLead(leadId, { callCount: calls });
  };

  const handleSaveNotes = (leadId: string, notes: [string, string, string, string, string]) => {
    adjsDb.updateLeadNotes(leadId, notes);
  };

  const handleDeleteLead = (leadId: string) => {
    adjsDb.deleteCrmLead(leadId);
  };

  const handleCreateLead = (leadData: Omit<PrintboothLeadItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newLead: PrintboothLeadItem = {
      ...leadData,
      id: `PB-LEAD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    adjsDb.addCrmLead(newLead);
  };

  const handleBatchImport = (importedList: Omit<PrintboothLeadItem, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const toInsert: PrintboothLeadItem[] = importedList.map((item, idx) => ({
      ...item,
      id: `PB-LEAD-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    adjsDb.batchAddCrmLeads(toInsert);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (tableLeads.length === 0) return;
    const headers = [
      'ID',
      'Merchant Name',
      'Phone',
      'Shop / Business Name',
      'Location Category',
      'Status',
      'Calls',
      'Lead Date',
      'Kiosk Model',
      'Installation City',
      'Units Ordered',
      'Note 1',
      'Note 2',
      'Note 3',
    ];

    const rows = tableLeads.map((l) => [
      l.id,
      `"${l.clientName.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${(l.shopName || '').replace(/"/g, '""')}"`,
      `"${l.locationCategory || ''}"`,
      `"${l.status}"`,
      l.callCount,
      l.leadDate,
      `"${l.kioskModel || ''}"`,
      `"${l.installationCity || ''}"`,
      l.unitsOrdered || '',
      `"${(l.notesList[0] || '').replace(/"/g, '""')}"`,
      `"${(l.notesList[1] || '').replace(/"/g, '""')}"`,
      `"${(l.notesList[2] || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PRINTBOOTH_Leads_${selectedYear}_${activeMonthObj.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Main View Mode Render */}
      {viewMode === 'month-selector' ? (
        <CrmMonthsView
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          leads={leads}
          onSelectMonth={(mVal) => {
            setSelectedMonth(mVal);
            setViewMode('month-sheet');
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Top Month Sheet Single-Row Ribbon */}
          <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs">
            {/* Left: Back to Months */}
            <button
              onClick={() => setViewMode('month-selector')}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition shadow-2xs cursor-pointer shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
              <span>Back to Months</span>
            </button>

            {/* Right: Month Stepper + Import + Export + Add Lead in One Row */}
            <div className="flex items-center space-x-2">
              {/* Month Stepper */}
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  onClick={handlePrevMonth}
                  className="rounded-lg p-1 text-slate-500 hover:bg-white hover:text-slate-900 transition"
                  title="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2.5 text-xs font-black text-slate-800 font-mono">
                  {activeMonthObj.short} {selectedYear}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="rounded-lg p-1 text-slate-500 hover:bg-white hover:text-slate-900 transition"
                  title="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition shadow-2xs"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-purple-600" />
                <span>Import Excel</span>
              </button>

              <button
                onClick={handleExportCsv}
                disabled={tableLeads.length === 0}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition shadow-2xs disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setShowAddLeadModal(true)}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add New Lead</span>
              </button>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <CrmKpiCards
            stats={monthKpis}
            currentFilter={statusFilter}
            onFilterChange={(newF) => setStatusFilter(newF)}
          />

          {/* Leads Table */}
          <CrmTable
            leads={tableLeads}
            selectedMonthName={activeMonthObj.name}
            selectedYear={selectedYear}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onUpdateStatus={handleUpdateStatus}
            onUpdateCalls={handleUpdateCalls}
            onOpenNotes={(lead) => setActiveNotesLead(lead)}
            onDeleteLead={handleDeleteLead}
          />
        </div>
      )}

      {/* MODALS */}
      {showAddLeadModal && (
        <AddLeadModal
          isOpen={showAddLeadModal}
          onClose={() => setShowAddLeadModal(false)}
          selectedMonthName={activeMonthObj.name}
          selectedYear={selectedYear}
          defaultDate={`${selectedYear}-${selectedMonth}-01`}
          existingLeads={leads}
          onSave={handleCreateLead}
        />
      )}

      {activeNotesLead && (
        <LeadNotesModal
          isOpen={Boolean(activeNotesLead)}
          onClose={() => setActiveNotesLead(null)}
          lead={activeNotesLead}
          onSaveNotes={handleSaveNotes}
        />
      )}

      {conversionModalLead && (
        <ConversionModal
          isOpen={Boolean(conversionModalLead)}
          onClose={() => setConversionModalLead(null)}
          lead={conversionModalLead}
          onConfirm={handleConfirmConversion}
        />
      )}

      {showImportModal && (
        <ImportExcelModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          existingLeads={leads}
          defaultMonth={selectedMonth}
          defaultYear={selectedYear}
          onImportLeads={handleBatchImport}
        />
      )}
    </div>
  );
}

