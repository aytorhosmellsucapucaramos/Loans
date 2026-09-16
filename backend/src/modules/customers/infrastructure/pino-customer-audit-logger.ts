import { logger } from '../../../shared/logging/logger.js';
import type { CustomerAuditAction, CustomerAuditLogger } from '../domain/customer-audit-logger.js';

export class PinoCustomerAuditLogger implements CustomerAuditLogger {
  record(action: CustomerAuditAction, actorId: string, customerId: string): void {
    logger.info({ action, actorId, customerId }, 'Auditoría básica de cliente');
  }
}
