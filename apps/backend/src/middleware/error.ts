import type { NextFunction, Request, Response } from 'express';

export const errorHandler = (error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(error);
  const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status: number }).status) : 500;
  const message =
    typeof error === 'object' && error && 'message' in error ? String((error as { message: string }).message) : 'Unexpected error';
  response.status(Number.isFinite(status) ? status : 500).json({ error: message });
};
