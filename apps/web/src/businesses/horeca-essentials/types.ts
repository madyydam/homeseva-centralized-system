export interface EssentialsSaleItem {
  id: string;
  orderNumber: string;
  clientName: string;
  phone: string;
  itemsSummary: string;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  paymentStatus: 'Paid' | 'Credit 30 Days' | 'Pending';
  orderDate: string;
}

export interface CrockeryRentalBookingItem {
  id: string;
  bookingRef: string;
  eventName: string;
  catererOrClient: string;
  phone: string;
  eventDate: string;
  returnDate: string;
  itemsRented: string;
  rentalCharges: number;
  securityDeposit: number;
  status: 'Booked' | 'Dispatched' | 'Returned & Inspected' | 'Damages Deducted';
  breakagesRecorded: number;
}

export interface HorecaStockItem {
  id: string;
  sku: string;
  name: string;
  division: 'essentials-sales' | 'crockery-rental';
  totalUnits: number;
  availableUnits: number;
  ratePerUnit: number;
  unit: string;
}

export interface HorecaEssentialsData {
  salesOrders: EssentialsSaleItem[];
  rentalBookings: CrockeryRentalBookingItem[];
  stockItems: HorecaStockItem[];
}

