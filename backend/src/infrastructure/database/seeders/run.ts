import { env } from '../../../config/env.js';
import { pool } from '../postgres.js';
import { BcryptPasswordHasher } from '../../../modules/auth/infrastructure/bcrypt-password-hasher.js';

const permissions = [
  ['users.read', 'Consultar usuarios'],
  ['users.create', 'Crear usuarios'],
  ['users.update', 'Actualizar usuarios'],
  ['roles.read', 'Consultar roles'],
  ['roles.create', 'Crear roles'],
  ['roles.update', 'Actualizar roles'],
  ['permissions.read', 'Consultar permisos'],
  ['customers.read', 'Consultar clientes'],
  ['customers.create', 'Registrar clientes'],
  ['customers.update', 'Actualizar clientes'],
  ['loans.read', 'Consultar préstamos'],
  ['loans.create', 'Registrar préstamos'],
  ['loans.update', 'Actualizar préstamos'],
  ['installments.read', 'Consultar cuotas'],
  ['payments.read', 'Consultar pagos'],
  ['payments.create', 'Registrar pagos'],
  ['payments.cancel', 'Anular pagos'],
  ['cash.read', 'Consultar cajas y movimientos'],
  ['cash.open', 'Abrir caja'],
  ['cash.movement.create', 'Registrar movimientos de caja'],
  ['cash.close', 'Cerrar caja'],
  ['reports.read', 'Consultar reportes'],
  ['audit.read', 'Consultar auditoría'],
] as const;

const run = async (): Promise<void> => {
  if (!env.adminEmail || !env.adminPassword) {
    throw new Error('ADMIN_EMAIL y ADMIN_PASSWORD son obligatorias para ejecutar los seeders.');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [code, name] of permissions) {
      await client.query(
        'INSERT INTO permissions (code, name) VALUES ($1, $2) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name', [code, name],
      );
    }
    const adminRole = await client.query<{ id: string }>(
      `INSERT INTO roles (code, name, description) VALUES ('admin', 'Administrador', 'Acceso completo inicial')
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    );
    const roleId = adminRole.rows[0]!.id;
    await client.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT $1, id FROM permissions ON CONFLICT DO NOTHING`, [roleId],
    );
    const passwordHash = await new BcryptPasswordHasher().hash(env.adminPassword);
    const adminUser = await client.query<{ id: string }>(
      `INSERT INTO users (email, first_name, last_name, password_hash)
       VALUES ($1, 'Administrador', 'Inicial', $2)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = TRUE
       RETURNING id`, [env.adminEmail.trim().toLowerCase(), passwordHash],
    );
    await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [adminUser.rows[0]!.id, roleId]);
    await client.query('COMMIT');
    process.stdout.write('Permisos y administrador inicial preparados.\n');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

run().then(() => pool.end()).catch(async (error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  await pool.end();
  process.exitCode = 1;
});
