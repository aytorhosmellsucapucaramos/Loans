import { logger } from '../../../shared/logging/logger.js';
import type { CreateAuditLogInput } from '../domain/audit-repository.js';
import type { AuditWriter } from '../domain/audit-writer.js';

export const recordAuditSafely = async (writer: AuditWriter, input: CreateAuditLogInput): Promise<void> => {
  try {
    await writer.record(input);
  } catch (error) {
    logger.error({ action: input.action, entityType: input.entityType, entityId: input.entityId, error: error instanceof Error ? error.message : 'unknown' }, 'No se pudo persistir el registro de auditoría');
  }
};
