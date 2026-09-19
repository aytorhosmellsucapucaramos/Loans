# Android con Capacitor

## Configuración

Capacitor usa `com.prestameesta.app`, nombre `PrestameEsta` y los assets compilados en `frontend/dist/sistema-prestamos-web/browser`. No existen iconos ni splash personalizados en el frontend; Android conserva los recursos base generados por Capacitor hasta que se proporcionen assets de marca.

La aplicación no incluye secretos, contraseñas, JWT ni credenciales. Las URL de API son configuración pública de entorno.

| Escenario | Comando de build | URL API |
| --- | --- | --- |
| Web local | `npm run start` | `http://localhost:3000/api` |
| Emulador Android | `npm run build:android:emulator` | `http://10.0.2.2:3000/api` |
| Dispositivo físico | `npm run build:android:device` | Reemplazar `192.168.1.100` en `environment.android-device.ts` por IP LAN del computador. |
| Producción Android | `npm run build:android:production` | Reemplazar `https://api.example.com/api` por URL HTTPS real. |
| Producción web | `npm run build` | `/api`, detrás del mismo proxy HTTPS. |

`localhost` dentro del teléfono apunta al teléfono. No usarlo para la API del dispositivo.

## Sincronizar Android

Desde `frontend/`, para producción HTTPS:

```powershell
npm run build
npx cap sync android
npx cap open android
```

Para emulador o dispositivo con backend HTTP local, la configuración permite contenido mixto solo en la variante `debug`:

```powershell
npm run build:android:emulator
$env:CAPACITOR_ALLOW_MIXED_CONTENT = 'true'
npx cap sync android
npx cap open android
```

Use `build:android:device` en vez de `build:android:emulator` después de definir IP LAN. Mantenga `CAPACITOR_ALLOW_MIXED_CONTENT` ausente para producción. El manifiesto principal bloquea tráfico HTTP; el manifiesto `debug` lo habilita únicamente para pruebas locales.

## Red local y CORS

- Computador y dispositivo deben compartir red.
- Backend debe escuchar en una interfaz accesible; Node sin host explícito escucha en interfaces disponibles.
- Firewall debe permitir puerto `3000` durante prueba.
- Para WebView Capacitor, configure backend con `CORS_ORIGIN=https://localhost`. Para navegador local, use `http://localhost:4200` en entorno separado.
- Producción debe usar HTTPS válido. No habilite contenido mixto ni tráfico HTTP.

No hay enlaces externos interactivos en la aplicación actual. Si se agregan, integrar un navegador externo mediante plugin dedicado y permitir únicamente URLs HTTPS confiables.

## Navegación y permisos

`MainActivity` devuelve a historial WebView con botón Atrás; sin historial devuelve control a Android. La orientación queda sin bloqueo para que layout Angular responsive se adapte. El único permiso declarado es `INTERNET`.

## APK debug

Abra `frontend/android` en Android Studio. Seleccione variante `debug` y use **Build > Build APK(s)**. Alternativa desde `frontend/android`:

```powershell
.\gradlew.bat assembleDebug
```

Resultado esperado: `app/build/outputs/apk/debug/app-debug.apk`. No usar este APK para distribución ni configurar firma de producción hasta definir URL HTTPS, iconos, política de backup y firma/keystore.
