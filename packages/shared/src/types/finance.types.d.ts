export type FinanceEntryType = 'INCOME' | 'EXPENSE';
export interface FinanceEntryDto {
    type: FinanceEntryType;
    amount: number;
    category: string;
    description?: string;
    entryDate: string;
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
//# sourceMappingURL=finance.types.d.ts.map