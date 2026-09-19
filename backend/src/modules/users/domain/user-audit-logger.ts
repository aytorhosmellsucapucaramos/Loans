export type UserAuditAction = 'user.created' | 'user.updated';

export interface UserAuditLogger {
  record(action: UserAuditAction, actorId: string, userId: string): Promise<void>;
}
