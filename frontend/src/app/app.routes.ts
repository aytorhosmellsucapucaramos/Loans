import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const appRoutes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/feature.routes').then((routes) => routes.AUTH_ROUTES),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/feature.routes').then((routes) => routes.DASHBOARD_ROUTES),
      },
      {
        path: 'users',
        canActivate: [permissionGuard],
        data: { permission: 'users.read' },
        loadChildren: () => import('./features/users/feature.routes').then((routes) => routes.USERS_ROUTES),
      },
      {
        path: 'access-control',
        canActivate: [permissionGuard],
        data: { permission: 'roles.read' },
        loadChildren: () => import('./features/access-control/feature.routes').then((routes) => routes.ACCESS_CONTROL_ROUTES),
      },
      {
        path: 'customers',
        canActivate: [permissionGuard],
        data: { permission: 'customers.read' },
        loadChildren: () => import('./features/customers/customers.routes').then((routes) => routes.CUSTOMERS_ROUTES),
      },
      {
        path: 'loans',
        canActivate: [permissionGuard],
        data: { permission: 'loans.read' },
        loadChildren: () => import('./features/loans/loans.routes').then((routes) => routes.LOANS_ROUTES),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: '' },
];
