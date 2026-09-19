import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import type { SystemSummary } from '../../../reports/models/report.model';
import { ReportsService } from '../../../reports/services/reports.service';

@Component({
  selector: 'sp-dashboard-page',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
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
  constructor() { if (this.auth.hasPermission('reports.read')) this.load(); }
  load(): void { if (!this.auth.hasPermission('reports.read')) return; this.loading.set(true); this.error.set(null); this.api.summary().pipe(finalize(() => this.loading.set(false))).subscribe({ next: (summary) => { this.summary.set(summary); this.updatedAt.set(new Date()); }, error: () => this.error.set('No fue posible cargar el resumen del sistema.') }); }
}
