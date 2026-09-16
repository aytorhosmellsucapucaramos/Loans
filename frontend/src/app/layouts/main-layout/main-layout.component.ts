import { BreakpointObserver } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

type NavigationItem = { label: string; icon: string; path: string; permission?: string };

@Component({
  selector: 'sp-main-layout',
  imports: [AsyncPipe, RouterLink, RouterLinkActive, RouterOutlet, MatButtonModule, MatIconModule, MatListModule, MatSidenavModule, MatToolbarModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);
  readonly auth = inject(AuthService);
  readonly isHandset = toSignal(this.breakpointObserver.observe('(max-width: 767px)').pipe(map((result) => result.matches)), { initialValue: false });
  readonly navigation: NavigationItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Usuarios', icon: 'group', path: '/users', permission: 'users.read' },
    { label: 'Roles y permisos', icon: 'admin_panel_settings', path: '/access-control', permission: 'roles.read' },
    { label: 'Clientes', icon: 'groups', path: '/customers', permission: 'customers.read' },
    { label: 'Préstamos', icon: 'account_balance_wallet', path: '/loans', permission: 'loans.read' },
  ];

  visible(item: NavigationItem): boolean { return !item.permission || this.auth.hasPermission(item.permission); }
  closeOnHandset(drawer: MatSidenav): void { if (this.isHandset()) void drawer.close(); }
  logout(): void { this.auth.logout(); }
}
