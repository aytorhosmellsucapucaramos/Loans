import type { CashMovementMethod } from '../../domain/cash-movement.js';
export type OpenCashDto = { openingAmount: string | number; observations?: string };
export type CashMovementDto = { amount: string | number; paymentMethod: CashMovementMethod; description: string };
export type CloseCashDto = { declaredClosingAmount: string | number; observations?: string };
export type CashHistoryQueryDto = { page: number; pageSize: number; status?: 'open' | 'closed'; userId?: string };
