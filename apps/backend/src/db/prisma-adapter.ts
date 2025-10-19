import { PrismaClient, Prisma, type User as PrismaUser, type Transaction as PrismaTransaction } from '@prisma/client';
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { randomUUID } from 'node:crypto';

import { config } from '../config.js';
import { demoAccountSeed, demoInsightsSeed, demoTransactionsSeed, categorySeed } from '../seed-data.js';
import type {
  Account,
  DashboardSummary,
  InsightFeedback,
  InsightFeedbackValue,
  InsightModule,
  Transaction,
  TransactionsQuery,
  UploadResult,
  User,
} from '../types.js';
import type {
  CreateTransactionInput,
  CreateUserInput,
  DatabaseAdapter,
  DashboardFiltersInternal,
  UpdateUserInput,
  UpsertAccountInput,
} from './adapter.js';

const prisma = new PrismaClient();

const sumBy = (items: number[]) => items.reduce((acc, value) => acc + value, 0);

const buildCashflowPeriods = (timeframe: DashboardFiltersInternal['timeframe'], months = 3) => {
  const points: { start: Date; end: Date; label: string }[] = [];
  if (timeframe === 'MONTH') {
    for (let i = months - 1; i >= 0; i -= 1) {
      const start = startOfMonth(subMonths(new Date(), i));
      const end = endOfMonth(subMonths(new Date(), i));
      points.push({ start, end, label: format(start, 'yyyy-MM') });
    }
  } else if (timeframe === 'QUARTER') {
    for (let i = months - 1; i >= 0; i -= 1) {
      const start = startOfMonth(subMonths(new Date(), i * 3));
      const end = endOfMonth(addMonths(start, 2));
      points.push({ start, end, label: `${format(start, 'yyyy')}-Q${Math.ceil((start.getMonth() + 1) / 3)}` });
    }
  } else if (timeframe === 'YEAR') {
    for (let i = months - 1; i >= 0; i -= 1) {
      const start = new Date(new Date().getFullYear() - i, 0, 1);
      const end = new Date(new Date().getFullYear() - i, 11, 31);
      points.push({ start, end, label: format(start, 'yyyy') });
    }
  } else {
    const start = startOfMonth(subMonths(new Date(), months - 1));
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
  if (normalized.includes('hydro')) return 111;
  if (normalized.includes('metro') || normalized.includes('iga') || normalized.includes('loblaws') || normalized.includes('costco'))
    return 116;
  if (normalized.includes('tim hortons') || normalized.includes('starbucks')) return 118;
  if (normalized.includes('transfer') || normalized.includes('etransfer') || normalized.includes('e-transfer')) return 138;
  if (transaction.transactionType === 'INCOME') return 131;
  return undefined;
};

const mapPrismaUser = (user: PrismaUser): User => ({
  id: user.id,
  email: user.email,
  name: user.name,
  locale: user.locale,
  currency: user.currency,
  province: user.province,
  phone: user.phone,
  dob: user.dob ?? undefined,
  passwordHash: user.passwordHash ?? undefined,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const mapPrismaTransaction = (transaction: PrismaTransaction): Transaction => ({
  id: transaction.id,
  userId: transaction.userId,
  accountId: transaction.accountId,
  merchantId: transaction.merchantId ?? undefined,
  categoryId: transaction.categoryId ?? undefined,
  normalizedName: transaction.normalizedName,
  description: transaction.description,
  amount: Number(transaction.amount),
  currency: transaction.currency,
  transactionType: transaction.transactionType,
  cashflowSign: transaction.cashflowSign,
  date: transaction.date,
  isTransfer: transaction.isTransfer,
  isRecurring: transaction.isRecurring,
  recurrenceRule: transaction.recurrenceRule ?? undefined,
  notes: transaction.notes ?? undefined,
  raw: transaction.raw ?? undefined,
  createdAt: transaction.createdAt,
  updatedAt: transaction.updatedAt,
});

export class PrismaAdapter implements DatabaseAdapter {
  config = config;

  async ensureDemoData(): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const categoryCount = await tx.category.count();
      if (categoryCount === 0) {
        await tx.category.createMany({
          data: categorySeed.map((category) => ({
            id: category.id,
            name: category.name,
            displayName: category.displayName,
            kind: category.kind,
            parentId: category.parentId ?? null,
          })),
          skipDuplicates: true,
        });
      }

      let user = await tx.user.findUnique({ where: { email: config.demoUserEmail } });
      if (!user) {
        user = await tx.user.create({
          data: {
            id: 'demo-user',
            email: config.demoUserEmail,
            name: 'Demo Household',
            locale: 'en-CA',
            currency: 'CAD',
          },
        });
      }

      const account = await tx.account.upsert({
        where: { id: demoAccountSeed.id },
        create: {
          id: demoAccountSeed.id,
          userId: user.id,
          name: demoAccountSeed.name,
          institution: demoAccountSeed.institution,
          type: demoAccountSeed.type,
          currency: demoAccountSeed.currency,
        },
        update: {
          name: demoAccountSeed.name,
          institution: demoAccountSeed.institution,
          type: demoAccountSeed.type,
          currency: demoAccountSeed.currency,
        },
      });

      const existingTransactions = await tx.transaction.count({ where: { userId: user.id } });
      if (existingTransactions === 0) {
        await tx.transaction.createMany({
          data: demoTransactionsSeed.map((transaction) => {
            const raw = transaction.raw as Prisma.JsonValue | undefined;
            return {
              id: transaction.id,
              userId: user.id,
              accountId: account.id,
              merchantId: transaction.merchantId ?? null,
              categoryId: transaction.categoryId ?? null,
              normalizedName: transaction.normalizedName,
              description: transaction.description,
              amount: new Prisma.Decimal(Number(transaction.amount)),
              currency: transaction.currency,
              transactionType: transaction.transactionType,
              cashflowSign: transaction.cashflowSign,
              date: transaction.date,
              isTransfer: transaction.isTransfer,
              isRecurring: transaction.isRecurring,
              recurrenceRule: transaction.recurrenceRule ?? null,
              notes: transaction.notes ?? null,
              ...(typeof raw !== 'undefined' ? { raw } : {}),
            };
          }),
          skipDuplicates: true,
        });
      }

      for (const module of demoInsightsSeed) {
        for (const insight of module.insights) {
          await tx.insight.upsert({
            where: { id: insight.id },
            create: {
              id: insight.id,
              userId: insight.userId,
              type: insight.type,
              title: insight.title,
              body: insight.body,
              data: insight.data as Prisma.JsonValue,
              status: insight.status,
            },
            update: {
              title: insight.title,
              body: insight.body,
              data: insight.data as Prisma.JsonValue,
              status: insight.status,
            },
          });
        }
      }
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? mapPrismaUser(user) : null;
  }

  async findUserById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? mapPrismaUser(user) : null;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash ?? null,
        name: input.name ?? null,
        locale: input.locale ?? 'en-CA',
        currency: input.currency ?? 'CAD',
      },
    });
    return mapPrismaUser(user);
  }

  async createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const token = randomUUID();
    const expiresAt = addMonths(new Date(), 1);
    await prisma.session.create({
      data: { token, userId, expiresAt },
    });
    return { token, expiresAt };
  }

  async deleteSession(token: string): Promise<void> {
    await prisma.session.delete({ where: { token } }).catch(() => undefined);
  }

  async getUserBySession(token: string): Promise<User | null> {
    const session = await prisma.session.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) {
      return null;
    }
    return this.findUserById(session.userId);
  }

  async updateUser(userId: string, input: UpdateUserInput): Promise<User> {
    const data: Prisma.UserUpdateInput = {};
    if (typeof input.name !== 'undefined') {
      data.name = input.name ?? null;
    }
    if (typeof input.locale !== 'undefined') {
      data.locale = input.locale;
    }
    if (typeof input.currency !== 'undefined') {
      data.currency = input.currency;
    }
    if (typeof input.province !== 'undefined') {
      data.province = input.province ?? null;
    }
    if (typeof input.phone !== 'undefined') {
      data.phone = input.phone ?? null;
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    return mapPrismaUser(user);
  }

  async listAccounts(userId: string): Promise<Account[]> {
    const accounts = await prisma.account.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    return accounts.map((account) => ({
      id: account.id,
      userId: account.userId,
      name: account.name,
      institution: account.institution,
      type: account.type,
      currency: account.currency,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));
  }

  async upsertAccount(input: UpsertAccountInput): Promise<Account> {
    const account = await prisma.account.upsert({
      where: {
        id: `${input.userId}-${input.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      create: {
        id: `${input.userId}-${input.name.toLowerCase().replace(/\s+/g, '-')}`,
        userId: input.userId,
        name: input.name,
        institution: input.institution,
        type: input.type,
        currency: input.currency,
      },
      update: {
        name: input.name,
        institution: input.institution,
        type: input.type,
        currency: input.currency,
      },
    });
    return {
      id: account.id,
      userId: account.userId,
      name: account.name,
      institution: account.institution,
      type: account.type,
      currency: account.currency,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  async createTransactions(transactions: CreateTransactionInput[]): Promise<Transaction[]> {
    const created = await prisma.$transaction(async (tx) => {
      const results: Transaction[] = [];
      for (const input of transactions) {
        const raw = input.raw as Prisma.JsonValue | undefined;
        const transaction = await tx.transaction.create({
          data: {
            userId: input.userId,
            accountId: input.accountId,
            merchantId: input.merchantId ?? null,
            categoryId: input.categoryId ?? detectCategory(input) ?? null,
            normalizedName: input.normalizedName,
            description: input.description,
            amount: new Prisma.Decimal(Number(input.amount)),
            currency: input.currency,
            transactionType: input.transactionType,
            cashflowSign: input.cashflowSign,
            date: input.date,
            isTransfer: input.isTransfer ?? false,
            isRecurring: input.isRecurring ?? false,
            ...(typeof raw !== 'undefined' ? { raw } : {}),
          },
        });
        results.push(mapPrismaTransaction(transaction));
      }
      return results;
    });
    return created;
  }

  async listTransactions(query: TransactionsQuery): Promise<{ items: Transaction[]; total: number }> {
    const where: Prisma.TransactionWhereInput = {
      userId: query.userId,
    };
    if (query.timeframe) {
      where.date = { gte: query.timeframe.start, lte: query.timeframe.end };
    }
    if (query.categories?.length) {
      where.categoryId = { in: query.categories };
    }
    if (query.accounts?.length) {
      where.accountId = { in: query.accounts };
    }
    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { normalizedName: { contains: query.search.toLowerCase(), mode: 'insensitive' } },
      ];
    }
    const [total, rows] = await prisma.$transaction([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: query.offset ?? 0,
        take: query.limit ?? 100,
      }),
    ]);
    return { items: rows.map(mapPrismaTransaction), total };
  }

  async updateTransactionCategory(transactionId: string, categoryId: number | null): Promise<Transaction | null> {
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { categoryId },
    }).catch(() => null);
    return transaction ? mapPrismaTransaction(transaction) : null;
  }

  async summarizeDashboard(userId: string, filters: DashboardFiltersInternal): Promise<DashboardSummary> {
    const periods = buildCashflowPeriods(filters.timeframe, 3);
    const cashflow = [] as DashboardSummary['cashflow'];

    for (const period of periods) {
      const aggregates = await prisma.transaction.aggregate({
        where: {
          userId,
          date: { gte: period.start, lte: period.end },
        },
        _sum: {
          amount: true,
        },
      });

      const income = await prisma.transaction.aggregate({
        where: {
          userId,
          date: { gte: period.start, lte: period.end },
          cashflowSign: 1,
        },
        _sum: { amount: true },
      });
      const expenses = await prisma.transaction.aggregate({
        where: {
          userId,
          date: { gte: period.start, lte: period.end },
          cashflowSign: -1,
        },
        _sum: { amount: true },
      });
      const transfers = await prisma.transaction.aggregate({
        where: {
          userId,
          date: { gte: period.start, lte: period.end },
          cashflowSign: 0,
        },
        _sum: { amount: true },
      });

      const incomeSum = income._sum.amount ? Number(income._sum.amount) : 0;
      const expenseSum = expenses._sum.amount ? Number(expenses._sum.amount) : 0;
      const transferSum = transfers._sum.amount ? Number(transfers._sum.amount) : 0;

      cashflow.push({
        period: period.label,
        income: Number(incomeSum.toFixed(2)),
        expense: Number(Math.abs(expenseSum).toFixed(2)),
        other: Number(transferSum.toFixed(2)),
      });
    }

    const latestPeriod = periods[periods.length - 1];
    const latestTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: latestPeriod.start, lte: latestPeriod.end },
      },
    });

    const categoryTotals = latestTransactions.reduce<Record<number, number>>((acc, transaction) => {
      const categoryId = transaction.categoryId ?? 138;
      acc[categoryId] = (acc[categoryId] ?? 0) + Number(transaction.amount);
      return acc;
    }, {});

    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([categoryId, total]) => {
        const category = categorySeed.find((item) => item.id === Number(categoryId));
        return {
          categoryId: Number(categoryId),
          categoryName: category?.displayName ?? `Category ${categoryId}`,
          total: Number(Math.abs(total).toFixed(2)),
        };
      })
      .sort((a, b) => b.total - a.total);

    const totals = {
      income: Number(sumBy(cashflow.map((point) => point.income)).toFixed(2)),
      expenses: Number(sumBy(cashflow.map((point) => point.expense)).toFixed(2)),
      other: Number(sumBy(cashflow.map((point) => point.other)).toFixed(2)),
      savings: Number(
        (
          sumBy(cashflow.map((point) => point.income)) - sumBy(cashflow.map((point) => point.expense))
        ).toFixed(2),
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
    const sinceStartAggregate = await prisma.transaction.aggregate({
      where: { userId, cashflowSign: { not: 0 } },
      _sum: { amount: true },
    });
    const sinceStartValue = sinceStartAggregate._sum.amount
      ? Number(sinceStartAggregate._sum.amount)
      : 0;
    const savings = {
      lastPeriod: lastCashflow ? Number((lastCashflow.income - lastCashflow.expense).toFixed(2)) : 0,
      sinceStart: Number(sinceStartValue.toFixed(2)),
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
    const insights = await prisma.insight.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return demoInsightsSeed.map((module) => ({
      ...module,
      insights: module.insights
        .map((seed) => {
          const matched = insights.find((insight) => insight.id === seed.id);
          if (!matched) return null;
          return {
            id: matched.id,
            userId: matched.userId,
            type: matched.type,
            title: matched.title,
            body: matched.body,
            data: (matched.data as Record<string, unknown>) ?? undefined,
            status: matched.status,
            createdAt: matched.createdAt,
            updatedAt: matched.updatedAt,
          };
        })
        .filter((insight): insight is InsightModule['insights'][number] => Boolean(insight)),
    }));
  }

  async recordInsightFeedback(
    userId: string,
    insightId: string,
    value: InsightFeedbackValue,
    comment?: string,
  ): Promise<InsightFeedback> {
    const feedback = await prisma.insightFeedback.create({
      data: {
        userId,
        insightId,
        value,
        comment: comment ?? null,
      },
    });
    return {
      id: feedback.id,
      userId: feedback.userId,
      insightId: feedback.insightId,
      value: feedback.value,
      comment: feedback.comment ?? undefined,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    };
  }

  async uploadCsv(
    userId: string,
    accountId: string,
    records: CreateTransactionInput[],
    rawRows: Record<string, unknown>[],
  ): Promise<UploadResult> {
    const created = await this.createTransactions(records.map((record) => ({ ...record, userId, accountId })));
    return {
      imported: created,
      skipped: [],
      stats: {
        totalRows: rawRows.length,
        importedRows: created.length,
        detectedDuplicates: 0,
        detectedTransfers: created.filter((transaction) => transaction.isTransfer).length,
      },
    };
  }
}

export const prismaAdapter = new PrismaAdapter();
