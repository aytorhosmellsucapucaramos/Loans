import { logger } from '../../../shared/logging/logger.js';
import type { AuditWriter } from '../../audit/domain/audit-writer.js';
import { recordAuditSafely } from '../../audit/infrastructure/safe-audit-writer.js';
import type { UserAuditAction, UserAuditLogger } from '../domain/user-audit-logger.js';

export class PinoUserAuditLogger implements UserAuditLogger {
  constructor(private readonly auditWriter: AuditWriter) {}
  async record(action: UserAuditAction, actorId: string, userId: string): Promise<void> {
    logger.info({ action, actorId, userId }, 'Auditoría de usuario');
    await recordAuditSafely(this.auditWriter, { userId: actorId, action, entityType: 'user', entityId: userId, description: action === 'user.created' ? 'Usuario creado.' : 'Usuario actualizado.', metadata: { source: 'application' } });
  }
}
