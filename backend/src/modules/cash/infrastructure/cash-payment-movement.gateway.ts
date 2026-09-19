import type { PoolClient } from 'pg';

export interface CashPaymentMovementGateway {
  requireOpenCashSession(client: PoolClient, userId: string): Promise<void>;
  registerPaymentIncome(client: PoolClient, input: { paymentId: string; amount: string; userId: string }): Promise<void>;
  registerPaymentReversal(client: PoolClient, input: { paymentId: string; amount: string; userId: string }): Promise<void>;
}
