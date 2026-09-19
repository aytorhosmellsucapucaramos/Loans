import request from 'supertest';

import { createApp } from '../../src/app.js';
import { User } from '../../src/modules/users/domain/user.js';
import type { AppContainer } from '../../src/shared/container/container.js';

const auditEntry = {
  id: '44444444-4444-4444-4444-444444444444',
  user: { id: '11111111-1111-1111-1111-111111111111', email: 'ana@example.com', firstName: 'Ana', lastName: 'Pérez' },
  action: 'payment.registered', entityType: 'payment', entityId: '22222222-2222-2222-2222-222222222222', description: 'Pago registrado.', metadata: { source: 'application' }, ipAddress: null, result: 'success', createdAt: new Date(),
};

const buildApp = (permissions = ['audit.read']) => {
  const user = new User('11111111-1111-1111-1111-111111111111', 'ana@example.com', 'Ana', 'Pérez', 'hash', true, new Date(), new Date(), ['admin'], permissions);
  return createApp({
    users: { findById: jest.fn().mockResolvedValue(user) }, tokenService: { verifyAccessToken: jest.fn().mockReturnValue({ userId: user.id }) },
    listAuditLogs: { execute: jest.fn().mockResolvedValue({ items: [auditEntry], pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }) },
  } as unknown as AppContainer);
};

describe('API HTTP de auditoría', () => {
  it('requiere autenticación y el permiso audit.read', async () => {
    await request(buildApp()).get('/api/audit').expect(401);
    await request(buildApp([])).get('/api/audit').set('Authorization', 'Bearer token').expect(403);
  });

  it('devuelve registros paginados con el formato estándar y sin secretos', async () => {
    const response = await request(buildApp()).get('/api/audit?action=payment.registered&page=1&pageSize=20').set('Authorization', 'Bearer token').expect(200);
    expect(response.body).toMatchObject({ success: true, data: { items: [{ action: 'payment.registered', metadata: { source: 'application' } }], pagination: { total: 1 } }, errors: [] });
    expect(JSON.stringify(response.body)).not.toMatch(/password|token|secret/i);
  });

  it('valida fechas, rangos y filtros UUID', async () => {
    const app = buildApp();
    await request(app).get('/api/audit?fromDate=2026-02-31').set('Authorization', 'Bearer token').expect(400);
    await request(app).get('/api/audit?fromDate=2026-09-02&toDate=2026-09-01').set('Authorization', 'Bearer token').expect(400);
    await request(app).get('/api/audit?userId=invalido').set('Authorization', 'Bearer token').expect(400);
  });
});
