import { logger } from '../../../shared/logging/logger.js';
import type { AuditWriter } from '../../audit/domain/audit-writer.js';
import { recordAuditSafely } from '../../audit/infrastructure/safe-audit-writer.js';
import type { CashAuditAction, CashAuditLogger } from '../domain/cash-audit-logger.js';

export class PinoCashAuditLogger implements CashAuditLogger {
  constructor(private readonly auditWriter: AuditWriter) {}
  async record(action: CashAuditAction, actorId: string, cashSessionId: string): Promise<void> { logger.info({ action, actorId, cashSessionId }, 'Auditoría básica de caja'); await recordAuditSafely(this.auditWriter, { userId: actorId, action, entityType: 'cash_session', entityId: cashSessionId, description: action === 'cash.opened' ? 'Caja abierta.' : action === 'cash.closed' ? 'Caja cerrada.' : 'Movimiento de caja registrado.', metadata: { source: 'application' } }); }
}
