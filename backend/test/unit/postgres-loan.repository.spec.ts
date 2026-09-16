import { PostgresLoanRepository } from '../../src/modules/loans/infrastructure/postgres-loan.repository.js';

const loanInput = { customerId: '55555555-5555-4555-8555-555555555555', principalAmount: '1000.00', interestRate: '10.0000', interestType: 'simple' as const, paymentFrequency: 'monthly' as const, installmentCount: 1, disbursementDate: '2026-01-01', firstInstallmentDate: '2026-02-01', totalAmount: '1100.00', observations: null };
const installment = { loanId: '', installmentNumber: 1, dueDate: '2026-02-01', principalAmount: '1000.00', interestAmount: '100.00', scheduledAmount: '1100.00', outstandingAmount: '1100.00', status: 'pending' as const };
const row = { id: '44444444-4444-4444-4444-444444444444', customer_id: loanInput.customerId, principal_amount: '1000.00', interest_rate: '10.0000', interest_type: 'simple', payment_frequency: 'monthly', installment_count: 1, disbursement_date: '2026-01-01', first_installment_date: '2026-02-01', total_amount: '1100.00', status: 'active', observations: null, created_at: new Date(), updated_at: new Date() };

describe('PostgresLoanRepository', () => {
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
});
