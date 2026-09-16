import type { Permission } from './permission.js';
import type { Role } from './role.js';

export type CreateRoleInput = {
  code: string;
  name: string;
  description?: string;
  permissionIds: string[];
};

export type UpdateRoleInput = Partial<CreateRoleInput>;

export interface AccessControlRepository {
  findRoles(): Promise<Role[]>;
  createRole(input: CreateRoleInput): Promise<Role>;
  updateRole(id: string, input: UpdateRoleInput): Promise<Role | null>;
  findPermissions(): Promise<Permission[]>;
  findRoleByCode(code: string): Promise<Role | null>;
}
