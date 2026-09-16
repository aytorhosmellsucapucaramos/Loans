import type { Pool, PoolClient } from 'pg';

import { withTransaction } from '../../../infrastructure/database/postgres.js';
import type { CreateUserInput, UpdateUserInput, UserRepository } from '../domain/user-repository.js';
import { User } from '../domain/user.js';

type UserRow = {
  id: string; email: string; first_name: string; last_name: string; password_hash: string;
  is_active: boolean; created_at: Date; updated_at: Date;
};

type Queryable = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>;

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly database: Pool) {}

  async create(input: CreateUserInput): Promise<User> {
    const id = await withTransaction(async (client) => {
      const inserted = await client.query<UserRow>(
        `INSERT INTO users (email, first_name, last_name, password_hash)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [input.email, input.firstName, input.lastName, input.passwordHash],
      );
      const userId = inserted.rows[0]!.id;
      if (input.roleIds?.length) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id)
           SELECT $1, role_id FROM unnest($2::uuid[]) AS role_id ON CONFLICT DO NOTHING`,
          [userId, input.roleIds],
        );
      }
      return userId;
    });
    return (await this.findById(id))!;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.findOne('email = $1', [email]);
  }

  findById(id: string): Promise<User | null> {
    return this.findOne('id = $1', [id]);
  }

  async findAll(): Promise<User[]> {
    const result = await this.database.query<UserRow>('SELECT * FROM users ORDER BY created_at DESC');
    return Promise.all(result.rows.map((row) => this.hydrate(row, this.database)));
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    const add = (column: string, value: unknown): void => { values.push(value); fields.push(`${column} = $${values.length}`); };
    if (input.firstName !== undefined) add('first_name', input.firstName.trim());
    if (input.lastName !== undefined) add('last_name', input.lastName.trim());
    if (input.isActive !== undefined) add('is_active', input.isActive);

    if (fields.length || input.roleIds !== undefined) {
      await withTransaction(async (client) => {
        if (fields.length) {
          values.push(id);
          const updated = await client.query<UserRow>(
            `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`, values,
          );
          if (!updated.rows[0]) return;
        } else if (!(await client.query('SELECT 1 FROM users WHERE id = $1', [id])).rows[0]) return;
        if (input.roleIds !== undefined) {
          await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
          if (input.roleIds.length) {
            await client.query(
              `INSERT INTO user_roles (user_id, role_id)
               SELECT $1, role_id FROM unnest($2::uuid[]) AS role_id ON CONFLICT DO NOTHING`, [id, input.roleIds],
            );
          }
        }
      });
    }
    return this.findById(id);
  }

  private async findOne(condition: string, values: unknown[]): Promise<User | null> {
    const result = await this.database.query<UserRow>(`SELECT * FROM users WHERE ${condition} LIMIT 1`, values);
    const row = result.rows[0];
    return row ? this.hydrate(row, this.database) : null;
  }

  private async hydrate(row: UserRow, database: Queryable): Promise<User> {
    const [rolesResult, permissionsResult] = await Promise.all([
      database.query<{ code: string }>(
        `SELECT r.code FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = $1 ORDER BY r.code`, [row.id],
      ),
      database.query<{ code: string }>(
        `SELECT DISTINCT p.code FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         JOIN user_roles ur ON ur.role_id = rp.role_id
         WHERE ur.user_id = $1 ORDER BY p.code`, [row.id],
      ),
    ]);
    return new User(
      row.id, row.email, row.first_name, row.last_name, row.password_hash, row.is_active,
      row.created_at, row.updated_at, rolesResult.rows.map((role) => role.code), permissionsResult.rows.map((permission) => permission.code),
    );
  }
}
