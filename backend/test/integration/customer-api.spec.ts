import request from 'supertest';

import { createApp } from '../../src/app.js';
import { User } from '../../src/modules/users/domain/user.js';
import type { AppContainer } from '../../src/shared/container/container.js';

const customer = {
  id: '44444444-4444-4444-4444-444444444444', documentType: 'DNI', documentNumber: '12345678', firstName: 'María', lastName: 'Quispe',
  phone: '987654321', email: null, address: 'Av. Perú 123, Lima', isActive: true, createdAt: new Date(), updatedAt: new Date(),
};

const buildApp = (permissions = ['customers.read', 'customers.create', 'customers.update'], roles = ['advisor']) => {
  const user = new User('user-1', 'ana@example.com', 'Ana', 'Pérez', 'hash', true, new Date(), new Date(), roles, permissions);
  const container = {
    users: { findById: jest.fn().mockResolvedValue(user) },
    tokenService: { verifyAccessToken: jest.fn().mockReturnValue({ userId: user.id }), signAccessToken: jest.fn() },
    listCustomers: { execute: jest.fn().mockResolvedValue({ items: [customer], pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }) },
    getCustomer: { execute: jest.fn().mockResolvedValue(customer) },
    createCustomer: { execute: jest.fn().mockResolvedValue(customer) },
    updateCustomer: { execute: jest.fn().mockResolvedValue(customer) },
    setCustomerStatus: { execute: jest.fn().mockResolvedValue({ ...customer, isActive: false }) },
  } as unknown as AppContainer;
  return { app: createApp(container), container };
};

const validPayload = { documentType: 'DNI', documentNumber: '12345678', firstName: 'María', lastName: 'Quispe', phone: '987654321', address: 'Av. Perú 123, Lima' };

describe('API HTTP de clientes', () => {
  it('requiere autenticación', async () => {
    await request(buildApp().app).get('/api/customers').expect(401);
  });

  it('autoriza la lista paginada con permiso de lectura', async () => {
    const { app, container } = buildApp();
    const response = await request(app).get('/api/customers?page=1&pageSize=20&search=Qui').set('Authorization', 'Bearer token').expect(200);
    expect(response.body).toMatchObject({ success: true, data: { items: [{ id: customer.id }], pagination: { total: 1 } } });
    expect(container.listCustomers.execute).toHaveBeenCalledWith(expect.objectContaining({ search: 'Qui' }), { userId: 'user-1', isAdmin: false });
  });

  it('omite el filtro de propietario para rol admin', async () => {
    const { app, container } = buildApp(['customers.read'], ['admin']);
    await request(app).get('/api/customers').set('Authorization', 'Bearer token').expect(200);
    expect(container.listCustomers.execute).toHaveBeenCalledWith(expect.any(Object), { userId: 'user-1', isAdmin: true });
  });

  it('aplica alcance propio en detalle y actualización por ID', async () => {
    const { app, container } = buildApp();
    await request(app).get(`/api/customers/${customer.id}`).set('Authorization', 'Bearer token').expect(200);
    await request(app).put(`/api/customers/${customer.id}`).set('Authorization', 'Bearer token').send(validPayload).expect(200);
    expect(container.getCustomer.execute).toHaveBeenCalledWith(customer.id, { userId: 'user-1', isAdmin: false });
    expect(container.updateCustomer.execute).toHaveBeenCalledWith(customer.id, expect.any(Object), 'user-1', false);
  });

  it('crea un cliente con el formato estándar', async () => {
    const { app, container } = buildApp();
    const response = await request(app).post('/api/customers').set('Authorization', 'Bearer token').send(validPayload).expect(201);
    expect(response.body).toMatchObject({ success: true, message: 'Cliente creado correctamente.', data: { id: customer.id }, errors: [] });
    expect(container.createCustomer.execute).toHaveBeenCalledWith(expect.objectContaining(validPayload), 'user-1');
  });

  it('devuelve 400 cuando falta un campo obligatorio', async () => {
    const { firstName: _firstName, ...missingName } = validPayload;
    const response = await request(buildApp().app).post('/api/customers').set('Authorization', 'Bearer token').send(missingName).expect(400);
    expect(response.body).toMatchObject({ success: false, errors: expect.any(Array) });
  });

  it('devuelve 422 cuando el número no corresponde al tipo de documento', async () => {
    const response = await request(buildApp().app).post('/api/customers').set('Authorization', 'Bearer token').send({ ...validPayload, documentNumber: '123' }).expect(422);
    expect(response.body.errors[0]).toMatchObject({ field: 'documentNumber' });
  });

  it('deniega una operación sin el permiso solicitado', async () => {
    const response = await request(buildApp(['customers.read']).app).post('/api/customers').set('Authorization', 'Bearer token').send(validPayload).expect(403);
    expect(response.body.errors[0]).toMatchObject({ code: 'INSUFFICIENT_PERMISSIONS' });
  });
});
