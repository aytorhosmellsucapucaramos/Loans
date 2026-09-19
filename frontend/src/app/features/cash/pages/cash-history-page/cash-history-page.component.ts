import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import type { CashSession, CashSessionStatus } from '../../models/cash.model';
import { CashService } from '../../services/cash.service';
@Component({ selector: 'sp-cash-history-page', imports: [CurrencyPipe, DatePipe, NgClass, ReactiveFormsModule, MatButtonModule, MatChipsModule, MatFormFieldModule, MatIconModule, MatPaginatorModule, MatProgressSpinnerModule, MatSelectModule, MatTableModule], templateUrl: './cash-history-page.component.html', styleUrl: './cash-history-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class CashHistoryPageComponent { private readonly api = inject(CashService); private readonly router = inject(Router); private readonly builder = inject(FormBuilder); readonly filters = this.builder.nonNullable.group({ status: '' as CashSessionStatus | '' }); readonly sessions = signal<CashSession[]>([]); readonly loading = signal(true); readonly error = signal<string | null>(null); readonly total = signal(0); readonly page = signal(1); readonly pageSize = signal(20); readonly columns = ['openedAt', 'status', 'opening', 'income', 'expenses', 'expected', 'declared', 'difference']; constructor() { this.load(); } load(): void { this.loading.set(true); this.error.set(null); const status = this.filters.controls.status.value || undefined; this.api.history({ page: this.page(), pageSize: this.pageSize(), status }).pipe(finalize(() => this.loading.set(false))).subscribe({ next: (result) => { this.sessions.set(result.items); this.total.set(result.pagination.total); this.page.set(result.pagination.page); this.pageSize.set(result.pagination.pageSize); }, error: () => this.error.set('No fue posible cargar el historial de cajas.') }); } apply(): void { this.page.set(1); this.load(); } changePage(event: PageEvent): void { this.page.set(event.pageIndex + 1); this.pageSize.set(event.pageSize); this.load(); } back(): void { void this.router.navigate(['/cash']); } }
