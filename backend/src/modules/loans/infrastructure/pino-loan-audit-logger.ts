import { logger } from '../../../shared/logging/logger.js';
import type { LoanAuditAction, LoanAuditLogger } from '../domain/loan-audit-logger.js';

export class PinoLoanAuditLogger implements LoanAuditLogger {
  record(action: LoanAuditAction, actorId: string, loanId: string): void { logger.info({ action, actorId, loanId }, 'Auditoría básica de préstamo'); }
}
