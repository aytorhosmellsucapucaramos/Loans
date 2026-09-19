import { logger } from '../../../shared/logging/logger.js';
import type { AuditWriter } from '../../audit/domain/audit-writer.js';
import { recordAuditSafely } from '../../audit/infrastructure/safe-audit-writer.js';
import type { AccessControlAuditAction, AccessControlAuditLogger } from '../domain/access-control-audit-logger.js';

export class PinoAccessControlAuditLogger implements AccessControlAuditLogger {
  constructor(private readonly auditWriter: AuditWriter) {}
  async record(action: AccessControlAuditAction, actorId: string, roleId: string): Promise<void> {
    logger.info({ action, actorId, roleId }, 'Auditoría de control de acceso');
    await recordAuditSafely(this.auditWriter, { userId: actorId, action, entityType: 'role', entityId: roleId, description: action === 'role.created' ? 'Rol creado.' : 'Rol y permisos actualizados.', metadata: { source: 'application' } });
  }
}
