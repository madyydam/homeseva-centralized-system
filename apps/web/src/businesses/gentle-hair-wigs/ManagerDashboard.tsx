'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  LayoutDashboard,
  Scissors,
  Ruler,
  Calendar,
  Package,
  Receipt,
  Plus,
  LogOut,
  MapPin,
  Inbox,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Printer,
  ChevronRight,
  Filter,
  Sparkles,
  ShieldCheck,
  ClipboardCheck,
  TrendingUp,
  FileSpreadsheet,
  Users,
  UserPlus,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  PhoneCall,
} from 'lucide-react';
import { BusinessDashboardProps } from '../types';
import { gentleHairWigsConfig } from './config';
import { gentleHairWigsDb } from './db';
import {
  OrderItem,
  MeasurementItem,
  AppointmentItem,
  InventoryItem,
  InvoiceItem,
  GentleHairWigsStudioData,
} from './types';
const CrmView = dynamic(() => import('./CrmView').then((m) => m.CrmView), {
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3 bg-white rounded-xl border border-slate-200/80 p-8 shadow-xs">
      <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
      <span className="text-xs font-bold text-slate-500">Loading Client CRM & Monthly Sheets...</span>
    </div>
  ),
  ssr: true,
});

const SopView = dynamic(() => import('./SopView').then((m) => m.SopView), {
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-2 bg-white rounded-xl border border-slate-200 p-8">
      <div className="w-6 h-6 rounded-full border-2 border-slate-600 border-t-transparent animate-spin" />
      <span className="text-xs font-semibold text-slate-400">Loading Studio SOP...</span>
    </div>
  ),
  ssr: false,
});

const FinancePnlView = dynamic(() => import('./FinancePnlView').then((m) => m.FinancePnlView), {
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-2 bg-white rounded-xl border border-slate-200 p-8">
      <div className="w-6 h-6 rounded-full border-2 border-slate-600 border-t-transparent animate-spin" />
      <span className="text-xs font-semibold text-slate-400">Loading Finance P&L...</span>
    </div>
  ),
  ssr: false,
});

const GoogleSheetsView = dynamic(() => import('./GoogleSheetsView').then((m) => m.GoogleSheetsView), {
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-2 bg-white rounded-xl border border-slate-200 p-8">
      <div className="w-6 h-6 rounded-full border-2 border-slate-600 border-t-transparent animate-spin" />
      <span className="text-xs font-semibold text-slate-400">Loading Google Sheets...</span>
    </div>
  ),
  ssr: false,
});

const TeamAttendanceView = dynamic(() => import('./TeamAttendanceView').then((m) => m.TeamAttendanceView), {
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-2 bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
      <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
      <span className="text-xs font-bold text-slate-500">Loading Team Attendance &amp; Reporting...</span>
    </div>
  ),
  ssr: false,
});

const ALL_MANAGER_NAV_ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
  },
  {
    id: 'orders',
    label: 'Custom Wig Orders',
    icon: Scissors,
  },
  {
    id: 'measurements',
    label: 'Head Measurements',
    icon: Ruler,
  },
  {
    id: 'appointments',
    label: 'Appointments & Suites',
    icon: Calendar,
  },
  {
    id: 'crm',
    label: 'Client CRM & Leads',
    icon: Users,
  },
  {
    id: 'team',
    label: 'Team & Attendance',
    icon: UserCheck,
  },
  {
    id: 'inventory',
    label: 'Hair & Patch Stock',
    icon: Package,
  },
  {
    id: 'billing',
    label: 'Billing & POS Desk',
    icon: Receipt,
  },
  {
    id: 'sop',
    label: 'Studio SOP & Protocols',
    icon: ClipboardCheck,
  },
  {
    id: 'finance-pnl',
    label: 'Monthly Finance & P&L',
    icon: TrendingUp,
  },
  {
    id: 'finance-sheets',
    label: 'Google Finance Sheets',
    icon: FileSpreadsheet,
  },
] as const;

