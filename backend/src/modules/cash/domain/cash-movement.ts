import { AppError } from '../../../shared/errors/app-error.js';

export const cashMovementTypes = ['income', 'expense', 'reversal'] as const;
export type CashMovementType = (typeof cashMovementTypes)[number];
export const cashMovementMethods = ['cash', 'bank_transfer', 'yape', 'plin', 'other'] as const;
export type CashMovementMethod = (typeof cashMovementMethods)[number];

export type CashMovementData = {
  id: string;
  cashSessionId: string;
  type: CashMovementType;
  amount: string;
  paymentMethod: CashMovementMethod;
  description: string;
  paymentId: string | null;
  createdByUserId: string;
  createdAt: Date;
};

export class CashMovement {
  constructor(public readonly data: CashMovementData) {
    if (data.amount === '0.00') throw new AppError(422, 'INVALID_CASH_MOVEMENT_AMOUNT', 'El monto del movimiento debe ser mayor que cero.');
  }
}
