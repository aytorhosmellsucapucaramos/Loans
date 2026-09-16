import { pool } from '../postgres.js';
import * as initialAuth from './001-initial-auth.js';
import * as customers from './002-customers.js';
import * as loansInstallments from './003-loans-installments.js';
import * as payments from './004-payments.js';

const migrations = [initialAuth, customers, loansInstallments, payments];

const run = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(120) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  for (const migration of migrations) {
    const alreadyApplied = await pool.query('SELECT 1 FROM schema_migrations WHERE id = $1', [migration.id]);
    if (alreadyApplied.rows[0]) continue;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(migration.up);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migration.id]);
      await client.query('COMMIT');
      process.stdout.write(`Migración aplicada: ${migration.id}\n`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

run().then(() => pool.end()).catch(async (error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  await pool.end();
  process.exitCode = 1;
});
