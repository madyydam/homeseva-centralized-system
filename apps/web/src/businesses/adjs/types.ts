export type PrintboothLeadStatusType =
  | 'Interested'
  | 'Follow-up'
  | 'Negotiation'
  | 'Converted'
  | 'Not Picked'
  | 'Not Interested'
  | 'Not Selected';

export type LocationCategoryType =
  | 'Stationery & Xerox'
  | 'College / University'
  | 'Office & IT Park'
  | 'Hospital & Medical'
  | 'Mall & Retail'
  | 'Public Space & Transit'
  | 'Entrepreneur / Other';

export type KioskModelType =
  | 'PRINTBOOTH™ Compact (Standard)'
  | 'PRINTBOOTH™ Dual-Tray High Speed'
  | 'PRINTBOOTH™ Desktop Countertop'
  | 'PRINTBOOTH™ Custom Kiosk';

export interface PrintboothLeadItem {
  id: string;
  clientName: string; // Merchant / Contact Name (Optional, defaults to "Don't know")
  phone: string; // Unique primary phone number
  shopName?: string | undefined; // Business / Store name (e.g. Apex Xerox Corner)
  locationCategory?: LocationCategoryType | string | undefined;
  status: PrintboothLeadStatusType;
  callCount: number; // 0 to 5 calls
  notesList: [string, string, string, string, string]; // 5 distinct notes
  leadDate: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  updatedAt: string; // ISO string

  // Converted Fields (Strictly asked and shown ONLY when status is 'Converted')
  kioskModel?: KioskModelType | string | undefined;
  unitsOrdered?: number | undefined;
  installationCity?: string | undefined;
}

export interface PrintboothMachineOrder {
  id: string;
  orderNumber: string;
  merchantName: string;
  phone: string;
  shopName: string;
  kioskModel: KioskModelType | string;
  units: number;
  unitPrice: number;
  totalAmount: number;
  stage: 'Order Booked' | 'Payment Received' | 'Assembled & Tested' | 'Dispatched' | 'Delivered';
  city: string;
  orderDate: string;
  trackingNumber?: string | undefined;
}

export interface PrintboothSoftwareRelease {
  id: string;
  version: string;
  releaseDate: string;
  targetOs: string;
  cloudEngineStatus: 'Operational' | 'Maintenance' | 'Degraded';
  notes: string;
}

export interface PrintboothSupportTicket {
  id: string;
  ticketNumber: string;
  merchantName: string;
  phone: string;
  issueType: 'Setup & Wi-Fi' | 'Payment Gateway' | 'Invoice Request' | 'Hardware Check';
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
  resolutionNotes?: string | undefined;
}

export interface AdjsData {
  leads: PrintboothLeadItem[];
  orders: PrintboothMachineOrder[];
  tickets: PrintboothSupportTicket[];
}
