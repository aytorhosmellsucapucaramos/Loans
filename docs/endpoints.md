# Endpoints — fases uno a cinco

Todas las respuestas siguen el contrato `success`, `message`, `data` y `errors` definido en [standards.md](standards.md). Las rutas protegidas requieren `Authorization: Bearer <accessToken>`.

| Método | Ruta | Permiso |
| --- | --- | --- |
| GET | `/api/health` | Público |
| POST | `/api/auth/register` | Público |
| POST | `/api/auth/login` | Público |
| GET | `/api/auth/me` | Usuario autenticado |
| GET | `/api/users` | `users.read` |
| GET | `/api/users/:id` | `users.read` |
| POST | `/api/users` | `users.create` |
| PUT | `/api/users/:id` | `users.update` |
| GET | `/api/access-control/roles` | `roles.read` |
| POST | `/api/access-control/roles` | `roles.create` |
| PUT | `/api/access-control/roles/:id` | `roles.update` |
| GET | `/api/access-control/permissions` | `permissions.read` |
| GET | `/api/customers` | `customers.read` |
| GET | `/api/customers/:id` | `customers.read` |
| POST | `/api/customers` | `customers.create` |
| PUT | `/api/customers/:id` | `customers.update` |
| PATCH | `/api/customers/:id/status` | `customers.update` |
| GET | `/api/loans` | `loans.read` |
| GET | `/api/loans/:id` | `loans.read` |
| POST | `/api/loans` | `loans.create` |
| PATCH | `/api/loans/:id/status` | `loans.update` |
| GET | `/api/loans/:loanId/installments` | `installments.read` |
| GET | `/api/installments/:id` | `installments.read` |
| GET | `/api/payments` | `payments.read` |
| GET | `/api/payments/:id` | `payments.read` |
| POST | `/api/payments` | `payments.create` |
| PATCH | `/api/payments/:id/cancel` | `payments.cancel` |
| GET | `/api/loans/:loanId/payments` | `payments.read` |
| GET | `/api/installments/:installmentId/payments` | `payments.read` |

## Ejemplos

```http
POST /api/auth/register
Content-Type: application/json

{"email":"ana@example.com","password":"ClaveSegura123!","firstName":"Ana","lastName":"Pérez"}
```

```json
{"success":true,"message":"Usuario registrado correctamente.","data":{"id":"uuid","email":"ana@example.com","firstName":"Ana","lastName":"Pérez","isActive":true,"roles":[],"permissions":[]},"errors":[]}
```

```http
POST /api/auth/login
Content-Type: application/json

{"email":"admin@example.com","password":"ClaveAdminSegura123!"}
```

```json
{"success":true,"message":"Inicio de sesión realizado correctamente.","data":{"accessToken":"<jwt>","user":{"id":"uuid","email":"admin@example.com"}},"errors":[]}
```

```http
GET /api/users
Authorization: Bearer <accessToken>
```

## Clientes

Los clientes no se eliminan físicamente. `PATCH /api/customers/:id/status` realiza una desactivación o activación lógica. El documento es único por tipo. Los tipos admitidos son `DNI`, `CE`, `PASSPORT` y `RUC`; DNI requiere ocho dígitos y RUC once.

`GET /api/customers` admite `page` (predeterminado `1`), `pageSize` (predeterminado `20`, máximo `100`), `search` (nombres, apellidos o documento) e `isActive`.

```http
POST /api/customers
Authorization: Bearer <accessToken>
Content-Type: application/json

{"documentType":"DNI","documentNumber":"12345678","firstName":"María","lastName":"Quispe","phone":"987654321","email":"maria@example.com","address":"Av. Arequipa 123, Lima"}
```

```json
{"success":true,"message":"Cliente creado correctamente.","data":{"id":"uuid","documentType":"DNI","documentNumber":"12345678","firstName":"María","lastName":"Quispe","phone":"987654321","email":"maria@example.com","address":"Av. Arequipa 123, Lima","isActive":true,"createdAt":"2026-01-01T00:00:00.000Z","updatedAt":"2026-01-01T00:00:00.000Z"},"errors":[]}
```

```http
PATCH /api/customers/:id/status
Authorization: Bearer <accessToken>
Content-Type: application/json

{"isActive":false}
```

Una búsqueda paginada devuelve `data.items` y `data.pagination` con `page`, `pageSize`, `total` y `totalPages`. Las solicitudes inválidas responden `400`; una regla de dominio incumplida puede responder `422`; la falta de sesión, permisos o documento duplicado responde respectivamente `401`, `403` o `409`, siempre con el formato estándar.

## Préstamos y cuotas

`GET /api/loans` admite `page`, `pageSize`, `customerId`, `status` (`active` o `cancelled`) y `search`, que busca por cliente, documento o identificador de préstamo. Las cuotas se consultan pero no se modifican directamente durante esta fase.

```http
POST /api/loans
Authorization: Bearer <accessToken>
Content-Type: application/json

{"customerId":"uuid","principalAmount":1000.00,"interestRate":10,"interestType":"simple","paymentFrequency":"monthly","installmentCount":4,"disbursementDate":"2026-09-15","firstInstallmentDate":"2026-10-15","observations":"Préstamo de prueba"}
```

```json
{"success":true,"message":"Préstamo creado correctamente.","data":{"id":"uuid","customerId":"uuid","principalAmount":"1000.00","interestRate":"10.0000","interestType":"simple","paymentFrequency":"monthly","installmentCount":4,"disbursementDate":"2026-09-15","firstInstallmentDate":"2026-10-15","totalAmount":"1100.00","status":"active","observations":"Préstamo de prueba"},"errors":[]}
```

La fórmula actual es interés simple por la vida del préstamo: `interés = redondeo(principal × tasa porcentual / 100)`. El redondeo se realiza a centavos, con mitad hacia arriba. Las cuotas distribuyen el total de manera uniforme; cualquier diferencia de un centavo se asigna desde las primeras cuotas para que la suma sea exacta.

```http
PATCH /api/loans/:id/status
Authorization: Bearer <accessToken>
Content-Type: application/json

{"status":"cancelled"}
```

## Pagos

Los pagos se registran contra una cuota específica y el backend recalcula el saldo bajo una transacción PostgreSQL; por ello nunca se acepta un saldo enviado por el cliente. Los métodos iniciales son `cash`, `bank_transfer`, `yape`, `plin` y `other`. Un pago no se elimina: `PATCH /api/payments/:id/cancel` lo anula y repone el saldo de la cuota.

```http
POST /api/payments
Authorization: Bearer <accessToken>
Content-Type: application/json

{"loanId":"uuid","installmentId":"uuid","amount":100.00,"paymentMethod":"yape","paymentDate":"2026-09-15","operationReference":"YAPE-123456","observations":"Pago parcial"}
```

```json
{"success":true,"message":"Pago registrado correctamente.","data":{"id":"uuid","loanId":"uuid","installmentId":"uuid","amount":"100.00","paymentMethod":"yape","paymentDate":"2026-09-15","operationReference":"YAPE-123456","status":"registered"},"errors":[]}
```

`GET /api/payments` acepta `page`, `pageSize`, `loanId`, `installmentId` y `status` (`registered` o `cancelled`). Una referencia de operación no vacía no puede repetirse para la misma cuota mientras el pago esté activo. Si no hay referencia (por ejemplo, efectivo), no existe una clave externa determinista para deduplicar pagos y el registro queda sujeto a la confirmación explícita del operador.
