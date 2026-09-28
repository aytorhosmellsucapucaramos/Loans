import request from 'supertest';

import { createApp } from '../../src/app.js';
import { User } from '../../src/modules/users/domain/user.js';
import type { AppContainer } from '../../src/shared/container/container.js';

const loan = { id: '44444444-4444-4444-4444-444444444444', customerId: '55555555-5555-4555-8555-555555555555', principalAmount: '1000.00', interestRate: '10.0000', interestType: 'simple', paymentFrequency: 'monthly', installmentCount: 4, disbursementDate: '2026-01-01', firstInstallmentDate: '2026-02-01', totalAmount: '1100.00', status: 'active', observations: null, createdAt: new Date(), updatedAt: new Date() };
const installment = { id: '66666666-6666-4666-8666-666666666666', loanId: loan.id, installmentNumber: 1, dueDate: '2026-02-01', principalAmount: '250.00', interestAmount: '25.00', scheduledAmount: '275.00', outstandingAmount: '275.00', status: 'pending', createdAt: new Date() };
const payload = { customerId: loan.customerId, principalAmount: 1000, interestRate: 10, interestType: 'simple', paymentFrequency: 'monthly', installmentCount: 4, disbursementDate: '2026-01-01', firstInstallmentDate: '2026-02-01' };
const preview = { customerId: loan.customerId, principalAmount: '1000.00', interestRate: '10.0000', interestType: 'simple', paymentFrequency: 'monthly', installmentCount: 4, disbursementDate: '2026-01-01', firstInstallmentDate: '2026-02-01', totalInterestAmount: '100.00', totalAmount: '1100.00', installments: [{ installmentNumber: 1, dueDate: '2026-02-01', principalAmount: '250.00', interestAmount: '25.00', scheduledAmount: '275.00', outstandingAmount: '275.00', status: 'pending' }] };

const collateralItem = { id: '77777777-7777-4777-8777-777777777777', loanId: loan.id, description: 'Televisor', category: 'Electrónica', brand: null, model: null, serialNumber: null, physicalCondition: 'Buen estado', estimatedValue: '500.00', notes: null, receivedAt: '2026-09-15', custodyStatus: 'in_custody', returnedAt: null, returnedBy: null };

const buildApp = (permissions = ['loans.read', 'loans.create', 'loans.update', 'installments.read']) => {
  const user = new User('user-1', 'ana@example.com', 'Ana', 'Pérez', 'hash', true, new Date(), new Date(), ['admin'], permissions);
  const container = {
    users: { findById: jest.fn().mockResolvedValue(user) }, tokenService: { verifyAccessToken: jest.fn().mockReturnValue({ userId: user.id }) },
    listLoans: { execute: jest.fn().mockResolvedValue({ items: [loan], pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }) },
    getLoan: { execute: jest.fn().mockResolvedValue({ ...loan, installments: [installment] }) }, previewLoan: { execute: jest.fn().mockResolvedValue(preview) }, createLoan: { execute: jest.fn().mockResolvedValue(loan) }, setLoanStatus: { execute: jest.fn().mockResolvedValue({ ...loan, status: 'cancelled' }) },
    listLoanInstallments: { execute: jest.fn().mockResolvedValue([installment]) }, getInstallment: { execute: jest.fn().mockResolvedValue(installment) },
    listLoanCollateral: { execute: jest.fn().mockResolvedValue([collateralItem]) }, returnLoanCollateral: { execute: jest.fn().mockResolvedValue({ ...collateralItem, custodyStatus: 'returned', returnedAt: new Date(), returnedBy: { id: user.id, firstName: user.firstName, lastName: user.lastName } }) },
  } as unknown as AppContainer;
  return { app: createApp(container), container };
};

describe('API HTTP de préstamos', () => {
  it('requiere autenticación para listar préstamos', async () => { await request(buildApp().app).get('/api/loans').expect(401); });
  it('crea un préstamo con el formato estándar', async () => {
    const response = await request(buildApp().app).post('/api/loans').set('Authorization', 'Bearer token').send(payload).expect(201);
    expect(response.body).toMatchObject({ success: true, data: { id: loan.id, totalAmount: '1100.00' }, errors: [] });
  });
  it('valida monto y fechas antes de crear', async () => {
    await request(buildApp().app).post('/api/loans').set('Authorization', 'Bearer token').send({ ...payload, principalAmount: 0 }).expect(400);
    await request(buildApp().app).post('/api/loans').set('Authorization', 'Bearer token').send({ ...payload, firstInstallmentDate: '2026-01-01' }).expect(400);
    await request(buildApp().app).post('/api/loans').set('Authorization', 'Bearer token').send({ ...payload, collateralItems: [{ description: 'Televisor', category: 'Electrónica', physicalCondition: 'Buen estado', estimatedValue: 0 }] }).expect(400);
  });
  it('previsualiza con permiso de creación y sin invocar registro', async () => {
    const { app, container } = buildApp();
    const response = await request(app).post('/api/loans/preview').set('Authorization', 'Bearer token').send(payload).expect(200);

    expect(response.body).toMatchObject({ success: true, data: { totalInterestAmount: '100.00', totalAmount: '1100.00', installments: expect.any(Array) }, errors: [] });
    expect(container.previewLoan.execute).toHaveBeenCalledWith(expect.objectContaining(payload));
    expect(container.createLoan.execute).not.toHaveBeenCalled();
  });
  it('deniega vista previa sin permiso loans.create', async () => {
    await request(buildApp(['loans.read']).app).post('/api/loans/preview').set('Authorization', 'Bearer token').send(payload).expect(403);
  });
  it('consulta las cuotas con su permiso específico', async () => {
    const response = await request(buildApp().app).get(`/api/loans/${loan.id}/installments`).set('Authorization', 'Bearer token').expect(200);
    expect(response.body.data).toHaveLength(1);
  });
  it('consulta garantías y registra su devolución con los permisos actuales', async () => {
    const { app, container } = buildApp();
    const list = await request(app).get(`/api/loans/${loan.id}/collateral`).set('Authorization', 'Bearer token').expect(200);
    expect(list.body.data[0]).toMatchObject({ description: 'Televisor', custodyStatus: 'in_custody' });
    const returned = await request(app).patch(`/api/loans/${loan.id}/collateral/${collateralItem.id}/return`).set('Authorization', 'Bearer token').send({}).expect(200);
    expect(returned.body.data).toMatchObject({ custodyStatus: 'returned', returnedBy: { firstName: 'Ana' } });
    expect(container.returnLoanCollateral.execute).toHaveBeenCalledWith(loan.id, collateralItem.id, 'user-1');
  });
  it('protege consulta y devolución de garantías con loans.read y loans.update', async () => {
    await request(buildApp(['loans.update']).app).get(`/api/loans/${loan.id}/collateral`).set('Authorization', 'Bearer token').expect(403);
    await request(buildApp(['loans.read']).app).patch(`/api/loans/${loan.id}/collateral/${collateralItem.id}/return`).set('Authorization', 'Bearer token').send({}).expect(403);
  });
  it('deniega creación sin permiso', async () => {
    await request(buildApp(['loans.read']).app).post('/api/loans').set('Authorization', 'Bearer token').send(payload).expect(403);
  });
});
