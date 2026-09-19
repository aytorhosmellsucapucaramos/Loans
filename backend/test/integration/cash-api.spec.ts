import request from 'supertest';
import { createApp } from '../../src/app.js';
import { User } from '../../src/modules/users/domain/user.js';
import type { AppContainer } from '../../src/shared/container/container.js';

const cashSession = {
  id: '88888888-8888-4888-8888-888888888888',
  status: 'open',
  openingAmount: '10.00',
  expectedClosingAmount: '10.00',
};
const buildApp = (
  permissions = ['cash.read', 'cash.open', 'cash.movement.create', 'cash.close'],
) => {
  const user = new User(
    'user-1',
    'ana@example.com',
    'Ana',
    'Pérez',
    'hash',
    true,
    new Date(),
    new Date(),
    ['admin'],
    permissions,
  );
  return createApp({
    users: { findById: jest.fn().mockResolvedValue(user) },
    tokenService: { verifyAccessToken: jest.fn().mockReturnValue({ userId: user.id }) },
    getCurrentCash: { execute: jest.fn().mockResolvedValue(cashSession) },
    openCash: { execute: jest.fn().mockResolvedValue(cashSession) },
    createCashMovement: {
      execute: jest.fn().mockResolvedValue({ id: 'movement-1', amount: '5.00', type: 'income' }),
    },
    listCashMovements: { execute: jest.fn().mockResolvedValue([]) },
    closeCash: {
      execute: jest
        .fn()
        .mockResolvedValue({ ...cashSession, status: 'closed', differenceAmount: '0.00' }),
    },
    listCashHistory: {
      execute: jest
        .fn()
        .mockResolvedValue({
          items: [cashSession],
          pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
        }),
    },
  } as unknown as AppContainer);
};
describe('API HTTP de caja', () => {
  it('protege las rutas de caja', async () => {
    await request(buildApp()).get('/api/cash/current').expect(401);
    await request(buildApp([]))
      .post('/api/cash/open')
      .set('Authorization', 'Bearer token')
      .send({ openingAmount: 10 })
      .expect(403);
  });
  it('abre, consulta, mueve y cierra bajo el contrato estándar', async () => {
    const app = buildApp();
    await request(app).get('/api/cash/current').set('Authorization', 'Bearer token').expect(200);
    await request(app)
      .post('/api/cash/open')
      .set('Authorization', 'Bearer token')
      .send({ openingAmount: 10 })
      .expect(201);
    await request(app)
      .post(`/api/cash/${cashSession.id}/income`)
      .set('Authorization', 'Bearer token')
      .send({ amount: 5, paymentMethod: 'cash', description: 'Ingreso manual' })
      .expect(201);
    await request(app)
      .get(`/api/cash/${cashSession.id}/movements`)
      .set('Authorization', 'Bearer token')
      .expect(200);
    await request(app)
      .post(`/api/cash/${cashSession.id}/close`)
      .set('Authorization', 'Bearer token')
      .send({ declaredClosingAmount: 15 })
      .expect(200);
    await request(app).get('/api/cash/history').set('Authorization', 'Bearer token').expect(200);
  });
  it('valida importes de caja', async () => {
    await request(buildApp())
      .post('/api/cash/open')
      .set('Authorization', 'Bearer token')
      .send({ openingAmount: 0 })
      .expect(400);
  });
});
