export interface ChemicalProductItem {
  id: string;
  productCode: string;
  name: string;
  category: 'Kitchen Warewashing' | 'Housekeeping & Floor Care' | 'Laundry & Textile' | 'Water Treatment & Biocides';
  stockBarrels: number;
  reorderLevel: number;
  ratePerDrum: number;
  msdsCompliance: boolean;
}

export interface InstitutionalAccountItem {
  id: string;
  accountName: string;
  segment: 'Hospital & Healthcare' | '5-Star Hotel / Resort' | 'Commercial Laundry' | 'Food Processing Plant';
  contactPerson: string;
  phone: string;
  monthlySupplyValue: number;
  dispenserInstalled: string;
  contractStatus: 'Active Contract' | 'Renewal Due' | 'Trial Period';
}

export interface DispatchOrderItem {
  id: string;
  dispatchId: string;
  clientName: string;
  chemicalSummary: string;
  barrelsCount: number;
  totalInvoice: number;
  paymentTerms: string;
  dispatchDate: string;
}

export interface EcolabDistributionData {
  chemicals: ChemicalProductItem[];
  accounts: InstitutionalAccountItem[];
  dispatches: DispatchOrderItem[];
}

