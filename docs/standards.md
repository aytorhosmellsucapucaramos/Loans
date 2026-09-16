# Estándares transversales

## API REST

Prefijo: `/api`. Los controladores devuelven siempre JSON con una de estas formas:

```json
{
  "success": true,
  "message": "Operación realizada correctamente",
  "data": {},
  "errors": []
}
```

```json
{
  "success": false,
  "message": "No se pudo realizar la operación",
  "data": null,
  "errors": [{ "code": "VALIDATION_ERROR", "field": "amount", "message": "Debe ser mayor que cero." }]
}
```

Los códigos de error son estables y se incluyen dentro de `errors`; no se exponen detalles internos. El middleware global traduce errores conocidos a 4xx y cualquier error inesperado a `INTERNAL_ERROR` (500), dejando el detalle únicamente en los logs. El identificador de correlación se mantiene exclusivamente en logs técnicos.

## Validación y errores

- Validar `params`, `query` y `body` mediante esquemas en `interfaces/http/validators`.
- Transformar la entrada a DTO tipados antes de invocar un caso de uso.
- Modelar invariantes de negocio en entidades/value objects, independientemente de HTTP.
- Lanzar errores de dominio o aplicación con código semántico; un único middleware los serializa.

## Variables de entorno

- Se cargan en `backend/src/config` y se validan al inicio con un esquema tipado.
- `.env` y cualquier secreto se ignoran por Git; `.env.example` contiene solo claves y valores inocuos.
- Rotar secretos fuera del repositorio y usar almacenes de secretos en producción.

Variables iniciales:

| Variable | Propósito |
| --- | --- |
| `NODE_ENV` | Entorno de ejecución. |
| `PORT` | Puerto HTTP de la API. |
| `DATABASE_URL` | Cadena de conexión PostgreSQL. |
| `JWT_ACCESS_SECRET` | Firma de tokens de acceso. |
| `JWT_REFRESH_SECRET` | Firma de tokens de renovación. |
| `CORS_ORIGIN` | Origen permitido del frontend. |
| `LOG_LEVEL` | Nivel de logging. |

## Logging y auditoría

- Emplear logging estructurado (`debug`, `info`, `warn`, `error`) con `requestId`, actor y contexto.
- Enmascarar PII sensible, credenciales, tokens, cuentas y montos que no deban aparecer en logs técnicos.
- Publicar eventos de aplicación tras confirmar una transacción. Los manejadores de auditoría y notificaciones son independientes y tolerantes a reintentos.

## Seguridad y acceso

- Tokens de corta duración y renovación revocable; contraseñas con Argon2 o bcrypt.
- `helmet`, CORS restringido, rate limiting, límites de tamaño de cuerpo y protección frente a enumeración de usuarios.
- Usar siempre consultas parametrizadas y una cuenta PostgreSQL con privilegios mínimos.
- Autorización basada en permisos, no solo roles: un rol agrupa permisos y cada endpoint declara los permisos requeridos.
- El frontend usa guards e interceptor de autenticación; el backend vuelve a autenticar y autorizar todo recurso protegido.

## Calidad

- TypeScript estricto, ESLint y Prettier en ambos paquetes.
- Pruebas unitarias con Jest: entidades, estrategias y casos de uso con dobles de prueba.
- Pruebas de integración separadas para repositorios PostgreSQL, rutas HTTP y adaptadores.
- Antes de fusionar: `lint`, `test` y `build` en ambos paquetes.

## Convenciones de nombres

- Código: inglés; textos visibles al usuario: español.
- Archivos Angular: `feature-name.component.ts`, `feature-name.service.ts`, `feature-name.guard.ts`.
- Backend: `create-loan.use-case.ts`, `loan.repository.ts`, `postgres-loan.repository.ts`.
- Clases, interfaces, DTO y enums: `PascalCase`; variables y funciones: `camelCase`; constantes: `UPPER_SNAKE_CASE` cuando sean verdaderas constantes de módulo.
- Un archivo exporta una responsabilidad principal. Evitar sufijos genéricos como `utils` o `helpers` cuando pueda usarse un nombre del dominio.
