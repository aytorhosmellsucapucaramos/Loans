import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const permissionGuard: CanActivateFn = (route) => {
  const permission = route.data?.['permission'] as string | undefined;
  const auth = inject(AuthService);
  if (!permission || auth.hasPermission(permission)) return true;
  inject(NotificationService).warning('No tienes permiso para acceder a esta sección.');
  return inject(Router).createUrlTree(['/dashboard']);
};
