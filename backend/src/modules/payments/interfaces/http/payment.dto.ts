import type { PaymentMethod, PaymentStatus } from '../../domain/payment.js';

export type RegisterPaymentDto = {
  loanId: string;
  installmentId: string;
  amount: string | number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  operationReference?: string;
  observations?: string;
};
export type PaymentListQueryDto = { page: number; pageSize: number; loanId?: string; installmentId?: string; status?: PaymentStatus };
