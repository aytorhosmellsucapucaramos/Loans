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

export type CollateralCustodyStatus = 'in_custody' | 'returned';

export interface LoanCollateralPayload {
  description: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  physicalCondition: string;
  estimatedValue: number;
  notes?: string;
  receivedAt: string;
}

export interface LoanCollateralItem {
  id: string;
  loanId: string;
  description: string;
  category: string;
  estimatedValue: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  physicalCondition: string;
  receivedAt: string;
  notes: string | null;
  custodyStatus: CollateralCustodyStatus;
  returnedAt: string | null;
  returnedBy: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoanPreviewInstallment {
  installmentNumber: number;
  dueDate: string;
  principalAmount: string;
  interestAmount: string;
  scheduledAmount: string;
  outstandingAmount: string;
  status: 'pending';
}

export interface LoanPreview {
  customerId: string;
  principalAmount: string;
  interestRate: string;
  interestType: InterestType;
  paymentFrequency: PaymentFrequency;
  installmentCount: number;
  disbursementDate: string;
  firstInstallmentDate: string;
  totalInterestAmount: string;
  totalAmount: string;
  installments: LoanPreviewInstallment[];
}

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
  collateralItems?: LoanCollateralPayload[];
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
