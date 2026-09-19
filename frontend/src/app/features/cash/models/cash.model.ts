export type CashSessionStatus = 'open' | 'closed';
export type CashMovementType = 'income' | 'expense' | 'reversal';
export type CashMovementMethod = 'cash' | 'bank_transfer' | 'yape' | 'plin' | 'other';

export interface CashSession {
  id: string; openedByUserId: string; closedByUserId: string | null; openedAt: string; closedAt: string | null;
  openingAmount: string; cashIncomeTotal: string; expenseTotal: string; expectedClosingAmount: string;
  declaredClosingAmount: string | null; differenceAmount: string | null; status: CashSessionStatus;
  observations: string | null; createdAt: string; updatedAt: string;
}

export interface CashMovement { id: string; cashSessionId: string; type: CashMovementType; amount: string; paymentMethod: CashMovementMethod; description: string; paymentId: string | null; createdByUserId: string; createdAt: string; }
export interface OpenCashPayload { openingAmount: number; observations?: string; }
export interface CashMovementPayload { amount: number; paymentMethod: CashMovementMethod; description: string; }
export interface CloseCashPayload { declaredClosingAmount: number; observations?: string; }
export interface CashHistoryQuery { page: number; pageSize: number; status?: CashSessionStatus; userId?: string; }
export interface CashHistoryPage { items: CashSession[]; pagination: { page: number; pageSize: number; total: number; totalPages: number }; }
