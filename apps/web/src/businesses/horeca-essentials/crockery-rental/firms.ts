export type InvoiceFirmId = 'someshwar' | 'homeseva';

export interface InvoiceFirmConfig {
  id: InvoiceFirmId;
  name: string;
  legalName: string;
  tagline?: string;
  addressLines: string[];
  gstin: string;
  stateName: string;
  stateCode: string;
  email?: string;
  phone?: string;
  bank: {
    accountHolder: string;
    bankName: string;
    accountNumber: string;
    branchAndIfsc: string;
  };
  signatureLabel: string;
  defaultInvoicePrefix: string;
  accentColor: string;
}

export const INVOICE_FIRMS: Record<InvoiceFirmId, InvoiceFirmConfig> = {
  someshwar: {
    id: 'someshwar',
    name: 'Someshwar Enterprises',
    legalName: 'Someshwar Enterprises',
    tagline: 'Banquet Tableware & Buffet Hire Operations',
    addressLines: [
      '873,Shri Maruti shankar kadam,Hol',
      'Baramati, Pune-412306',
    ],
    gstin: '27CFMPK7012M1Z2',
    stateName: 'Maharashtra',
    stateCode: '27',
    bank: {
      accountHolder: 'SOMESHWAR ENTERPRISES',
      bankName: 'UNION BANK OF INDIA-0022',
      accountNumber: '324921010000022',
      branchAndIfsc: 'WANEWADI BRANCH & UBIN0932493',
    },
    signatureLabel: 'For Someshwar Enterprises',
    defaultInvoicePrefix: 'Inv no- ',
    accentColor: '#78B800',
  },
  homeseva: {
    id: 'homeseva',
    name: 'Homeseva 2024-2025',
    legalName: 'Homeseva 2024-2025',
    tagline: 'One call. Fix it all.',
    addressLines: [
      'Office No.1, Grandstand Trinity,',
      'Mumbai Pune Bypass Rd., Jijai Nagar,',
      'Near Chandani Chowk, Kothrud, Pune 411038',
    ],
    gstin: '27AAJFH4134K1Z8',
    stateName: 'Maharashtra',
    stateCode: '27',
    email: 'sales@homeseva.co.in',
    phone: '+91 98220 00000',
    bank: {
      accountHolder: 'HOMESEVA',
      bankName: 'YES BANK LTD - 0893',
      accountNumber: '000861900000893',
      branchAndIfsc: 'Prabhat Road & YESB0000008',
    },
    signatureLabel: 'for Homeseva 2024-2025',
    defaultInvoicePrefix: '26-27/CCG/',
    accentColor: '#2563eb',
  },
};
