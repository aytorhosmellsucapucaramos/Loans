import type { Pool } from 'pg';

import { withTransaction } from '../../../infrastructure/database/postgres.js';
import type {
  AccessControlRepository,
  CreateRoleInput,
  UpdateRoleInput,
} from '../domain/access-control-repository.js';
import { Permission } from '../domain/permission.js';
import { Role } from '../domain/role.js';

type RoleRow = { id: string; code: string; name: string; description: string | null; permission_ids: string[] };

const roleQuery = `
  SELECT r.id, r.code, r.name, r.description,
         COALESCE(array_agg(rp.permission_id) FILTER (WHERE rp.permission_id IS NOT NULL), '{}') AS permission_ids
  FROM roles r LEFT JOIN role_permissions rp ON rp.role_id = r.id`;

const toRole = (row: RoleRow): Role => new Role(row.id, row.code, row.name, row.description, row.permission_ids);

export class PostgresAccessControlRepository implements AccessControlRepository {
  constructor(private readonly database: Pool) {}

  async findRoles(): Promise<Role[]> {
    const result = await this.database.query<RoleRow>(`${roleQuery} GROUP BY r.id ORDER BY r.name`);
    return result.rows.map(toRole);
  }

  async createRole(input: CreateRoleInput): Promise<Role> {
    const id = await withTransaction(async (client) => {
      const result = await client.query<{ id: string }>(
        'INSERT INTO roles (code, name, description) VALUES ($1, $2, $3) RETURNING id',
        [input.code, input.name.trim(), input.description?.trim() || null],
      );
      const roleId = result.rows[0]!.id;
      await this.replacePermissions(client, roleId, input.permissionIds);
      return roleId;
    });
    return (await this.findRoleById(id))!;
  }

  async updateRole(id: string, input: UpdateRoleInput): Promise<Role | null> {
    await withTransaction(async (client) => {
      const fields: string[] = [];
      const values: unknown[] = [];
      const add = (column: string, value: unknown): void => { values.push(value); fields.push(`${column} = $${values.length}`); };
      if (input.code !== undefined) add('code', input.code.trim().toLowerCase());
      if (input.name !== undefined) add('name', input.name.trim());
      if (input.description !== undefined) add('description', input.description.trim() || null);
      if (fields.length) {
        values.push(id);
        const result = await client.query(
          `UPDATE roles SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING id`, values,
        );
        if (!result.rows[0]) return;
      } else if (!(await client.query('SELECT 1 FROM roles WHERE id = $1', [id])).rows[0]) return;
      if (input.permissionIds !== undefined) await this.replacePermissions(client, id, input.permissionIds);
    });
    return this.findRoleById(id);
  }

  async findPermissions(): Promise<Permission[]> {
    const result = await this.database.query<{ id: string; code: string; name: string; description: string | null }>(
      'SELECT id, code, name, description FROM permissions ORDER BY code',
    );
    return result.rows.map((row) => new Permission(row.id, row.code, row.name, row.description));
  }

  async findRoleByCode(code: string): Promise<Role | null> {
    const result = await this.database.query<RoleRow>(`${roleQuery} WHERE r.code = $1 GROUP BY r.id`, [code]);
    return result.rows[0] ? toRole(result.rows[0]) : null;
  }

  private async findRoleById(id: string): Promise<Role | null> {
    const result = await this.database.query<RoleRow>(`${roleQuery} WHERE r.id = $1 GROUP BY r.id`, [id]);
    return result.rows[0] ? toRole(result.rows[0]) : null;
  }

  private async replacePermissions(client: { query: Pool['query'] }, roleId: string, permissionIds: string[]): Promise<void> {
    await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
    if (permissionIds.length) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         SELECT $1, permission_id FROM unnest($2::uuid[]) AS permission_id ON CONFLICT DO NOTHING`,
        [roleId, permissionIds],
      );
    }
  }
}
