# Sistema de préstamos

Aplicación para la gestión operativa de una casa de préstamos: clientes, préstamos y cuotas, cobros, caja, reportes y consulta de auditoría. El repositorio es un monorepo con npm workspaces; backend y frontend se pueden ejecutar y desplegar por separado.

## Tecnologías

- **Frontend:** Angular 20, TypeScript estricto, componentes standalone, Reactive Forms y Angular Material.
- **Backend:** Node.js, Express 5 y TypeScript.
- **Datos:** PostgreSQL mediante consultas parametrizadas y transacciones para operaciones financieras.
- **Seguridad y operación:** JWT, bcrypt, Helmet, CORS restringible, rate limiting, Joi, Pino, Jest, Jasmine/Karma, ESLint 9 y Prettier.

## Estructura y arquitectura

```text
sistema-prestamos/
├── backend/                 # API REST y migraciones PostgreSQL
├── frontend/                # SPA Angular
├── docs/                    # Contratos HTTP, estándares y operación
├── PrestameEsta/            # Colección local de Bruno (no versionada si contiene secretos)
├── eslint.config.mjs        # Configuración flat de ESLint 9
├── package.json             # Workspaces y scripts raíz
└── .env.example             # Plantilla de configuración local
```

El backend está organizado por dominio y conserva cuatro capas:

```text
backend/src/modules/<dominio>/
├── domain/                  # Entidades, contratos y reglas puras
├── application/             # Casos de uso y orquestación
├── infrastructure/          # PostgreSQL, repositorios y adaptadores
└── interfaces/http/         # Rutas, controladores, DTOs y validadores
```

Los controladores delegan a casos de uso; estos dependen de contratos, no de PostgreSQL. La composición de dependencias se concentra en `backend/src/shared/container`. El frontend separa servicios y seguridad transversal en `core`, componentes reutilizables en `shared` y cada capacidad en `features`.

## Módulos disponibles

| Módulo | Alcance actual |
| --- | --- |
| Autenticación, usuarios y access control | Registro, inicio/cierre de sesión, JWT, roles y permisos. |
| Clientes | Alta, edición, búsqueda, paginación y activación lógica. |
| Préstamos y cuotas | Interés simple, cronograma de cuotas iguales y consulta de detalle. |
| Pagos | Registro parcial/final, prevención de duplicados y anulación. |
| Caja | Apertura, ingresos, egresos, cierre y movimientos automáticos de cobros en efectivo. |
| Reportes | Resumen, cartera, cuotas, cobranza y caja, solo lectura. |
| Auditoría | Consulta paginada de operaciones, solo lectura y sin campos sensibles. |

La lista completa de rutas, permisos, filtros y ejemplos está en [docs/endpoints.md](docs/endpoints.md). Las respuestas siguen el contrato de [docs/standards.md](docs/standards.md).

## Requisitos e instalación

Se requiere Node.js 20.19 o posterior, npm 10 o posterior y PostgreSQL disponible.

```bash
npm install
```

Copie `.env.example` como `.env` en la raíz y reemplace todos los valores de ejemplo. No versionar `.env`; el archivo ya está excluido por `.gitignore`.

Variables necesarias:

| Variable | Uso |
| --- | --- |
| `NODE_ENV` | Entorno de ejecución (`development`, `test` o `production`). |
| `PORT` | Puerto HTTP de la API. |
| `DATABASE_URL` | Cadena de conexión de PostgreSQL. |
| `JWT_ACCESS_SECRET` | Secreto aleatorio de al menos 32 caracteres. |
| `JWT_ACCESS_EXPIRES_IN` | Vigencia del access token, por ejemplo `15m`. |
| `JWT_REFRESH_SECRET` | Secreto reservado para el flujo de renovación. |
| `CORS_ORIGIN` | Origen exacto permitido para el frontend. |
| `LOG_LEVEL` | Nivel de Pino. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Administrador inicial para el seeder. |

## Base de datos

Compile el backend antes de ejecutar los comandos de base de datos, porque los ejecutables de migración y seed se generan en `dist`:

```bash
npm run build --workspace=@sistema-prestamos/backend
npm run db:migrate --workspace=@sistema-prestamos/backend
npm run db:seed --workspace=@sistema-prestamos/backend
```

Las migraciones y el seeder son idempotentes. Ejecute el seeder con cuidado en producción: sincroniza los permisos del administrador inicial y, por diseño actual, vuelve a establecer la contraseña definida por `ADMIN_PASSWORD`.

## Ejecución local

En terminales separadas:

```bash
npm run dev:backend
npm run dev:frontend
```

La API se expone normalmente en `http://localhost:3000/api` y Angular en `http://localhost:4200`. En desarrollo, `frontend/src/environments/environment.development.ts` apunta a la API local; la configuración de producción usa `/api` para que un proxy inverso pueda servir ambas aplicaciones bajo el mismo origen.

## Calidad, pruebas y lint

```bash
npm run build
npm test
npm run lint
npm run format:check
```

`eslint.config.mjs` usa la configuración flat de ESLint 9 con TypeScript y Angular, incluidas plantillas HTML. La regla de variables sin uso admite el prefijo `_` únicamente para descartes explícitos; el resto es un error de lint.

Para pruebas manuales, importe o abra la colección de Bruno en `PrestameEsta/`, configure una variable de entorno para la URL de API y un token temporal, y siga los ejemplos de [docs/endpoints.md](docs/endpoints.md). No guarde tokens ni credenciales reales en archivos `.bru` versionados.

## Flujo operativo

1. Inicie sesión con un usuario autorizado.
2. Registre y valide un cliente activo.
3. Cree el préstamo; el backend calcula el total y genera las cuotas dentro de una transacción.
4. Abra caja antes de registrar un pago en efectivo.
5. Registre pagos contra cuotas pendientes; el backend recalcula saldos y estados.
6. Consulte o cierre caja, incluyendo sus movimientos y diferencias.
7. Consulte reportes y auditoría con los permisos correspondientes.

Los permisos se validan en la API; los guards y botones ocultos de Angular solo mejoran la experiencia y no sustituyen esa validación.

## Preparación para producción

- Use secretos distintos, largos y almacenados en un gestor de secretos; nunca en código, imágenes ni repositorios.
- Defina `NODE_ENV=production`, una `DATABASE_URL` con usuario de mínimo privilegio y `CORS_ORIGIN` con el origen HTTPS exacto.
- Publique detrás de HTTPS y un proxy inverso configurado de forma explícita. Revise también la confianza de proxy antes de usar cabeceras de cliente en producción.
- Mantenga PostgreSQL, Node.js y dependencias con parches de seguridad revisados en una ventana controlada.
- Centralice los logs y confirme que las políticas de retención no recolecten contraseñas, tokens o secretos.
- Realice copias de seguridad cifradas y ensaye su restauración según [docs/backups.md](docs/backups.md).

## Limitaciones actuales

- No existe todavía automatización interna de copias de seguridad ni generación de APK.
- HTTPS, proxy inverso, monitorización y almacenamiento externo de logs son responsabilidades de despliegue.
- El access token expira según `JWT_ACCESS_EXPIRES_IN`; la renovación de sesión no expone aún un endpoint público de refresh token.
- La regla de interés implementada es interés simple con cuotas iguales; productos financieros adicionales requieren una decisión funcional antes de incorporarse.
