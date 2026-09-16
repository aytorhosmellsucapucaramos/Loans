import { AppError } from '../../src/shared/errors/app-error.js';
import { RegisterUserUseCase } from '../../src/modules/users/application/register-user.use-case.js';
import type { UserRepository } from '../../src/modules/users/domain/user-repository.js';
import { User } from '../../src/modules/users/domain/user.js';

const user = new User('user-1', 'ana@example.com', 'Ana', 'Pérez', 'hash', true, new Date(), new Date());
const hasher = { hash: jest.fn().mockResolvedValue('hash'), compare: jest.fn() };

describe('RegisterUserUseCase', () => {
  it('normaliza el correo, cifra la contraseña y no expone el hash', async () => {
    const repository: UserRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(user),
      findById: jest.fn(), findAll: jest.fn(), update: jest.fn(),
    };
    const result = await new RegisterUserUseCase(repository, hasher).execute({
      email: ' ANA@EXAMPLE.COM ', password: 'ClaveSegura123!', firstName: 'Ana', lastName: 'Pérez',
    });
    expect(repository.findByEmail).toHaveBeenCalledWith('ana@example.com');
    expect(hasher.hash).toHaveBeenCalledWith('ClaveSegura123!');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rechaza correos duplicados', async () => {
    const repository: UserRepository = {
      findByEmail: jest.fn().mockResolvedValue(user), create: jest.fn(), findById: jest.fn(), findAll: jest.fn(), update: jest.fn(),
    };
    await expect(new RegisterUserUseCase(repository, hasher).execute({
      email: user.email, password: 'ClaveSegura123!', firstName: 'Ana', lastName: 'Pérez',
    })).rejects.toMatchObject<Partial<AppError>>({ statusCode: 409, code: 'EMAIL_ALREADY_EXISTS' });
  });
});
