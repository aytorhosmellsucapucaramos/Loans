import { AppError } from '../../../shared/errors/app-error.js';

export const paymentMethods = ['cash', 'bank_transfer', 'yape', 'plin', 'other'] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const paymentStatuses = ['registered', 'cancelled'] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export type PaymentData = {
  id: string;
  loanId: string;
  installmentId: string;
  amount: string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  operationReference: string | null;
  observations: string | null;
  registeredByUserId: string;
  status: PaymentStatus;
  createdAt: Date;
};

export class Payment {
  constructor(public readonly data: PaymentData) {
    if (data.amount === '0.00') {
      throw new AppError(422, 'INVALID_PAYMENT_AMOUNT', 'El monto pagado debe ser mayor que cero.');
    }
  }
}
