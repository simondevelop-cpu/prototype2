import type { NextFunction, Request, Response } from 'express';

import { db } from '../db/index.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    locale: string;
    currency: string;
  };
}

const extractToken = (request: Request) => {
  const authHeader = request.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }
  if (request.cookies?.session) {
    return request.cookies.session;
  }
  return undefined;
};

export const requireAuth = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
  try {
    const token = extractToken(request);
    if (!token) {
      return response.status(401).json({ error: 'Unauthorized' });
    }
    const user = await db.getUserBySession(token);
    if (!user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }
    request.user = {
      id: user.id,
      email: user.email,
      locale: user.locale,
      currency: user.currency,
    };
    return next();
  } catch (error) {
    return next(error);
  }
};
