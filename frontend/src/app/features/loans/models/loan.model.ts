import type { Installment } from './installment.model';

export type LoanStatus = 'active' | 'cancelled' | 'paid';
export type InterestType = 'simple';
export type PaymentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface LoanCustomerSummary {
  id: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
}

export interface Loan {
  id: string;
  customerId: string;
  principalAmount: string;
  interestRate: string;
  interestType: InterestType;
  paymentFrequency: PaymentFrequency;
  installmentCount: number;
  disbursementDate: string;
  firstInstallmentDate: string;
  totalAmount: string;
  status: LoanStatus;
  observations: string | null;
  customer?: LoanCustomerSummary;
  createdAt: string;
  updatedAt: string;
}

export interface LoanDetail extends Loan { installments: Installment[]; }

export interface CreateLoanPayload {
  customerId: string;
  principalAmount: number;
  interestRate: number;
  interestType: InterestType;
  paymentFrequency: PaymentFrequency;
  installmentCount: number;
  disbursementDate: string;
  firstInstallmentDate: string;
  observations?: string;
}

export interface LoansQuery {
  page: number;
  pageSize: number;
  customerId?: string;
  status?: LoanStatus;
  search?: string;
}

export interface LoansPage {
  items: Loan[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number; };
}
