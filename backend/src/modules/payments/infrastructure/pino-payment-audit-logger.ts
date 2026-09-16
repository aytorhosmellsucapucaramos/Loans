import { logger } from '../../../shared/logging/logger.js';
import type { PaymentAuditAction, PaymentAuditLogger } from '../domain/payment-audit-logger.js';

export class PinoPaymentAuditLogger implements PaymentAuditLogger {
  record(action: PaymentAuditAction, actorId: string, paymentId: string): void {
    logger.info({ action, actorId, paymentId }, 'Auditoría básica de pago');
  }
}
