import { logger } from '../../../shared/logging/logger.js';
import type { AuditWriter } from '../../audit/domain/audit-writer.js';
import { recordAuditSafely } from '../../audit/infrastructure/safe-audit-writer.js';
import type { PaymentAuditAction, PaymentAuditLogger } from '../domain/payment-audit-logger.js';

export class PinoPaymentAuditLogger implements PaymentAuditLogger {
  constructor(private readonly auditWriter: AuditWriter) {}
  async record(action: PaymentAuditAction, actorId: string, paymentId: string): Promise<void> {
    logger.info({ action, actorId, paymentId }, 'Auditoría básica de pago');
    await recordAuditSafely(this.auditWriter, { userId: actorId, action, entityType: 'payment', entityId: paymentId, description: action === 'payment.registered' ? 'Pago registrado.' : 'Pago anulado.', metadata: { source: 'application' } });
  }
}
