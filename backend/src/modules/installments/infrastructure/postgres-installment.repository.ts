import type { Pool } from 'pg';

import { Installment, type InstallmentData } from '../domain/installment.js';
import type { InstallmentRepository } from '../domain/installment-repository.js';

type InstallmentRow = {
  id: string; loan_id: string; installment_number: number; due_date: Date | string; principal_amount: string; interest_amount: string;
  scheduled_amount: string; outstanding_amount: string; status: 'pending' | 'paid' | 'overdue'; created_at: Date;
};
const dateOnly = (value: Date | string): string => value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
const mapRow = (row: InstallmentRow): Installment => new Installment({
  id: row.id, loanId: row.loan_id, installmentNumber: row.installment_number, dueDate: dateOnly(row.due_date), principalAmount: row.principal_amount,
  interestAmount: row.interest_amount, scheduledAmount: row.scheduled_amount, outstandingAmount: row.outstanding_amount, status: row.status, createdAt: row.created_at,
} satisfies InstallmentData);

export class PostgresInstallmentRepository implements InstallmentRepository {
  constructor(private readonly database: Pool) {}
  async findById(id: string): Promise<Installment | null> {
    const result = await this.database.query<InstallmentRow>('SELECT * FROM installments WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }
  async findByLoanId(loanId: string): Promise<Installment[]> {
    const result = await this.database.query<InstallmentRow>('SELECT * FROM installments WHERE loan_id = $1 ORDER BY installment_number ASC', [loanId]);
    return result.rows.map(mapRow);
  }
}
