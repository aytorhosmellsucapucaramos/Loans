import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { env } from './config/env.js';
import { accessControlRouter } from './modules/access-control/interfaces/http/access-control.routes.js';
import { authRouter } from './modules/auth/interfaces/http/auth.routes.js';
import { userRouter } from './modules/users/interfaces/http/user.routes.js';
import { customerRouter } from './modules/customers/interfaces/http/customer.routes.js';
import { installmentRouter } from './modules/installments/interfaces/http/installment.routes.js';
import { loanRouter } from './modules/loans/interfaces/http/loan.routes.js';
import { installmentPaymentRouter, loanPaymentRouter, paymentRouter } from './modules/payments/interfaces/http/payment.routes.js';
import type { AppContainer } from './shared/container/container.js';
import { errorHandler, notFoundHandler } from './shared/http/error-handler.js';
import { success } from './shared/http/api-response.js';
import { logger } from './shared/logging/logger.js';

export const createApp = (container: AppContainer): Express => {
  const app = express();
  app.disable('x-powered-by');
  app.use(pinoHttp({ logger, genReqId: () => randomUUID() }));
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-8', legacyHeaders: false }));

  app.get('/api/health', (_request, response) => success(response, { status: 'ok' }, 'La API está disponible.'));
  app.use('/api/auth', authRouter(container));
  app.use('/api/users', userRouter(container));
  app.use('/api/access-control', accessControlRouter(container));
  app.use('/api/customers', customerRouter(container));
  app.use('/api/loans', loanRouter(container));
  app.use('/api/loans', loanPaymentRouter(container));
  app.use('/api/installments', installmentRouter(container));
  app.use('/api/installments', installmentPaymentRouter(container));
  app.use('/api/payments', paymentRouter(container));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
