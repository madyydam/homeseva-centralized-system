export type FinanceEntryType = 'INCOME' | 'EXPENSE';

export interface FinanceEntryDto {
  type: FinanceEntryType;
  amount: number;
  category: string;
  description?: string;
  entryDate: string; // ISO date string YYYY-MM-DD
  reference?: string;
  attachmentUrl?: string;
}

export interface MonthlySummaryDto {
  businessId: string;
  businessName: string;
  year: number;
  month: number;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  salaryCost: number;
  isClosed: boolean;
}
