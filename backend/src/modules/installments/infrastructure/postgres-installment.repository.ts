import type { Pool } from 'pg';

import { Installment, type InstallmentData } from '../domain/installment.js';
import type { InstallmentRepository } from '../domain/installment-repository.js';
import type { LoanAccessScope } from '../../loans/domain/loan-repository.js';

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
  async findById(id: string, scope: LoanAccessScope): Promise<Installment | null> {
    const ownership = scope.isAdmin ? '' : ' AND c.user_id = $2';
    const values = scope.isAdmin ? [id] : [id, scope.userId];
    const result = await this.database.query<InstallmentRow>(`SELECT i.* FROM installments i JOIN loans l ON l.id = i.loan_id JOIN customers c ON c.id = l.customer_id WHERE i.id = $1${ownership} LIMIT 1`, values);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }
  async findByLoanId(loanId: string, scope: LoanAccessScope): Promise<Installment[]> {
    const ownership = scope.isAdmin ? '' : ' AND c.user_id = $2';
    const values = scope.isAdmin ? [loanId] : [loanId, scope.userId];
    const result = await this.database.query<InstallmentRow>(`SELECT i.* FROM installments i JOIN loans l ON l.id = i.loan_id JOIN customers c ON c.id = l.customer_id WHERE i.loan_id = $1${ownership} ORDER BY i.installment_number ASC`, values);
    return result.rows.map(mapRow);
  }
}
