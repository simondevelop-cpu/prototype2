import { Router } from 'express';
import { z } from 'zod';

import { db } from '../db/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const summaryQuerySchema = z.object({
  timeframe: z.enum(['WEEK', 'MONTH', 'QUARTER', 'YEAR']).default('MONTH'),
  labelId: z.string().optional(),
});

router.get('/summary', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    const parsed = summaryQuerySchema.parse(request.query);
    const summary = await db.summarizeDashboard(request.user!.id, {
      timeframe: parsed.timeframe,
      labelId: parsed.labelId,
    });
    return response.json(summary);
  } catch (error) {
    return next(error);
  }
});

export const dashboardRouter = router;
