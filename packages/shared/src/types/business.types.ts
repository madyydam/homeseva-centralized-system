export interface BusinessPublic {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
}

export interface TabConfig {
  id: string;
  label: string;
  type: 'MODULE' | 'REPORT' | 'GOOGLE_SHEET';
  icon?: string;
  path?: string;
  sortOrder: number;
}
