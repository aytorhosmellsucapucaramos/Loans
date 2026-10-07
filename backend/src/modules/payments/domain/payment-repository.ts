import type { Payment, PaymentData, PaymentMethod, PaymentStatus } from './payment.js';

export type RegisterPaymentInput = {
  loanId: string;
  installmentId: string;
  amount: string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  operationReference?: string | null;
  observations?: string | null;
  registeredByUserId: string;
};

export type PaymentListCriteria = {
  page: number;
  pageSize: number;
  loanId?: string;
  installmentId?: string;
  status?: PaymentStatus;
};
export type PaymentAccessScope = { userId: string; isAdmin: boolean };

export type PaymentPage = { items: Payment[]; total: number; page: number; pageSize: number; totalPages: number };

export interface PaymentRepository {
  register(input: RegisterPaymentInput, scope: PaymentAccessScope): Promise<Payment>;
  findById(id: string, scope: PaymentAccessScope): Promise<Payment | null>;
  findPage(criteria: PaymentListCriteria, scope: PaymentAccessScope): Promise<PaymentPage>;
  findByLoanId(loanId: string, scope: PaymentAccessScope): Promise<Payment[]>;
  findByInstallmentId(installmentId: string, scope: PaymentAccessScope): Promise<Payment[]>;
  cancel(id: string, cancelledByUserId: string, scope: PaymentAccessScope): Promise<Payment>;
}

export type { PaymentData };
