import { logger } from '../../../shared/logging/logger.js';
import type { AuditWriter } from '../../audit/domain/audit-writer.js';
import { recordAuditSafely } from '../../audit/infrastructure/safe-audit-writer.js';
import type { LoanAuditAction, LoanAuditLogger } from '../domain/loan-audit-logger.js';

export class PinoLoanAuditLogger implements LoanAuditLogger {
  constructor(private readonly auditWriter: AuditWriter) {}
  async record(action: LoanAuditAction, actorId: string, loanId: string, metadata: Record<string, unknown> = {}): Promise<void> {
    logger.info({ action, actorId, loanId, ...metadata }, 'Auditoría básica de préstamo');
    const description = action === 'loan.created' ? 'Préstamo creado.' : action === 'loan.status_changed' ? 'Estado del préstamo actualizado.' : 'Objeto en garantía devuelto.';
    await recordAuditSafely(this.auditWriter, { userId: actorId, action, entityType: 'loan', entityId: loanId, description, metadata: { source: 'application', ...metadata } });
  }
}
