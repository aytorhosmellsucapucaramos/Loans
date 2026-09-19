export type AccessControlAuditAction = 'role.created' | 'role.updated';

export interface AccessControlAuditLogger {
  record(action: AccessControlAuditAction, actorId: string, roleId: string): Promise<void>;
}
