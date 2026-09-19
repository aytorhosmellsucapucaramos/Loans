import type { CashMovement, CashMovementData, CashMovementMethod, CashMovementType } from './cash-movement.js';
import type { CashSession, CashSessionData } from './cash-session.js';

export type OpenCashSessionInput = { openingAmount: string; observations?: string | null; openedByUserId: string };
export type CreateCashMovementInput = { cashSessionId: string; type: Exclude<CashMovementType, 'reversal'>; amount: string; paymentMethod: CashMovementMethod; description: string; createdByUserId: string };
export type CloseCashSessionInput = { declaredClosingAmount: string; observations?: string | null; closedByUserId: string };
export type CashHistoryCriteria = { page: number; pageSize: number; status?: 'open' | 'closed'; userId?: string };
export type CashSessionPage = { items: CashSession[]; total: number; page: number; pageSize: number; totalPages: number };

export interface CashRepository {
  open(input: OpenCashSessionInput): Promise<CashSession>;
  findCurrentByUserId(userId: string): Promise<CashSession | null>;
  findById(id: string): Promise<CashSession | null>;
  findHistory(criteria: CashHistoryCriteria): Promise<CashSessionPage>;
  createMovement(input: CreateCashMovementInput): Promise<CashMovement>;
  findMovements(cashSessionId: string): Promise<CashMovement[]>;
  close(id: string, input: CloseCashSessionInput): Promise<CashSession>;
}

export type { CashMovementData, CashSessionData };
