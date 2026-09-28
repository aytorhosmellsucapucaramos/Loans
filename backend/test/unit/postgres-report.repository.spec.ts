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

    const result = await repository.getInstallments({ page: 1, pageSize: 5, fromDate: '2026-09-27', toDate: '2026-09-27', status: 'pending' });

    expect(result.page.items[0]).toMatchObject({ customerName: 'María Quispe', loanId: 'loan-1', status: 'pending', outstandingAmount: '25.00' });
    expect(queries[1]).toContain('JOIN loans l ON l.id=i.loan_id JOIN customers c ON c.id=l.customer_id');
    expect(queries[1]).toContain("i.due_date < (NOW() AT TIME ZONE 'America/Lima')::date");
    expect(query).toHaveBeenCalledWith(expect.stringContaining('i.due_date >= $1'), ['2026-09-27', '2026-09-27', 'pending', 5, 0]);
  });
});
