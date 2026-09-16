import { notFound } from '../../../shared/errors/app-error.js';
import type { UpdateUserInput, UserRepository } from '../domain/user-repository.js';
import type { PublicUser } from '../domain/user.js';

export class ListUsersUseCase {
  constructor(private readonly users: UserRepository) {}
  async execute(): Promise<PublicUser[]> {
    return (await this.users.findAll()).map((user) => user.toPublic());
  }
}

export class GetUserUseCase {
  constructor(private readonly users: UserRepository) {}
  async execute(id: string): Promise<PublicUser> {
    const user = await this.users.findById(id);
    if (!user) throw notFound('Usuario');
    return user.toPublic();
  }
}

export class UpdateUserUseCase {
  constructor(private readonly users: UserRepository) {}
  async execute(id: string, input: UpdateUserInput): Promise<PublicUser> {
    const user = await this.users.update(id, input);
    if (!user) throw notFound('Usuario');
    return user.toPublic();
  }
}
