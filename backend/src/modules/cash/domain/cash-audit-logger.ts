export type CashAuditAction = 'cash.opened' | 'cash.movement_created' | 'cash.closed';
export interface CashAuditLogger { record(action: CashAuditAction, actorId: string, cashSessionId: string): Promise<void>; }
