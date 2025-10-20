export interface CashflowPoint {
  period: string;
  income: number;
  expense: number;
  other: number;
}

export interface CategorySpendItem {
  categoryId: number;
  categoryName: string;
  total: number;
  budgetTarget?: number;
}

export interface DashboardSummary {
  cashflow: CashflowPoint[];
  categoryBreakdown: CategorySpendItem[];
  totals: {
    income: number;
    expenses: number;
    other: number;
    savings: number;
  };
  budget?: {
    monthlyBudget?: number;
    spentThisMonth?: number;
    savingsThisMonth?: number;
    categories?: CategorySpendItem[];
  };
  savings?: {
    lastPeriod?: number;
    sinceStart?: number;
    goals?: {
      id: string;
      name: string;
      target: number;
      progress: number;
      priority: number;
    }[];
  };
}

export interface TransactionItem {
  id: string;
  description: string;
  normalizedName: string;
  date: string;
  amount: number;
  currency: string;
  transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'OTHER';
  cashflowSign: number;
  categoryId?: number | null;
}

export interface TransactionsResponse {
  items: TransactionItem[];
  total: number;
}

export interface InsightModule {
  id: string;
  title: string;
  description: string;
  insights: {
    id: string;
    title: string;
    body: string;
    type: string;
    status: string;
    data?: Record<string, unknown>;
  }[];
}

export interface AccountResponse {
  accounts: {
    id: string;
    name: string;
    institution: string;
    type: string;
    currency: string;
  }[];
}

export interface UploadStats {
  totalRows: number;
  importedRows: number;
  detectedDuplicates: number;
  detectedTransfers: number;
}

export interface UploadResponse {
  imported: TransactionItem[];
  skipped: { reason: string; row: Record<string, unknown> }[];
  stats: UploadStats;
}
