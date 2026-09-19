# Disponibilidad en Render Free

Render Free puede suspender el servicio después de inactividad. El primer acceso puede tardar mientras Render inicia backend.

Frontend muestra “Estamos despertando el servidor” y reintenta solo solicitudes `GET` de red o timeout, hasta dos veces. Nunca repite automáticamente `POST`, `PUT`, `PATCH` ni operaciones financieras.

Para disponibilidad continua, usar un plan Render siempre activo o proveedor equivalente. No usar pings falsos, datos simulados ni desactivar controles de seguridad.
