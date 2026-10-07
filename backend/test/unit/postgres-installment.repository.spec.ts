import { PostgresInstallmentRepository } from '../../src/modules/installments/infrastructure/postgres-installment.repository.js';

describe('PostgresInstallmentRepository ownership scope', () => {
  it('restringe por propietario tanto cuotas por préstamo como por ID', async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const database = { query: jest.fn(async (sql: string, values: unknown[]) => { queries.push({ sql, values }); return { rows: [] }; }) };
    const repository = new PostgresInstallmentRepository(database as never);
    const scope = { userId: 'owner-1', isAdmin: false };

    await repository.findByLoanId('loan-1', scope);
    await repository.findById('installment-1', scope);

    expect(queries).toHaveLength(2);
    for (const query of queries) {
      expect(query.sql).toContain('JOIN loans l ON l.id = i.loan_id JOIN customers c ON c.id = l.customer_id');
      expect(query.sql).toContain('c.user_id = $2');
      expect(query.values).toEqual([expect.any(String), 'owner-1']);
    }
  });

  it('permite al administrador consultar cuotas sin filtro de propietario', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const repository = new PostgresInstallmentRepository({ query } as never);

    await repository.findByLoanId('loan-1', { userId: 'admin-1', isAdmin: true });

    expect(query.mock.calls[0]?.[0]).not.toContain('c.user_id');
    expect(query.mock.calls[0]?.[1]).toEqual(['loan-1']);
  });
});
