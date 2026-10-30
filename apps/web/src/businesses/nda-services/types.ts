export interface SecurityGuardItem {
  id: string;
  badgeNumber: string;
  guardName: string;
  rank: 'Security Guard' | 'Head Guard' | 'Armed Gunman' | 'Facility Marshal';
  assignedSite: string;
  shift: 'Day Shift (08:00 - 20:00)' | 'Night Shift (20:00 - 08:00)';
  psaraVerified: boolean;
  status: 'On Duty' | 'Relieved' | 'On Leave';
}

export interface ClientFacilitySiteItem {
  id: string;
  clientName: string;
  facilityType: 'Gated Residential Society' | 'Corporate IT Park' | 'Manufacturing Factory' | 'Hospitality Hotel';
  guardsDeployedCount: number;
  monthlyServiceFee: number;
  contractStatus: 'Active Deployment' | 'Renewal Pending';
}

export interface SecurityIncidentLogItem {
  id: string;
  incidentTime: string;
  siteName: string;
  severity: 'Low' | 'Medium' | 'Critical';
  summary: string;
  reportedBy: string;
  actionTaken: string;
}

export interface NdaServicesData {
  guards: SecurityGuardItem[];
  clientSites: ClientFacilitySiteItem[];
  incidents: SecurityIncidentLogItem[];
}

