import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { finalize, switchMap } from 'rxjs';

import type { Role } from '../../../../core/models/role.model';
import type { User } from '../../../../core/models/user.model';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AccessControlApiService } from '../../../access-control/services/access-control-api.service';
import type { CreateUserPayload, UpdateUserPayload } from '../../models/user-form.model';
import { UsersApiService } from '../../services/users-api.service';
import { UserFormDialogComponent } from '../../components/user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'sp-users-page',
  imports: [DatePipe, NgClass, MatButtonModule, MatChipsModule, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPageComponent {
  private readonly usersApi = inject(UsersApiService);
  private readonly accessApi = inject(AccessControlApiService);
  private readonly dialog = inject(MatDialog);
  readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  readonly users = signal<User[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly columns = ['name', 'email', 'roles', 'status', 'createdAt', 'actions'];

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.accessApi.listRoles().subscribe({ next: (roles) => this.roles.set(roles), error: () => undefined });
    this.usersApi.list().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (users) => this.users.set(users),
      error: () => this.error.set('No fue posible cargar los usuarios.'),
    });
  }

  create(): void {
    this.dialog.open(UserFormDialogComponent, { data: { roles: this.roles(), roleIds: [] }, width: '560px' }).afterClosed().pipe(
      switchMap((payload: CreateUserPayload | undefined) => payload ? this.confirm('Crear usuario', '¿Confirmas la creación de este usuario?').pipe(switchMap((confirmed) => confirmed ? this.usersApi.create(payload) : [])) : []),
    ).subscribe({ next: (user) => { if (user) { this.users.update((list) => [user, ...list]); this.notifications.success('Usuario creado correctamente.'); } } });
  }

  edit(user: User): void {
    const roleIds = this.roles().filter((role) => user.roles.includes(role.code)).map((role) => role.id);
    this.dialog.open(UserFormDialogComponent, { data: { user, roles: this.roles(), roleIds }, width: '560px' }).afterClosed().pipe(
      switchMap((payload: UpdateUserPayload | undefined) => payload ? this.confirm('Modificar usuario', '¿Confirmas los cambios del usuario?').pipe(switchMap((confirmed) => confirmed ? this.usersApi.update(user.id, payload) : [])) : []),
    ).subscribe({ next: (updated) => { if (updated) { this.replace(updated); this.notifications.success('Usuario actualizado correctamente.'); } } });
  }

  deactivate(user: User): void {
    this.confirm('Desactivar usuario', `¿Deseas desactivar a ${user.firstName} ${user.lastName}?`).pipe(
      switchMap((confirmed) => confirmed ? this.usersApi.update(user.id, { isActive: false }) : []),
    ).subscribe({ next: (updated) => { if (updated) { this.replace(updated); this.notifications.success('Usuario desactivado correctamente.'); } } });
  }

  private replace(user: User): void { this.users.update((list) => list.map((item) => item.id === user.id ? user : item)); }
  private confirm(title: string, message: string) { return this.dialog.open(ConfirmDialogComponent, { data: { title, message, confirmLabel: 'Confirmar' } }).afterClosed(); }
}
