export type ItemCategory = 'plates' | 'bowls' | 'glassware' | 'cups' | 'cutlery' | 'serving' | 'other';

export type RentBasis = 'per_day' | 'per_event';

export type UserRole = 'owner' | 'manager' | 'counter' | 'godown' | 'accountant';

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  pack_size: number;
  rent_per_day: number;
  rent_basis: RentBasis;
  replacement_cost: number;
  total_quantity: number; // Owned
  in_godown: number;
  out_on_rent: number;
  in_cleaning: number;
  written_off: number;
  active: boolean;
  image?: string | undefined;
  low_stock_threshold?: number | undefined;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  alt_phone?: string | undefined;
  address: string;
  gstin?: string | undefined;
  tag: 'regular' | 'caterer' | 'blacklisted' | 'vip';
  notes?: string | undefined;
  created_at: string;
}

export type BookingStatus =
  | 'Enquiry'
  | 'Quotation'
  | 'Confirmed'
  | 'Dispatched'
  | 'Returned'
  | 'Closed'
  | 'Cancelled'
  | 'Overdue';

export interface BookingItem {
  id: string;
  item_id: string;
  item_name: string;
  category: ItemCategory;
  pack_size: number;
  quantity: number;
  dispatched_quantity: number;
  returned_good: number;
  returned_broken: number;
  returned_missing: number;
  rate_snapshot: number;
  rent_basis: RentBasis;
  replacement_cost_snapshot: number;
  damage_grade?: 'broken' | 'chipped' | 'none' | undefined;
}

export interface Booking {
  id: string;
  booking_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  event_type: 'Wedding' | 'Reception' | 'Birthday' | 'Corporate' | 'Catering' | 'Religious' | 'Party' | 'Other';
  event_date: string;
  delivery_date: string;
  expected_return_date: string;
  actual_return_date?: string | undefined;
  venue_name: string;
  venue_address: string;
  contact_person?: string | undefined;
  status: BookingStatus;
  items: BookingItem[];
  transport_charge: number;
  discount: number;
  advance_paid: number;
  security_deposit: number;
  damage_charge: number;
  late_fee: number;
  notes?: string | undefined;
  created_at: string;
  dispatched_at?: string | undefined;
  returned_at?: string | undefined;
  dispatched_by?: string | undefined;
  vehicle_details?: string | undefined;
  signature_dispatch?: string | undefined;
  signature_return?: string | undefined;
}

export type StockMovementType =
  | 'OPENING'
  | 'PURCHASE'
  | 'DISPATCH'
  | 'RETURN_GOOD'
  | 'RETURN_BROKEN'
  | 'RETURN_MISSING'
  | 'WASH_DONE'
  | 'ADJUSTMENT'
  | 'AUDIT_CORRECTION'
  | 'REVERSAL';

export interface StockMovement {
  id: string;
  item_id: string;
  item_name: string;
  type: StockMovementType;
  quantity: number;
  bucket_from?: string | undefined;
  bucket_to?: string | undefined;
  booking_id?: string | undefined;
  booking_number?: string | undefined;
  user: string;
  reason: string;
  created_at: string;
}

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  type: 'rent' | 'transport' | 'damage' | 'late_fee' | 'discount' | 'tax';
}

export interface Invoice {
  id: string;
  invoice_number: string;
  financial_year: string;
  booking_id: string;
  booking_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_date: string;
  return_date: string;
  rent_days: number;
  rent_amount: number;
  transport_charge: number;
  damage_amount: number;
  late_fee: number;
  discount: number;
  tax_amount: number;
  tax_rate: number;
  total_amount: number;
  advance_paid: number;
  balance_due: number;
  status: 'draft' | 'final' | 'paid';
  issued_at: string;
  issued_by: string;
  lines: InvoiceLine[];
}

export interface Payment {
  id: string;
  booking_id: string;
  booking_number: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  method: 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque';
  reference?: string | undefined;
  notes?: string | undefined;
  date: string;
  received_by: string;
  direction: 'received' | 'refund';
}

export interface PackageCombo {
  id: string;
  name: string;
  description: string;
  suggested_guests: number;
  items: {
    item_id: string;
    ratio_per_guest: number;
    buffer_percent: number;
  }[];
}

export interface BusinessProfile {
  name: string;
  tagline: string;
  phone: string;
  alt_phone: string;
  email: string;
  address: string;
  gstin: string;
  upi_id: string;
  bank_name: string;
  account_number: string;
  ifsc: string;
  terms_conditions: string;
  default_prep_days: number;
  return_buffer_days: number;
  cleaning_stage_enabled: boolean;
  late_fee_multiplier: number;
  min_advance_percent: number;
}
