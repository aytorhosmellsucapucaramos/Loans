import { AppError } from '../../../shared/errors/app-error.js';
import type { UserRepository } from '../../users/domain/user-repository.js';
import type { PublicUser } from '../../users/domain/user.js';
import type { PasswordHasher, TokenService } from '../domain/auth-services.js';

export type LoginResult = { accessToken: string; user: PublicUser };

export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(email.trim().toLowerCase());
    const validCredentials = user && (await this.passwordHasher.compare(password, user.passwordHash));
    if (!validCredentials) throw new AppError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña inválidos.');
    if (!user.isActive) throw new AppError(403, 'USER_INACTIVE', 'El usuario está inactivo.');

    return {
      accessToken: this.tokenService.signAccessToken({
        userId: user.id,
        email: user.email,
        permissions: user.permissions,
      }),
      user: user.toPublic(),
    };
  }
}
