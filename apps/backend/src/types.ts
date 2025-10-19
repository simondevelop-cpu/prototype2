import { Decimal } from '@prisma/client/runtime/library';

type PrimitiveDecimal = Decimal | number | string;

export interface BaseEntity {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CategoryKind = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'OTHER';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'OTHER';
export type PeriodType = 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
export type InsightType =
  | 'SUBSCRIPTION'
  | 'BILL_HIKE'
  | 'FEE_ALERT'
  | 'PEER_COMPARISON'
  | 'SAVINGS_PROGRESS'
  | 'SUMMARY';
export type InsightStatus = 'ACTIVE' | 'DISMISSED' | 'ARCHIVED';
export type InsightFeedbackValue =
  | 'USEFUL'
  | 'NOT_RELEVANT'
  | 'TOO_OBVIOUS'
  | 'INACCURATE'
  | 'OTHER';

export interface User extends BaseEntity {
  email: string;
  name?: string | null;
  locale: string;
  currency: string;
  province?: string | null;
  phone?: string | null;
  dob?: Date | null;
  passwordHash?: string | null;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface Account extends BaseEntity {
  userId: string;
  name: string;
  institution: string;
  type: string;
  currency: string;
}

export interface Merchant extends BaseEntity {
  canonical: string;
  aliases: string[];
  gateway?: string | null;
  parentBrand?: string | null;
  tags: string[];
}

export interface Category {
  id: number;
  name: string;
  displayName: string;
  kind: CategoryKind;
  parentId?: number | null;
}

export interface Label extends BaseEntity {
  userId: string;
  name: string;
  color?: string | null;
}

export interface Transaction extends BaseEntity {
  userId: string;
  accountId: string;
  merchantId?: string | null;
  categoryId?: number | null;
  normalizedName: string;
  description: string;
  amount: PrimitiveDecimal;
  currency: string;
  transactionType: TransactionType;
  cashflowSign: number;
  date: Date;
  isTransfer: boolean;
  isRecurring: boolean;
  recurrenceRule?: string | null;
  notes?: string | null;
  raw?: unknown;
  labels?: Label[];
}

export interface Budget extends BaseEntity {
  userId: string;
  period: PeriodType;
  startDate: Date;
  endDate: Date;
  totalTarget?: PrimitiveDecimal | null;
}

export interface BudgetCategory extends BaseEntity {
  budgetId: string;
  categoryId: number;
  target: PrimitiveDecimal;
  spent: PrimitiveDecimal;
}

export interface Goal extends BaseEntity {
  userId: string;
  name: string;
  target: PrimitiveDecimal;
  progress: PrimitiveDecimal;
  priority: number;
}

export interface Insight extends BaseEntity {
  userId: string;
  type: InsightType;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  status: InsightStatus;
}

export interface InsightFeedback extends BaseEntity {
  userId: string;
  insightId: string;
  value: InsightFeedbackValue;
  comment?: string | null;
}

export interface DashboardFilters {
  timeframe: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  periodOffset?: number;
  labelId?: string;
}

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
    goals?: Goal[];
  };
}

export interface TransactionsQuery {
  userId: string;
  timeframe?: { start: Date; end: Date };
  categories?: number[];
  labels?: string[];
  accounts?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CsvTransactionRecord {
  date: Date;
  description: string;
  amount: number;
  currency: string;
  accountName?: string;
  typeGuess?: TransactionType;
}

export interface UploadResult {
  imported: Transaction[];
  skipped: { reason: string; row: Record<string, unknown> }[];
  stats: {
    totalRows: number;
    importedRows: number;
    detectedDuplicates: number;
    detectedTransfers: number;
  };
}

export interface InsightModule {
  id: string;
  title: string;
  description: string;
  insights: Insight[];
}

export interface AppConfig {
  disableDb: boolean;
  port: number;
  sessionSecret: string;
  demoUserEmail: string;
  environment: 'development' | 'production' | 'test';
}
