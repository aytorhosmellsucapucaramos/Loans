export type PaymentMethod = 'cash' | 'bank_transfer' | 'yape' | 'plin' | 'other';
export type PaymentStatus = 'registered' | 'cancelled';

export interface Payment {
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
  createdAt: string;
}

export interface CreatePaymentPayload {
  loanId: string;
  installmentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  operationReference?: string;
  observations?: string;
}

export interface PaymentsQuery {
  page: number;
  pageSize: number;
  loanId?: string;
  installmentId?: string;
  status?: PaymentStatus;
}

export interface PaymentsPage {
  items: Payment[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}
