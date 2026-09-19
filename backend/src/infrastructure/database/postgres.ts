import { Pool, type PoolClient, type PoolConfig, type QueryResultRow } from 'pg';

import { env } from '../../config/env.js';

const isSupabaseHost = (hostname: string): boolean => hostname === 'supabase.co'
  || hostname.endsWith('.supabase.co')
  || hostname === 'supabase.com'
  || hostname.endsWith('.supabase.com');

const removeSslUrlParameters = (url: URL): string => {
  for (const parameter of ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert']) {
    url.searchParams.delete(parameter);
  }
  return url.toString();
};

const createPoolConfig = (): PoolConfig => {
  const databaseUrl = new URL(env.databaseUrl);
  if (!isSupabaseHost(databaseUrl.hostname)) {
    return { connectionString: env.databaseUrl };
  }

  const ca = env.databaseSslCa?.replace(/\\n/g, '\n');
  return {
    connectionString: removeSslUrlParameters(databaseUrl),
    ssl: {
      ...(ca ? { ca } : {}),
      rejectUnauthorized: ca ? true : env.databaseSslRejectUnauthorized,
    },
  };
};

export const pool = new Pool(createPoolConfig());

export const query = <T extends QueryResultRow>(text: string, values: unknown[] = []) => pool.query<T>(text, values);

export const withTransaction = async <T>(work: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
