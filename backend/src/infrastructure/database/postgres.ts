import { Pool, type PoolClient, type QueryResultRow } from 'pg';

import { env } from '../../config/env.js';

export const pool = new Pool({ connectionString: env.databaseUrl });

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
