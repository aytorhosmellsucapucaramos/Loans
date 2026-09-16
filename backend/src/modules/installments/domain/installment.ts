import { AppError } from '../../../shared/errors/app-error.js';

export const installmentStatuses = ['pending', 'paid', 'overdue'] as const;
export type InstallmentStatus = (typeof installmentStatuses)[number];

export type InstallmentData = {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: string;
  interestAmount: string;
  scheduledAmount: string;
  outstandingAmount: string;
  status: InstallmentStatus;
  createdAt: Date;
};

export type NewInstallment = Omit<InstallmentData, 'id' | 'createdAt'>;

export class Installment {
  constructor(public readonly data: InstallmentData) {
    if (data.installmentNumber < 1) throw new AppError(422, 'INVALID_INSTALLMENT', 'El número de cuota debe ser mayor que cero.');
  }
}
