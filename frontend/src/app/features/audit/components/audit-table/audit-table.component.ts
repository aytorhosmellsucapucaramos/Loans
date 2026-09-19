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
  readonly columns = ['createdAt', 'user', 'action', 'entity', 'entityId', 'description', 'result'];

  actor(entry: AuditEntry): string {
    return entry.user ? `${entry.user.firstName} ${entry.user.lastName}`.trim() || entry.user.email : 'Usuario no disponible';
  }
}
