export type LoanAuditAction = 'loan.created' | 'loan.status_changed';
export interface LoanAuditLogger { record(action: LoanAuditAction, actorId: string, loanId: string): void; }
