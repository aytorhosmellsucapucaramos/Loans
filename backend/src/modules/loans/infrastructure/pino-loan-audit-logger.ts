import { logger } from '../../../shared/logging/logger.js';
import type { AuditWriter } from '../../audit/domain/audit-writer.js';
import { recordAuditSafely } from '../../audit/infrastructure/safe-audit-writer.js';
import type { LoanAuditAction, LoanAuditLogger } from '../domain/loan-audit-logger.js';

export class PinoLoanAuditLogger implements LoanAuditLogger {
  constructor(private readonly auditWriter: AuditWriter) {}
  async record(action: LoanAuditAction, actorId: string, loanId: string): Promise<void> { logger.info({ action, actorId, loanId }, 'Auditoría básica de préstamo'); await recordAuditSafely(this.auditWriter, { userId: actorId, action, entityType: 'loan', entityId: loanId, description: action === 'loan.created' ? 'Préstamo creado.' : 'Estado del préstamo actualizado.', metadata: { source: 'application' } }); }
}
