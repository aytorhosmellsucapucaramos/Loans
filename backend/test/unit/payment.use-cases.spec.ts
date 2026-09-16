import { AppError } from '../../src/shared/errors/app-error.js';
import { CancelPaymentUseCase, GetPaymentUseCase, ListPaymentsUseCase, RegisterPaymentUseCase } from '../../src/modules/payments/application/payment.use-cases.js';
import { Payment } from '../../src/modules/payments/domain/payment.js';
import type { PaymentRepository } from '../../src/modules/payments/domain/payment-repository.js';

const data = { id: 'payment-1', loanId: 'loan-1', installmentId: 'installment-1', amount: '50.00', paymentMethod: 'cash' as const, paymentDate: '2026-09-15', operationReference: null, observations: null, registeredByUserId: 'user-1', status: 'registered' as const, createdAt: new Date() };
const payment = (overrides: Partial<typeof data> = {}) => new Payment({ ...data, ...overrides });

describe('casos de uso de pagos', () => {
  const payments: PaymentRepository = {
    register: jest.fn(), findById: jest.fn(), findPage: jest.fn(), findByLoanId: jest.fn(), findByInstallmentId: jest.fn(), cancel: jest.fn(),
  };
  const audit = { record: jest.fn() };
  const register = new RegisterPaymentUseCase(payments, audit);

  beforeEach(() => {
    jest.clearAllMocks();
    (payments.register as jest.Mock).mockResolvedValue(payment());
  });

  it('normaliza el importe, registra el actor y audita un pago válido', async () => {
    const result = await register.execute({ loanId: 'loan-1', installmentId: 'installment-1', amount: '50', paymentMethod: 'cash', paymentDate: '2026-09-15', observations: '  parcial ' }, 'user-1');
    expect(result.amount).toBe('50.00');
    expect(payments.register).toHaveBeenCalledWith(expect.objectContaining({ amount: '50.00', registeredByUserId: 'user-1', observations: 'parcial' }));
    expect(audit.record).toHaveBeenCalledWith('payment.registered', 'user-1', 'payment-1');
  });

  it.each([
    ['cero', '0', 'INVALID_PAYMENT_AMOUNT'],
    ['negativo', '-1', 'INVALID_MONETARY_VALUE'],
    ['fecha inválida', '50', 'INVALID_PAYMENT_DATE'],
  ])('rechaza pago %s', async (label, amount, code) => {
    const date = label === 'fecha inválida' ? 'invalid' : '2026-09-15';
    await expect(register.execute({ loanId: 'loan-1', installmentId: 'installment-1', amount, paymentMethod: 'cash', paymentDate: date }, 'user-1')).rejects.toMatchObject<AppError>({ code });
  });

  it('propaga reglas transaccionales del repositorio para cuota, préstamo, duplicidad y saldo', async () => {
    for (const code of ['INSTALLMENT_NOT_FOUND', 'INSTALLMENT_LOAN_MISMATCH', 'LOAN_CANCELLED', 'INSTALLMENT_ALREADY_PAID', 'PAYMENT_EXCEEDS_OUTSTANDING', 'DUPLICATE_PAYMENT']) {
      (payments.register as jest.Mock).mockRejectedValueOnce(new AppError(code === 'DUPLICATE_PAYMENT' ? 409 : 422, code, 'regla'));
      await expect(register.execute({ loanId: 'loan-1', installmentId: 'installment-1', amount: '50', paymentMethod: 'cash', paymentDate: '2026-09-15' }, 'user-1')).rejects.toMatchObject<AppError>({ code });
    }
  });

  it('consulta, pagina y anula sin eliminar el pago', async () => {
    (payments.findById as jest.Mock).mockResolvedValue(payment());
    (payments.findPage as jest.Mock).mockResolvedValue({ items: [payment()], total: 1, page: 1, pageSize: 20, totalPages: 1 });
    (payments.cancel as jest.Mock).mockResolvedValue(payment({ status: 'cancelled' }));
    await expect(new GetPaymentUseCase(payments).execute('payment-1')).resolves.toMatchObject({ id: 'payment-1' });
    await expect(new ListPaymentsUseCase(payments).execute({ page: 1, pageSize: 20 })).resolves.toMatchObject({ pagination: { total: 1 } });
    await expect(new CancelPaymentUseCase(payments, audit).execute('payment-1', 'user-1')).resolves.toMatchObject({ status: 'cancelled' });
    expect(audit.record).toHaveBeenCalledWith('payment.cancelled', 'user-1', 'payment-1');
  });
});
