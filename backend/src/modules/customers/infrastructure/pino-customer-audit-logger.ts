import { logger } from '../../../shared/logging/logger.js';
import type { AuditWriter } from '../../audit/domain/audit-writer.js';
import { recordAuditSafely } from '../../audit/infrastructure/safe-audit-writer.js';
import type { CustomerAuditAction, CustomerAuditLogger } from '../domain/customer-audit-logger.js';

export class PinoCustomerAuditLogger implements CustomerAuditLogger {
  constructor(private readonly auditWriter: AuditWriter) {}
  async record(action: CustomerAuditAction, actorId: string, customerId: string): Promise<void> {
    logger.info({ action, actorId, customerId }, 'Auditoría básica de cliente');
    await recordAuditSafely(this.auditWriter, { userId: actorId, action, entityType: 'customer', entityId: customerId, description: action === 'customer.created' ? 'Cliente registrado.' : action === 'customer.updated' ? 'Cliente actualizado.' : 'Estado del cliente actualizado.', metadata: { source: 'application' } });
  }
}
