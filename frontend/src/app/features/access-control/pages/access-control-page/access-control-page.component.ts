import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { forkJoin, switchMap } from 'rxjs';

import type { Permission } from '../../../../core/models/permission.model';
import type { Role } from '../../../../core/models/role.model';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import type { RolePayload } from '../../models/role-form.model';
import { AccessControlApiService } from '../../services/access-control-api.service';
import { RoleFormDialogComponent } from '../../components/role-form-dialog/role-form-dialog.component';

@Component({
  selector: 'sp-access-control-page',
  imports: [MatButtonModule, MatChipsModule, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './access-control-page.component.html',
  styleUrl: './access-control-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessControlPageComponent {
  private readonly api = inject(AccessControlApiService);
  private readonly dialog = inject(MatDialog);
  readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  readonly roles = signal<Role[]>([]);
  readonly permissions = signal<Permission[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly roleColumns = ['name', 'code', 'permissions', 'actions'];
  readonly permissionColumns = ['name', 'code', 'description'];

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    forkJoin({ roles: this.api.listRoles(), permissions: this.api.listPermissions() }).subscribe({
      next: ({ roles, permissions }) => { this.roles.set(roles); this.permissions.set(permissions); this.loading.set(false); },
      error: () => { this.error.set('No fue posible cargar roles y permisos.'); this.loading.set(false); },
    });
  }

  create(): void {
    this.dialog.open(RoleFormDialogComponent, { data: { permissions: this.permissions() }, width: '580px' }).afterClosed().pipe(
      switchMap((payload: RolePayload | undefined) => payload ? this.confirm('Crear rol', '¿Confirmas la creación de este rol?').pipe(switchMap((confirmed) => confirmed ? this.api.createRole(payload) : [])) : []),
    ).subscribe({ next: (role) => { if (role) { this.roles.update((items) => [...items, role]); this.notifications.success('Rol creado correctamente.'); } } });
  }

  edit(role: Role): void {
    this.dialog.open(RoleFormDialogComponent, { data: { role, permissions: this.permissions() }, width: '580px' }).afterClosed().pipe(
      switchMap((payload: RolePayload | undefined) => payload ? this.confirm('Modificar rol', '¿Confirmas los cambios del rol?').pipe(switchMap((confirmed) => confirmed ? this.api.updateRole(role.id, payload) : [])) : []),
    ).subscribe({ next: (updated) => { if (updated) { this.roles.update((items) => items.map((item) => item.id === updated.id ? updated : item)); this.notifications.success('Rol actualizado correctamente.'); } } });
  }

  permissionName(id: string): string { return this.permissions().find((permission) => permission.id === id)?.code ?? id; }
  private confirm(title: string, message: string) { return this.dialog.open(ConfirmDialogComponent, { data: { title, message } }).afterClosed(); }
}
