import request from 'supertest';

import { createApp } from '../../src/app.js';
import type { AppContainer } from '../../src/shared/container/container.js';
import { User } from '../../src/modules/users/domain/user.js';

const publicUser = new User('user-1', 'ana@example.com', 'Ana', 'Pérez', 'hash', true, new Date(), new Date()).toPublic();
const container = {
  users: { findById: jest.fn().mockResolvedValue(new User('user-1', 'ana@example.com', 'Ana', 'Pérez', 'hash', true, new Date(), new Date())) },
  tokenService: { verifyAccessToken: jest.fn(), signAccessToken: jest.fn() },
  registerUser: { execute: jest.fn().mockResolvedValue(publicUser) },
  login: { execute: jest.fn().mockResolvedValue({ accessToken: 'jwt-token', user: publicUser }) },
  getUser: { execute: jest.fn().mockResolvedValue(publicUser) },
} as unknown as AppContainer;

const app = createApp(container);

describe('API pública de autenticación', () => {
  it('responde el health check', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body).toMatchObject({ success: true, data: { status: 'ok' } });
  });

  it('registra un usuario validado sin exponer contraseña', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'ana@example.com', password: 'ClaveSegura123!', firstName: 'Ana', lastName: 'Pérez',
    }).expect(201);
    expect(response.body.data).not.toHaveProperty('passwordHash');
    expect(response.body.success).toBe(true);
  });

  it('inicia sesión con el formato estándar', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: 'ana@example.com', password: 'ClaveSegura123!' }).expect(200);
    expect(response.body).toMatchObject({ success: true, data: { accessToken: 'jwt-token' }, errors: [] });
  });
});
