import type { Pool } from 'pg';
import { PostgresReportRepository } from '../../src/modules/reports/infrastructure/postgres-report.repository.js';

describe('PostgresReportRepository installments', () => {
  it('includes customer display name and keeps Lima status and date filters in SQL', async () => {
    const queries: string[] = [];
    const query = jest.fn(async (sql: string) => {
      queries.push(sql);
      if (sql.includes('FILTER (WHERE')) {
        return { rows: [{ pending_count: '1', paid_count: '0', overdue_count: '0', outstanding_amount: '25.00' }] };
      }
      if (sql.includes('concat(c.first_name')) {
        return { rows: [{ id: 'installment-1', loan_id: 'loan-1', customer_name: 'María Quispe', installment_number: 1, due_date: '2026-09-27', principal_amount: '20.00', interest_amount: '5.00', scheduled_amount: '25.00', outstanding_amount: '25.00', status: 'pending' }] };
      }
      return { rows: [{ total: '1' }] };
    });
    const repository = new PostgresReportRepository({ query } as unknown as Pool);

    const result = await repository.getInstallments({ page: 1, pageSize: 5, fromDate: '2026-09-27', toDate: '2026-09-27', status: 'pending' }, { userId: 'user-1', isAdmin: true });

    expect(result.page.items[0]).toMatchObject({ customerName: 'María Quispe', loanId: 'loan-1', status: 'pending', outstandingAmount: '25.00' });
    expect(queries[1]).toContain('JOIN loans l ON l.id=i.loan_id JOIN customers c ON c.id=l.customer_id');
    expect(queries[1]).toContain("i.due_date < (NOW() AT TIME ZONE 'America/Lima')::date");
    expect(query).toHaveBeenCalledWith(expect.stringContaining('i.due_date >= $1'), ['2026-09-27', '2026-09-27', 'pending', 5, 0]);
  });

  it('aplica propietario en agregados de dashboard y agenda para usuario estándar', async () => {
    const query = jest.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('active_customers')) return { rows: [{ active_customers: '1', active_loans: '1', total_disbursed: '100.00', total_outstanding: '80.00', total_collected: '20.00', overdue_installments: '1', payments_today_count: '1', payments_today_amount: '20.00', current_cash_balance: '10.00' }] };
      if (sql.includes('FILTER (WHERE')) return { rows: [{ pending_count: '1', paid_count: '0', overdue_count: '1', outstanding_amount: '25.00' }] };
      if (sql.includes('concat(c.first_name')) return { rows: [] };
      return { rows: [{ total: '1' }] };
    });
    const repository = new PostgresReportRepository({ query } as unknown as Pool);
    const scope = { userId: 'owner-1', isAdmin: false };

    await repository.getSummary(scope);
    await repository.getInstallments({ page: 1, pageSize: 5, status: 'overdue' }, scope);

    expect(query.mock.calls[0]?.[0]).toContain('c.user_id = $1');
    expect(query.mock.calls[0]?.[0]).toContain('cs.opened_by_user_id = $1');
    expect(query.mock.calls[0]?.[1]).toEqual(['owner-1']);
    for (const [sql, values] of query.mock.calls.slice(1)) {
      expect(sql).toContain('JOIN customers c ON c.id=l.customer_id');
      expect(sql).toContain('c.user_id = $2');
      expect(values.slice(0, 2)).toEqual(['overdue', 'owner-1']);
    }
  });

  it('filtra reportes de préstamos y cobranza por customers.user_id', async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const query = jest.fn(async (sql: string, values: unknown[] = []) => {
      queries.push({ sql, values });
      if (sql.includes('loan_count')) return { rows: [{ loan_count: '0', principal_amount: '0', interest_amount: '0', outstanding_amount: '0', active_count: '0', paid_count: '0', cancelled_count: '0' }] };
      if (sql.includes('GROUP BY')) return { rows: [] };
      if (sql.includes('payment_count')) return { rows: [{ payment_count: '0', total_amount: '0' }] };
      if (sql.includes('total FROM')) return { rows: [{ total: '0' }] };
      return { rows: [] };
    });
    const repository = new PostgresReportRepository({ query } as unknown as Pool);
    const scope = { userId: 'owner-1', isAdmin: false };

    await repository.getLoans({ page: 1, pageSize: 5 }, scope);
    await repository.getCollections({ page: 1, pageSize: 5 }, scope);

    expect(queries).toHaveLength(8);
    for (const queryCall of queries) {
      expect(queryCall.sql).toContain('c.user_id = $1');
      expect(queryCall.values[0]).toBe('owner-1');
    }
  });
});
