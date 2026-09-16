import type { Pool, PoolClient } from 'pg';

import type { NewInstallment } from '../../installments/domain/installment.js';
import type { PersistedLoanInput, LoanListCriteria, LoanPage, LoanRepository } from '../domain/loan-repository.js';
import { Loan, type LoanData, type LoanStatus } from '../domain/loan.js';

type LoanRow = {
  id: string; customer_id: string; principal_amount: string; interest_rate: string; interest_type: 'simple'; payment_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  installment_count: number; disbursement_date: Date | string; first_installment_date: Date | string; total_amount: string; status: LoanStatus; observations: string | null; created_at: Date; updated_at: Date;
};

const dateOnly = (value: Date | string): string => value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
const mapRow = (row: LoanRow): Loan => new Loan({
  id: row.id, customerId: row.customer_id, principalAmount: row.principal_amount, interestRate: row.interest_rate, interestType: row.interest_type,
  paymentFrequency: row.payment_frequency, installmentCount: row.installment_count, disbursementDate: dateOnly(row.disbursement_date), firstInstallmentDate: dateOnly(row.first_installment_date),
  totalAmount: row.total_amount, status: row.status, observations: row.observations, createdAt: row.created_at, updatedAt: row.updated_at,
} satisfies LoanData);

export class PostgresLoanRepository implements LoanRepository {
  constructor(private readonly database: Pool) {}

  async createWithInstallments(input: PersistedLoanInput, installments: NewInstallment[]): Promise<Loan> {
    if (!installments.length) throw new Error('Un préstamo requiere al menos una cuota.');
    const client = await this.database.connect();
    try {
      await client.query('BEGIN');
      const created = await client.query<LoanRow>(
        `INSERT INTO loans (customer_id, principal_amount, interest_rate, interest_type, payment_frequency, installment_count, disbursement_date, first_installment_date, total_amount, observations)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [input.customerId, input.principalAmount, input.interestRate, input.interestType, input.paymentFrequency, input.installmentCount, input.disbursementDate, input.firstInstallmentDate, input.totalAmount, input.observations ?? null],
      );
      const loan = created.rows[0]!;
      for (const installment of installments) await this.insertInstallment(client, loan.id, installment);
      await client.query('COMMIT');
      return mapRow(loan);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<Loan | null> {
    const result = await this.database.query<LoanRow>('SELECT * FROM loans WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async findPage(criteria: LoanListCriteria): Promise<LoanPage> {
    const where: string[] = [];
    const values: unknown[] = [];
    const add = (expression: string, value: unknown): void => { values.push(value); where.push(`${expression} $${values.length}`); };
    if (criteria.customerId) add('l.customer_id =', criteria.customerId);
    if (criteria.status) add('l.status =', criteria.status);
    if (criteria.search) {
      values.push(`%${criteria.search}%`);
      const index = values.length;
      where.push(`(c.first_name ILIKE $${index} OR c.last_name ILIKE $${index} OR c.document_number ILIKE $${index} OR l.id::text ILIKE $${index})`);
    }
    const condition = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (criteria.page - 1) * criteria.pageSize;
    const [items, count] = await Promise.all([
      this.database.query<LoanRow>(`SELECT l.* FROM loans l JOIN customers c ON c.id = l.customer_id ${condition} ORDER BY l.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, criteria.pageSize, offset]),
      this.database.query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM loans l JOIN customers c ON c.id = l.customer_id ${condition}`, values),
    ]);
    const total = Number(count.rows[0]?.total ?? 0);
    return { items: items.rows.map(mapRow), total, page: criteria.page, pageSize: criteria.pageSize, totalPages: Math.ceil(total / criteria.pageSize) };
  }

  async updateStatus(id: string, status: LoanStatus): Promise<Loan | null> {
    const result = await this.database.query<LoanRow>('UPDATE loans SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id]);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  private async insertInstallment(client: PoolClient, loanId: string, installment: NewInstallment): Promise<void> {
    await client.query(
      `INSERT INTO installments (loan_id, installment_number, due_date, principal_amount, interest_amount, scheduled_amount, outstanding_amount, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [loanId, installment.installmentNumber, installment.dueDate, installment.principalAmount, installment.interestAmount, installment.scheduledAmount, installment.outstandingAmount, installment.status],
    );
  }
}
