import request from 'supertest';
import { createApp } from '../../src/app.js';
import { User } from '../../src/modules/users/domain/user.js';
import type { AppContainer } from '../../src/shared/container/container.js';

const summary = { activeCustomers: 1, activeLoans: 1, totalDisbursed: '100.00', totalOutstanding: '80.00', totalCollected: '20.00', overdueInstallments: 0, paymentsToday: { count: 1, totalAmount: '20.00' }, currentCashBalance: '30.00' };
const page = { totals: {}, page: { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } };
const installmentReport = {
  totals: { pendingCount: 0, paidCount: 0, overdueCount: 1, outstandingAmount: '25.00' },
  page: { items: [{ id: 'installment-1', loanId: 'loan-1', customerName: 'María Quispe', installmentNumber: 1, dueDate: '2026-09-20', principalAmount: '20.00', interestAmount: '5.00', scheduledAmount: '25.00', outstandingAmount: '25.00', status: 'overdue' }], pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } },
};

const buildApp = (permissions = ['reports.read'], installmentReportResult = page) => {
  const user = new User('user-1', 'ana@example.com', 'Ana', 'Pérez', 'hash', true, new Date(), new Date(), ['admin'], permissions);
  return createApp({
    users: { findById: jest.fn().mockResolvedValue(user) },
    tokenService: { verifyAccessToken: jest.fn().mockReturnValue({ userId: user.id }) },
    getReportSummary: { execute: jest.fn().mockResolvedValue(summary) },
    getLoanReport: { execute: jest.fn().mockResolvedValue(page) },
    getInstallmentReport: { execute: jest.fn().mockResolvedValue(installmentReportResult) },
    getCollectionReport: { execute: jest.fn().mockResolvedValue(page) },
    getCashReport: { execute: jest.fn().mockResolvedValue(page) },
  } as unknown as AppContainer);
};

describe('API HTTP de reportes', () => {
  it('protege los reportes con autenticación y permiso', async () => {
    await request(buildApp()).get('/api/reports/summary').expect(401);
    await request(buildApp([])).get('/api/reports/summary').set('Authorization', 'Bearer token').expect(403);
  });

  it('devuelve resumen y reportes paginados con el formato estándar', async () => {
    const app = buildApp();
    await request(app).get('/api/reports/summary').set('Authorization', 'Bearer token').expect(200).expect((response) => expect(response.body).toMatchObject({ success: true, data: { totalCollected: '20.00' }, errors: [] }));
    await request(app).get('/api/reports/loans?page=1&pageSize=20&status=active').set('Authorization', 'Bearer token').expect(200).expect((response) => expect(response.body.data.page.pagination).toMatchObject({ page: 1 }));
    await request(app).get('/api/reports/installments').set('Authorization', 'Bearer token').expect(200);
    await request(app).get('/api/reports/collections').set('Authorization', 'Bearer token').expect(200);
    await request(app).get('/api/reports/cash').set('Authorization', 'Bearer token').expect(200);
  });

  it('devuelve nombre de cliente para la agenda sin exponer campos adicionales sensibles', async () => {
    await request(buildApp(['reports.read'], installmentReport))
      .get('/api/reports/installments?status=overdue')
      .set('Authorization', 'Bearer token')
      .expect(200)
      .expect((response) => {
        expect(response.body.data.page.items[0]).toMatchObject({ customerName: 'María Quispe', installmentNumber: 1, status: 'overdue' });
        expect(response.body.data.page.items[0]).not.toHaveProperty('customerId');
      });
  });

  it('valida fechas y rangos', async () => {
    const app = buildApp();
    await request(app).get('/api/reports/loans?fromDate=2026-02-02&toDate=2026-02-01').set('Authorization', 'Bearer token').expect(400);
    await request(app).get('/api/reports/collections?fromDate=no-fecha').set('Authorization', 'Bearer token').expect(400);
    await request(app).get('/api/reports/cash?fromDate=2026-02-31').set('Authorization', 'Bearer token').expect(400);
  });
});
