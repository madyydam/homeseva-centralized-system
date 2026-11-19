import {
  Item,
  Customer,
  Booking,
  StockMovement,
  Invoice,
  Payment,
  PackageCombo,
  BusinessProfile,
} from './types';

export const initialBusinessProfile: BusinessProfile = {
  name: 'HomeSeva Crockery & Catering Rentals',
  tagline: 'Commercial Tableware, Glassware & Buffet Catering Equipment Hire',
  phone: '+91 98765 00000',
  alt_phone: '',
  email: 'rentals@homeseva.com',
  address: 'HomeSeva Central Logistics Hub',
  gstin: '',
  upi_id: 'rentals@homeseva',
  bank_name: 'HDFC Bank Ltd',
  account_number: '',
  ifsc: '',
  terms_conditions:
    '1. All counts must be verified upon delivery and return.\n2. Broken or missing pieces will be charged at current replacement cost.\n3. Overdue rentals attract standard daily fee plus late surcharge.\n4. Advance payment is non-refundable if cancelled less than 3 days before event.',
  default_prep_days: 0,
  return_buffer_days: 1,
  cleaning_stage_enabled: true,
  late_fee_multiplier: 1.0,
  min_advance_percent: 25,
};

// Pure authentic initial state - ZERO mock records
export const initialItems: Item[] = [];
export const initialCustomers: Customer[] = [];
export const initialBookings: Booking[] = [];
export const initialLedger: StockMovement[] = [];
export const initialInvoices: Invoice[] = [];
export const initialPayments: Payment[] = [];
export const initialPackages: PackageCombo[] = [];
