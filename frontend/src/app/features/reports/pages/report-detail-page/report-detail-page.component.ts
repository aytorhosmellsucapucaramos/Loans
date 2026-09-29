import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, type Observable } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import type { Customer } from '../../../customers/models/customer.model';
import { CustomersService } from '../../../customers/services/customers.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ReportEmptyStateComponent } from '../../components/report-empty-state/report-empty-state.component';
import { ReportFiltersComponent } from '../../components/report-filters/report-filters.component';
import {
  type ReportColumn,
  ReportTableComponent,
} from '../../components/report-table/report-table.component';
import { ReportSummaryCardsComponent } from '../../components/report-summary-cards/report-summary-cards.component';
import type {
  CashReport,
  CollectionReport,
  InstallmentReport,
  LoanReport,
  ReportExportFilters,
  ReportExportItem,
  ReportKind,
} from '../../models/report.model';
import { ReportsService } from '../../services/reports.service';
import type { ExcelColumn } from '../../services/report-excel-export.service';
import { ReportExcelExportService } from '../../services/report-excel-export.service';
const kinds: ReportKind[] = ['loans', 'installments', 'collections', 'cash'];
const labels: Record<ReportKind, string> = {
  loans: 'Cartera de préstamos',
  installments: 'Cuotas',
  collections: 'Cobranza',
  cash: 'Caja',
};
const descriptions: Record<ReportKind, string> = {
  loans: 'Préstamos, capital, intereses y saldos pendientes.',
  installments: 'Cuotas por vencimiento, estado y saldo pendiente.',
  collections: 'Pagos registrados, organizados por fecha y método.',
  cash: 'Sesiones de caja, movimientos y diferencias de cierre.',
};
@Component({
  selector: 'sp-report-detail-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    ReportEmptyStateComponent,
    ReportFiltersComponent,
    ReportSummaryCardsComponent,
    ReportTableComponent,
  ],
  templateUrl: './report-detail-page.component.html',
  styleUrl: './report-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ReportsService);
  private readonly customersApi = inject(CustomersService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly excelExporter = inject(ReportExcelExportService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly builder = inject(FormBuilder);
  readonly kind = signal<ReportKind>('loans');
  readonly title = computed(() => labels[this.kind()]);
  readonly description = computed(() => descriptions[this.kind()]);
  readonly canExport = this.auth.hasPermission('reports.read');
  readonly filters = this.builder.nonNullable.group(
    {
      fromDate: ['', [Validators.pattern(/^$|^\d{4}-\d{2}-\d{2}$/)]],
      toDate: ['', [Validators.pattern(/^$|^\d{4}-\d{2}-\d{2}$/)]],
      status: [''],
      customerId: [''],
    },
    {
      validators: (group) => {
        const from = group.get('fromDate')?.value as string;
        const to = group.get('toDate')?.value as string;
        return from && to && from > to ? { dateRange: true } : null;
      },
    },
  );
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly report = signal<LoanReport | InstallmentReport | CollectionReport | CashReport | null>(
    null,
  );
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly customers = signal<Customer[]>([]);
  readonly appliedFilters = signal<ReportExportFilters>({});
  readonly activeFilterTags = computed(() => this.filterTags(this.appliedFilters()));
  readonly exporting = signal(false);
  readonly exportPhase = signal<'data' | 'workbook'>('data');
  readonly exportProgress = signal({ page: 0, totalPages: 0 });
  readonly exportError = signal<string | null>(null);
  readonly total = computed(() => this.report()?.page.pagination.total ?? 0);
  readonly rows = computed<Record<string, unknown>[]>(
    () => (this.report()?.page.items ?? []) as unknown as Record<string, unknown>[],
  );
  readonly columns = computed<ReportColumn[]>(() =>
    this.kind() === 'loans'
      ? [
          { key: 'customerName', label: 'Cliente' },
          { key: 'disbursementDate', label: 'Desembolso', kind: 'date' },
          { key: 'principalAmount', label: 'Capital', kind: 'money' },
          { key: 'interestAmount', label: 'Interés', kind: 'money' },
          { key: 'outstandingAmount', label: 'Pendiente', kind: 'money' },
          { key: 'status', label: 'Estado', kind: 'status' },
        ]
      : this.kind() === 'installments'
        ? [
            { key: 'customerName', label: 'Cliente' },
            { key: 'installmentNumber', label: 'Cuota' },
            { key: 'dueDate', label: 'Vencimiento', kind: 'date' },
            { key: 'principalAmount', label: 'Capital', kind: 'money' },
            { key: 'interestAmount', label: 'Interés', kind: 'money' },
            { key: 'outstandingAmount', label: 'Pendiente', kind: 'money' },
            { key: 'status', label: 'Estado', kind: 'status' },
          ]
        : this.kind() === 'collections'
          ? [
              { key: 'paymentDate', label: 'Fecha', kind: 'date' },
              { key: 'paymentMethod', label: 'Método', kind: 'status' },
              { key: 'amount', label: 'Monto', kind: 'money' },
              { key: 'operationReference', label: 'Referencia' },
            ]
          : [
              { key: 'openedAt', label: 'Apertura', kind: 'date' },
              { key: 'status', label: 'Estado', kind: 'status' },
              { key: 'incomeAmount', label: 'Ingresos', kind: 'money' },
              { key: 'expenseAmount', label: 'Egresos', kind: 'money' },
              { key: 'reversalAmount', label: 'Reversiones', kind: 'money' },
              { key: 'expectedBalance', label: 'Esperado', kind: 'money' },
              { key: 'differenceAmount', label: 'Diferencia', kind: 'money' },
            ],
  );
  constructor() {
    const value = this.route.snapshot.paramMap.get('type');
    if (!value || !kinds.includes(value as ReportKind)) {
      void this.router.navigate(['/reports']);
      return;
    }
    this.kind.set(value as ReportKind);
    if (this.kind() === 'loans' && this.auth.hasPermission('customers.read')) this.loadCustomers();
    this.load();
  }
  cards(): { label: string; value: string | number; money?: boolean }[] {
    const report = this.report();
    if (!report) return [];
    if (this.kind() === 'loans') {
      const data = report as LoanReport;
      return [
        { label: 'Préstamos', value: data.totals.loanCount },
        { label: 'Capital', value: data.totals.principalAmount, money: true },
        { label: 'Intereses', value: data.totals.interestAmount, money: true },
        { label: 'Pendiente', value: data.totals.outstandingAmount, money: true },
      ];
    }
    if (this.kind() === 'installments') {
      const data = report as InstallmentReport;
      return [
        { label: 'Pendientes', value: data.totals.pendingCount },
        { label: 'Pagadas', value: data.totals.paidCount },
        { label: 'Vencidas', value: data.totals.overdueCount },
        { label: 'Total pendiente', value: data.totals.outstandingAmount, money: true },
      ];
    }
    if (this.kind() === 'collections') {
      const data = report as CollectionReport;
      return [
        { label: 'Pagos', value: data.totals.paymentCount },
        { label: 'Total cobrado', value: data.totals.totalAmount, money: true },
        { label: 'Métodos', value: data.totals.byMethod.length },
        { label: 'Días con cobros', value: data.totals.byDay.length },
      ];
    }
    const data = report as CashReport;
    return [
      { label: 'Ingresos', value: data.totals.incomeAmount, money: true },
      { label: 'Egresos', value: data.totals.expenseAmount, money: true },
      { label: 'Reversiones', value: data.totals.reversalAmount, money: true },
      { label: 'Saldo esperado', value: data.totals.expectedBalance, money: true },
    ];
  }
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const filters = this.appliedFilters();
    const base = {
      page: this.page(),
      pageSize: this.pageSize(),
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    };
    const request: Observable<LoanReport | InstallmentReport | CollectionReport | CashReport> =
      this.kind() === 'loans'
        ? this.api.loans({
            ...base,
            customerId: filters.customerId,
            status: filters.status as never,
          })
        : this.kind() === 'installments'
          ? this.api.installments({ ...base, status: filters.status as never })
          : this.kind() === 'collections'
            ? this.api.collections(base)
            : this.api.cash({ ...base, status: filters.status as never });
    request
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (report) => this.report.set(report),
        error: () => this.error.set('No fue posible cargar el reporte solicitado.'),
      });
  }
  apply(): void {
    if (this.filters.invalid) {
      this.filters.markAllAsTouched();
      return;
    }
    this.appliedFilters.set(this.readFilters());
    this.page.set(1);
    this.load();
  }
  clear(): void {
    this.filters.reset({ fromDate: '', toDate: '', status: '', customerId: '' });
    this.appliedFilters.set({});
    this.page.set(1);
    this.load();
  }
  changePage(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.load();
  }
  back(): void {
    void this.router.navigate(['/reports']);
  }

  exportReport(): void {
    if (!this.canExport || this.exporting()) return;
    if (this.filters.invalid) {
      this.filters.markAllAsTouched();
      this.exportError.set('Corrige los filtros antes de exportar.');
      return;
    }
    const selectedFilters = this.readFilters();
    const needsRefresh = JSON.stringify(this.appliedFilters()) !== JSON.stringify(selectedFilters) || this.page() !== 1;
    this.appliedFilters.set(selectedFilters);
    this.page.set(1);
    this.exporting.set(true);
    this.exportPhase.set('data');
    this.exportProgress.set({ page: 0, totalPages: 0 });
    this.exportError.set(null);
    const filters = selectedFilters;
    if (needsRefresh) this.load();
    this.api.allPages(this.kind(), filters, (page, totalPages) => this.exportProgress.set({ page, totalPages }))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.exportPhase.set('workbook');
          void this.buildAndDownload(items, filters);
        },
        error: () => {
          this.exporting.set(false);
          this.exportError.set('No se pudo obtener el reporte completo. No se descargó un archivo parcial.');
          this.notifications.error('No fue posible completar la exportación.');
        },
      });
  }

  private async buildAndDownload(items: ReportExportItem[], filters: ReportExportFilters): Promise<void> {
    try {
      const generatedAt = new Date();
      const definition = this.exportDefinition();
      const rows = items.map((item) => definition.columns.map((column) => this.exportValue(item, column)));
      const bytes = await this.excelExporter.build({
        title: this.title(),
        sheetName: definition.sheetName,
        generatedAt,
        appliedFilters: this.filterSummary(filters),
        columns: definition.columns,
        rows,
      });
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-${this.kind()}-${this.limaDate(generatedAt)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      this.notifications.success('Reporte Excel descargado.');
    } catch (error) {
      const message = error instanceof RangeError ? error.message : 'No se pudo preparar el archivo Excel. No se descargó un archivo parcial.';
      this.exportError.set(message);
      this.notifications.error('No fue posible preparar el archivo Excel.');
    } finally {
      this.exporting.set(false);
    }
  }

  private exportDefinition(): { sheetName: string; columns: ExcelColumn[] } {
    const definitions: Record<ReportKind, { sheetName: string; columns: ExcelColumn[] }> = {
      loans: { sheetName: 'Cartera', columns: [
        { key: 'customerName', label: 'Cliente', kind: 'text', width: 28 }, { key: 'disbursementDate', label: 'Fecha de desembolso', kind: 'date', width: 19 },
        { key: 'principalAmount', label: 'Capital prestado (S/)', kind: 'money', width: 20 }, { key: 'interestAmount', label: 'Interés (S/)', kind: 'money', width: 16 },
        { key: 'outstandingAmount', label: 'Saldo pendiente (S/)', kind: 'money', width: 21 }, { key: 'status', label: 'Estado', kind: 'text', width: 16 },
      ] },
      installments: { sheetName: 'Cuotas', columns: [
        { key: 'customerName', label: 'Cliente', kind: 'text', width: 28 }, { key: 'installmentNumber', label: 'Número de cuota', kind: 'number', width: 17 },
        { key: 'dueDate', label: 'Fecha de vencimiento', kind: 'date', width: 20 }, { key: 'principalAmount', label: 'Capital (S/)', kind: 'money', width: 16 },
        { key: 'interestAmount', label: 'Interés (S/)', kind: 'money', width: 16 }, { key: 'outstandingAmount', label: 'Saldo pendiente (S/)', kind: 'money', width: 21 }, { key: 'status', label: 'Estado', kind: 'text', width: 16 },
      ] },
      collections: { sheetName: 'Cobranza', columns: [
        { key: 'paymentDate', label: 'Fecha de pago', kind: 'date', width: 18 }, { key: 'paymentMethod', label: 'Método de pago', kind: 'text', width: 20 },
        { key: 'amount', label: 'Monto (S/)', kind: 'money', width: 17 }, { key: 'operationReference', label: 'Referencia', kind: 'text', width: 30 },
      ] },
      cash: { sheetName: 'Caja', columns: [
        { key: 'openedAt', label: 'Fecha de apertura', kind: 'datetime', width: 21 }, { key: 'closedAt', label: 'Fecha de cierre', kind: 'datetime', width: 21 },
        { key: 'status', label: 'Estado', kind: 'text', width: 15 }, { key: 'openingAmount', label: 'Saldo inicial (S/)', kind: 'money', width: 19 },
        { key: 'incomeAmount', label: 'Ingresos (S/)', kind: 'money', width: 17 }, { key: 'expenseAmount', label: 'Egresos (S/)', kind: 'money', width: 17 },
        { key: 'reversalAmount', label: 'Reversiones (S/)', kind: 'money', width: 19 }, { key: 'expectedBalance', label: 'Saldo esperado (S/)', kind: 'money', width: 22 }, { key: 'differenceAmount', label: 'Diferencia (S/)', kind: 'money', width: 18 },
      ] },
    };
    return definitions[this.kind()];
  }

  private exportValue(item: ReportExportItem, column: ExcelColumn): string | number | Date | null {
    const row = item as unknown as Record<string, unknown>;
    const value = row[column.key];
    if (value === null || value === undefined) return null;
    if (column.kind === 'money' || column.kind === 'number') {
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    }
    if (column.kind === 'date' || column.kind === 'datetime') return String(value);
    return this.friendlyValue(String(value));
  }

  private friendlyValue(value: string): string {
    const labels: Record<string, string> = {
      active: 'Activo', paid: 'Pagado', cancelled: 'Cancelado', pending: 'Pendiente', overdue: 'Vencida', open: 'Abierta', closed: 'Cerrada',
      cash: 'Efectivo', bank_transfer: 'Transferencia bancaria', yape: 'Yape', plin: 'Plin', other: 'Otro',
    };
    return labels[value] ?? value;
  }

  private filterTags(filters: ReportExportFilters): { label: string; value: string }[] {
    const tags: { label: string; value: string }[] = [];
    if (filters.fromDate) tags.push({ label: 'Desde', value: this.displayDate(filters.fromDate) });
    if (filters.toDate) tags.push({ label: 'Hasta', value: this.displayDate(filters.toDate) });
    if (filters.customerId) {
      const customer = this.customers().find((item) => item.id === filters.customerId);
      tags.push({ label: 'Cliente', value: customer ? `${customer.firstName} ${customer.lastName}` : 'Cliente seleccionado' });
    }
    if (filters.status) tags.push({ label: 'Estado', value: this.friendlyValue(filters.status) });
    return tags;
  }

  private filterSummary(filters: ReportExportFilters): string {
    const tags = this.filterTags(filters);
    return tags.length ? tags.map((tag) => `${tag.label}: ${tag.value}`).join(' · ') : 'Sin filtros';
  }

  private displayDate(value: string): string { return `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`; }
  private limaDate(value: Date): string { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value); }

  private readFilters(): ReportExportFilters {
    const raw = this.filters.getRawValue();
    return {
      fromDate: raw.fromDate || undefined,
      toDate: raw.toDate || undefined,
      customerId: raw.customerId.trim() || undefined,
      status: (raw.status || undefined) as ReportExportFilters['status'],
    };
  }

  private loadCustomers(): void {
    this.customersApi.list({ page: 1, pageSize: 100, isActive: true }).subscribe({ next: (result) => this.customers.set(result.items), error: () => undefined });
  }
}
