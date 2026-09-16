import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

const messages: Record<number, string> = {
  400: 'Revisa los datos ingresados.',
  401: 'Tu sesión expiró. Inicia sesión nuevamente.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'No se encontró el recurso solicitado.',
  409: 'La operación entra en conflicto con datos existentes.',
  422: 'No fue posible procesar los datos enviados.',
  429: 'Has realizado demasiadas solicitudes. Intenta nuevamente en unos minutos.',
  500: 'Ocurrió un error interno. Intenta nuevamente más tarde.',
};

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const notifications = inject(NotificationService);
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = error.error?.message ?? messages[error.status] ?? 'No se pudo conectar con el servidor.';
      if (error.status === 401 && !request.url.endsWith('/auth/login')) {
        auth.logout(false);
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      notifications.error(message);
      return throwError(() => error);
    }),
  );
};
