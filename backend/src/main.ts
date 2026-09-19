import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './infrastructure/database/postgres.js';
import { createContainer } from './shared/container/container.js';
import { logger } from './shared/logging/logger.js';

const app = createApp(createContainer());
const host = '0.0.0.0';
const server = app.listen(env.port, host, () => logger.info({ port: env.port, host }, 'API iniciada'));

const shutdown = (signal: string): void => {
  logger.info({ signal }, 'Cerrando API');
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
