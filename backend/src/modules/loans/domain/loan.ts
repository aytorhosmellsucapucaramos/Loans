import { AppError } from '../../../shared/errors/app-error.js';
import type { InterestType } from '../../interest/domain/interest-calculation.strategy.js';
import type { PaymentFrequency } from '../../installments/domain/payment-frequency.js';

export const loanStatuses = ['active', 'cancelled', 'paid'] as const;
export type LoanStatus = (typeof loanStatuses)[number];
export const manuallySettableLoanStatuses = ['active', 'cancelled'] as const;

export type LoanCustomerSummary = {
  id: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
};

export type LoanData = {
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
  createdAt: Date;
  updatedAt: Date;
};

export class Loan {
  constructor(public readonly data: LoanData) {
    if (data.installmentCount < 1 || data.totalAmount === '0.00') {
      throw new AppError(422, 'INVALID_LOAN', 'Los datos del préstamo no cumplen las reglas del dominio.');
    }
  }
}
