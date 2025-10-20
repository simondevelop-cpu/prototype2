import { Router } from 'express';
import { z } from 'zod';

import { db } from '../db/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { categorySeed, insightFeedbackOptions } from '../seed-data.js';

const router = Router();

router.get('/profile', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    const user = await db.findUserById(request.user!.id);
    if (!user) {
      return response.status(404).json({ error: 'User not found' });
    }
    return response.json({
      id: user.id,
      email: user.email,
      name: user.name,
      locale: user.locale,
      currency: user.currency,
      province: user.province,
      phone: user.phone,
    });
  } catch (error) {
    return next(error);
  }
});

const profileSchema = z.object({
  name: z.string().max(80).optional(),
  locale: z.string().optional(),
  currency: z.string().optional(),
  province: z.string().max(40).optional(),
  phone: z.string().max(30).optional(),
});

router.patch('/profile', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    const payload = profileSchema.parse(request.body);
    const updated = await db.updateUser(request.user!.id, payload);
    return response.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      locale: updated.locale,
      currency: updated.currency,
      province: updated.province,
      phone: updated.phone,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/accounts', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    const accounts = await db.listAccounts(request.user!.id);
    return response.json({ accounts });
  } catch (error) {
    return next(error);
  }
});

router.get('/categories', requireAuth, (_request, response) => {
  response.json({ categories: categorySeed });
});

router.get('/feedback-options', requireAuth, (_request, response) => {
  response.json({ options: insightFeedbackOptions });
});

export const settingsRouter = router;
