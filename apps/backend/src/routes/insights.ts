import { Router } from 'express';
import { z } from 'zod';

import { db } from '../db/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { insightFeedbackOptions } from '../seed-data.js';

const router = Router();

router.get('/', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    const modules = await db.getInsightModules(request.user!.id);
    return response.json({ modules, feedbackOptions: insightFeedbackOptions });
  } catch (error) {
    return next(error);
  }
});

const feedbackSchema = z.object({
  value: z.enum(['USEFUL', 'NOT_RELEVANT', 'TOO_OBVIOUS', 'INACCURATE', 'OTHER']),
  comment: z.string().max(280).optional(),
});

router.post('/:insightId/feedback', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    const { insightId } = request.params;
    const payload = feedbackSchema.parse(request.body);
    const feedback = await db.recordInsightFeedback(request.user!.id, insightId, payload.value, payload.comment);
    return response.status(201).json(feedback);
  } catch (error) {
    return next(error);
  }
});

export const insightsRouter = router;
