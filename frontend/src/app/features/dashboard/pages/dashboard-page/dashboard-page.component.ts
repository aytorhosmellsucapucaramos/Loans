import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import type { InstallmentReport, SystemSummary } from '../../../reports/models/report.model';
import { ReportsService } from '../../../reports/services/reports.service';

export const limaDateKey = (date: Date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
};

@Component({
  selector: 'sp-dashboard-page',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  private readonly api = inject(ReportsService);
  readonly auth = inject(AuthService);
  readonly user$ = this.auth.user$;
  readonly summary = signal<SystemSummary | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly updatedAt = signal<Date | null>(null);
  readonly todayReport = signal<InstallmentReport | null>(null);
  readonly overdueReport = signal<InstallmentReport | null>(null);
  readonly todayLoading = signal(false);
  readonly overdueLoading = signal(false);
  readonly todayError = signal<string | null>(null);
  readonly overdueError = signal<string | null>(null);
  constructor() { if (this.auth.hasPermission('reports.read')) this.load(); }
  load(): void {
    if (!this.auth.hasPermission('reports.read')) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.summary().pipe(finalize(() => this.loading.set(false))).subscribe({ next: (summary) => { this.summary.set(summary); this.updatedAt.set(new Date()); }, error: () => this.error.set('No fue posible cargar el resumen del sistema.') });
    this.loadAgenda();
  }
  loadAgenda(): void {
    if (!this.auth.hasPermission('reports.read')) return;
    const today = limaDateKey();
    this.todayLoading.set(true);
    this.todayError.set(null);
    this.api.installments({ page: 1, pageSize: 5, fromDate: today, toDate: today, status: 'pending' })
      .pipe(finalize(() => this.todayLoading.set(false)))
      .subscribe({ next: (report) => this.todayReport.set(report), error: () => this.todayError.set('No fue posible cargar las cuotas de hoy.') });
    this.overdueLoading.set(true);
    this.overdueError.set(null);
    this.api.installments({ page: 1, pageSize: 5, status: 'overdue' })
      .pipe(finalize(() => this.overdueLoading.set(false)))
      .subscribe({ next: (report) => this.overdueReport.set(report), error: () => this.overdueError.set('No fue posible cargar las cuotas atrasadas.') });
  }
}
