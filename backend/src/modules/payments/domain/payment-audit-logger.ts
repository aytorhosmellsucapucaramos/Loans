export type PaymentAuditAction = 'payment.registered' | 'payment.cancelled';

export interface PaymentAuditLogger {
  record(action: PaymentAuditAction, actorId: string, paymentId: string): Promise<void>;
}
