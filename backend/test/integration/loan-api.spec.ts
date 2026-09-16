import request from 'supertest';

import { createApp } from '../../src/app.js';
import { User } from '../../src/modules/users/domain/user.js';
import type { AppContainer } from '../../src/shared/container/container.js';

const loan = { id: '44444444-4444-4444-4444-444444444444', customerId: '55555555-5555-4555-8555-555555555555', principalAmount: '1000.00', interestRate: '10.0000', interestType: 'simple', paymentFrequency: 'monthly', installmentCount: 4, disbursementDate: '2026-01-01', firstInstallmentDate: '2026-02-01', totalAmount: '1100.00', status: 'active', observations: null, createdAt: new Date(), updatedAt: new Date() };
const installment = { id: '66666666-6666-4666-8666-666666666666', loanId: loan.id, installmentNumber: 1, dueDate: '2026-02-01', principalAmount: '250.00', interestAmount: '25.00', scheduledAmount: '275.00', outstandingAmount: '275.00', status: 'pending', createdAt: new Date() };
const payload = { customerId: loan.customerId, principalAmount: 1000, interestRate: 10, interestType: 'simple', paymentFrequency: 'monthly', installmentCount: 4, disbursementDate: '2026-01-01', firstInstallmentDate: '2026-02-01' };

const buildApp = (permissions = ['loans.read', 'loans.create', 'loans.update', 'installments.read']) => {
  const user = new User('user-1', 'ana@example.com', 'Ana', 'Pérez', 'hash', true, new Date(), new Date(), ['admin'], permissions);
  const container = {
    users: { findById: jest.fn().mockResolvedValue(user) }, tokenService: { verifyAccessToken: jest.fn().mockReturnValue({ userId: user.id }) },
    listLoans: { execute: jest.fn().mockResolvedValue({ items: [loan], pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }) },
    getLoan: { execute: jest.fn().mockResolvedValue({ ...loan, installments: [installment] }) }, createLoan: { execute: jest.fn().mockResolvedValue(loan) }, setLoanStatus: { execute: jest.fn().mockResolvedValue({ ...loan, status: 'cancelled' }) },
    listLoanInstallments: { execute: jest.fn().mockResolvedValue([installment]) }, getInstallment: { execute: jest.fn().mockResolvedValue(installment) },
  } as unknown as AppContainer;
  return createApp(container);
};

describe('API HTTP de préstamos', () => {
  it('requiere autenticación para listar préstamos', async () => { await request(buildApp()).get('/api/loans').expect(401); });
  it('crea un préstamo con el formato estándar', async () => {
    const response = await request(buildApp()).post('/api/loans').set('Authorization', 'Bearer token').send(payload).expect(201);
    expect(response.body).toMatchObject({ success: true, data: { id: loan.id, totalAmount: '1100.00' }, errors: [] });
  });
  it('valida monto y fechas antes de crear', async () => {
    await request(buildApp()).post('/api/loans').set('Authorization', 'Bearer token').send({ ...payload, principalAmount: 0 }).expect(400);
    await request(buildApp()).post('/api/loans').set('Authorization', 'Bearer token').send({ ...payload, firstInstallmentDate: '2026-01-01' }).expect(400);
  });
  it('consulta las cuotas con su permiso específico', async () => {
    const response = await request(buildApp()).get(`/api/loans/${loan.id}/installments`).set('Authorization', 'Bearer token').expect(200);
    expect(response.body.data).toHaveLength(1);
  });
  it('deniega creación sin permiso', async () => {
    await request(buildApp(['loans.read'])).post('/api/loans').set('Authorization', 'Bearer token').send(payload).expect(403);
  });
});
