import { AppError, notFound } from '../../../shared/errors/app-error.js';
import type {
  AccessControlRepository,
  CreateRoleInput,
  UpdateRoleInput,
} from '../domain/access-control-repository.js';
import type { Permission } from '../domain/permission.js';
import type { Role } from '../domain/role.js';

export class ListRolesUseCase {
  constructor(private readonly repository: AccessControlRepository) {}
  execute(): Promise<Role[]> { return this.repository.findRoles(); }
}

export class CreateRoleUseCase {
  constructor(private readonly repository: AccessControlRepository) {}
  async execute(input: CreateRoleInput): Promise<Role> {
    if (await this.repository.findRoleByCode(input.code)) {
      throw new AppError(409, 'ROLE_CODE_ALREADY_EXISTS', 'El código del rol ya existe.');
    }
    return this.repository.createRole({ ...input, code: input.code.trim().toLowerCase() });
  }
}

export class UpdateRoleUseCase {
  constructor(private readonly repository: AccessControlRepository) {}
  async execute(id: string, input: UpdateRoleInput): Promise<Role> {
    const role = await this.repository.updateRole(id, input);
    if (!role) throw notFound('Rol');
    return role;
  }
}

export class ListPermissionsUseCase {
  constructor(private readonly repository: AccessControlRepository) {}
  execute(): Promise<Permission[]> { return this.repository.findPermissions(); }
}
