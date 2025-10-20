import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';

import { config } from '../config.js';
import { db } from '../db/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: config.environment === 'production',
  maxAge: 1000 * 60 * 60 * 24 * 30,
};

const sanitizeUser = (user: { id: string; email: string; name?: string | null; locale: string; currency: string }) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  locale: user.locale,
  currency: user.currency,
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .or(z.literal(''))
    .optional(),
  name: z.string().min(1).max(80).optional(),
  locale: z.string().optional(),
  currency: z.string().optional(),
});

router.post('/register', async (request, response, next) => {
  try {
    const payload = registerSchema.parse(request.body);
    const existing = await db.findUserByEmail(payload.email);
    if (existing) {
      return response.status(409).json({ error: 'Account already exists' });
    }
    const passwordValue = payload.password && payload.password.length > 0 ? payload.password : undefined;
    const passwordHash = passwordValue ? await bcrypt.hash(passwordValue, 10) : null;
    const user = await db.createUser({
      email: payload.email,
      passwordHash,
      name: payload.name,
      locale: payload.locale ?? 'en-CA',
      currency: payload.currency ?? 'CAD',
    });
    const session = await db.createSession(user.id);
    response.cookie('session', session.token, sessionCookieOptions);
    return response.status(201).json({ token: session.token, user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
});

router.post('/login', async (request, response, next) => {
  try {
    const payload = loginSchema.parse(request.body);
    const user = await db.findUserByEmail(payload.email);
    if (!user) {
      return response.status(404).json({ error: 'Account not found' });
    }
    if (user.passwordHash) {
      if (!payload.password || payload.password.length === 0) {
        return response.status(401).json({ error: 'Password required' });
      }
      const match = await bcrypt.compare(payload.password, user.passwordHash);
      if (!match) {
        return response.status(401).json({ error: 'Invalid credentials' });
      }
    }
    const session = await db.createSession(user.id);
    response.cookie('session', session.token, sessionCookieOptions);
    return response.json({ token: session.token, user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post('/demo', async (_request, response, next) => {
  try {
    const demoUser = await db.findUserByEmail(config.demoUserEmail);
    if (!demoUser) {
      return response.status(500).json({ error: 'Demo unavailable' });
    }
    const session = await db.createSession(demoUser.id);
    response.cookie('session', session.token, sessionCookieOptions);
    return response.json({ token: session.token, user: sanitizeUser(demoUser) });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    const token = request.cookies?.session ?? request.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      await db.deleteSession(token);
      response.clearCookie('session');
    }
    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, async (request: AuthenticatedRequest, response) => {
  response.json({ user: request.user });
});

export const authRouter = router;
