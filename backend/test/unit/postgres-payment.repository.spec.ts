import { AppError } from '../../src/shared/errors/app-error.js';
import { PostgresPaymentRepository } from '../../src/modules/payments/infrastructure/postgres-payment.repository.js';

const paymentRow = { id: 'payment-1', loan_id: 'loan-1', installment_id: 'installment-1', amount: '50.00', payment_method: 'cash' as const, payment_date: '2026-09-15', operation_reference: 'REF-1', observations: null, registered_by_user_id: 'user-1', status: 'registered' as const, created_at: new Date() };

const createDatabase = (responses: Array<{ rows: unknown[] }>) => {
  const client = { query: jest.fn().mockImplementation(() => Promise.resolve(responses.shift() ?? { rows: [] })), release: jest.fn() };
  return { database: { connect: jest.fn().mockResolvedValue(client) }, client };
};

describe('PostgresPaymentRepository', () => {
  const input = { loanId: 'loan-1', installmentId: 'installment-1', amount: '50.00', paymentMethod: 'cash' as const, paymentDate: '2026-09-15', operationReference: 'REF-1', registeredByUserId: 'user-1' };
  const cash = { registerPaymentIncome: jest.fn(), registerPaymentReversal: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('registra y actualiza cuota y préstamo dentro de una sola transacción', async () => {
    const { database, client } = createDatabase([
      { rows: [] }, { rows: [{ id: 'loan-1', status: 'active' }] }, { rows: [{ id: 'installment-1', loan_id: 'loan-1', scheduled_amount: '50.00', outstanding_amount: '50.00', status: 'pending' }] },
      { rows: [] }, { rows: [paymentRow] }, { rows: [] }, { rows: [{ total: '0' }] }, { rows: [] }, { rows: [] },
    ]);
    const result = await new PostgresPaymentRepository(database as never, cash).register(input);
    expect(result.data).toMatchObject({ id: 'payment-1', status: 'registered', amount: '50.00' });
    const statements = client.query.mock.calls.map(([sql]) => String(sql));
    expect(statements).toEqual(expect.arrayContaining([expect.stringContaining('BEGIN'), expect.stringContaining('INSERT INTO payments'), expect.stringContaining('UPDATE installments SET outstanding_amount'), expect.stringContaining("status = 'paid'"), expect.stringContaining('COMMIT')]));
    expect(client.release).toHaveBeenCalled();
    expect(cash.registerPaymentIncome).toHaveBeenCalledWith(client, expect.objectContaining({ paymentId: 'payment-1', amount: '50.00' }));
  });

  it('hace rollback si una cuota no existe y no inserta el pago', async () => {
    const { database, client } = createDatabase([{ rows: [] }, { rows: [{ id: 'loan-1', status: 'active' }] }, { rows: [] }, { rows: [] }]);
    await expect(new PostgresPaymentRepository(database as never, cash).register(input)).rejects.toMatchObject<AppError>({ code: 'INSTALLMENT_NOT_FOUND' });
    const statements = client.query.mock.calls.map(([sql]) => String(sql));
    expect(statements).toEqual(expect.arrayContaining([expect.stringContaining('BEGIN'), expect.stringContaining('ROLLBACK')]));
    expect(statements.some((sql) => sql.includes('INSERT INTO payments'))).toBe(false);
  });

  it('no crea movimiento físico para un cobro no efectivo', async () => {
    const { database } = createDatabase([
      { rows: [] }, { rows: [{ id: 'loan-1', status: 'active' }] }, { rows: [{ id: 'installment-1', loan_id: 'loan-1', scheduled_amount: '50.00', outstanding_amount: '50.00', status: 'pending' }] }, { rows: [] }, { rows: [{ ...paymentRow, payment_method: 'yape' }] }, { rows: [] }, { rows: [{ total: '1' }] }, { rows: [] },
    ]);
    await new PostgresPaymentRepository(database as never, cash).register({ ...input, paymentMethod: 'yape' });
    expect(cash.registerPaymentIncome).not.toHaveBeenCalled();
  });

  it('anula sin borrar y devuelve el préstamo pagado a activo cuando corresponde', async () => {
    const { database, client } = createDatabase([
      { rows: [] }, { rows: [paymentRow] }, { rows: [{ id: 'loan-1', status: 'paid' }] }, { rows: [{ id: 'installment-1', loan_id: 'loan-1', scheduled_amount: '50.00', outstanding_amount: '0.00', status: 'paid' }] }, { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] },
    ]);
    cash.registerPaymentReversal.mockResolvedValue(undefined);
    const result = await new PostgresPaymentRepository(database as never, cash).cancel('payment-1', 'user-1');
    expect(result.data.status).toBe('cancelled');
    const statements = client.query.mock.calls.map(([sql]) => String(sql));
    expect(statements).toEqual(expect.arrayContaining([expect.stringContaining("UPDATE payments SET status = 'cancelled'"), expect.stringContaining('outstanding_amount = outstanding_amount +'), expect.stringContaining("SET status = 'active'"), expect.stringContaining('COMMIT')]));
    expect(cash.registerPaymentReversal).toHaveBeenCalledWith(client, expect.objectContaining({ paymentId: 'payment-1' }));
  });

  it('revierte todo el pago si el movimiento de caja falla', async () => {
    const { database, client } = createDatabase([
      { rows: [] }, { rows: [{ id: 'loan-1', status: 'active' }] }, { rows: [{ id: 'installment-1', loan_id: 'loan-1', scheduled_amount: '50.00', outstanding_amount: '50.00', status: 'pending' }] }, { rows: [] }, { rows: [paymentRow] }, { rows: [] },
    ]);
    cash.registerPaymentIncome.mockRejectedValueOnce(new AppError(422, 'CASH_SESSION_REQUIRED', 'Sin caja'));
    await expect(new PostgresPaymentRepository(database as never, cash).register(input)).rejects.toMatchObject<AppError>({ code: 'CASH_SESSION_REQUIRED' });
    expect(client.query.mock.calls.map(([sql]) => String(sql))).toEqual(expect.arrayContaining([expect.stringContaining('ROLLBACK')]));
  });
});
