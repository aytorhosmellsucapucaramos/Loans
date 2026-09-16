import { AppError } from '../../../shared/errors/app-error.js';
import type { PasswordHasher } from '../../auth/domain/auth-services.js';
import type { CreateUserInput, UserRepository } from '../domain/user-repository.js';
import type { PublicUser } from '../domain/user.js';

export type RegisterUserInput = Omit<CreateUserInput, 'passwordHash'> & { password: string };

export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput): Promise<PublicUser> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'El correo electrónico ya está registrado.');

    const user = await this.users.create({
      email,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      passwordHash: await this.passwordHasher.hash(input.password),
      roleIds: input.roleIds,
    });
    return user.toPublic();
  }
}