export function ManagerDashboard({
  branch = 'viman-nagar',
  role = 'Studio Manager',
}: BusinessDashboardProps) {
  const BRANCH_LIST = gentleHairWigsConfig.branches!;

  const currentBranch =
    branch === 'ravet' ? 'ravet' : branch === 'kolhapur' ? 'kolhapur' : 'viman-nagar';

  const currentBranchInfo =
    BRANCH_LIST.find((b) => b.slug === currentBranch) || BRANCH_LIST[0]!;

  const branchName = currentBranchInfo.name;

  const nextBranch =
    currentBranch === 'viman-nagar'
      ? BRANCH_LIST[1]!
      : currentBranch === 'ravet'
      ? BRANCH_LIST[2]!
      : BRANCH_LIST[0]!;

  // Role state (Allows on-the-fly switching between Studio Manager and Cold Caller)
  const [currentRole, setCurrentRole] = useState(role || 'Studio Manager');

  useEffect(() => {
    if (role) {
      setCurrentRole(role);
    }
  }, [role]);

  const userRole = currentRole;
  const isColdCaller =
    userRole.toLowerCase().includes('cold') || userRole.toLowerCase().includes('telecaller');

  // Navigation tab state - if Cold Caller, strictly locked to 'crm'
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'orders'
    | 'measurements'
    | 'appointments'
    | 'crm'
    | 'team'
    | 'inventory'
    | 'billing'
    | 'sop'
    | 'finance-pnl'
    | 'finance-sheets'
  >(isColdCaller ? 'crm' : 'overview');

  useEffect(() => {
    if (isColdCaller && activeTab !== 'crm') {
      setActiveTab('crm');
    }
  }, [isColdCaller, activeTab]);

  // Sidebar collapse toggle state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Isolated database state
  const [data, setData] = useState<GentleHairWigsStudioData>(() => gentleHairWigsDb.getStudioData(currentBranch));

  const refreshData = useCallback(() => {
    setData({ ...gentleHairWigsDb.getStudioData(currentBranch) });
  }, [currentBranch]);

  useEffect(() => {
    refreshData();
    gentleHairWigsDb.syncFromDatabase();
    const unsubscribe = gentleHairWigsDb.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [refreshData]);

  // Modals state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Selected item modal viewers
  const [activeMeasurementSpec, setActiveMeasurementSpec] = useState<MeasurementItem | null>(null);
  const [activeInvoiceReceipt, setActiveInvoiceReceipt] = useState<InvoiceItem | null>(null);

  // Form input states: Custom Wig Order
  const [clientNameInput, setClientNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [wigTypeInput, setWigTypeInput] = useState('Full Lace Human Hair Wig');
  const [densityInput, setDensityInput] = useState('120% (Natural Full)');
  const [hairLengthInput, setHairLengthInput] = useState('16 Inches');
  const [hairShadeInput, setHairShadeInput] = useState('Natural Virgin Dark Brown (#2)');
  const [amountInput, setAmountInput] = useState('');
  const [advanceInput, setAdvanceInput] = useState('');
  const [fittingDateInput, setFittingDateInput] = useState('');

  // Form input states: Measurement
  const [mClientName, setMClientName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mHairLoss, setMHairLoss] = useState('Male Pattern Baldness (Norwood IV-V)');
  const [mCircumference, setMCircumference] = useState('21.5 inches');
  const [mFrontToNape, setMFrontToNape] = useState('14.0 inches');
  const [mEarToEar, setMEarToEar] = useState('12.5 inches');
  const [mTempleToTemple, setMTempleToTemple] = useState('14.5 inches');
  const [mBaseSize, setMBaseSize] = useState('8 x 6 inches');
  const [mBaseMaterial, setMBaseMaterial] = useState('Swiss HD Invisible Lace');
  const [mAttachment, setMAttachment] = useState('Waterproof Ultra-Hold Tape');
  const [mNotes, setMNotes] = useState('');

  // Form input states: Appointment
  const [appClientName, setAppClientName] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appService, setAppService] = useState('Custom Wig Trial & Cut-in Styling');
  const [appSuite, setAppSuite] = useState('Suite 1 (VIP Fitting & Consultation)');
  const [appStylist, setAppStylist] = useState('Senior Wig Specialist Rohit');
  const [appDate, setAppDate] = useState(new Date().toISOString().split('T')[0] || '');
  const [appTime, setAppTime] = useState('11:30 AM');

  // Form input states: Inventory
  const [invSku, setInvSku] = useState('');
  const [invName, setInvName] = useState('');
  const [invCategory, setInvCategory] = useState<'Wigs & Systems' | 'Patches & Toupees' | 'Adhesives & Tapes' | 'Solvents & Care'>('Wigs & Systems');
  const [invQuantity, setInvQuantity] = useState('5');
  const [invReorder, setInvReorder] = useState('2');
  const [invPrice, setInvPrice] = useState('28000');
  const [invUnit, setInvUnit] = useState('System Unit');

  // Form input states: Invoice
  const [invcClient, setInvcClient] = useState('');
  const [invcPhone, setInvcPhone] = useState('');
  const [invcSummary, setInvcSummary] = useState('Custom HD Lace Wig + Fitting Service');
  const [invcSubtotal, setInvcSubtotal] = useState('32000');
  const [invcPaymentMode, setInvcPaymentMode] = useState<'UPI / QR Pay' | 'Credit / Debit Card' | 'Cash Counter' | 'NEFT / Transfer'>('UPI / QR Pay');
  const [invcStatus, setInvcStatus] = useState<'Paid' | 'Partial Advance' | 'Pending'>('Paid');

  // Filter states
  const [orderStageFilter, setOrderStageFilter] = useState<string>('All');

  // Live KPI Calculations (Memoized to prevent recalculations on form keystrokes)
  const { totalSales, activeOrdersCount, todayAppointmentsCount, totalInventoryUnits, lowStockCount } = useMemo(() => {
    const sales =
      data.orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0) +
      data.invoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
    const activeOrders = data.orders.length;
    const todayApps = data.appointments.filter((a) => a.status !== 'Cancelled').length;
    const invUnits = data.inventory.reduce((sum, i) => sum + (Number(i.stockQuantity) || 0), 0);
    const lowStock = data.inventory.filter((i) => i.stockQuantity <= i.reorderLevel).length;
    return {
      totalSales: sales,
      activeOrdersCount: activeOrders,
      todayAppointmentsCount: todayApps,
      totalInventoryUnits: invUnits,
      lowStockCount: lowStock,
    };
  }, [data.orders, data.invoices, data.appointments, data.inventory]);

  // Escape listener for closing modals
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowOrderModal(false);
        setShowMeasurementModal(false);
        setShowAppointmentModal(false);
        setShowInventoryModal(false);
        setShowInvoiceModal(false);
        setActiveMeasurementSpec(null);
        setActiveInvoiceReceipt(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateOrder = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!amountInput.trim()) return;

    const newOrder: OrderItem = {
      id: `GHW-${currentBranch.substring(0, 3).toUpperCase()}-${String(data.orders.length + 1).padStart(3, '0')}`,
      clientName: clientNameInput.trim() || "Don't know",
      phone: phoneInput.trim(),
      wigType: wigTypeInput,
      density: densityInput,
      hairLength: hairLengthInput,
      hairShade: hairShadeInput,
      amount: Number(amountInput) || 0,
      advancePaid: Number(advanceInput) || 0,
      fittingDate: fittingDateInput || 'Pending Schedule',
      stage: 'Measurements Recorded',
      createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    gentleHairWigsDb.addOrder(currentBranch, newOrder);
    refreshData();
    setShowOrderModal(false);
    setClientNameInput('');
    setPhoneInput('');
    setAmountInput('');
    setAdvanceInput('');
    setFittingDateInput('');
  }, [clientNameInput, amountInput, phoneInput, wigTypeInput, densityInput, hairLengthInput, hairShadeInput, advanceInput, fittingDateInput, currentBranch, data.orders.length, refreshData]);

  const handleAdvanceOrderStage = useCallback((orderId: string) => {
    gentleHairWigsDb.advanceOrderStage(currentBranch, orderId);
    refreshData();
  }, [currentBranch, refreshData]);

  const handleCreateMeasurement = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const newMeasurement: MeasurementItem = {
      id: `SCAL-${currentBranch.substring(0, 3).toUpperCase()}-${String(data.measurements.length + 1).padStart(3, '0')}`,
      clientName: mClientName.trim() || "Don't know",
      phone: mPhone.trim(),
      hairLossType: mHairLoss,
      circumference: mCircumference,
      frontToNape: mFrontToNape,
      earToEar: mEarToEar,
      templeToTemple: mTempleToTemple,
      baseSize: mBaseSize,
      baseMaterial: mBaseMaterial,
      attachmentMethod: mAttachment,
      notes: mNotes.trim() || 'No scalp irritation, healthy skin profile.',
      recordedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    gentleHairWigsDb.addMeasurement(currentBranch, newMeasurement);
    refreshData();
    setShowMeasurementModal(false);
    setMClientName('');
    setMPhone('');
    setMNotes('');
  }, [mClientName, mPhone, mHairLoss, mCircumference, mFrontToNape, mEarToEar, mTempleToTemple, mBaseSize, mBaseMaterial, mAttachment, mNotes, currentBranch, data.measurements.length, refreshData]);

  const handleCreateAppointment = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const newApp: AppointmentItem = {
      id: `APT-${currentBranch.substring(0, 3).toUpperCase()}-${String(data.appointments.length + 1).padStart(3, '0')}`,
      clientName: appClientName.trim() || "Don't know",
      phone: appPhone.trim(),
      serviceType: appService,
      suite: appSuite,
      stylistName: appStylist,
      appointmentDate: appDate,
      timeSlot: appTime,
      status: 'Scheduled',
    };

    gentleHairWigsDb.addAppointment(currentBranch, newApp);
    refreshData();
    setShowAppointmentModal(false);
    setAppClientName('');
    setAppPhone('');
  }, [appClientName, appPhone, appService, appSuite, appStylist, appDate, appTime, currentBranch, data.appointments.length, refreshData]);

  const handleUpdateAppointmentStatus = useCallback((id: string, status: AppointmentItem['status']) => {
    gentleHairWigsDb.updateAppointmentStatus(currentBranch, id, status);
    refreshData();
  }, [currentBranch, refreshData]);

  const handleCreateInventory = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!invName.trim()) return;

    const newInv: InventoryItem = {
      id: `INV-${currentBranch.substring(0, 3).toUpperCase()}-${String(data.inventory.length + 1).padStart(3, '0')}`,
      sku: invSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      name: invName.trim(),
      category: invCategory,
      stockQuantity: Number(invQuantity) || 0,
      reorderLevel: Number(invReorder) || 1,
      unitPrice: Number(invPrice) || 0,
      unit: invUnit || 'Unit',
    };

    gentleHairWigsDb.addInventoryItem(currentBranch, newInv);
    refreshData();
    setShowInventoryModal(false);
    setInvSku('');
    setInvName('');
  }, [invName, invSku, invCategory, invQuantity, invReorder, invPrice, invUnit, currentBranch, data.inventory.length, refreshData]);

  const handleAdjustInventoryQuantity = useCallback((id: string, delta: number) => {
    gentleHairWigsDb.adjustInventory(currentBranch, id, delta);
    refreshData();
  }, [currentBranch, refreshData]);

  const handleCreateInvoice = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!invcSubtotal.trim()) return;

    const sub = Number(invcSubtotal) || 0;
    const gst = Math.round(sub * 0.18);
    const total = sub + gst;

    const newInvoice: InvoiceItem = {
      id: `INV-REC-${String(data.invoices.length + 1).padStart(4, '0')}`,
      invoiceNumber: `GHW/${currentBranch.substring(0, 3).toUpperCase()}/2026/${String(data.invoices.length + 101)}`,
      clientName: invcClient.trim() || "Don't know",
      phone: invcPhone.trim(),
      itemsSummary: invcSummary.trim(),
      subtotal: sub,
      gstAmount: gst,
      totalAmount: total,
      paymentMode: invcPaymentMode,
      paymentStatus: invcStatus,
      invoiceDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    gentleHairWigsDb.addInvoice(currentBranch, newInvoice);
    refreshData();
    setShowInvoiceModal(false);
    setInvcClient('');
    setInvcPhone('');
    setActiveInvoiceReceipt(newInvoice);
  }, [invcClient, invcSubtotal, invcPhone, invcSummary, invcPaymentMode, invcStatus, currentBranch, data.invoices.length, refreshData]);

  // Filtered orders (memoized to eliminate redundant computations on re-render)
  const filteredOrders = useMemo(() => {
    return data.orders.filter((o) => {
      if (orderStageFilter === 'All') return true;
      if (orderStageFilter === 'Crafting')
        return (
          o.stage === 'Measurements Recorded' ||
          o.stage === 'Lace Base Crafting' ||
          o.stage === 'Hand-Knotting Hair'
        );
      if (orderStageFilter === 'Fitting')
        return o.stage === 'Custom Styling' || o.stage === 'Fitting & Trial';
      if (orderStageFilter === 'Delivered') return o.stage === 'Delivered';
      return true;
    });
  }, [data.orders, orderStageFilter]);

  const allNavItems = ALL_MANAGER_NAV_ITEMS;

  // If Cold Caller, strictly only show the CRM and leads tab
  const navItems = useMemo(
    () => (isColdCaller ? allNavItems.filter((item) => item.id === 'crm') : allNavItems),
    [isColdCaller, allNavItems]
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans selection:bg-amber-500 selection:text-white">
      {/* Sidebar with Smooth Collapse / Expand Option - Squeezed & Compact */}
      <aside
        className={`bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 md:h-screen md:sticky md:top-0 z-30 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-full md:w-16' : 'w-full md:w-56'
        }`}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Header Brand & Collapse Toggle */}
          <div
            className={`h-14 flex items-center border-b border-slate-200/80 bg-white shrink-0 px-3 transition-all ${
              isSidebarCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            {!isSidebarCollapsed ? (
              <>
                <div className="flex items-center space-x-2 min-w-0">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-200/90 bg-amber-50/30 p-0.5 shadow-2xs overflow-hidden"
                    style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px' }}
                  >
                    <img
                      src="/logos/gentle-hair-wigs-logo.jpg"
                      alt="Gentle Hair Wigs"
                      width={32}
                      height={32}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-black text-slate-900 truncate leading-tight">
                      Gentle Hair Wigs
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200/80 leading-none">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      {currentBranchInfo.shortName}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="hidden md:flex p-1 rounded-lg text-slate-400 hover:text-amber-800 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition cursor-pointer"
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200/90 bg-amber-50/30 p-0.5 hover:bg-amber-100 hover:border-amber-400 transition cursor-pointer group shadow-2xs"
                  title="Expand Sidebar"
                >
                  <img
                    src="/logos/gentle-hair-wigs-logo.jpg"
                    alt="Logo"
                    className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                  />
                </button>
              </div>
            )}
          </div>

          {/* Sub-header expand trigger when collapsed */}
          {isSidebarCollapsed && (
            <div className="hidden md:flex justify-center py-1 border-b border-slate-100 bg-slate-50/60">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-100/70 transition cursor-pointer"
                title="Click to Expand Sidebar"
              >
                <PanelLeftOpen className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Unified Navigation Links - Elegant Spacing & Balanced Vertical Rhythm */}
          <div className="p-3 overflow-y-auto flex-1">
            <nav className="space-y-2.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as typeof activeTab)}
                    title={item.label}
                    className={`group relative w-full flex items-center rounded-xl font-bold transition-all duration-150 cursor-pointer overflow-hidden ${
                      isSidebarCollapsed
                        ? 'justify-center py-3 px-2'
                        : 'justify-start px-3.5 py-3 text-[12.5px]'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-amber-50/80 active:scale-98'
                    }`}
                  >
                    {/* Active & Hover Left Edge Bar (Expanded Only) */}
                    {!isSidebarCollapsed && (
                      <span
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-150 ${
                          isActive
                            ? 'h-6 bg-white opacity-100 shadow-xs'
                            : 'h-0 bg-amber-500 opacity-0 group-hover:h-4 group-hover:opacity-100'
                        }`}
                      />
                    )}

                    <div
                      className={`flex items-center min-w-0 ${
                        isSidebarCollapsed ? 'justify-center' : 'gap-2.5 pr-0.5 pl-1'
                      }`}
                    >
                      <Icon
                        className={`shrink-0 transition-transform duration-150 ${
                          isSidebarCollapsed ? 'h-5 w-5' : 'h-4.5 w-4.5'
                        } ${
                          isActive
                            ? 'text-white'
                            : 'text-amber-700/80 group-hover:text-amber-600 group-hover:scale-105'
                        }`}
                      />
                      {!isSidebarCollapsed && (
                        <span className="truncate whitespace-nowrap text-left tracking-tight text-[12px] font-bold">
                          {item.label}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Profile & Role Switcher */}
        <div className="p-2.5 border-t border-slate-200/80 bg-slate-50/80 shrink-0">
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center space-x-2 mb-2 px-0.5">
                <div
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-lg text-[11px] font-black text-white shrink-0 shadow-xs bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-500 shadow-amber-500/20"
                >
                  {isColdCaller ? 'CC' : 'SM'}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-slate-900 truncate leading-tight">
                    {userRole}
                  </span>
                  <span className="block text-[10px] font-semibold truncate leading-tight text-slate-500">
                    {currentBranchInfo.shortName} Studio
                  </span>
                </div>
              </div>

              {/* Exit / Switch User */}
              <div>
                <Link
                  href="/signin/gentle-hair-wigs"
                  className="w-full flex items-center justify-center space-x-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 py-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-900 transition-all duration-150 shadow-2xs cursor-pointer group"
                >
                  <LogOut className="h-2.5 w-2.5 text-slate-400 group-hover:text-rose-600 transition-transform" />
                  <span>Sign In As Another User / Exit</span>
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-1.5">
              <div
                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg text-[11px] font-black text-white shadow-xs bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-500"
                title={`User Role: ${userRole}`}
              >
                {isColdCaller ? 'CC' : 'SM'}
              </div>
              <Link
                href="/signin/gentle-hair-wigs"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-slate-200 transition cursor-pointer"
                title="Sign In As Another User / Exit"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Top Header Bar - Middle/Center Aligned */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center">
            {/* Quick Expand trigger if collapsed */}
            {isSidebarCollapsed && (
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="hidden md:flex p-2 rounded-xl text-slate-500 hover:text-amber-800 hover:bg-amber-50 border border-slate-200 transition cursor-pointer"
                title="Expand Sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Centered Middle Section: Title & Studio Selector ("center me middle me kar") */}
          <div className="flex items-center justify-center space-x-3.5 mx-auto">
            <h1 className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-tight whitespace-nowrap">
              {activeTab === 'overview' && 'Studio Overview'}
              {activeTab === 'orders' && 'Custom Wig Orders'}
              {activeTab === 'measurements' && 'Head Measurements'}
              {activeTab === 'appointments' && 'Appointments & Suites'}
              {activeTab === 'crm' && 'Client CRM & Monthly Sheets'}
              {activeTab === 'team' && 'Team Attendance & Daily Reporting'}
              {activeTab === 'inventory' && 'Hair & Patch Stock'}
              {activeTab === 'billing' && 'Billing & POS Invoices'}
              {activeTab === 'sop' && 'Studio SOP & Operations'}
              {activeTab === 'finance-pnl' && 'Finance & Monthly Profit/Loss'}
              {activeTab === 'finance-sheets' && 'Google Finance Spreadsheets'}
            </h1>

            {/* Studio Branch Switcher */}
            <div className="hidden sm:inline-flex items-center space-x-1 bg-amber-50/90 border border-amber-200/80 rounded-lg p-0.5 shadow-2xs">
              {BRANCH_LIST.map((b) => (
                <Link
                  key={b.slug}
                  href={`/app/gentle-hair-wigs/dashboard?branch=${b.slug}&role=${encodeURIComponent(userRole)}`}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition ${
                    currentBranch === b.slug
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  {b.shortName}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {activeTab === 'orders' && (
              <button
                onClick={() => setShowOrderModal(true)}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-amber-500/20 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ New Wig Order</span>
              </button>
            )}
            {activeTab === 'measurements' && (
              <button
                onClick={() => setShowMeasurementModal(true)}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-amber-500/20 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Record Measurement</span>
              </button>
            )}
            {activeTab === 'appointments' && (
              <button
                onClick={() => setShowAppointmentModal(true)}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-amber-500/20 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Book Suite Slot</span>
              </button>
            )}
            {activeTab === 'inventory' && (
              <button
                onClick={() => setShowInventoryModal(true)}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-amber-500/20 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add Stock Item</span>
              </button>
            )}
            {activeTab === 'billing' && (
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-amber-500/20 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Generate Tax Invoice</span>
              </button>
            )}
          </div>
        </header>

        {/* Dashboard Canvas */}
        <div className="p-3.5 sm:p-5 space-y-4 max-w-[1720px] w-full">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-yellow-900 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-400/30 rounded-full px-3 py-1 text-[11px] font-bold text-amber-200 mb-3">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                    <span>Isolated Studio DB · Active</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight">{currentBranchInfo.name}</h2>
                  <p className="text-xs text-amber-100/90 mt-1 leading-relaxed">
                    {currentBranchInfo.address}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
                    <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                      {currentBranchInfo.suites} Private Fitting Suites
                    </span>
                    <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                      {currentBranchInfo.staffCount} Dedicated Specialists
                    </span>
                    <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                      Operating: 10:00 AM - 08:30 PM
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Pipeline Snapshot */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Custom Order Production Pipeline
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Live cranial production progress across workshop stages
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1 cursor-pointer bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200/80 transition"
                  >
                    <span>Go to Orders Tab</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'Measurements', stage: 'Measurements Recorded', color: 'border-blue-200 bg-blue-50/70 text-blue-900' },
                    { label: 'Lace Base', stage: 'Lace Base Crafting', color: 'border-indigo-200 bg-indigo-50/70 text-indigo-900' },
                    { label: 'Hand-Knotting', stage: 'Hand-Knotting Hair', color: 'border-purple-200 bg-purple-50/70 text-purple-900' },
                    { label: 'Custom Styling', stage: 'Custom Styling', color: 'border-amber-200 bg-amber-50/70 text-amber-900' },
                    { label: 'Fitting & Trial', stage: 'Fitting & Trial', color: 'border-orange-200 bg-orange-50/70 text-orange-900' },
                    { label: 'Delivered', stage: 'Delivered', color: 'border-emerald-200 bg-emerald-50/70 text-emerald-900' },
                  ].map((st) => {
                    const count = data.orders.filter((o) => o.stage === st.stage).length;
                    return (
                      <div key={st.label} className={`rounded-2xl border p-4 text-center shadow-2xs flex flex-col justify-between min-h-[96px] ${st.color}`}>
                        <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">
                          {st.label}
                        </span>
                        <span className="text-2xl font-black font-mono my-0.5 block">{count}</span>
                        <span className="text-[11px] font-semibold opacity-70 block">units</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dedicated Sections Quick Access - Spacious Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                {/* 1. Custom Orders */}
                <div
                  onClick={() => setActiveTab('orders')}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 hover:border-amber-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[150px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-800 transition">Custom Orders</span>
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 group-hover:bg-amber-100 transition">
                      <Scissors className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 group-hover:text-amber-700 transition">
                      {data.orders.length}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">Cranial custom orders in production &amp; trial</p>
                  </div>
                </div>

                {/* 2. Head Measurements */}
                <div
                  onClick={() => setActiveTab('measurements')}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 hover:border-amber-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[150px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-800 transition">Head Measurements</span>
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 group-hover:bg-amber-100 transition">
                      <Ruler className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 group-hover:text-amber-700 transition">
                      {data.measurements.length}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">Scalp contour scans &amp; base specifications</p>
                  </div>
                </div>

                {/* 3. Suites & Appointments */}
                <div
                  onClick={() => setActiveTab('appointments')}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 hover:border-amber-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[150px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-800 transition">Suites &amp; Appointments</span>
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 group-hover:bg-amber-100 transition">
                      <Calendar className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 group-hover:text-amber-700 transition">
                      {data.appointments.length}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">Private fitting suite bookings &amp; trials</p>
                  </div>
                </div>

                {/* 4. Client CRM & Leads */}
                <div
                  onClick={() => setActiveTab('crm')}
                  className="rounded-2xl border border-purple-200/90 bg-white p-5 sm:p-6 hover:border-purple-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[150px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wider group-hover:text-purple-900 transition">Client CRM &amp; Leads</span>
                    <div className="p-2 rounded-xl bg-purple-50 border border-purple-200/60 text-purple-700 group-hover:bg-purple-100 transition">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-purple-900 group-hover:text-purple-700 transition">
                      {gentleHairWigsDb.getCentralCrmLeads().length}
                    </div>
                    <p className="text-xs text-purple-600/80 mt-2 line-clamp-2">Inquiries, scalp trials &amp; daily calls</p>
                  </div>
                </div>

                {/* 5. Hair & Patch Stock */}
                <div
                  onClick={() => setActiveTab('inventory')}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 hover:border-amber-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[150px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-800 transition">Hair &amp; Patch Stock</span>
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 group-hover:bg-amber-100 transition">
                      <Package className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 group-hover:text-amber-700 transition">
                      {data.inventory.length}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">Wigs, toupees, medical adhesives &amp; solvent care</p>
                  </div>
                </div>

                {/* 6. Billing & Invoices */}
                <div
                  onClick={() => setActiveTab('billing')}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 hover:border-amber-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[150px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-800 transition">Billing &amp; Invoices</span>
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 group-hover:bg-amber-100 transition">
                      <Receipt className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 group-hover:text-amber-700 transition">
                      {data.invoices.length}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">GST tax invoices, advance receipts &amp; POS settlements</p>
                  </div>
                </div>

                {/* 7. Studio SOP & Protocols */}
                <div
                  onClick={() => setActiveTab('sop')}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 hover:border-amber-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[150px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-800 transition">Studio SOP &amp; Protocols</span>
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 group-hover:bg-amber-100 transition">
                      <ClipboardCheck className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-amber-700">
                      SOP Active
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">Standard protocols, hygiene checklist &amp; staff duties</p>
                  </div>
                </div>

                {/* 8. Monthly Finance & P&L */}
                <div
                  onClick={() => setActiveTab('finance-pnl')}
                  className="rounded-2xl border border-emerald-200/90 bg-white p-5 sm:p-6 hover:border-emerald-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[150px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider group-hover:text-emerald-900 transition">Monthly Finance &amp; P&amp;L</span>
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 group-hover:bg-emerald-100 transition">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600">
                      P&amp;L Live
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">Monthly sales, Capex/Opex expenses &amp; net profit</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM WIG ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Custom Wig &amp; Toupee Orders
                  </h2>
                  <p className="text-xs text-slate-500">
                    Track client custom orders from cranial measurement to final fitting and styling
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Custom Order</span>
                  </button>
                </div>
              </div>

              {/* Stage Filter */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center space-x-1">
                  <Filter className="h-3 w-3" />
                  <span>Filter:</span>
                </span>
                {['All', 'Crafting', 'Fitting', 'Delivered'].map((filterName) => (
                  <button
                    key={filterName}
                    onClick={() => setOrderStageFilter(filterName)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      orderStageFilter === filterName
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filterName}
                  </button>
                ))}
              </div>

              {filteredOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
                  <Scissors className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-3 text-sm font-bold text-slate-800">No orders found in this view</h3>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                    Record client custom hair systems with precise density, shade, base material, and advance deposit.
                  </p>
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className="mt-4 inline-flex items-center space-x-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Custom Wig Order</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Order ID</th>
                        <th className="py-2.5 px-3">Client Name</th>
                        <th className="py-2.5 px-3">System Specification</th>
                        <th className="py-2.5 px-3">Hair Shade &amp; Length</th>
                        <th className="py-2.5 px-3">Current Stage</th>
                        <th className="py-2.5 px-3 font-mono">Total / Advance</th>
                        <th className="py-2.5 px-3">Fitting Date</th>
                        <th className="py-2.5 px-3 text-right">Workflow Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {filteredOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-amber-700">{o.id}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{o.clientName?.trim() || "Don't know"}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{o.phone || 'No phone'}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-slate-900 block font-bold">{o.wigType}</span>
                            <span className="text-[10px] text-slate-500">Density: {o.density}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-slate-800 block">{o.hairLength}</span>
                            <span className="text-[10px] text-slate-500">{o.hairShade}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold border inline-block ${
                                o.stage === 'Delivered'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {o.stage}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <span className="font-bold text-slate-900 block">₹ {o.amount.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-emerald-700">Adv: ₹ {o.advancePaid.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">{o.fittingDate}</td>
                          <td className="py-3 px-3 text-right">
                            {o.stage !== 'Delivered' ? (
                              <button
                                onClick={() => handleAdvanceOrderStage(o.id)}
                                className="inline-flex items-center space-x-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900 transition"
                                title="Advance order to next pipeline phase"
                              >
                                <span>Advance Stage</span>
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-emerald-700 text-[11px] font-bold">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Completed</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HEAD MEASUREMENTS */}
          {activeTab === 'measurements' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Cranial &amp; Scalp Measurements Register
                  </h2>
                  <p className="text-xs text-slate-500">
                    Consultant cranial contour records, base dimension scans, and attachment preferences
                  </p>
                </div>

                <button
                  onClick={() => setShowMeasurementModal(true)}
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Record Scalp Measurement</span>
                </button>
              </div>

              {data.measurements.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
                  <Ruler className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-3 text-sm font-bold text-slate-800">No measurement sheets recorded</h3>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                    Record head circumference, front-to-nape, temple dimensions, and base preferences for custom-fitted wigs.
                  </p>
                  <button
                    onClick={() => setShowMeasurementModal(true)}
                    className="mt-4 inline-flex items-center space-x-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Record New Measurement</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.measurements.map((m) => (
                    <div
                      key={m.id}
                      className="border border-slate-200 rounded-xl p-4 bg-white hover:border-amber-300 transition shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {m.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{m.recordedAt}</span>
                      </div>

                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{m.clientName?.trim() || "Don't know"}</h4>
                        <p className="text-[11px] text-slate-500 font-mono">{m.phone || 'No contact provided'}</p>
                      </div>

                      <div className="text-xs bg-slate-50 rounded-lg p-2.5 space-y-1.5 border border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Loss Pattern:</span>
                          <span className="font-bold text-slate-800 truncate max-w-[160px]">{m.hairLossType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Base Size:</span>
                          <span className="font-bold text-amber-800 font-mono">{m.baseSize}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Circumference:</span>
                          <span className="font-bold text-slate-800 font-mono">{m.circumference}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Base Material:</span>
                          <span className="font-bold text-slate-800 truncate max-w-[150px]">{m.baseMaterial}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-semibold text-slate-500">
                          Method: {m.attachmentMethod.split(' ')[0]}
                        </span>
                        <button
                          onClick={() => setActiveMeasurementSpec(m)}
                          className="inline-flex items-center space-x-1 text-xs font-bold text-amber-700 hover:text-amber-800"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Full Spec</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Stylist Suites &amp; Appointments Roster
                  </h2>
                  <p className="text-xs text-slate-500">
                    Schedule client trials, bonding services, spa washes, and specialist consultation sessions
                  </p>
                </div>

                <button
                  onClick={() => setShowAppointmentModal(true)}
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Book Appointment</span>
                </button>
              </div>

              {data.appointments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
                  <Calendar className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-3 text-sm font-bold text-slate-800">No appointments booked today</h3>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                    Reserve a private styling suite for client consultations, patch bonding, or wig cut-in fittings.
                  </p>
                  <button
                    onClick={() => setShowAppointmentModal(true)}
                    className="mt-4 inline-flex items-center space-x-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Book Suite Slot</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Appt ID</th>
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3">Service</th>
                        <th className="py-2.5 px-3">Stylist Suite</th>
                        <th className="py-2.5 px-3">Stylist Assigned</th>
                        <th className="py-2.5 px-3">Date &amp; Slot</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.appointments.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-amber-700">{a.id}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{a.clientName?.trim() || "Don't know"}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{a.phone || 'No phone'}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-900 font-bold">{a.serviceType}</td>
                          <td className="py-3 px-3 text-slate-600">{a.suite}</td>
                          <td className="py-3 px-3 text-slate-700">{a.stylistName}</td>
                          <td className="py-3 px-3 font-mono text-slate-700">
                            <span className="block font-bold">{a.timeSlot}</span>
                            <span className="text-[10px] text-slate-400">{a.appointmentDate}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold border inline-block ${
                                a.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : a.status === 'In-Service'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : a.status === 'Cancelled'
                                  ? 'bg-red-50 text-red-800 border-red-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center space-x-1">
                              {a.status === 'Scheduled' && (
                                <button
                                  onClick={() => handleUpdateAppointmentStatus(a.id, 'In-Service')}
                                  className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800 hover:bg-blue-100"
                                >
                                  Start
                                </button>
                              )}
                              {a.status === 'In-Service' && (
                                <button
                                  onClick={() => handleUpdateAppointmentStatus(a.id, 'Completed')}
                                  className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                                >
                                  Complete
                                </button>
                              )}
                              {a.status !== 'Completed' && a.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handleUpdateAppointmentStatus(a.id, 'Cancelled')}
                                  className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: CLIENT CRM & LEADS */}
          {activeTab === 'crm' && (
            <CrmView
              branch={currentBranch}
              crmLeads={data.crmLeads || []}
              callLogs={data.callLogs || []}
              onRefresh={refreshData}
              onConvertToOrder={(clientName, phone) => {
                setClientNameInput(clientName?.trim() || "Don't know");
                setPhoneInput(phone);
                setShowOrderModal(true);
              }}
            />
          )}

          {/* TAB: TEAM ATTENDANCE & DAILY REPORTING */}
          {activeTab === 'team' && (
            <TeamAttendanceView currentBranch={currentBranch} role={userRole} />
          )}

          {/* TAB 5: HAIR INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Hair Systems, Toupees &amp; Consumables Stock
                  </h2>
                  <p className="text-xs text-slate-500">
                    Track stock for lace wigs, mono patches, thin skin toupees, ultra-hold adhesives, and solvents
                  </p>
                </div>

                <button
                  onClick={() => setShowInventoryModal(true)}
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Add Stock Item</span>
                </button>
              </div>

              {data.inventory.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
                  <Package className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-3 text-sm font-bold text-slate-800">No inventory registered in this studio</h3>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                    Add human hair wigs, skin patches, bonding adhesives, solvent removers, and wig maintenance accessories.
                  </p>
                  <button
                    onClick={() => setShowInventoryModal(true)}
                    className="mt-4 inline-flex items-center space-x-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Register New Stock</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 font-mono">Stock Level</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 font-mono">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Adjust Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.inventory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-amber-700">{item.sku}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Unit: {item.unit}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{item.category}</td>
                          <td className="py-3 px-3 font-mono">
                            <span className="font-bold text-slate-900 text-sm">{item.stockQuantity}</span>
                            <span className="text-[10px] text-slate-400 block">Min: {item.reorderLevel}</span>
                          </td>
                          <td className="py-3 px-3">
                            {item.stockQuantity <= 0 ? (
                              <span className="rounded bg-red-50 text-red-800 px-2 py-0.5 text-[10px] font-bold border border-red-200">
                                Out of Stock
                              </span>
                            ) : item.stockQuantity <= item.reorderLevel ? (
                              <span className="rounded bg-orange-50 text-orange-800 px-2 py-0.5 text-[10px] font-bold border border-orange-200 flex items-center space-x-1 w-fit">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Low Stock</span>
                              </span>
                            ) : (
                              <span className="rounded bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹ {item.unitPrice.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center space-x-1">
                              <button
                                onClick={() => handleAdjustInventoryQuantity(item.id, -1)}
                                className="h-6 w-6 rounded border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center text-xs"
                                title="Deduct 1 unit"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleAdjustInventoryQuantity(item.id, 1)}
                                className="h-6 w-6 rounded border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center text-xs"
                                title="Add 1 unit"
                              >
                                +
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: BILLING & POS */}
          {activeTab === 'billing' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Billing &amp; Tax Invoices (POS)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Generate client tax invoices with 18% GST (CGST + SGST), advance receipts, and printable tax bills
                  </p>
                </div>

                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Generate New Invoice</span>
                </button>
              </div>

              {data.invoices.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
                  <Receipt className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-3 text-sm font-bold text-slate-800">No invoices generated yet</h3>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                    Bill counter services, custom hair wig deposits, and product purchases with tax breakdown and digital receipt.
                  </p>
                  <button
                    onClick={() => setShowInvoiceModal(true)}
                    className="mt-4 inline-flex items-center space-x-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create First Invoice</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Invoice #</th>
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 font-mono">Subtotal</th>
                        <th className="py-2.5 px-3 font-mono">18% GST</th>
                        <th className="py-2.5 px-3 font-mono">Total Paid</th>
                        <th className="py-2.5 px-3">Mode</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {data.invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-amber-700">{inv.invoiceNumber}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{inv.clientName?.trim() || "Don't know"}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{inv.phone || 'No phone'}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 max-w-[200px] truncate">{inv.itemsSummary}</td>
                          <td className="py-3 px-3 font-mono text-slate-600">₹ {inv.subtotal.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">₹ {inv.gstAmount.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹ {inv.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-slate-600">{inv.paymentMode}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold border inline-block ${
                                inv.paymentStatus === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : inv.paymentStatus === 'Partial Advance'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-red-50 text-red-800 border-red-200'
                              }`}
                            >
                              {inv.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setActiveInvoiceReceipt(inv)}
                              className="inline-flex items-center space-x-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 transition"
                            >
                              <Printer className="h-3 w-3 text-slate-500" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: STUDIO SOP & OPERATIONS */}
          {activeTab === 'sop' && (
            <SopView
              branch={currentBranch}
              data={data}
              onDataChange={refreshData}
              userRole={userRole}
            />
          )}

          {/* TAB 8: MONTHLY FINANCE & P&L */}
          {activeTab === 'finance-pnl' && (
            <FinancePnlView
              branch={currentBranch}
              data={data}
              onDataChange={refreshData}
              userRole={userRole}
            />
          )}

          {/* TAB 9: GOOGLE FINANCE SPREADSHEETS (IFRAME) */}
          {activeTab === 'finance-sheets' && (
            <GoogleSheetsView branch={currentBranch} />
          )}
        </div>
      </main>

      {/* MODAL 1: NEW CUSTOM WIG ORDER */}
      {showOrderModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowOrderModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-lg border border-amber-200 bg-white p-0.5 shrink-0 overflow-hidden" style={{ width: '32px', height: '32px' }}>
                  <img src="/logos/gentle-hair-wigs-logo.jpg" alt="Logo" width={32} height={32} style={{ width: '100%', height: '100%', objectFit: 'contain' }} className="h-full w-full object-contain" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Record New Custom Wig Order</h3>
                  <p className="text-xs text-amber-800 font-medium">Studio: {branchName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Full Name (Optional)</label>
                <input
                  type="text"
                  value={clientNameInput}
                  onChange={(e) => setClientNameInput(e.target.value)}
                  placeholder="e.g. Vikram Malhotra (or leave blank for &quot;Don't know&quot;)"
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Phone Number</label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="e.g. +91 98220 12345"
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">System Type</label>
                  <select
                    value={wigTypeInput}
                    onChange={(e) => setWigTypeInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="Full Lace Human Hair Wig">Full Lace Human Hair Wig</option>
                    <option value="Monofilament Crown Patch">Monofilament Crown Patch</option>
                    <option value="Micro-Poly Skin Toupee">Micro-Poly Skin Toupee</option>
                    <option value="HD Invisible Lace Front">HD Invisible Lace Front</option>
                    <option value="Silk Top Cranial Prosthesis">Silk Top Cranial Prosthesis</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Density %</label>
                  <select
                    value={densityInput}
                    onChange={(e) => setDensityInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="100% (Natural Light)">100% (Natural Light)</option>
                    <option value="120% (Natural Full)">120% (Natural Full)</option>
                    <option value="130% (Medium Heavy)">130% (Medium Heavy)</option>
                    <option value="150% (Glamour High Volume)">150% (Glamour High Volume)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hair Length</label>
                  <select
                    value={hairLengthInput}
                    onChange={(e) => setHairLengthInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="6-8 Inches (Men's Patch)">6-8 Inches (Men's Patch)</option>
                    <option value="12 Inches (Short Bob)">12 Inches (Short Bob)</option>
                    <option value="16 Inches (Shoulder)">16 Inches (Shoulder)</option>
                    <option value="20 Inches (Mid-back)">20 Inches (Mid-back)</option>
                    <option value="24 Inches (Long Luxury)">24 Inches (Long Luxury)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hair Color Shade</label>
                  <select
                    value={hairShadeInput}
                    onChange={(e) => setHairShadeInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="Natural Virgin Dark Brown (#2)">Natural Virgin Dark Brown (#2)</option>
                    <option value="Jet Black (#1)">Jet Black (#1)</option>
                    <option value="Medium Chestnut (#4)">Medium Chestnut (#4)</option>
                    <option value="Natural Grey Blend (20% Silver)">Natural Grey Blend (20% Silver)</option>
                    <option value="Caramel Balayage Highlights">Caramel Balayage Highlights</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total (INR ₹) *</label>
                  <input
                    type="number"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="e.g. 35000"
                    required
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Advance (INR ₹)</label>
                  <input
                    type="number"
                    value={advanceInput}
                    onChange={(e) => setAdvanceInput(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fitting Date</label>
                  <input
                    type="date"
                    value={fittingDateInput}
                    onChange={(e) => setFittingDateInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Save Custom Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW HEAD MEASUREMENTS */}
      {showMeasurementModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMeasurementModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <Ruler className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Record Scalp &amp; Cranial Scan</h3>
                  <p className="text-xs text-amber-800 font-medium">Studio: {branchName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMeasurementModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMeasurement} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Name (Optional)</label>
                  <input
                    type="text"
                    value={mClientName}
                    onChange={(e) => setMClientName(e.target.value)}
                    placeholder="Enter client name (or leave blank for &quot;Don't know&quot;)"
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={mPhone}
                    onChange={(e) => setMPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hair Loss Classification</label>
                <select
                  value={mHairLoss}
                  onChange={(e) => setMHairLoss(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                >
                  <option value="Male Pattern Baldness (Norwood IV-V)">Male Pattern Baldness (Norwood IV-V)</option>
                  <option value="Male Pattern Baldness (Norwood VI-VII)">Male Pattern Baldness (Norwood VI-VII)</option>
                  <option value="Female Pattern Thinning (Ludwig Scale II)">Female Pattern Thinning (Ludwig Scale II)</option>
                  <option value="Alopecia Areata / Totalis">Alopecia Areata / Totalis</option>
                  <option value="Chemotherapy / Medical Hair Loss">Chemotherapy / Medical Hair Loss</option>
                  <option value="Crown Vertex Thinning Only">Crown Vertex Thinning Only</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Circumference</label>
                  <input
                    type="text"
                    value={mCircumference}
                    onChange={(e) => setMCircumference(e.target.value)}
                    placeholder="e.g. 21.5 inches"
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Front to Nape</label>
                  <input
                    type="text"
                    value={mFrontToNape}
                    onChange={(e) => setMFrontToNape(e.target.value)}
                    placeholder="e.g. 14.0 inches"
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ear to Ear over Crown</label>
                  <input
                    type="text"
                    value={mEarToEar}
                    onChange={(e) => setMEarToEar(e.target.value)}
                    placeholder="e.g. 12.5 inches"
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Size Dimension</label>
                  <input
                    type="text"
                    value={mBaseSize}
                    onChange={(e) => setMBaseSize(e.target.value)}
                    placeholder="e.g. 8 x 6 inches"
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Material</label>
                  <select
                    value={mBaseMaterial}
                    onChange={(e) => setMBaseMaterial(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="Swiss HD Invisible Lace">Swiss HD Invisible Lace</option>
                    <option value="French Durable Lace">French Durable Lace</option>
                    <option value="Mono Center + Poly Skin Perimeter">Mono Center + Poly Skin Perimeter</option>
                    <option value="0.03mm Ultra-Thin Skin Poly">0.03mm Ultra-Thin Skin Poly</option>
                    <option value="Silk Top Cranial Base">Silk Top Cranial Base</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Attachment Method</label>
                  <select
                    value={mAttachment}
                    onChange={(e) => setMAttachment(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="Waterproof Ultra-Hold Tape">Waterproof Ultra-Hold Tape</option>
                    <option value="Medical-Grade Ghost Bond Glue">Medical-Grade Ghost Bond Glue</option>
                    <option value="Silicone-Cushioned Scalp Clips">Silicone-Cushioned Scalp Clips</option>
                    <option value="Microring Permanent Weaving">Microring Permanent Weaving</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Consultant Notes &amp; Scalp Profile</label>
                <textarea
                  value={mNotes}
                  onChange={(e) => setMNotes(e.target.value)}
                  rows={2}
                  placeholder="Scalp notes, hair direction, crown whorl placement, sensitivity notes..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMeasurementModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Save Measurement Spec
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: NEW APPOINTMENT */}
      {showAppointmentModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAppointmentModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Book Stylist Suite Slot</h3>
                  <p className="text-xs text-amber-800 font-medium">Studio: {branchName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Name (Optional)</label>
                <input
                  type="text"
                  value={appClientName}
                  onChange={(e) => setAppClientName(e.target.value)}
                  placeholder="Enter client name (or leave blank for &quot;Don't know&quot;)"
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={appPhone}
                  onChange={(e) => setAppPhone(e.target.value)}
                  placeholder="+91..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Type</label>
                <select
                  value={appService}
                  onChange={(e) => setAppService(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                >
                  <option value="Initial Consultation & Scalp Scan (60 min)">Initial Consultation &amp; Scalp Scan (60 min)</option>
                  <option value="Custom Wig Trial & Cut-in Styling (90 min)">Custom Wig Trial &amp; Cut-in Styling (90 min)</option>
                  <option value="Patch Monthly Re-bonding & Service (60 min)">Patch Monthly Re-bonding &amp; Service (60 min)</option>
                  <option value="Wig Wash, Spa & Conditioning (45 min)">Wig Wash, Spa &amp; Conditioning (45 min)</option>
                  <option value="Emergency Adhesive Touch-up (30 min)">Emergency Adhesive Touch-up (30 min)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stylist Suite</label>
                  <select
                    value={appSuite}
                    onChange={(e) => setAppSuite(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="Suite 1 (VIP Fitting & Consultation)">Suite 1 (VIP Fitting)</option>
                    <option value="Suite 2 (Precision Cut-in & Bonding)">Suite 2 (Cut-in &amp; Bonding)</option>
                    <option value="Suite 3 (Wig Spa & Treatment)">Suite 3 (Wig Spa)</option>
                    <option value="Suite 4 (Express Maintenance)">Suite 4 (Express Maintenance)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Stylist</label>
                  <select
                    value={appStylist}
                    onChange={(e) => setAppStylist(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="Senior Specialist Rohit">Senior Specialist Rohit</option>
                    <option value="Master Stylist Priya">Master Stylist Priya</option>
                    <option value="Wig Technician Anand">Wig Technician Anand</option>
                    <option value="Trichology Consultant Dr. Sneha">Dr. Sneha (Consultant)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={appDate}
                    onChange={(e) => setAppDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={appTime}
                    onChange={(e) => setAppTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                    <option value="06:30 PM">06:30 PM</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAppointmentModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: NEW INVENTORY ITEM */}
      {showInventoryModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInventoryModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Add Inventory Stock Item</h3>
                  <p className="text-xs text-amber-800 font-medium">Studio: {branchName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInventory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item / System Name *</label>
                <input
                  type="text"
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  placeholder="e.g. HD Invisible Lace Toupee 8x6"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={invSku}
                    onChange={(e) => setInvSku(e.target.value)}
                    placeholder="e.g. GHW-LACE-01"
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={invCategory}
                    onChange={(e) => setInvCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="Wigs & Systems">Wigs &amp; Systems</option>
                    <option value="Patches & Toupees">Patches &amp; Toupees</option>
                    <option value="Adhesives & Tapes">Adhesives &amp; Tapes</option>
                    <option value="Solvents & Care">Solvents &amp; Care</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    value={invQuantity}
                    onChange={(e) => setInvQuantity(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Reorder</label>
                  <input
                    type="number"
                    value={invReorder}
                    onChange={(e) => setInvReorder(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={invUnit}
                    onChange={(e) => setInvUnit(e.target.value)}
                    placeholder="Pieces, Bottles..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit Price (INR ₹) *</label>
                <input
                  type="number"
                  value={invPrice}
                  onChange={(e) => setInvPrice(e.target.value)}
                  placeholder="e.g. 18500"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInventoryModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Add to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: NEW POS INVOICE */}
      {showInvoiceModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInvoiceModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Generate Tax Invoice (POS)</h3>
                  <p className="text-xs text-amber-800 font-medium">Studio: {branchName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Name (Optional)</label>
                <input
                  type="text"
                  value={invcClient}
                  onChange={(e) => setInvcClient(e.target.value)}
                  placeholder="Enter client name (or leave blank for &quot;Don't know&quot;)"
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={invcPhone}
                  onChange={(e) => setInvcPhone(e.target.value)}
                  placeholder="+91..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service / Product Items Summary *</label>
                <input
                  type="text"
                  value={invcSummary}
                  onChange={(e) => setInvcSummary(e.target.value)}
                  placeholder="e.g. Monofilament Crown Patch + Monthly Re-bonding"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtotal Amount (INR ₹) *</label>
                <input
                  type="number"
                  value={invcSubtotal}
                  onChange={(e) => setInvcSubtotal(e.target.value)}
                  placeholder="e.g. 25000"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  GST of 18% (9% CGST + 9% SGST) will be computed automatically.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={invcPaymentMode}
                    onChange={(e) => setInvcPaymentMode(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="UPI / QR Pay">UPI / QR Pay</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                    <option value="Cash Counter">Cash Counter</option>
                    <option value="NEFT / Transfer">NEFT / Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={invcStatus}
                    onChange={(e) => setInvcStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="Paid">Paid in Full</option>
                    <option value="Partial Advance">Partial Advance</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 font-bold text-white shadow-sm"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: VIEW / PRINT DIGITAL INVOICE RECEIPT */}
      {activeInvoiceReceipt && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveInvoiceReceipt(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl border border-amber-200 bg-white p-1 shrink-0 overflow-hidden" style={{ width: '40px', height: '40px' }}>
                  <img src="/logos/gentle-hair-wigs-logo.jpg" alt="Logo" width={40} height={40} style={{ width: '100%', height: '100%', objectFit: 'contain' }} className="h-full w-full object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Gentle Hair Wigs Studio</h3>
                  <p className="text-[10px] text-slate-500">{currentBranchInfo.address}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveInvoiceReceipt(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="flex justify-between items-start bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Tax Invoice</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{activeInvoiceReceipt.invoiceNumber}</p>
                  <p className="text-[10px] text-slate-500">Date: {activeInvoiceReceipt.invoiceDate}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">GSTIN: 27AAACG1234F1Z5</span>
                  <p className="text-[10px] text-emerald-700 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    STATUS: {activeInvoiceReceipt.paymentStatus.toUpperCase()}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Billed Client:
                </span>
                <p className="font-bold text-slate-900 text-sm">{activeInvoiceReceipt.clientName?.trim() || "Don't know"}</p>
                <p className="text-slate-500 font-mono">{activeInvoiceReceipt.phone || 'Walk-in Client'}</p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Item / Service Description</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{activeInvoiceReceipt.itemsSummary}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹ {activeInvoiceReceipt.subtotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="text-slate-500 text-[11px]">
                      <td className="py-1.5 px-3">Central GST (CGST @ 9%)</td>
                      <td className="py-1.5 px-3 text-right font-mono">
                        ₹ {Math.round(activeInvoiceReceipt.gstAmount / 2).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="text-slate-500 text-[11px]">
                      <td className="py-1.5 px-3">State GST (SGST @ 9%)</td>
                      <td className="py-1.5 px-3 text-right font-mono">
                        ₹ {Math.round(activeInvoiceReceipt.gstAmount / 2).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                    <tr>
                      <td className="py-2 px-3 text-slate-900">Grand Total (Net Paid)</td>
                      <td className="py-2 px-3 text-right font-mono text-sm text-amber-700">
                        ₹ {activeInvoiceReceipt.totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>Payment Mode: <strong>{activeInvoiceReceipt.paymentMode}</strong></span>
                <span className="text-emerald-700 font-semibold">Digitally Signed &amp; Verified</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 font-bold text-slate-700 text-xs shadow-2xs"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Tax Invoice</span>
              </button>
              <button
                onClick={() => setActiveInvoiceReceipt(null)}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 font-bold text-white text-xs shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: VIEW MEASUREMENT SPEC SHEET */}
      {activeMeasurementSpec && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveMeasurementSpec(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Ruler className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Cranial Contour Spec Sheet — {activeMeasurementSpec.id}
                  </h3>
                  <p className="text-[10px] text-slate-500">Recorded on {activeMeasurementSpec.recordedAt}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveMeasurementSpec(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Client Profile</span>
                <p className="text-sm font-extrabold text-slate-900">{activeMeasurementSpec.clientName?.trim() || "Don't know"}</p>
                <p className="text-slate-500 font-mono text-[11px]">{activeMeasurementSpec.phone || 'No phone recorded'}</p>
                <p className="text-amber-800 font-semibold text-[11px] mt-1">
                  Classification: {activeMeasurementSpec.hairLossType}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="border border-slate-200 rounded-xl p-3 bg-white">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Head Circumference</span>
                  <span className="text-sm font-black font-mono text-slate-900">{activeMeasurementSpec.circumference}</span>
                </div>
                <div className="border border-slate-200 rounded-xl p-3 bg-white">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Front to Nape</span>
                  <span className="text-sm font-black font-mono text-slate-900">{activeMeasurementSpec.frontToNape}</span>
                </div>
                <div className="border border-slate-200 rounded-xl p-3 bg-white">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Ear to Ear over Crown</span>
                  <span className="text-sm font-black font-mono text-slate-900">{activeMeasurementSpec.earToEar}</span>
                </div>
                <div className="border border-slate-200 rounded-xl p-3 bg-white">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Base Size Dimension</span>
                  <span className="text-sm font-black font-mono text-amber-700">{activeMeasurementSpec.baseSize}</span>
                </div>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Base Material:</span>
                  <span className="font-bold text-slate-900">{activeMeasurementSpec.baseMaterial}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Attachment Method:</span>
                  <span className="font-bold text-slate-900">{activeMeasurementSpec.attachmentMethod}</span>
                </div>
              </div>

              {activeMeasurementSpec.notes && (
                <div className="border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Consultant Observations:
                  </span>
                  <p className="text-slate-700 leading-relaxed text-[11px]">{activeMeasurementSpec.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 font-bold text-slate-700 text-xs shadow-2xs"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Spec Sheet</span>
              </button>
              <button
                onClick={() => setActiveMeasurementSpec(null)}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 font-bold text-white text-xs shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

