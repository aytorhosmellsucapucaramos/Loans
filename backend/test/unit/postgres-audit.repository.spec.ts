import type { Pool } from 'pg';

import { PostgresAuditRepository } from '../../src/modules/audit/infrastructure/postgres-audit.repository.js';

describe('PostgresAuditRepository', () => {
  it('elimina secretos de metadatos antes de persistirlos', async () => {
    const database = { query: jest.fn().mockResolvedValue({ rows: [] }) } as unknown as Pool;
    await new PostgresAuditRepository(database).create({
      userId: null, action: 'payment.registered', entityType: 'payment', entityId: null, description: 'Pago registrado.',
      metadata: { source: 'application', password: 'no-guardar', nested: { access_token: 'no-guardar', operation: 'safe' } },
    });
    const parameters = (database.query as jest.Mock).mock.calls[0]?.[1] as unknown[];
    expect(JSON.parse(String(parameters[5]))).toEqual({ source: 'application', nested: { operation: 'safe' } });
  });

  it('usa consulta parametrizada y orden descendente para la página de auditoría', async () => {
    const database = { query: jest.fn().mockResolvedValue({ rows: [{ total: '0' }] }) } as unknown as Pool;
    await new PostgresAuditRepository(database).findPage({ page: 2, pageSize: 10, action: 'payment.registered', search: 'Pago' });
    const selectSql = String((database.query as jest.Mock).mock.calls[0]?.[0]);
    expect(selectSql).toContain('ORDER BY a.created_at DESC, a.id DESC');
    expect(selectSql).toContain('$1');
    expect(database.query).toHaveBeenCalledTimes(2);
  });
});
