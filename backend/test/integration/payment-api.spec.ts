import request from 'supertest';

import { createApp } from '../../src/app.js';
import { User } from '../../src/modules/users/domain/user.js';
import type { AppContainer } from '../../src/shared/container/container.js';

const payment = { id: '77777777-7777-4777-8777-777777777777', loanId: '44444444-4444-4444-8444-444444444444', installmentId: '55555555-5555-4555-8555-555555555555', amount: '50.00', paymentMethod: 'cash', paymentDate: '2026-09-15', operationReference: null, observations: null, registeredByUserId: 'user-1', status: 'registered', createdAt: new Date() };
const payload = { loanId: payment.loanId, installmentId: payment.installmentId, amount: 50, paymentMethod: 'cash', paymentDate: '2026-09-15' };

const buildApp = (permissions = ['payments.read', 'payments.create', 'payments.cancel']) => {
  const user = new User('user-1', 'ana@example.com', 'Ana', 'Pérez', 'hash', true, new Date(), new Date(), ['admin'], permissions);
  const container = {
    users: { findById: jest.fn().mockResolvedValue(user) }, tokenService: { verifyAccessToken: jest.fn().mockReturnValue({ userId: user.id }) },
    listPayments: { execute: jest.fn().mockResolvedValue({ items: [payment], pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }) },
    getPayment: { execute: jest.fn().mockResolvedValue(payment) }, registerPayment: { execute: jest.fn().mockResolvedValue(payment) }, cancelPayment: { execute: jest.fn().mockResolvedValue({ ...payment, status: 'cancelled' }) },
    listLoanPayments: { execute: jest.fn().mockResolvedValue([payment]) }, listInstallmentPayments: { execute: jest.fn().mockResolvedValue([payment]) },
  } as unknown as AppContainer;
  return createApp(container);
};

describe('API HTTP de pagos', () => {
  it('requiere autenticación y permiso de lectura', async () => {
    await request(buildApp()).get('/api/payments').expect(401);
    await request(buildApp([])).get('/api/payments').set('Authorization', 'Bearer token').expect(403);
  });

  it('registra, consulta y anula usando el contrato estándar', async () => {
    const app = buildApp();
    await expect(request(app).post('/api/payments').set('Authorization', 'Bearer token').send(payload)).resolves.toMatchObject({ status: 201, body: { success: true, data: { id: payment.id }, errors: [] } });
    await expect(request(app).get(`/api/payments/${payment.id}`).set('Authorization', 'Bearer token')).resolves.toMatchObject({ status: 200, body: { data: { amount: '50.00' } } });
    await expect(request(app).patch(`/api/payments/${payment.id}/cancel`).set('Authorization', 'Bearer token')).resolves.toMatchObject({ status: 200, body: { data: { status: 'cancelled' } } });
  });

  it('valida el cuerpo y las rutas relacionadas', async () => {
    const app = buildApp();
    await request(app).post('/api/payments').set('Authorization', 'Bearer token').send({ ...payload, amount: 0 }).expect(400);
    await request(app).get(`/api/loans/${payment.loanId}/payments`).set('Authorization', 'Bearer token').expect(200);
    await request(app).get(`/api/installments/${payment.installmentId}/payments`).set('Authorization', 'Bearer token').expect(200);
  });

  it('deniega crear o anular sin los permisos específicos', async () => {
    const app = buildApp(['payments.read']);
    await request(app).post('/api/payments').set('Authorization', 'Bearer token').send(payload).expect(403);
    await request(app).patch(`/api/payments/${payment.id}/cancel`).set('Authorization', 'Bearer token').expect(403);
  });
});
