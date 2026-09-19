import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

import { NotificationService } from '../../../../core/services/notification.service';
import { AuditFiltersComponent } from '../../components/audit-filters/audit-filters.component';
import { AuditTableComponent } from '../../components/audit-table/audit-table.component';
import type { AuditEntry, AuditResult } from '../../models/audit.model';
import { AuditService } from '../../services/audit.service';

const dateRangeValidator: ValidatorFn = (control): ValidationErrors | null => {
  const fromDate = control.get('fromDate')?.value as string;
  const toDate = control.get('toDate')?.value as string;
  return fromDate && toDate && fromDate > toDate ? { dateRange: true } : null;
};

@Component({
  selector: 'sp-audit-page',
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule, MatPaginatorModule, MatProgressSpinnerModule, AuditFiltersComponent, AuditTableComponent],
  templateUrl: './audit-page.component.html',
  styleUrl: './audit-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditPageComponent {
  private readonly api = inject(AuditService);
  private readonly notifications = inject(NotificationService);
  private readonly builder = inject(FormBuilder);
  readonly filters = this.builder.nonNullable.group({ userId: '', action: '', entityType: '', result: '' as AuditResult | '', search: '', fromDate: '', toDate: '' }, { validators: dateRangeValidator });
  readonly entries = signal<AuditEntry[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    const value = this.filters.getRawValue();
    this.api.list({ page: this.page(), pageSize: this.pageSize(), userId: value.userId.trim() || undefined, action: value.action.trim() || undefined, entityType: value.entityType.trim() || undefined, result: value.result || undefined, search: value.search.trim() || undefined, fromDate: value.fromDate || undefined, toDate: value.toDate || undefined }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (result) => { this.entries.set(result.items); this.total.set(result.pagination.total); this.page.set(result.pagination.page); this.pageSize.set(result.pagination.pageSize); },
      error: () => this.error.set('No fue posible cargar los registros de auditoría.'),
    });
  }

  applyFilters(): void {
    if (this.filters.invalid) { this.filters.markAllAsTouched(); this.notifications.warning('Corrige el rango de fechas antes de filtrar.'); return; }
    this.page.set(1); this.load();
  }

  clearFilters(): void { this.filters.reset({ userId: '', action: '', entityType: '', result: '', search: '', fromDate: '', toDate: '' }); this.page.set(1); this.load(); }
  changePage(event: PageEvent): void { this.page.set(event.pageIndex + 1); this.pageSize.set(event.pageSize); this.load(); }
}
