export interface PropertyUnitItem {
  id: string;
  propertyCode: string;
  title: string;
  propertyType: 'Commercial IT Office' | 'Retail Showroom' | 'Residential Luxury 3BHK' | 'Industrial Warehouse';
  carpetAreaSqFt: number;
  location: string;
  monthlyRent: number;
  occupancyStatus: 'Leased' | 'Vacant Available' | 'Under Renovation';
  tenantName?: string;
}

export interface TenantLeaseAgreementItem {
  id: string;
  leaseRef: string;
  tenantName: string;
  propertyCode: string;
  phone: string;
  leaseStart: string;
  leaseExpiry: string;
  monthlyRent: number;
  securityDeposit: number;
  lockInPeriodMonths: number;
  status: 'Active Lease' | 'Renewal Approaching' | 'Vacated';
}

export interface RentReceiptItem {
  id: string;
  receiptNumber: string;
  tenantName: string;
  propertyCode: string;
  monthYear: string;
  rentAmount: number;
  maintenanceAmount: number;
  totalCollected: number;
  paymentMode: string;
  status: 'Collected & Reconciled';
}

export interface HsRealEstateData {
  properties: PropertyUnitItem[];
  leases: TenantLeaseAgreementItem[];
  receipts: RentReceiptItem[];
}

