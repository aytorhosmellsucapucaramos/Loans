import type { Installment } from './installment.js';

export interface InstallmentRepository {
  findById(id: string): Promise<Installment | null>;
  findByLoanId(loanId: string): Promise<Installment[]>;
}
