export type LoanAuditAction = 'loan.created' | 'loan.status_changed' | 'loan.collateral_returned';
export interface LoanAuditLogger { record(action: LoanAuditAction, actorId: string, loanId: string, metadata?: Record<string, unknown>): Promise<void>; }
