import type { Pool, PoolClient } from 'pg';

import { AppError, notFound } from '../../../shared/errors/app-error.js';
import type { PaymentData, PaymentMethod, PaymentStatus } from '../domain/payment.js';
import { Payment } from '../domain/payment.js';
import type { PaymentAccessScope, PaymentListCriteria, PaymentPage, PaymentRepository, RegisterPaymentInput } from '../domain/payment-repository.js';
import type { CashPaymentMovementGateway } from '../../cash/infrastructure/cash-payment-movement.gateway.js';

type PaymentRow = {
  id: string; loan_id: string; installment_id: string; amount: string; payment_method: PaymentMethod; payment_date: Date | string;
  operation_reference: string | null; observations: string | null; registered_by_user_id: string; status: PaymentStatus; created_at: Date;
};
type LoanRow = { id: string; status: 'active' | 'cancelled' | 'paid' };
type InstallmentRow = { id: string; loan_id: string; scheduled_amount: string; outstanding_amount: string; status: 'pending' | 'paid' | 'overdue' };

const dateOnly = (value: Date | string): string => value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
const cents = (amount: string): bigint => {
  const [whole, decimal = ''] = amount.split('.');
  return BigInt(whole ?? '0') * 100n + BigInt(decimal.padEnd(2, '0').slice(0, 2));
};
const mapRow = (row: PaymentRow): Payment => new Payment({
  id: row.id, loanId: row.loan_id, installmentId: row.installment_id, amount: row.amount, paymentMethod: row.payment_method,
  paymentDate: dateOnly(row.payment_date), operationReference: row.operation_reference, observations: row.observations,
  registeredByUserId: row.registered_by_user_id, status: row.status, createdAt: row.created_at,
} satisfies PaymentData);

export class PostgresPaymentRepository implements PaymentRepository {
  constructor(private readonly database: Pool, private readonly cash: CashPaymentMovementGateway) {}

