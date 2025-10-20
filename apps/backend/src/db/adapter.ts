import type {
  Account,
  AppConfig,
  DashboardSummary,
  Insight,
  InsightFeedback,
  InsightFeedbackValue,
  InsightModule,
  Transaction,
  TransactionsQuery,
  UploadResult,
  User,
} from '../types.js';

export interface CreateUserInput {
  email: string;
  passwordHash?: string | null;
  name?: string | null;
  locale?: string;
  currency?: string;
}

export interface UpdateUserInput {
  name?: string | null;
  locale?: string;
  currency?: string;
  province?: string | null;
  phone?: string | null;
}

export interface UpsertAccountInput {
  userId: string;
  name: string;
  institution: string;
  type: string;
  currency: string;
}

export interface CreateTransactionInput {
  userId: string;
  accountId: string;
  description: string;
  normalizedName: string;
  amount: number;
  currency: string;
  transactionType: Transaction['transactionType'];
  cashflowSign: number;
  date: Date;
  categoryId?: number | null;
  isTransfer?: boolean;
  isRecurring?: boolean;
  merchantId?: string | null;
  raw?: unknown;
}

export interface DashboardFiltersInternal {
  timeframe: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  periodOffset?: number;
  labelId?: string;
}

export interface DatabaseAdapter {
  config: AppConfig;
  ensureDemoData(): Promise<void>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(input: CreateUserInput): Promise<User>;
  createSession(userId: string): Promise<{ token: string; expiresAt: Date }>;
  deleteSession(token: string): Promise<void>;
  getUserBySession(token: string): Promise<User | null>;
  updateUser(userId: string, input: UpdateUserInput): Promise<User>;
  listAccounts(userId: string): Promise<Account[]>;
  upsertAccount(input: UpsertAccountInput): Promise<Account>;
  createTransactions(transactions: CreateTransactionInput[]): Promise<Transaction[]>;
  listTransactions(query: TransactionsQuery): Promise<{ items: Transaction[]; total: number }>;
  updateTransactionCategory(transactionId: string, categoryId: number | null): Promise<Transaction | null>;
  summarizeDashboard(userId: string, filters: DashboardFiltersInternal): Promise<DashboardSummary>;
  getInsightModules(userId: string): Promise<InsightModule[]>;
  recordInsightFeedback(
    userId: string,
    insightId: string,
    value: InsightFeedbackValue,
    comment?: string,
  ): Promise<InsightFeedback>;
  uploadCsv(
    userId: string,
    accountId: string,
    records: CreateTransactionInput[],
    rawRows: Record<string, unknown>[],
  ): Promise<UploadResult>;
}
