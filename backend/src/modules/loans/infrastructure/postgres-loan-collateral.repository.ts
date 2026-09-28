import type { Pool } from 'pg';
import { AppError, notFound } from '../../../shared/errors/app-error.js';
import { LoanCollateralItem, type LoanCollateralCustodyStatus, type LoanCollateralData } from '../domain/loan-collateral.js';
import type { LoanCollateralRepository } from '../domain/loan-collateral-repository.js';

type LoanCollateralRow = {
  id: string;
  loan_id: string;
  description: string;
  category: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  physical_condition: string;
  estimated_value: string;
  notes: string | null;
  received_at: Date | string;
  custody_status: LoanCollateralCustodyStatus;
  returned_at: Date | null;
  returned_by_user_id: string | null;
  returned_by_first_name?: string | null;
  returned_by_last_name?: string | null;
  created_at: Date;
  updated_at: Date;
};

const dateOnly = (value: Date | string): string => value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
const mapRow = (row: LoanCollateralRow): LoanCollateralItem => new LoanCollateralItem({
  id: row.id,
  loanId: row.loan_id,
  description: row.description,
  category: row.category,
  brand: row.brand,
  model: row.model,
  serialNumber: row.serial_number,
  physicalCondition: row.physical_condition,
  estimatedValue: row.estimated_value,
  notes: row.notes,
  receivedAt: dateOnly(row.received_at),
  custodyStatus: row.custody_status,
  returnedAt: row.returned_at,
  returnedBy: row.returned_by_user_id && row.returned_by_first_name && row.returned_by_last_name
    ? { id: row.returned_by_user_id, firstName: row.returned_by_first_name, lastName: row.returned_by_last_name }
    : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
} satisfies LoanCollateralData);

const baseSelect = `SELECT item.*, u.first_name AS returned_by_first_name, u.last_name AS returned_by_last_name
  FROM loan_collateral_items item LEFT JOIN users u ON u.id = item.returned_by_user_id`;

export class PostgresLoanCollateralRepository implements LoanCollateralRepository {
  constructor(private readonly database: Pool) {}

  async findByLoanId(loanId: string): Promise<LoanCollateralItem[]> {
    const result = await this.database.query<LoanCollateralRow>(`${baseSelect} WHERE item.loan_id = $1 ORDER BY item.received_at DESC, item.created_at DESC`, [loanId]);
    return result.rows.map(mapRow);
  }

  async findById(loanId: string, collateralId: string): Promise<LoanCollateralItem | null> {
    const result = await this.database.query<LoanCollateralRow>(`${baseSelect} WHERE item.loan_id = $1 AND item.id = $2 LIMIT 1`, [loanId, collateralId]);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async returnItem(loanId: string, collateralId: string, actorId: string): Promise<LoanCollateralItem | null> {
    const client = await this.database.connect();
    try {
      await client.query('BEGIN');
      const loan = await client.query<{ status: string }>('SELECT status FROM loans WHERE id = $1 FOR UPDATE', [loanId]);
      if (!loan.rows[0]) throw notFound('Préstamo');
      if (loan.rows[0].status !== 'paid') throw new AppError(422, 'COLLATERAL_RETURN_REQUIRES_PAID_LOAN', 'La garantía solo puede devolverse cuando el préstamo esté pagado.');
      const updated = await client.query<{ id: string }>(
        `UPDATE loan_collateral_items SET custody_status = 'returned', returned_at = NOW(), returned_by_user_id = $3, updated_at = NOW()
         WHERE loan_id = $1 AND id = $2 AND custody_status = 'in_custody' RETURNING id`,
        [loanId, collateralId, actorId],
      );
      if (!updated.rows[0]) {
        await client.query('COMMIT');
        return null;
      }
      const result = await client.query<LoanCollateralRow>(`${baseSelect} WHERE item.id = $1`, [collateralId]);
      await client.query('COMMIT');
      return result.rows[0] ? mapRow(result.rows[0]) : null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
