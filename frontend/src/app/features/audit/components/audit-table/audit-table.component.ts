import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';

import type { AuditEntry } from '../../models/audit.model';

@Component({
  selector: 'sp-audit-table',
  imports: [DatePipe, NgClass, MatChipsModule, MatTableModule],
  templateUrl: './audit-table.component.html',
  styleUrl: './audit-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditTableComponent {
  @Input({ required: true }) entries: AuditEntry[] = [];
  readonly columns = ['createdAt', 'user', 'description', 'result'];

  actor(entry: AuditEntry): string {
    return entry.user ? `${entry.user.firstName} ${entry.user.lastName}`.trim() || entry.user.email : 'Usuario no disponible';
  }

  description(entry: AuditEntry): string {
    const actions: Record<string, string> = {
      'customer.created': 'Cliente creado', 'customer.updated': 'Cliente actualizado', 'customer.status_changed': 'Estado de cliente actualizado',
      'loan.created': 'Préstamo registrado', 'loan.status_changed': 'Estado de préstamo actualizado',
      'payment.registered': 'Pago registrado', 'payment.cancelled': 'Pago anulado',
      'cash.opened': 'Caja abierta', 'cash.closed': 'Caja cerrada', 'cash.movement_created': 'Movimiento de caja registrado',
      'user.created': 'Usuario creado', 'user.updated': 'Usuario actualizado', 'role.created': 'Rol creado', 'role.updated': 'Rol actualizado',
    };
    return actions[entry.action] ?? entry.description;
  }
}
