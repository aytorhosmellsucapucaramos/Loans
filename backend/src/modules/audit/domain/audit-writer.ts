import type { CreateAuditLogInput } from './audit-repository.js';

export interface AuditWriter {
  record(input: CreateAuditLogInput): Promise<void>;
}
