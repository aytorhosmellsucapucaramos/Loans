import { AppError, notFound } from '../../../shared/errors/app-error.js';
import type {
  AccessControlRepository,
  CreateRoleInput,
  UpdateRoleInput,
} from '../domain/access-control-repository.js';
import type { Permission } from '../domain/permission.js';
import type { Role } from '../domain/role.js';
import type { AccessControlAuditLogger } from '../domain/access-control-audit-logger.js';

export class ListRolesUseCase {
  constructor(private readonly repository: AccessControlRepository) {}
  execute(): Promise<Role[]> { return this.repository.findRoles(); }
}

export class CreateRoleUseCase {
  constructor(private readonly repository: AccessControlRepository, private readonly audit: AccessControlAuditLogger) {}
  async execute(input: CreateRoleInput, actorId: string): Promise<Role> {
    if (await this.repository.findRoleByCode(input.code)) {
      throw new AppError(409, 'ROLE_CODE_ALREADY_EXISTS', 'El código del rol ya existe.');
    }
    const role = await this.repository.createRole({ ...input, code: input.code.trim().toLowerCase() });
    await this.audit.record('role.created', actorId, role.id);
    return role;
  }
}

export class UpdateRoleUseCase {
  constructor(private readonly repository: AccessControlRepository, private readonly audit: AccessControlAuditLogger) {}
  async execute(id: string, input: UpdateRoleInput, actorId: string): Promise<Role> {
    const role = await this.repository.updateRole(id, input);
    if (!role) throw notFound('Rol');
    await this.audit.record('role.updated', actorId, role.id);
    return role;
  }
}

export class ListPermissionsUseCase {
  constructor(private readonly repository: AccessControlRepository) {}
  execute(): Promise<Permission[]> { return this.repository.findPermissions(); }
}
