# Supabase PostgreSQL y Render

## Arquitectura

```text
Angular y APK -- HTTPS --> Backend Express en Render -- DATABASE_URL --> PostgreSQL en Supabase
```

Angular y APK nunca se conectan directamente a Supabase. No se usan `SUPABASE_URL`, `SUPABASE_ANON_KEY` ni `SUPABASE_SERVICE_ROLE_KEY`. El único componente con `DATABASE_URL` es backend Express.

Autenticación permanece local: JWT, bcrypt, usuarios, roles, permisos, auditoría, repositorios y transacciones PostgreSQL. No usar Supabase Auth ni API REST de Supabase.

## Compatibilidad verificada

Backend usa solamente `DATABASE_URL` mediante `pg.Pool`. No hay cliente Supabase ni dependencia de su API.

| Capacidad | Estado |
| --- | --- |
| URL PostgreSQL Supabase | Compatible; copiar desde botón **Connect** del proyecto. No inventar ni reconstruir URL. |
| SSL | Producción exige `sslmode=require`, `verify-ca` o `verify-full` en `DATABASE_URL`. `pg` procesa parámetro de URL. |
| Migraciones | Seis migraciones SQL PostgreSQL, registradas transaccionalmente en `schema_migrations`. |
| Transacciones y bloqueos | `BEGIN`/`COMMIT`/`ROLLBACK` y `FOR UPDATE`; PostgreSQL administrado los soporta. |
| Consultas y paginación | Consultas parametrizadas, `LIMIT`/`OFFSET`; sin cambios requeridos. |
| Reportes | Agregaciones SQL y zona `America/Lima`; sin API Supabase. |

Para Render con red IPv4, preferir cadena de **Session Pooler** de Supabase indicada en Connect. Mantiene conexión apta para backend persistente, transacciones y bloqueos. Usar cadena directa solo si Render tiene conectividad IPv6 compatible. No usar Transaction Pooler sin probar flujos que bloquean filas.

## Preparar Supabase

1. Crear proyecto Supabase manualmente y activar MFA en cuenta administradora.
2. En **Connect**, copiar cadena PostgreSQL adecuada; no escribir una URL manual.
3. Guardar cadena solo como `DATABASE_URL` en variables privadas de Render. Para producción debe incluir modo SSL seguro.
4. Ejecutar, una única vez por entorno nuevo:

   ```bash
   npm run build --workspace=@sistema-prestamos/backend
   npm run db:migrate --workspace=@sistema-prestamos/backend
   ```

5. Ejecutar seeder solo bajo control operativo, después de definir `ADMIN_EMAIL` y `ADMIN_PASSWORD`:

   ```bash
   npm run db:seed --workspace=@sistema-prestamos/backend
   ```

6. Confirmar `schema_migrations`, tablas, índices, rol administrador y permisos. Las migraciones son `001-initial-auth`, `002-customers`, `003-loans-installments`, `004-payments`, `005-cash`, `006-audit`.
7. Con backend iniciado, comprobar `GET /api/health`.

No ejecutar seeder al iniciar Render. El seeder actual actualiza contraseña del administrador definido; por eso debe ejecutarse deliberadamente, nunca como Start Command.

Las migraciones usan `CREATE ... IF NOT EXISTS`, índices idempotentes y registro `schema_migrations`. En una base Supabase vacía se ejecutan en orden y cada migración se confirma junto con su registro. No se ejecutaron contra Supabase durante esta preparación.

## Configurar Render

Crear manualmente Web Service desde repositorio. No desplegar todavía.

| Campo | Valor |
| --- | --- |
| Root directory | `.` si repositorio abre directamente este monorepo; usar `sistema-prestamos` solo si existe como subcarpeta del repositorio conectado. |
| Build Command | `npm ci && npm run build --workspace=@sistema-prestamos/backend` |
| Start Command | `npm run start --workspace=@sistema-prestamos/backend` |
| Migraciones | Ejecutar una vez: `npm run db:migrate --workspace=@sistema-prestamos/backend` |
| Health Check Path | `/api/health` |
| Puerto | `PORT` proporcionado por Render; Express escucha `0.0.0.0`. |
| Logs | Pino escribe JSON a stdout; usar `LOG_LEVEL=info` inicialmente. |

Variables privadas requeridas:

```text
NODE_ENV=production
DATABASE_URL=<cadena copiada desde Supabase Connect con sslmode seguro>
JWT_ACCESS_SECRET=<secreto aleatorio de al menos 32 caracteres>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<secreto aleatorio de al menos 32 caracteres>
CORS_ORIGIN=<https://frontend-real>,https://localhost
LOG_LEVEL=info
ADMIN_EMAIL=<correo inicial solo para seeder controlado>
ADMIN_PASSWORD=<contraseña inicial solo para seeder controlado>
```

`CORS_ORIGIN` acepta lista explícita separada por comas. Agregar solo origen HTTPS real del frontend y `https://localhost` para Capacitor cuando corresponda. Nunca usar `*` con credenciales.

## Seguridad y operación

- No incluir `.env`, URL PostgreSQL, contraseñas, JWT ni service role keys en Git, Angular o APK.
- Exigir SSL de Supabase para producción. No desactivar verificación TLS sin decisión de seguridad documentada.
- No activar RLS automáticamente: backend usa conexión PostgreSQL directa y roles SQL actuales; revisar políticas antes de introducir RLS.
- Activar backups disponibles en plan Supabase, definir retención y probar restauración. Procedimiento PostgreSQL: [backups.md](backups.md).
- Para restaurar, usar una base aislada primero; no ejecutar `pg_restore --clean` sobre producción sin autorización explícita.

## Rollback

Si Render no conecta, detener despliegue y revisar `DATABASE_URL`, `sslmode`, pooler, CORS y logs. No borrar tablas ni ejecutar migraciones inversas. El backend local sigue usando su `DATABASE_URL` local mientras no se cambie esa variable.
