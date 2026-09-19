import { config } from 'dotenv';
import Joi from 'joi';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '..', '.env'), override: false });

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  CORS_ORIGIN: Joi.string().required(),
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('info'),
  ADMIN_EMAIL: Joi.string().email().optional(),
  ADMIN_PASSWORD: Joi.string().min(12).optional(),
}).unknown(true);

const result = schema.validate(process.env, { abortEarly: false });
if (result.error) {
  throw new Error(`Variables de entorno inválidas: ${result.error.message}`);
}

const corsOrigins = (result.value.CORS_ORIGIN as string).split(',').map((origin) => origin.trim()).filter(Boolean);
if (!corsOrigins.length || corsOrigins.some((origin) => Joi.string().uri().validate(origin).error)) {
  throw new Error('Variables de entorno inválidas: CORS_ORIGIN debe contener una o más URL válidas separadas por comas.');
}

const sslMode = new URL(result.value.DATABASE_URL as string).searchParams.get('sslmode');
const secureSslModes = new Set(['require', 'verify-ca', 'verify-full']);
if (result.value.NODE_ENV === 'production' && !secureSslModes.has(sslMode ?? '')) {
  throw new Error('Variables de entorno inválidas: DATABASE_URL requiere sslmode=require, verify-ca o verify-full en producción.');
}

export const env = {
  nodeEnv: result.value.NODE_ENV as 'development' | 'test' | 'production',
  port: result.value.PORT as number,
  databaseUrl: result.value.DATABASE_URL as string,
  jwtAccessSecret: result.value.JWT_ACCESS_SECRET as string,
  jwtAccessExpiresIn: result.value.JWT_ACCESS_EXPIRES_IN as string,
  jwtRefreshSecret: result.value.JWT_REFRESH_SECRET as string,
  corsOrigins,
  logLevel: result.value.LOG_LEVEL as string,
  adminEmail: result.value.ADMIN_EMAIL as string | undefined,
  adminPassword: result.value.ADMIN_PASSWORD as string | undefined,
};
