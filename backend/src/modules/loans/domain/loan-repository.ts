import type { PaymentFrequency } from '../../installments/domain/payment-frequency.js';
import type { NewInstallment } from '../../installments/domain/installment.js';
import type { InterestType } from '../../interest/domain/interest-calculation.strategy.js';
import type { Loan, LoanStatus } from './loan.js';

export type CreateLoanInput = {
  customerId: string;
  principalAmount: string | number;
  interestRate: string | number;
  interestType: InterestType;
  paymentFrequency: PaymentFrequency;
  installmentCount: number;
  disbursementDate: string;
  firstInstallmentDate: string;
  observations?: string | null;
};

export type PersistedLoanInput = Omit<CreateLoanInput, 'principalAmount' | 'interestRate'> & {
  principalAmount: string;
  interestRate: string;
  totalAmount: string;
};

export type LoanListCriteria = {
  page: number;
  pageSize: number;
  customerId?: string;
  status?: LoanStatus;
  search?: string;
};

export type LoanPage = { items: Loan[]; total: number; page: number; pageSize: number; totalPages: number };

export interface LoanRepository {
  createWithInstallments(input: PersistedLoanInput, installments: NewInstallment[]): Promise<Loan>;
  findById(id: string): Promise<Loan | null>;
  findPage(criteria: LoanListCriteria): Promise<LoanPage>;
  updateStatus(id: string, status: LoanStatus): Promise<Loan | null>;
}
