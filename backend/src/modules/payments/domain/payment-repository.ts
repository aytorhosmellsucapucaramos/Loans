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

export type PaymentPage = { items: Payment[]; total: number; page: number; pageSize: number; totalPages: number };

export interface PaymentRepository {
  register(input: RegisterPaymentInput): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findPage(criteria: PaymentListCriteria): Promise<PaymentPage>;
  findByLoanId(loanId: string): Promise<Payment[]>;
  findByInstallmentId(installmentId: string): Promise<Payment[]>;
  cancel(id: string, cancelledByUserId: string): Promise<Payment>;
}

export type { PaymentData };
