import multer from 'multer';
import { Router } from 'express';
import { z } from 'zod';

import { db } from '../db/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { parseCsvTransactions } from '../utils/csv.js';

const upload = multer();
const router = Router();

const listSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  categories: z.string().optional(),
  accounts: z.string().optional(),
  limit: z.coerce.number().min(1).max(500).optional(),
  offset: z.coerce.number().min(0).optional(),
});

router.get('/', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    const parsed = listSchema.parse(request.query);
    const timeframe = parsed.startDate && parsed.endDate ? {
      start: new Date(parsed.startDate),
      end: new Date(parsed.endDate),
    } : undefined;
    const categories = parsed.categories ? parsed.categories.split(',').map((id) => Number(id.trim())).filter(Boolean) : undefined;
    const accounts = parsed.accounts ? parsed.accounts.split(',').map((id) => id.trim()).filter(Boolean) : undefined;
    const result = await db.listTransactions({
      userId: request.user!.id,
      timeframe,
      categories,
      accounts,
      search: parsed.search,
      limit: parsed.limit,
      offset: parsed.offset,
    });
    return response.json(result);
  } catch (error) {
    return next(error);
  }
});

const recategorizeSchema = z.object({
  categoryId: z.number().nullable(),
});

router.post('/:transactionId/category', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    const { transactionId } = request.params;
    const payload = recategorizeSchema.parse(request.body);
    const updated = await db.updateTransactionCategory(transactionId, payload.categoryId);
    if (!updated) {
      return response.status(404).json({ error: 'Transaction not found' });
    }
    return response.json(updated);
  } catch (error) {
    return next(error);
  }
});

const uploadSchema = z.object({
  accountId: z.string().optional(),
  accountName: z.string().optional(),
  institution: z.string().optional(),
  accountType: z.string().optional(),
  currency: z.string().optional(),
});

router.post('/upload', requireAuth, upload.single('file'), async (request: AuthenticatedRequest, response, next) => {
  try {
    if (!request.file) {
      return response.status(400).json({ error: 'CSV file is required' });
    }
    const payload = uploadSchema.parse(request.body);
    let accountId = payload.accountId;
    if (!accountId && payload.accountName) {
      const account = await db.upsertAccount({
        userId: request.user!.id,
        name: payload.accountName,
        institution: payload.institution ?? 'Uploaded CSV',
        type: payload.accountType ?? 'chequing',
        currency: payload.currency ?? request.user!.currency,
      });
      accountId = account.id;
    }
    if (!accountId) {
      return response.status(400).json({ error: 'Provide accountId or accountName' });
    }
    const { transactions, rawRows } = parseCsvTransactions(request.file.buffer, {
      userId: request.user!.id,
      accountId,
      currency: payload.currency ?? request.user!.currency,
    });
    if (!transactions.length) {
      return response.status(400).json({ error: 'No transactions detected in CSV' });
    }
    const result = await db.uploadCsv(request.user!.id, accountId, transactions, rawRows);
    return response.json(result);
  } catch (error) {
    return next(error);
  }
});

const manualTransactionSchema = z.object({
  accountId: z.string(),
  description: z.string().min(1),
  amount: z.number(),
  currency: z.string().optional(),
  date: z.string(),
  categoryId: z.number().optional(),
  isTransfer: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
});

router.post('/', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    const payload = manualTransactionSchema.parse(request.body);
    const amount = payload.amount;
    const cashflowSign = amount > 0 ? 1 : amount < 0 ? -1 : 0;
    const [transaction] = await db.createTransactions([
      {
        userId: request.user!.id,
        accountId: payload.accountId,
        description: payload.description,
        normalizedName: payload.description.toLowerCase(),
        amount,
        currency: payload.currency ?? request.user!.currency,
        transactionType: amount >= 0 ? 'INCOME' : 'EXPENSE',
        cashflowSign,
        date: new Date(payload.date),
        categoryId: payload.categoryId,
        isTransfer: payload.isTransfer ?? false,
        isRecurring: payload.isRecurring ?? false,
      },
    ]);
    return response.status(201).json(transaction);
  } catch (error) {
    return next(error);
  }
});

export const transactionsRouter = router;