  async register(input: RegisterPaymentInput, scope: PaymentAccessScope): Promise<Payment> {
    const client = await this.database.connect();
    try {
      await client.query('BEGIN');
      const loan = await this.lockLoan(client, input.loanId, scope);
      if (loan.status === 'cancelled') throw new AppError(422, 'LOAN_CANCELLED', 'No se pueden registrar pagos en un préstamo cancelado.');
      const installment = await this.lockInstallment(client, input.installmentId);
      if (installment.loan_id !== loan.id) throw new AppError(422, 'INSTALLMENT_LOAN_MISMATCH', 'La cuota no pertenece al préstamo indicado.');
      if (installment.status === 'paid' || cents(installment.outstanding_amount) === 0n) throw new AppError(422, 'INSTALLMENT_ALREADY_PAID', 'La cuota ya se encuentra pagada.');
      const nextInstallment = await this.lockNextPendingInstallment(client, loan.id);
      if (!nextInstallment || nextInstallment.id !== installment.id) throw new AppError(422, 'INSTALLMENT_SEQUENCE_REQUIRED', 'Solo se puede registrar un pago en la primera cuota pendiente del préstamo.');
      await this.cash.requireOpenCashSession(client, input.registeredByUserId);
      const amountCents = cents(input.amount);
      if (amountCents > cents(installment.outstanding_amount)) throw new AppError(422, 'PAYMENT_EXCEEDS_OUTSTANDING', 'El pago no puede superar el saldo pendiente de la cuota.');
      if (input.operationReference) await this.assertReferenceIsUnique(client, input.installmentId, input.operationReference);
      const created = await client.query<PaymentRow>(
        `INSERT INTO payments (loan_id, installment_id, amount, payment_method, payment_date, operation_reference, observations, registered_by_user_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [input.loanId, input.installmentId, input.amount, input.paymentMethod, input.paymentDate, input.operationReference ?? null, input.observations ?? null, input.registeredByUserId],
      );
      if (input.paymentMethod === 'cash') await this.cash.registerPaymentIncome(client, { paymentId: created.rows[0]!.id, amount: input.amount, userId: input.registeredByUserId });
      await client.query(
        `UPDATE installments SET outstanding_amount = outstanding_amount - $1,
         status = CASE WHEN outstanding_amount - $1 = 0 THEN 'paid' ELSE 'pending' END
         WHERE id = $2`, [input.amount, input.installmentId],
      );
      await this.markLoanPaidIfComplete(client, input.loanId);
      await client.query('COMMIT');
      return mapRow(created.rows[0]!);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string, scope: PaymentAccessScope): Promise<Payment | null> {
    const ownership = scope.isAdmin ? '' : ' AND c.user_id = $2';
    const values = scope.isAdmin ? [id] : [id, scope.userId];
    const result = await this.database.query<PaymentRow>(`SELECT p.* FROM payments p JOIN loans l ON l.id = p.loan_id JOIN customers c ON c.id = l.customer_id WHERE p.id = $1${ownership} LIMIT 1`, values);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async findPage(criteria: PaymentListCriteria, scope: PaymentAccessScope): Promise<PaymentPage> {
    const where: string[] = []; const values: unknown[] = [];
    const add = (column: string, value: unknown): void => { values.push(value); where.push(`${column} = $${values.length}`); };
    if (!scope.isAdmin) add('c.user_id', scope.userId);
    if (criteria.loanId) add('p.loan_id', criteria.loanId);
    if (criteria.installmentId) add('p.installment_id', criteria.installmentId);
    if (criteria.status) add('p.status', criteria.status);
    const condition = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (criteria.page - 1) * criteria.pageSize;
    const [items, count] = await Promise.all([
      this.database.query<PaymentRow>(`SELECT p.* FROM payments p JOIN loans l ON l.id = p.loan_id JOIN customers c ON c.id = l.customer_id ${condition} ORDER BY p.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, criteria.pageSize, offset]),
      this.database.query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM payments p JOIN loans l ON l.id = p.loan_id JOIN customers c ON c.id = l.customer_id ${condition}`, values),
    ]);
    const total = Number(count.rows[0]?.total ?? 0);
    return { items: items.rows.map(mapRow), total, page: criteria.page, pageSize: criteria.pageSize, totalPages: Math.ceil(total / criteria.pageSize) };
  }

  async findByLoanId(loanId: string, scope: PaymentAccessScope): Promise<Payment[]> {
    const ownership = scope.isAdmin ? '' : ' AND c.user_id = $2';
    const values = scope.isAdmin ? [loanId] : [loanId, scope.userId];
    const result = await this.database.query<PaymentRow>(`SELECT p.* FROM payments p JOIN loans l ON l.id = p.loan_id JOIN customers c ON c.id = l.customer_id WHERE p.loan_id = $1${ownership} ORDER BY p.payment_date DESC, p.created_at DESC`, values);
    return result.rows.map(mapRow);
  }

  async findByInstallmentId(installmentId: string, scope: PaymentAccessScope): Promise<Payment[]> {
    const ownership = scope.isAdmin ? '' : ' AND c.user_id = $2';
    const values = scope.isAdmin ? [installmentId] : [installmentId, scope.userId];
    const result = await this.database.query<PaymentRow>(`SELECT p.* FROM payments p JOIN loans l ON l.id = p.loan_id JOIN customers c ON c.id = l.customer_id WHERE p.installment_id = $1${ownership} ORDER BY p.payment_date DESC, p.created_at DESC`, values);
    return result.rows.map(mapRow);
  }

  async cancel(id: string, cancelledByUserId: string, scope: PaymentAccessScope): Promise<Payment> {
    const client = await this.database.connect();
    try {
      await client.query('BEGIN');
      const ownership = scope.isAdmin ? '' : ' AND c.user_id = $2';
      const paymentValues = scope.isAdmin ? [id] : [id, scope.userId];
      const paymentResult = await client.query<PaymentRow>(`SELECT p.* FROM payments p JOIN loans l ON l.id = p.loan_id JOIN customers c ON c.id = l.customer_id WHERE p.id = $1${ownership} FOR UPDATE OF p`, paymentValues);
      const payment = paymentResult.rows[0];
      if (!payment) throw notFound('Pago');
      if (payment.status === 'cancelled') throw new AppError(422, 'PAYMENT_ALREADY_CANCELLED', 'El pago ya fue anulado.');
      const loan = await this.lockLoan(client, payment.loan_id, scope);
      const installment = await this.lockInstallment(client, payment.installment_id);
      if (payment.payment_method === 'cash') await this.cash.registerPaymentReversal(client, { paymentId: payment.id, amount: payment.amount, userId: cancelledByUserId });
      await client.query("UPDATE payments SET status = 'cancelled' WHERE id = $1", [id]);
      await client.query(
        `UPDATE installments SET outstanding_amount = outstanding_amount + $1,
         status = CASE WHEN outstanding_amount + $1 = scheduled_amount THEN 'pending' ELSE 'pending' END
         WHERE id = $2`, [payment.amount, installment.id],
      );
      if (loan.status === 'paid') await client.query("UPDATE loans SET status = 'active', updated_at = NOW() WHERE id = $1", [loan.id]);
      await client.query('COMMIT');
      return mapRow({ ...payment, status: 'cancelled' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async lockLoan(client: PoolClient, id: string, scope: PaymentAccessScope): Promise<LoanRow> {
    const ownership = scope.isAdmin ? '' : ' AND c.user_id = $2';
    const values = scope.isAdmin ? [id] : [id, scope.userId];
    const result = await client.query<LoanRow>(`SELECT l.id, l.status FROM loans l JOIN customers c ON c.id = l.customer_id WHERE l.id = $1${ownership} FOR UPDATE OF l`, values);
    if (!result.rows[0]) throw new AppError(404, 'LOAN_NOT_FOUND', 'El préstamo no fue encontrado.');
    return result.rows[0];
  }

  private async lockInstallment(client: PoolClient, id: string): Promise<InstallmentRow> {
    const result = await client.query<InstallmentRow>('SELECT id, loan_id, scheduled_amount, outstanding_amount, status FROM installments WHERE id = $1 FOR UPDATE', [id]);
    if (!result.rows[0]) throw new AppError(404, 'INSTALLMENT_NOT_FOUND', 'La cuota no fue encontrada.');
    return result.rows[0];
  }

  private async lockNextPendingInstallment(client: PoolClient, loanId: string): Promise<InstallmentRow | null> {
    const result = await client.query<InstallmentRow>(
      `SELECT id, loan_id, scheduled_amount, outstanding_amount, status
       FROM installments
       WHERE loan_id = $1 AND outstanding_amount > 0
       ORDER BY installment_number ASC
       LIMIT 1 FOR UPDATE`,
      [loanId],
    );
    return result.rows[0] ?? null;
  }

  private async assertReferenceIsUnique(client: PoolClient, installmentId: string, reference: string): Promise<void> {
    const duplicate = await client.query('SELECT 1 FROM payments WHERE installment_id = $1 AND operation_reference = $2 AND status = $3 LIMIT 1 FOR UPDATE', [installmentId, reference, 'registered']);
    if (duplicate.rows[0]) throw new AppError(409, 'DUPLICATE_PAYMENT', 'Ya existe un pago activo con esa referencia de operación para la cuota.');
  }

  private async markLoanPaidIfComplete(client: PoolClient, loanId: string): Promise<void> {
    const outstanding = await client.query<{ total: string }>('SELECT COUNT(*)::text AS total FROM installments WHERE loan_id = $1 AND outstanding_amount > 0', [loanId]);
    if (Number(outstanding.rows[0]?.total ?? 0) === 0) await client.query("UPDATE loans SET status = 'paid', updated_at = NOW() WHERE id = $1", [loanId]);
  }
}
