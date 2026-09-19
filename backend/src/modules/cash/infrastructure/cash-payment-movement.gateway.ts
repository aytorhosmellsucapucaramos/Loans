import type { PoolClient } from 'pg';

export interface CashPaymentMovementGateway {
  registerPaymentIncome(client: PoolClient, input: { paymentId: string; amount: string; userId: string }): Promise<void>;
  registerPaymentReversal(client: PoolClient, input: { paymentId: string; amount: string; userId: string }): Promise<void>;
}
