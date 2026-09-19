# Copias de seguridad PostgreSQL

Este procedimiento es operativo y manual; la aplicación no crea ni programa copias de seguridad. Ejecútelo con una cuenta de PostgreSQL de respaldo y almacene las credenciales fuera del repositorio, preferentemente en un gestor de secretos o en el mecanismo seguro del sistema operativo.

## Crear una copia

Identifique primero la base de datos objetivo de producción y asigne su URL a una variable de entorno de la sesión; no escriba la contraseña en el comando ni en un script versionado.

```powershell
$env:BACKUP_DATABASE_URL = '<URL segura de la base de datos objetivo>'
pg_dump --format=custom --verbose --file '<directorio seguro>\sistema_prestamos_YYYYMMDD_HHMM.dump' --dbname "$env:BACKUP_DATABASE_URL"
```

El formato `custom` permite inspeccionar y restaurar selectivamente con `pg_restore`. Verifique que el archivo se generó, conserve su checksum en un registro operativo y copie la copia a almacenamiento fuera del servidor.

## Restaurar y probar

Nunca ejecute una restauración de prueba sobre la base de datos de producción. Cree una base temporal o de recuperación y apunte una URL distinta hacia ella:

```powershell
$env:RESTORE_DATABASE_URL = '<URL segura de una base de restauración>'
pg_restore --verbose --clean --if-exists --no-owner --dbname "$env:RESTORE_DATABASE_URL" '<directorio seguro>\sistema_prestamos_YYYYMMDD_HHMM.dump'
```

`--clean` elimina objetos en **la base destino** antes de recrearlos. Úselo solamente tras confirmar que `RESTORE_DATABASE_URL` corresponde a un entorno desechable o aprobado. Compruebe después el esquema, un recuento de tablas y un flujo de lectura de la aplicación.

## Protección y retención

- Cifre el archivo antes de trasladarlo fuera del host; use una clave pública o un KMS corporativo y mantenga la clave privada separada de la copia.
- Restringa acceso al directorio de salida y no incluya respaldos ni archivos de configuración con secretos en Git.
- Mantenga, como punto de partida, 7 copias diarias, 4 semanales y 12 mensuales; ajuste la política a los requisitos legales y de recuperación del negocio.
- Registre fecha, tamaño, checksum, ubicación y resultado de cada prueba de restauración.
- Pruebe restauraciones periódicamente. Una copia no verificada no es una estrategia de recuperación.
