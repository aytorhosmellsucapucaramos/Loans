import { PostgresLoanRepository } from '../../src/modules/loans/infrastructure/postgres-loan.repository.js';

const loanInput = { customerId: '55555555-5555-4555-8555-555555555555', principalAmount: '1000.00', interestRate: '10.0000', interestType: 'simple' as const, paymentFrequency: 'monthly' as const, installmentCount: 1, disbursementDate: '2026-01-01', firstInstallmentDate: '2026-02-01', totalAmount: '1100.00', observations: null };
const installment = { loanId: '', installmentNumber: 1, dueDate: '2026-02-01', principalAmount: '1000.00', interestAmount: '100.00', scheduledAmount: '1100.00', outstandingAmount: '1100.00', status: 'pending' as const };
const collateral = { description: 'Televisor', category: 'Electrónica', physicalCondition: 'Buen estado', estimatedValue: '500.00', receivedAt: '2026-01-01' };
const row = { id: '44444444-4444-4444-4444-444444444444', customer_id: loanInput.customerId, principal_amount: '1000.00', interest_rate: '10.0000', interest_type: 'simple', payment_frequency: 'monthly', installment_count: 1, disbursement_date: '2026-01-01', first_installment_date: '2026-02-01', total_amount: '1100.00', status: 'active', observations: null, created_at: new Date(), updated_at: new Date() };

describe('PostgresLoanRepository', () => {
  it('filtra por propietario en listado y detalle para usuario estándar', async () => {
    const queries: Array<{ sql: string; values?: unknown[] }> = [];
    const database = { query: jest.fn(async (sql: string, values?: unknown[]) => { queries.push({ sql, values }); return sql.includes('COUNT(*)') ? { rows: [{ total: '0' }] } : { rows: [] }; }) };
    const repository = new PostgresLoanRepository(database as never);
    const scope = { userId: 'owner-1', isAdmin: false };

    await repository.findPage({ page: 1, pageSize: 20 }, scope);
    await repository.findById('loan-1', scope);

    expect(queries[0]?.sql).toContain('c.user_id = $1');
    expect(queries[2]?.sql).toContain('c.user_id = $2');
    expect(queries[0]?.values).toEqual(['owner-1', 20, 0]);
    expect(queries[2]?.values).toEqual(['loan-1', 'owner-1']);
    expect(queries[0]?.sql).toContain('JOIN customers c ON c.id = l.customer_id');
  });

  it('confirma préstamo y cuotas dentro de una transacción', async () => {
    const client = { query: jest.fn().mockImplementation(async (sql: string) => sql.includes('INSERT INTO loans') ? { rows: [row] } : { rows: [] }), release: jest.fn() };
    const repository = new PostgresLoanRepository({ connect: jest.fn().mockResolvedValue(client) } as never);
    await repository.createWithInstallments(loanInput, [installment]);
    expect(client.query).toHaveBeenCalledWith('BEGIN');
    expect(client.query).toHaveBeenCalledWith('COMMIT');
    expect(client.query).not.toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });

  it('revierte la transacción si no se puede crear una cuota', async () => {
    const client = { query: jest.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('INSERT INTO loans')) return { rows: [row] };
      if (sql.includes('INSERT INTO installments')) throw new Error('fallo');
      return { rows: [] };
    }), release: jest.fn() };
    const repository = new PostgresLoanRepository({ connect: jest.fn().mockResolvedValue(client) } as never);
    await expect(repository.createWithInstallments(loanInput, [installment])).rejects.toThrow('fallo');
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });

  it('revierte préstamo y cuotas si falla el guardado de una garantía', async () => {
    const client = { query: jest.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('INSERT INTO loans')) return { rows: [row] };
      if (sql.includes('INSERT INTO loan_collateral_items')) throw new Error('fallo garantía');
      return { rows: [] };
    }), release: jest.fn() };
    const repository = new PostgresLoanRepository({ connect: jest.fn().mockResolvedValue(client) } as never);

    await expect(repository.createWithInstallments(loanInput, [installment], [collateral])).rejects.toThrow('fallo garantía');
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO installments'), expect.any(Array));
    expect(client.release).toHaveBeenCalled();
  });
});
