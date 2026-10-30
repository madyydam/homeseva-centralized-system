export interface OrderItem {
  id: string;
  clientName: string;
  phone: string;
  wigType: string;
  density: string;
  hairLength: string;
  hairShade: string;
  amount: number;
  advancePaid: number;
  fittingDate: string;
  stage: 'Measurements Recorded' | 'Lace Base Crafting' | 'Hand-Knotting Hair' | 'Custom Styling' | 'Fitting & Trial' | 'Delivered';
  createdAt: string;
}

export interface MeasurementItem {
  id: string;
  clientName: string;
  phone: string;
  hairLossType: string;
  circumference: string;
  frontToNape: string;
  earToEar: string;
  templeToTemple: string;
  baseSize: string;
  baseMaterial: string;
  attachmentMethod: string;
  notes: string;
  recordedAt: string;
}

export interface AppointmentItem {
  id: string;
  clientName: string;
  phone: string;
  serviceType: string;
  suite: string;
  stylistName: string;
  appointmentDate: string;
  timeSlot: string;
  status: 'Scheduled' | 'In-Service' | 'Completed' | 'Cancelled';
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: 'Wigs & Systems' | 'Patches & Toupees' | 'Adhesives & Tapes' | 'Solvents & Care';
  stockQuantity: number;
  reorderLevel: number;
  unitPrice: number;
  unit: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  clientName: string;
  phone: string;
  itemsSummary: string;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  paymentMode: 'UPI / QR Pay' | 'Credit / Debit Card' | 'Cash Counter' | 'NEFT / Transfer';
  paymentStatus: 'Paid' | 'Partial Advance' | 'Pending';
  invoiceDate: string;
}

export interface AssetRegisterItem {
  id: string;
  name: string;
  category: 'Styling Equipment' | 'Wash & Spa' | 'Fixtures & Mirrors' | 'Display & Lighting' | 'Electronics & Security';
  quantity: number;
  condition: 'Excellent' | 'Good' | 'Needs Maintenance';
  purchaseCost: number;
  location: string;
  lastServiceDate: string;
}

export interface DailyTaskItem {
  id: string;
  taskTitle: string;
  category: 'Opening Checklist' | 'Midday Operations' | 'Client Follow-up' | 'Closing Checklist';
  assignedTo: string;
  timeSlot: string;
  completed: boolean;
  completedAt?: string | undefined;
}

export interface ClientCallLogItem {
  id: string;
  clientName: string;
  phone: string;
  callType: 'Inquiry' | 'Appointment Booking' | 'Post-Trial Feedback' | 'Maintenance Reminder';
  status: 'Completed' | 'Follow-up Needed' | 'No Answer';
  notes: string;
  date: string;
}

export type CrmLeadStatusType = 'Interested' | 'Follow-up' | 'Converted' | 'Not Interested' | 'Not Picked' | 'Not Selected';

export interface StudioInfoItem {
  slug: string;
  name: string;
  shortName: string;
  address?: string | undefined;
  isCustom?: boolean | undefined;
}

export interface CrmLeadItem {
  id: string;
  srNo?: number | undefined;
  studioSlug: string;
  studioName: string;
  clientName: string;
  phone: string;
  status: CrmLeadStatusType;
  customStatusText?: string | undefined;
  callCount: number; // 0 to 5
  notesList: string[]; // up to 5 distinct notes
  city?: string | undefined;
  source?: ('Instagram Ad' | 'Google / Maps' | 'Doctor Referral' | 'Walk-in' | 'Word of Mouth' | 'Website') | undefined;
  stage?: ('New Inquiry' | 'Consultation Scheduled' | 'Scalp Trial Done' | 'Proposal Sent' | 'Converted to Order' | 'Lost / Cold') | undefined;
  hairLossConcern?: string | undefined;
  interestCategory?: ('Full Lace Human Hair Wig' | 'HD Lace Toupee / Patch' | 'Monofilament System' | 'Frontal Hairline Patch' | 'Maintenance & Hair Spa') | undefined;
  estimatedBudget?: number | undefined;
  assignedSpecialist?: string | undefined;
  lastContactDate?: string | undefined;
  nextFollowUpDate?: string | undefined;
  notes?: string | undefined;
  priority?: ('High' | 'Medium' | 'Normal') | undefined;
  createdAt: string;
  updatedAt?: string | undefined;
}

export interface FinanceTransactionItem {
  id: string;
  type: 'sale' | 'expense';
  category:
    | 'Hair Wig Sale'
    | 'Styling & Fitting Service'
    | 'Care Product Sale'
    | 'Studio Rent'
    | 'Staff Salaries'
    | 'Electricity & Utilities'
    | 'Wi-Fi & Internet'
    | 'Wig / Hair Stock Purchase'
    | 'Daily Petty Cash & Tea'
    | 'Marketing & Ads'
    | 'Cleaning & Sanitization'
    | 'Other';
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  month: string; // "2026-10"
  paymentMode: 'UPI / QR Pay' | 'Cash Counter' | 'Bank Transfer / NEFT' | 'Credit / Debit Card';
  recordedBy: string;
}

export interface GentleHairWigsStudioData {
  orders: OrderItem[];
  measurements: MeasurementItem[];
  appointments: AppointmentItem[];
  inventory: InventoryItem[];
  invoices: InvoiceItem[];
  assets: AssetRegisterItem[];
  dailyTasks: DailyTaskItem[];
  callLogs: ClientCallLogItem[];
  crmLeads: CrmLeadItem[];
  financeTransactions: FinanceTransactionItem[];
}

