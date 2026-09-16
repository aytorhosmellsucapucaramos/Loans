# Loans

## Sistema de préstamos

Base de un monorepo para una casa de préstamos. Esta primera entrega contiene únicamente la estructura, configuraciones y reglas de arquitectura; no implementa los módulos de negocio.

## Arquitectura propuesta

El repositorio usa **npm workspaces** para agrupar dos aplicaciones desplegables de forma independiente:

```text
sistema-prestamos/
├── frontend/                 # SPA Angular
├── backend/                  # API REST Express
├── docs/                     # Decisiones y estándares transversales
├── package.json              # Scripts compartidos y workspaces
└── .env.example              # Referencia de variables locales
```

El backend sigue una arquitectura modular por dominio. Cada módulo conserva sus responsabilidades en cuatro capas:

```text
src/modules/<dominio>/
├── domain/                   # Entidades, value objects, contratos y reglas puras
├── application/              # Casos de uso y servicios de aplicación
├── infrastructure/           # PostgreSQL, proveedores externos y adaptadores técnicos
└── interfaces/http/          # Controladores, rutas, DTOs y validadores HTTP
```

Las dependencias siempre apuntan hacia el dominio. Los controladores no contienen reglas de negocio y los casos de uso dependen de contratos de repositorio, no de PostgreSQL. La composición de dependencias se hará en `backend/src/shared/container`.

El frontend usa una organización por capacidades: `core` para servicios singleton y protección de rutas, `shared` para componentes reutilizables y `features` para las pantallas de cada dominio. Angular Material aportará componentes accesibles, y cada vista se diseñará mobile-first con puntos de quiebre para tableta y escritorio.

## Patrones aplicados con criterio

| Patrón | Uso previsto | Razón |
| --- | --- | --- |
| Repository | Persistencia por agregado | Aísla PostgreSQL y facilita pruebas. |
| Service Layer | Casos de uso de aplicación | Orquesta reglas, repositorios y transacciones. |
| Dependency Injection | Composición de servicios | Hace explícitas las dependencias y permite sustituirlas en pruebas. |
| Factory Method | Creación de préstamos/cuotas relacionados | Centraliza invariantes cuando existan varios productos de préstamo. |
| Strategy | Interés, mora y modalidades de cálculo | Permite añadir políticas sin condicionales crecientes. |
| Adapter | SMS, correo, pasarela de pago u otros terceros | Evita que APIs externas invadan el dominio. |
| Eventos (Observer) | Auditoría y notificaciones | Desacopla efectos posteriores a una operación. |
| Facade | Desembolso, registro de pago y cierre | Ofrece una entrada única para flujos multi-paso. |

No se crearán abstracciones o patrones donde un caso de uso simple no los justifique.

## Dominios previstos

`auth`, `users`, `access-control`, `customers`, `loans`, `installments`, `payments`, `interest`, `cash`, `reports`, `audit` y `settings`.

## Reglas de ingeniería

Las reglas completas están en [docs/standards.md](docs/standards.md) y los endpoints de la primera fase en [docs/endpoints.md](docs/endpoints.md). En resumen:

- **Errores:** una jerarquía de errores de aplicación y un middleware HTTP global producen respuestas homogéneas; no se filtran trazas ni detalles de infraestructura.
- **Validación:** los DTO se validan en el borde HTTP; el dominio vuelve a proteger sus invariantes. Los datos no válidos nunca llegan a un caso de uso.
- **Entorno:** secretos y valores por entorno se leen una sola vez, se validan al iniciar y no se versionan. Copiar `.env.example` a `.env` para desarrollo local.
- **Logging:** logs estructurados con identificador de correlación, nivel y contexto; nunca contraseñas, tokens ni datos financieros completos.
- **Seguridad:** HTTPS en producción, cabeceras seguras, CORS de lista permitida, limitación de peticiones, hash de contraseñas y consultas parametrizadas.
- **Pruebas:** pruebas unitarias para dominio y casos de uso, con repositorios y proveedores simulados; integración separada para HTTP y PostgreSQL.
- **Rutas y acceso:** guards del frontend mejoran la experiencia, pero la API es la autoridad: autentica tokens y comprueba permisos en cada endpoint protegido.
- **Nombres:** inglés para código y nombres explícitos; `kebab-case` para archivos Angular, `camelCase` para variables/funciones, `PascalCase` para tipos/clases y `UPPER_SNAKE_CASE` para variables de entorno.
- **API:** todas las respuestas usan el sobre documentado en `docs/standards.md`, con `data` o `error`, `meta` y `requestId`.

## Inicio posterior

1. Copiar `.env.example` como `.env` en la raíz y completar valores locales.
2. Ejecutar `npm install` desde la raíz cuando se decida fijar el lockfile.
3. Ejecutar `npm run dev:frontend` o `npm run dev:backend`.

La conexión a PostgreSQL, migraciones y módulos de negocio se añadirán en la siguiente fase.
