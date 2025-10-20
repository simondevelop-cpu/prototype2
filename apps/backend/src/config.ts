import dotenv from 'dotenv';

import type { AppConfig } from './types.js';

dotenv.config();

const toBool = (value: string | undefined, fallback = false) => {
  if (!value) return fallback;
  return ['1', 'true', 'TRUE', 'yes', 'YES', 'on', 'ON'].includes(value);
};

const toNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config: AppConfig = {
  disableDb: toBool(process.env.DISABLE_DB, false),
  port: toNumber(process.env.PORT, 4000),
  sessionSecret: process.env.SESSION_SECRET ?? 'super-secret',
  demoUserEmail: process.env.DEMO_USER_EMAIL ?? 'demo@canadianinsights.app',
  environment: (process.env.NODE_ENV as AppConfig['environment']) ?? 'development',
};
