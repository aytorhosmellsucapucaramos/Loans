# Endpoints — fases uno a nueve

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
| GET | `/api/cash/current` | `cash.read` |
| POST | `/api/cash/open` | `cash.open` |
| POST | `/api/cash/:id/income` | `cash.movement.create` |
| POST | `/api/cash/:id/expense` | `cash.movement.create` |
| GET | `/api/cash/:id/movements` | `cash.read` |
| POST | `/api/cash/:id/close` | `cash.close` |
| GET | `/api/cash/history` | `cash.read` |
| GET | `/api/reports/summary` | `reports.read` |
| GET | `/api/reports/loans` | `reports.read` |
| GET | `/api/reports/installments` | `reports.read` |
| GET | `/api/reports/collections` | `reports.read` |
| GET | `/api/reports/cash` | `reports.read` |
| GET | `/api/audit` | `audit.read` |

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

`GET /api/loans` admite `page`, `pageSize`, `customerId`, `status` (`active`, `paid` o `cancelled`) y `search`, que busca por cliente, documento o identificador de préstamo. Las consultas de préstamos incluyen `customer` con `id`, nombres, apellidos y documento para presentación; `customerId` se conserva como identificador interno. Las cuotas se consultan pero no se modifican directamente durante esta fase.

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

Los pagos se registran contra una cuota específica y el backend recalcula el saldo bajo una transacción PostgreSQL; por ello nunca se acepta un saldo enviado por el cliente. Solo admite pago la primera cuota con saldo pendiente, ordenada por número de cuota. Una cuota parcial bloquea todas las posteriores. Un intento de saltar cuota responde `422 INSTALLMENT_SEQUENCE_REQUIRED` incluso desde Bruno. Los métodos iniciales son `cash`, `bank_transfer`, `yape`, `plin` y `other`. Un pago no se elimina: `PATCH /api/payments/:id/cancel` lo anula y repone el saldo de la cuota.

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

## Caja

Una caja pertenece al usuario que la abre y un mismo usuario solo puede tener una sesión con estado `open`. `GET /api/cash/current` devuelve la sesión abierta del usuario autenticado; `GET /api/cash/history` admite `page`, `pageSize`, `status` y `userId`.

```http
POST /api/cash/open
Authorization: Bearer <accessToken>
Content-Type: application/json

{"openingAmount":100.00,"observations":"Apertura del turno"}
```

```http
POST /api/cash/<cashSessionId>/income
Authorization: Bearer <accessToken>
Content-Type: application/json

{"amount":25.00,"paymentMethod":"cash","description":"Ingreso manual"}
```

`income` y `expense` validan un importe positivo, el método (`cash`, `bank_transfer`, `yape`, `plin`, `other`) y una descripción. El saldo físico esperado considera únicamente movimientos con método `cash`: monto inicial + ingresos − egresos − reversiones.

```http
POST /api/cash/<cashSessionId>/close
Authorization: Bearer <accessToken>
Content-Type: application/json

{"declaredClosingAmount":125.00,"observations":"Cierre conciliado"}
```

Al cerrar, la API persiste los totales, el monto esperado, el declarado y la diferencia (`declarado - esperado`). Una caja cerrada no admite más movimientos ni puede cerrarse otra vez.

Todo pago requiere una caja abierta del usuario que lo registra, sin importar método. La validación bloquea sesión de caja dentro de la misma transacción y responde `422 CASH_SESSION_REQUIRED` si no existe. Los pagos en efectivo crean ingreso; los cobros no físicos no alteran efectivo esperado. La anulación de efectivo crea una reversión vinculada a `paymentId`; si una de las operaciones falla, PostgreSQL revierte ambas.

## Reportes

Todos los endpoints de reportes son de solo lectura y requieren `reports.read`. Las respuestas contienen datos agregados por PostgreSQL y, cuando incluyen detalle, `data.page.items` junto a `data.page.pagination`.

- `GET /api/reports/summary`: clientes activos, préstamos activos, desembolsado, pendiente, cobrado, cuotas vencidas, pagos del día y efectivo esperado de las cajas abiertas.
- `GET /api/reports/loans`: acepta `page`, `pageSize`, `fromDate`, `toDate`, `customerId` y `status`; la fecha se aplica al desembolso.
- `GET /api/reports/installments`: acepta `page`, `pageSize`, `fromDate`, `toDate` y `status`; la fecha se aplica al vencimiento. Una cuota con saldo y vencimiento anterior al día actual en `America/Lima` se reporta como vencida aunque su campo persistido aún no se haya actualizado.
- `GET /api/reports/collections`: acepta `page`, `pageSize`, `fromDate` y `toDate`; considera solo pagos registrados y presenta totales por día y método.
- `GET /api/reports/cash`: acepta `page`, `pageSize`, `fromDate`, `toDate`, `cashSessionId` y `status`; solo los movimientos físicos (`cash`) afectan el saldo esperado.

```http
GET /api/reports/loans?fromDate=2026-09-01&toDate=2026-09-30&status=active&page=1&pageSize=20
Authorization: Bearer <accessToken>
```

Los rangos usan fechas ISO `YYYY-MM-DD`, son inclusivos y requieren que `fromDate` no sea posterior a `toDate`. Los timestamps de caja se delimitan en la zona horaria `America/Lima`.

## Auditoría

`GET /api/audit` es de solo lectura y requiere `audit.read`. Devuelve `data.items` y `data.pagination`, ordenados de forma descendente por `createdAt` (y por identificador como desempate). Cada elemento contiene el usuario responsable —cuando aún existe—, la acción, entidad e identificador afectados, descripción, resultado, metadatos técnicos seguros, dirección IP si fue registrada y fecha/hora. No se devuelven contraseñas, hashes, tokens, secretos ni información bancaria.

Acepta `page` (predeterminado `1`), `pageSize` (predeterminado `20`, máximo `100`), `userId`, `action`, `entityType`, `entityId`, `fromDate`, `toDate`, `result` (`success` o `failure`) y `search`. La búsqueda se aplica a acción, entidad y descripción. Las fechas ISO `YYYY-MM-DD` usan los límites de `America/Lima`; el rango es inclusivo y `fromDate` no puede ser posterior a `toDate`.

```http
GET /api/audit?action=payment.registered&entityType=payment&fromDate=2026-09-01&toDate=2026-09-30&page=1&pageSize=20
Authorization: Bearer <accessToken>
```

```json
{"success":true,"message":"Registros de auditoría obtenidos correctamente.","data":{"items":[{"id":"uuid","user":{"id":"uuid","email":"admin@example.com","firstName":"Administrador","lastName":"Inicial"},"action":"payment.registered","entityType":"payment","entityId":"uuid","description":"Pago registrado.","metadata":{"source":"application"},"ipAddress":null,"result":"success","createdAt":"2026-09-18T12:00:00.000Z"}],"pagination":{"page":1,"pageSize":20,"total":1,"totalPages":1}},"errors":[]}
```
