export type CustomerAuditAction = 'customer.created' | 'customer.updated' | 'customer.status_changed';

export interface CustomerAuditLogger {
  record(action: CustomerAuditAction, actorId: string, customerId: string): void;
}
