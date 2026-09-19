import type { Pool, PoolClient } from 'pg';

import { AppError, notFound } from '../../../shared/errors/app-error.js';
import { CashMovement, type CashMovementData, type CashMovementMethod, type CashMovementType } from '../domain/cash-movement.js';
import type { CashHistoryCriteria, CashRepository, CashSessionPage, CloseCashSessionInput, CreateCashMovementInput, OpenCashSessionInput } from '../domain/cash-repository.js';
import { CashSession, type CashSessionData, type CashSessionStatus } from '../domain/cash-session.js';
import type { CashPaymentMovementGateway } from './cash-payment-movement.gateway.js';

type SessionRow = { id: string; opened_by_user_id: string; closed_by_user_id: string | null; opened_at: Date; closed_at: Date | null; opening_amount: string; cash_income_total: string; expense_total: string; expected_closing_amount: string; declared_closing_amount: string | null; difference_amount: string | null; status: CashSessionStatus; observations: string | null; created_at: Date; updated_at: Date };
type MovementRow = { id: string; cash_session_id: string; type: CashMovementType; amount: string; payment_method: CashMovementMethod; description: string; payment_id: string | null; created_by_user_id: string; created_at: Date };
type TotalsRow = { income: string; expenses: string; reversals: string };

const mapSession = (row: SessionRow): CashSession => new CashSession({ id: row.id, openedByUserId: row.opened_by_user_id, closedByUserId: row.closed_by_user_id, openedAt: row.opened_at, closedAt: row.closed_at, openingAmount: row.opening_amount, cashIncomeTotal: row.cash_income_total, expenseTotal: row.expense_total, expectedClosingAmount: row.expected_closing_amount, declaredClosingAmount: row.declared_closing_amount, differenceAmount: row.difference_amount, status: row.status, observations: row.observations, createdAt: row.created_at, updatedAt: row.updated_at } satisfies CashSessionData);
const mapMovement = (row: MovementRow): CashMovement => new CashMovement({ id: row.id, cashSessionId: row.cash_session_id, type: row.type, amount: row.amount, paymentMethod: row.payment_method, description: row.description, paymentId: row.payment_id, createdByUserId: row.created_by_user_id, createdAt: row.created_at } satisfies CashMovementData);
const toCents = (value: string): bigint => { const [whole, fraction = ''] = value.split('.'); return BigInt(whole ?? '0') * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2)); };
const fromCents = (value: bigint): string => { const sign = value < 0n ? '-' : ''; const absolute = value < 0n ? -value : value; return `${sign}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, '0')}`; };

export class PostgresCashRepository implements CashRepository, CashPaymentMovementGateway {
  constructor(private readonly database: Pool) {}

  async open(input: OpenCashSessionInput): Promise<CashSession> {
    try {
      const result = await this.database.query<SessionRow>(`INSERT INTO cash_sessions (opened_by_user_id, opening_amount, expected_closing_amount, observations) VALUES ($1,$2,$2,$3) RETURNING *`, [input.openedByUserId, input.openingAmount, input.observations ?? null]);
      return mapSession(result.rows[0]!);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new AppError(409, 'OPEN_CASH_SESSION_EXISTS', 'El usuario ya tiene una caja abierta.');
      throw error;
    }
  }

  async findCurrentByUserId(userId: string): Promise<CashSession | null> {
    const result = await this.database.query<SessionRow>(`SELECT * FROM cash_sessions WHERE opened_by_user_id = $1 AND status = 'open' ORDER BY opened_at DESC LIMIT 1`, [userId]);
    return result.rows[0] ? mapSession(await this.withCurrentTotals(result.rows[0])) : null;
  }

