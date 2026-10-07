import type { Installment } from './installment.js';
import type { LoanAccessScope } from '../../loans/domain/loan-repository.js';

export interface InstallmentRepository {
  findById(id: string, scope: LoanAccessScope): Promise<Installment | null>;
  findByLoanId(loanId: string, scope: LoanAccessScope): Promise<Installment[]>;
}
