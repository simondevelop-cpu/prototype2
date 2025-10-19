import { parse } from 'csv-parse/sync';
import { parse as parseDate } from 'date-fns';

import type { CreateTransactionInput } from '../db/adapter.js';

const DATE_FORMATS = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy/MM/dd', 'dd-MM-yyyy', 'MMM d, yyyy'];

const columnMatches = (row: Record<string, unknown>, candidates: string[]) => {
  for (const candidate of candidates) {
    const key = Object.keys(row).find((column) => column.toLowerCase() === candidate.toLowerCase());
    if (key) return key;
  }
  return undefined;
};

const parseAmount = (row: Record<string, unknown>) => {
  const amountKey = columnMatches(row, ['amount', 'cad', 'value']);
  if (amountKey) {
    const raw = String(row[amountKey] ?? '').replace(/[$,]/g, '');
    if (raw) return Number(raw);
  }
  const creditKey = columnMatches(row, ['credit', 'deposit', 'in']);
  const debitKey = columnMatches(row, ['debit', 'withdrawal', 'out']);
  const credit = creditKey ? Number(String(row[creditKey] ?? '').replace(/[$,]/g, '')) : 0;
  const debit = debitKey ? Number(String(row[debitKey] ?? '').replace(/[$,]/g, '')) : 0;
  const amount = credit - debit;
  if (!Number.isNaN(amount) && amount !== 0) {
    return amount;
  }
  return 0;
};

const parseTransactionDate = (row: Record<string, unknown>) => {
  const dateKey = columnMatches(row, ['date', 'transaction date', 'posted date', 'date posted', 'timestamp']);
  if (!dateKey) return null;
  const raw = String(row[dateKey] ?? '').trim();
  if (!raw) return null;
  for (const formatCandidate of DATE_FORMATS) {
    const parsed = parseDate(raw, formatCandidate, new Date());
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  const fallback = new Date(raw);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback;
  }
  return null;
};

const parseDescription = (row: Record<string, unknown>) => {
  const descriptionKey = columnMatches(row, ['description', 'details', 'memo', 'transaction', 'merchant', 'name']);
  if (!descriptionKey) {
    return 'Transaction';
  }
  return String(row[descriptionKey] ?? '').trim() || 'Transaction';
};

const detectTransactionType = (amount: number): CreateTransactionInput['transactionType'] => {
  if (amount > 0) return 'INCOME';
  if (amount < 0) return 'EXPENSE';
  return 'TRANSFER';
};

const detectTransfer = (description: string) => {
  const lowered = description.toLowerCase();
  return lowered.includes('transfer') || lowered.includes('etransfer') || lowered.includes('e-transfer');
};

export const parseCsvTransactions = (
  buffer: Buffer,
  options: { currency?: string; userId: string; accountId: string },
): { transactions: CreateTransactionInput[]; rawRows: Record<string, unknown>[] } => {
  const rows = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, unknown>[];

  const transactions: CreateTransactionInput[] = [];

  rows.forEach((row) => {
    const date = parseTransactionDate(row);
    const amount = parseAmount(row);
    const description = parseDescription(row);
    if (!date || Number.isNaN(amount) || amount === 0) {
      return;
    }
    const normalizedName = description.toLowerCase();
    const transactionType = detectTransactionType(amount);
    const cashflowSign = amount > 0 ? 1 : amount < 0 ? -1 : 0;
    const transaction: CreateTransactionInput = {
      userId: options.userId,
      accountId: options.accountId,
      description,
      normalizedName,
      amount,
      currency: options.currency ?? 'CAD',
      transactionType,
      cashflowSign,
      date,
      isTransfer: detectTransfer(description),
      isRecurring: false,
    };
    transactions.push(transaction);
  });

  return { transactions, rawRows: rows };
};
