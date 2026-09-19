import { AppError } from '../../../shared/errors/app-error.js';

export const cashSessionStatuses = ['open', 'closed'] as const;
export type CashSessionStatus = (typeof cashSessionStatuses)[number];

export type CashSessionData = {
  id: string;
  openedByUserId: string;
  closedByUserId: string | null;
  openedAt: Date;
  closedAt: Date | null;
  openingAmount: string;
  cashIncomeTotal: string;
  expenseTotal: string;
  expectedClosingAmount: string;
  declaredClosingAmount: string | null;
  differenceAmount: string | null;
  status: CashSessionStatus;
  observations: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class CashSession {
  constructor(public readonly data: CashSessionData) {
    if (data.openingAmount.startsWith('-')) throw new AppError(422, 'INVALID_OPENING_AMOUNT', 'El monto inicial no puede ser negativo.');
  }
}
