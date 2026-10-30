export interface ProjectSiteItem {
  id: string;
  name: string;
  client: string;
  location: string;
  budget: number;
  stage: 'Foundation & Earthwork' | 'Steel Frame Erection' | 'Wall Panels Installation' | 'MEP & Finishing' | 'Handover & Audit';
  startDate: string;
  targetHandover: string;
}

export interface BOQItem {
  id: string;
  materialName: string;
  category: 'Structural Steel' | 'Insulated PUF Panels' | 'Cement & Concrete' | 'Fasteners & Anchor Bolts' | 'Roofing Sheets';
  quantityRequired: number;
  quantityReceived: number;
  unit: string;
  estimatedRate: number;
}

export interface LaborRosterItem {
  id: string;
  workerName: string;
  trade: 'Fitter' | 'Welder' | 'Mason' | 'Rigger' | 'Electrician' | 'Helper';
  site: string;
  dailyWage: number;
  attendanceStatus: 'Present' | 'Overtime' | 'Absent';
  shiftDate: string;
}

export interface MilestoneBillItem {
  id: string;
  billNumber: string;
  siteName: string;
  clientName: string;
  milestoneTitle: string;
  billAmount: number;
  gstAmount: number;
  totalPayable: number;
  status: 'Draft RA Bill' | 'Certified by Engineer' | 'Paid';
  billDate: string;
}

export interface PrefabConstructionData {
  sites: ProjectSiteItem[];
  boqList: BOQItem[];
  laborRoster: LaborRosterItem[];
  milestoneBills: MilestoneBillItem[];
}

