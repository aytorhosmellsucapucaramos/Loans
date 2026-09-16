import { AppError, notFound } from '../../../shared/errors/app-error.js';
import { amountToCents, centsToAmount } from '../../interest/domain/monetary-value.js';
import type { PaymentAuditLogger } from '../domain/payment-audit-logger.js';
import type { PaymentData } from '../domain/payment.js';
import type { PaymentListCriteria, PaymentPage, PaymentRepository, RegisterPaymentInput } from '../domain/payment-repository.js';

const validDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());

export class ListPaymentsUseCase {
  constructor(private readonly payments: PaymentRepository) {}
  async execute(criteria: PaymentListCriteria): Promise<{ items: PaymentData[]; pagination: Omit<PaymentPage, 'items'> }> {
    const page = await this.payments.findPage(criteria);
    return { items: page.items.map((item) => item.data), pagination: { page: page.page, pageSize: page.pageSize, total: page.total, totalPages: page.totalPages } };
  }
}

export class GetPaymentUseCase {
  constructor(private readonly payments: PaymentRepository) {}
  async execute(id: string): Promise<PaymentData> {
    const payment = await this.payments.findById(id);
    if (!payment) throw notFound('Pago');
    return payment.data;
  }
}

export class RegisterPaymentUseCase {
  constructor(private readonly payments: PaymentRepository, private readonly audit: PaymentAuditLogger) {}
  async execute(input: Omit<RegisterPaymentInput, 'amount' | 'registeredByUserId'> & { amount: string | number }, actorId: string): Promise<PaymentData> {
    if (!validDate(input.paymentDate)) throw new AppError(422, 'INVALID_PAYMENT_DATE', 'La fecha de pago no es válida.');
    const amount = amountToCents(input.amount);
    if (amount <= 0n) throw new AppError(422, 'INVALID_PAYMENT_AMOUNT', 'El monto pagado debe ser mayor que cero.');
    const payment = await this.payments.register({
      ...input, amount: centsToAmount(amount), operationReference: input.operationReference?.trim() || null,
      observations: input.observations?.trim() || null, registeredByUserId: actorId,
    });
    this.audit.record('payment.registered', actorId, payment.data.id);
    return payment.data;
  }
}

export class CancelPaymentUseCase {
  constructor(private readonly payments: PaymentRepository, private readonly audit: PaymentAuditLogger) {}
  async execute(id: string, actorId: string): Promise<PaymentData> {
    const payment = await this.payments.cancel(id);
    this.audit.record('payment.cancelled', actorId, payment.data.id);
    return payment.data;
  }
}

export class ListLoanPaymentsUseCase {
  constructor(private readonly payments: PaymentRepository) {}
  async execute(loanId: string): Promise<PaymentData[]> { return (await this.payments.findByLoanId(loanId)).map((item) => item.data); }
}

export class ListInstallmentPaymentsUseCase {
  constructor(private readonly payments: PaymentRepository) {}
  async execute(installmentId: string): Promise<PaymentData[]> { return (await this.payments.findByInstallmentId(installmentId)).map((item) => item.data); }
}
