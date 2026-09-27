import { BreakpointObserver } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

type NavigationItem = { label: string; icon: string; path: string; permission?: string };

@Component({
  selector: 'sp-main-layout',
  imports: [AsyncPipe, RouterLink, RouterLinkActive, RouterOutlet, MatButtonModule, MatIconModule, MatListModule, MatMenuModule, MatSidenavModule, MatToolbarModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly isHandset = toSignal(this.breakpointObserver.observe('(max-width: 767px)').pipe(map((result) => result.matches)), { initialValue: false });
  readonly navigation: NavigationItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Usuarios', icon: 'group', path: '/users', permission: 'users.read' },
    { label: 'Roles y permisos', icon: 'admin_panel_settings', path: '/access-control', permission: 'roles.read' },
    { label: 'Clientes', icon: 'groups', path: '/customers', permission: 'customers.read' },
    { label: 'Préstamos', icon: 'account_balance_wallet', path: '/loans', permission: 'loans.read' },
    { label: 'Pagos', icon: 'payments', path: '/payments', permission: 'payments.read' },
    { label: 'Caja', icon: 'point_of_sale', path: '/cash', permission: 'cash.read' },
    { label: 'Reportes', icon: 'analytics', path: '/reports', permission: 'reports.read' },
    { label: 'Auditoría', icon: 'history', path: '/audit', permission: 'audit.read' },
  ];
  private readonly primaryPaths = ['/dashboard', '/customers', '/loans', '/payments'];

  visible(item: NavigationItem): boolean { return !item.permission || this.auth.hasPermission(item.permission); }
  primaryNavigation(): NavigationItem[] { return this.navigation.filter((item) => this.primaryPaths.includes(item.path) && this.visible(item)); }
  moreNavigation(): NavigationItem[] { return this.navigation.filter((item) => !this.primaryPaths.includes(item.path) && this.visible(item)); }
  isActive(item: NavigationItem): boolean { return this.router.isActive(item.path, { paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' }); }
  isMoreActive(): boolean { return this.moreNavigation().some((item) => this.isActive(item)); }
  closeOnHandset(drawer: MatSidenav): void { if (this.isHandset()) void drawer.close(); }
  logout(): void { this.auth.logout(); }
}