  async findById(id: string): Promise<CashSession | null> {
    const result = await this.database.query<SessionRow>('SELECT * FROM cash_sessions WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapSession(await this.withCurrentTotals(result.rows[0])) : null;
  }

  async findHistory(criteria: CashHistoryCriteria): Promise<CashSessionPage> {
    const values: unknown[] = []; const where: string[] = [];
    const add = (column: string, value: unknown): void => { values.push(value); where.push(`${column} = $${values.length}`); };
    if (criteria.status) add('status', criteria.status);
    if (criteria.userId) add('opened_by_user_id', criteria.userId);
    const condition = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (criteria.page - 1) * criteria.pageSize;
    const [items, count] = await Promise.all([
      this.database.query<SessionRow>(`SELECT * FROM cash_sessions ${condition} ORDER BY opened_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, criteria.pageSize, offset]),
      this.database.query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM cash_sessions ${condition}`, values),
    ]);
    const sessions = await Promise.all(items.rows.map(async (row) => mapSession(await this.withCurrentTotals(row))));
    const total = Number(count.rows[0]?.total ?? 0);
    return { items: sessions, total, page: criteria.page, pageSize: criteria.pageSize, totalPages: Math.ceil(total / criteria.pageSize) };
  }

  async createMovement(input: CreateCashMovementInput): Promise<CashMovement> {
    const client = await this.database.connect();
    try { await client.query('BEGIN'); const movement = await this.createManualMovement(client, input); await client.query('COMMIT'); return movement; } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async findMovements(sessionId: string): Promise<CashMovement[]> {
    const result = await this.database.query<MovementRow>('SELECT * FROM cash_movements WHERE cash_session_id = $1 ORDER BY created_at ASC', [sessionId]);
    return result.rows.map(mapMovement);
  }

  async close(id: string, input: CloseCashSessionInput): Promise<CashSession> {
    const client = await this.database.connect();
    try {
      await client.query('BEGIN'); const session = await this.lockOpenSession(client, id); const totals = await this.cashTotals(client, id);
      const expected = this.expected(session.opening_amount, totals);
      const result = await client.query<SessionRow>(`UPDATE cash_sessions SET closed_by_user_id=$1, closed_at=NOW(), cash_income_total=$2, expense_total=$3, expected_closing_amount=$4, declared_closing_amount=$5, difference_amount=$5::numeric-$4::numeric, observations=COALESCE($6, observations), status='closed', updated_at=NOW() WHERE id=$7 RETURNING *`, [input.closedByUserId, totals.income, totals.expenses, expected, input.declaredClosingAmount, input.observations ?? null, id]);
      await client.query('COMMIT'); return mapSession(result.rows[0]!);
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async registerPaymentIncome(client: PoolClient, input: { paymentId: string; amount: string; userId: string }): Promise<void> {
    const session = await this.lockCurrentSession(client, input.userId);
    if (!session) throw new AppError(422, 'CASH_SESSION_REQUIRED', 'Se requiere una caja abierta para registrar un pago en efectivo.');
    await client.query(`INSERT INTO cash_movements (cash_session_id, type, amount, payment_method, description, payment_id, created_by_user_id) VALUES ($1,'income',$2,'cash','Cobro de pago en efectivo',$3,$4)`, [session.id, input.amount, input.paymentId, input.userId]);
  }

  async registerPaymentReversal(client: PoolClient, input: { paymentId: string; amount: string; userId: string }): Promise<void> {
    const original = await client.query<MovementRow>(`SELECT * FROM cash_movements WHERE payment_id=$1 AND type='income' FOR UPDATE`, [input.paymentId]);
    if (!original.rows[0]) throw new AppError(409, 'CASH_MOVEMENT_NOT_FOUND', 'No se encontró el movimiento de caja del pago en efectivo.');
    await this.lockOpenSession(client, original.rows[0].cash_session_id);
    await client.query(`INSERT INTO cash_movements (cash_session_id, type, amount, payment_method, description, payment_id, created_by_user_id) VALUES ($1,'reversal',$2,'cash','Reversión de pago anulado',$3,$4)`, [original.rows[0].cash_session_id, input.amount, input.paymentId, input.userId]);
  }

  private async createManualMovement(client: PoolClient, input: CreateCashMovementInput): Promise<CashMovement> {
    await this.lockOpenSession(client, input.cashSessionId);
    const result = await client.query<MovementRow>(`INSERT INTO cash_movements (cash_session_id,type,amount,payment_method,description,created_by_user_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [input.cashSessionId, input.type, input.amount, input.paymentMethod, input.description, input.createdByUserId]);
    return mapMovement(result.rows[0]!);
  }

  private async lockCurrentSession(client: PoolClient, userId: string): Promise<SessionRow | null> { const result = await client.query<SessionRow>(`SELECT * FROM cash_sessions WHERE opened_by_user_id=$1 AND status='open' ORDER BY opened_at DESC LIMIT 1 FOR UPDATE`, [userId]); return result.rows[0] ?? null; }
  private async lockOpenSession(client: PoolClient, id: string): Promise<SessionRow> { const result = await client.query<SessionRow>('SELECT * FROM cash_sessions WHERE id=$1 FOR UPDATE', [id]); if (!result.rows[0]) throw notFound('Caja'); if (result.rows[0].status !== 'open') throw new AppError(422, 'CASH_SESSION_CLOSED', 'No se pueden registrar movimientos en una caja cerrada.'); return result.rows[0]; }
  private async cashTotals(client: PoolClient, sessionId: string): Promise<TotalsRow> { const result = await client.query<TotalsRow>(`SELECT COALESCE(SUM(amount) FILTER (WHERE type='income' AND payment_method='cash'),0)::text AS income, COALESCE(SUM(amount) FILTER (WHERE type='expense' AND payment_method='cash'),0)::text AS expenses, COALESCE(SUM(amount) FILTER (WHERE type='reversal' AND payment_method='cash'),0)::text AS reversals FROM cash_movements WHERE cash_session_id=$1`, [sessionId]); return result.rows[0]!; }
  private expected(opening: string, totals: TotalsRow): string { return fromCents(toCents(opening) + toCents(totals.income) - toCents(totals.expenses) - toCents(totals.reversals)); }
  private async withCurrentTotals(row: SessionRow): Promise<SessionRow> { if (row.status === 'closed') return row; const totals = await this.database.query<TotalsRow>(`SELECT COALESCE(SUM(amount) FILTER (WHERE type='income' AND payment_method='cash'),0)::text AS income, COALESCE(SUM(amount) FILTER (WHERE type='expense' AND payment_method='cash'),0)::text AS expenses, COALESCE(SUM(amount) FILTER (WHERE type='reversal' AND payment_method='cash'),0)::text AS reversals FROM cash_movements WHERE cash_session_id=$1`, [row.id]); const expected = this.expected(row.opening_amount, totals.rows[0]!); return { ...row, cash_income_total: totals.rows[0]!.income, expense_total: totals.rows[0]!.expenses, expected_closing_amount: expected }; }
}
