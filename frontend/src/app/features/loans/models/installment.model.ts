export type InstallmentStatus = 'pending' | 'paid' | 'overdue';

export interface Installment {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: string;
  interestAmount: string;
  scheduledAmount: string;
  outstandingAmount: string;
  status: InstallmentStatus;
  createdAt: string;
}
