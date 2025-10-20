import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { config } from './config.js';
import { errorHandler } from './middleware/error.js';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { healthRouter } from './routes/health.js';
import { insightsRouter } from './routes/insights.js';
import { settingsRouter } from './routes/settings.js';
import { transactionsRouter } from './routes/transactions.js';

export const createServer = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/dashboard', dashboardRouter);
  app.use('/transactions', transactionsRouter);
  app.use('/insights', insightsRouter);
  app.use('/settings', settingsRouter);

  app.use(errorHandler);

  app.set('port', config.port);

  return app;
};
