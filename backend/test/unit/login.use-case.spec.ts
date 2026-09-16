import { LoginUseCase } from '../../src/modules/auth/application/login.use-case.js';
import type { UserRepository } from '../../src/modules/users/domain/user-repository.js';
import { User } from '../../src/modules/users/domain/user.js';

describe('LoginUseCase', () => {
  it('emite un token para credenciales válidas', async () => {
    const user = new User('user-1', 'admin@example.com', 'Admin', 'Inicial', 'hash', true, new Date(), new Date(), ['admin'], ['users.read']);
    const repository: UserRepository = { findByEmail: jest.fn().mockResolvedValue(user), create: jest.fn(), findById: jest.fn(), findAll: jest.fn(), update: jest.fn() };
    const passwords = { hash: jest.fn(), compare: jest.fn().mockResolvedValue(true) };
    const tokens = { signAccessToken: jest.fn().mockReturnValue('jwt-token'), verifyAccessToken: jest.fn() };
    const result = await new LoginUseCase(repository, passwords, tokens).execute(user.email, 'ClaveSegura123!');
    expect(result.accessToken).toBe('jwt-token');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(tokens.signAccessToken).toHaveBeenCalledWith(expect.objectContaining({ userId: user.id }));
  });
});
