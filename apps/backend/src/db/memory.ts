import { addMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { randomUUID } from 'node:crypto';

import { demoAccountSeed, demoInsightsSeed, demoTransactionsSeed, categorySeed } from '../seed-data.js';
import type {
  Account,
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
import { config } from '../config.js';
import type {
  CreateTransactionInput,
  CreateUserInput,
  DatabaseAdapter,
  DashboardFiltersInternal,
  UpdateUserInput,
  UpsertAccountInput,
} from './adapter.js';

interface MemoryStore {
  users: User[];
  accounts: Account[];
  transactions: Transaction[];
  sessions: { token: string; userId: string; expiresAt: Date }[];
  insights: InsightModule[];
  feedback: InsightFeedback[];
}

const sumBy = (items: number[]) => items.reduce((acc, value) => acc + value, 0);

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const inMemory: MemoryStore = {
  users: [],
  accounts: [],
  transactions: [],
  sessions: [],
  insights: clone(demoInsightsSeed),
  feedback: [],
};

const ensureDemoUser = () => {
  const existing = inMemory.users.find((user) => user.email === config.demoUserEmail);
  if (existing) {
    return existing;
  }
  const user: User = {
    id: 'demo-user',
    email: config.demoUserEmail,
    name: 'Demo Household',
    locale: 'en-CA',
    currency: 'CAD',
    passwordHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  inMemory.users.push(user);
  if (!inMemory.accounts.find((account) => account.id === demoAccountSeed.id)) {
    inMemory.accounts.push({
      ...demoAccountSeed,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  if (!inMemory.transactions.length) {
    demoTransactionsSeed.forEach((transaction) => inMemory.transactions.push({ ...transaction }));
  }
  return user;
};

const paginate = <T>(items: T[], offset = 0, limit = 50) => {
  const start = Math.max(offset, 0);
  const end = limit ? start + limit : items.length;
  return items.slice(start, end);
};

const buildCashflowPeriods = (timeframe: DashboardFiltersInternal['timeframe'], months = 3) => {
  const points: { start: Date; end: Date; label: string }[] = [];
  if (timeframe === 'MONTH') {
    for (let i = months - 1; i >= 0; i -= 1) {
      const start = startOfMonth(subMonths(new Date(), i));
      const end = endOfMonth(subMonths(new Date(), i));
      points.push({ start, end, label: format(start, 'yyyy-MM') });
    }
  }
  if (timeframe === 'QUARTER') {
    for (let i = months - 1; i >= 0; i -= 1) {
      const start = startOfMonth(subMonths(new Date(), i * 3));
      const end = endOfMonth(addMonths(start, 2));
      points.push({ start, end, label: `${format(start, 'yyyy')}-Q${Math.ceil((start.getMonth() + 1) / 3)}` });
    }
  }
  if (timeframe === 'YEAR') {
    for (let i = months - 1; i >= 0; i -= 1) {
      const start = new Date(new Date().getFullYear() - i, 0, 1);
      const end = new Date(new Date().getFullYear() - i, 11, 31);
      points.push({ start, end, label: format(start, 'yyyy') });
    }
  }
  if (!points.length) {
    const start = startOfMonth(subMonths(new Date(), 2));
    for (let i = 0; i < months; i += 1) {
      const periodStart = addMonths(start, i);
      points.push({ start: periodStart, end: endOfMonth(periodStart), label: format(periodStart, 'yyyy-MM') });
    }
  }
  return points;
};

const detectCategory = (transaction: CreateTransactionInput): number | undefined => {
  const normalized = transaction.normalizedName.toLowerCase();
  if (normalized.includes('rent')) return 101;
  if (normalized.includes('netflix')) return 126;
  if (normalized.includes('spotify')) return 126;
  if (normalized.includes('telus') || normalized.includes('rogers') || normalized.includes('bell')) return 114;
  if (normalized.includes('hydro') || normalized.includes('hydro-qu') || normalized.includes('hydro quebec')) return 111;
  if (normalized.includes('metro') || normalized.includes('iga') || normalized.includes('loblaws') || normalized.includes('costco'))
    return 116;
  if (normalized.includes('tim hortons') || normalized.includes('starbucks')) return 118;
  if (normalized.includes('transfer') || normalized.includes('etransfer') || normalized.includes('e-transfer')) return 138;
  if (transaction.transactionType === 'INCOME') return 131;
  return undefined;
};

export class MemoryAdapter implements DatabaseAdapter {
  config = config;

  async ensureDemoData(): Promise<void> {
    ensureDemoUser();
  }

  async findUserByEmail(email: string): Promise<User | null> {
    if (email === config.demoUserEmail) {
      return ensureDemoUser();
    }
    return inMemory.users.find((user) => user.email === email) ?? null;
  }

  async findUserById(id: string): Promise<User | null> {
    if (id === 'demo-user') {
      return ensureDemoUser();
    }
    return inMemory.users.find((user) => user.id === id) ?? null;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const existing = await this.findUserByEmail(input.email);
    if (existing) {
      return existing;
    }
    const user: User = {
      id: randomUUID(),
      email: input.email,
      name: input.name ?? null,
      locale: input.locale ?? 'en-CA',
      currency: input.currency ?? 'CAD',
      passwordHash: input.passwordHash ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemory.users.push(user);
    return user;
  }

  async createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const token = randomUUID();
    const expiresAt = addMonths(new Date(), 1);
    inMemory.sessions.push({ token, userId, expiresAt });
    return { token, expiresAt };
  }

  async deleteSession(token: string): Promise<void> {
    const index = inMemory.sessions.findIndex((session) => session.token === token);
    if (index >= 0) {
      inMemory.sessions.splice(index, 1);
    }
  }

  async getUserBySession(token: string): Promise<User | null> {
    const session = inMemory.sessions.find((item) => item.token === token && item.expiresAt > new Date());
    if (!session) return null;
    return this.findUserById(session.userId);
  }

  async updateUser(userId: string, input: UpdateUserInput): Promise<User> {
    const user = await this.findUserById(userId);
    if (!user) throw new Error('User not found');
    Object.entries(input).forEach(([key, value]) => {
      if (typeof value !== 'undefined') {
        (user as Record<string, unknown>)[key] = value;
      }
    });
    user.updatedAt = new Date();
    return user;
  }

  async listAccounts(userId: string): Promise<Account[]> {
    ensureDemoUser();
    return inMemory.accounts.filter((account) => account.userId === userId);
  }

  async upsertAccount(input: UpsertAccountInput): Promise<Account> {
    const existing = inMemory.accounts.find(
      (account) => account.userId === input.userId && account.name.toLowerCase() === input.name.toLowerCase(),
    );
    if (existing) {
      Object.assign(existing, input);
      return existing;
    }
    const account: Account = { ...input, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    inMemory.accounts.push(account);
    return account;
  }

  async createTransactions(transactions: CreateTransactionInput[]): Promise<Transaction[]> {
    const created: Transaction[] = [];
    transactions.forEach((item) => {
      const transaction: Transaction = {
        id: randomUUID(),
        userId: item.userId,
        accountId: item.accountId,
        merchantId: item.merchantId ?? null,
        categoryId: item.categoryId ?? detectCategory(item) ?? null,
        normalizedName: item.normalizedName,
        description: item.description,
        amount: item.amount,
        currency: item.currency,
        transactionType: item.transactionType,
        cashflowSign: item.cashflowSign,
        date: item.date,
        isTransfer: item.isTransfer ?? false,
        isRecurring: item.isRecurring ?? false,
        raw: item.raw,
      };
      created.push(transaction);
      inMemory.transactions.push(transaction);
    });
    return created;
  }

  async listTransactions(query: TransactionsQuery): Promise<{ items: Transaction[]; total: number }> {
    const items = inMemory.transactions
      .filter((transaction) => transaction.userId === query.userId)
      .filter((transaction) => {
        if (!query.timeframe) return true;
        return transaction.date >= query.timeframe.start && transaction.date <= query.timeframe.end;
      })
      .filter((transaction) => {
        if (!query.categories?.length) return true;
        return transaction.categoryId ? query.categories.includes(transaction.categoryId) : false;
      })
      .filter((transaction) => {
        if (!query.accounts?.length) return true;
        return query.accounts.includes(transaction.accountId);
      })
      .filter((transaction) => {
        if (!query.search) return true;
        const search = query.search.toLowerCase();
        return (
          transaction.description.toLowerCase().includes(search) ||
          transaction.normalizedName.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    const total = items.length;
    const paginated = paginate(items, query.offset, query.limit ?? 100);
    return { items: paginated, total };
  }

  async updateTransactionCategory(transactionId: string, categoryId: number | null): Promise<Transaction | null> {
    const transaction = inMemory.transactions.find((item) => item.id === transactionId);
    if (!transaction) return null;
    transaction.categoryId = categoryId ?? undefined;
    return transaction;
  }

  async summarizeDashboard(userId: string, filters: DashboardFiltersInternal): Promise<DashboardSummary> {
    const transactions = inMemory.transactions.filter((transaction) => transaction.userId === userId);
    const periods = buildCashflowPeriods(filters.timeframe, 3);
    const cashflow = periods.map((period) => {
      const slice = transactions.filter((transaction) => transaction.date >= period.start && transaction.date <= period.end);
      const income = sumBy(
        slice.filter((transaction) => transaction.cashflowSign > 0).map((transaction) => Number(transaction.amount)),
      );
      const expenses = sumBy(
        slice.filter((transaction) => transaction.cashflowSign < 0).map((transaction) => Number(transaction.amount)),
      );
      const other = sumBy(
        slice.filter((transaction) => transaction.cashflowSign === 0).map((transaction) => Number(transaction.amount)),
      );
      return {
        period: period.label,
        income: Number(income.toFixed(2)),
        expense: Number(Math.abs(expenses).toFixed(2)),
        other: Number(other.toFixed(2)),
      };
    });

    const latestPeriod = periods[periods.length - 1];
    const latestTransactions = transactions.filter(
      (transaction) => transaction.date >= latestPeriod.start && transaction.date <= latestPeriod.end,
    );

    const categoryTotals = new Map<number, number>();
    latestTransactions.forEach((transaction) => {
      const categoryId = transaction.categoryId ?? 138;
      const current = categoryTotals.get(categoryId) ?? 0;
      categoryTotals.set(categoryId, current + Number(transaction.amount));
    });

    const categoryBreakdown = Array.from(categoryTotals.entries())
      .map(([categoryId, total]) => {
        const category = categorySeed.find((item) => item.id === categoryId);
        return {
          categoryId,
          categoryName: category?.displayName ?? `Category ${categoryId}`,
          total: Number(Math.abs(total).toFixed(2)),
        };
      })
      .sort((a, b) => b.total - a.total);

    const totals = {
      income: Number(
        cashflow.reduce((acc, point) => acc + point.income, 0).toFixed(2),
      ),
      expenses: Number(
        cashflow.reduce((acc, point) => acc + point.expense, 0).toFixed(2),
      ),
      other: Number(
        cashflow.reduce((acc, point) => acc + point.other, 0).toFixed(2),
      ),
      savings: Number(
        (cashflow.reduce((acc, point) => acc + point.income, 0) + cashflow.reduce((acc, point) => acc - point.expense, 0)).toFixed(2),
      ),
    };

    const expenseTotalThisMonth = latestTransactions
      .filter((transaction) => transaction.cashflowSign < 0)
      .reduce((acc, item) => acc + Math.abs(Number(item.amount)), 0);
    const netThisMonth = latestTransactions
      .filter((transaction) => transaction.cashflowSign !== 0)
      .reduce((acc, item) => acc + Number(item.amount), 0);

    const budget = {
      monthlyBudget: 3500,
      spentThisMonth: Number(expenseTotalThisMonth.toFixed(2)),
      savingsThisMonth: Number(netThisMonth.toFixed(2)),
      categories: categoryBreakdown.slice(0, 6),
    };

    const lastCashflow = cashflow[cashflow.length - 1];
    const savings = {
      lastPeriod: lastCashflow ? Number((lastCashflow.income - lastCashflow.expense).toFixed(2)) : 0,
      sinceStart: Number(
        transactions
          .filter((transaction) => transaction.cashflowSign !== 0)
          .reduce((acc, item) => acc + Number(item.amount), 0)
          .toFixed(2),
      ),
      goals: [
        {
          id: 'goal-1',
          userId,
          name: 'Emergency fund',
          target: 10000,
          progress: 4200,
          priority: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    return {
      cashflow,
      categoryBreakdown,
      totals,
      budget,
      savings,
    };
  }

  async getInsightModules(userId: string): Promise<InsightModule[]> {
    ensureDemoUser();
    const modules = inMemory.insights.map((module) => ({
      ...module,
      insights: module.insights.filter((insight) => insight.userId === userId),
    }));
    return modules;
  }

  async recordInsightFeedback(
    userId: string,
    insightId: string,
    value: InsightFeedbackValue,
    comment?: string,
  ): Promise<InsightFeedback> {
    const feedback: InsightFeedback = {
      id: randomUUID(),
      userId,
      insightId,
      value,
      comment: comment ?? null ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemory.feedback.push(feedback);
    return feedback;
  }

  async uploadCsv(
    userId: string,
    accountId: string,
    records: CreateTransactionInput[],
    rawRows: Record<string, unknown>[],
  ): Promise<UploadResult> {
    const imported = await this.createTransactions(records.map((record) => ({ ...record, userId, accountId })));
    return {
      imported,
      skipped: [],
      stats: {
        totalRows: rawRows.length,
        importedRows: imported.length,
        detectedDuplicates: 0,
        detectedTransfers: imported.filter((transaction) => transaction.isTransfer).length,
      },
    };
  }
}

export const memoryAdapter = new MemoryAdapter();
