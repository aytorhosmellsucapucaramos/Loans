import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import type { Customer } from '../../../customers/models/customer.model';
import { CustomersService } from '../../../customers/services/customers.service';
import { LoanFormComponent } from '../../components/loan-form/loan-form.component';
import type { CreateLoanPayload, Loan, LoanStatus } from '../../models/loan.model';
import { LoansService } from '../../services/loans.service';

@Component({
  selector: 'sp-loans-page',
  imports: [CurrencyPipe, DatePipe, NgClass, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatProgressSpinnerModule, MatSelectModule, MatTableModule],
  templateUrl: './loans-page.component.html',
  styleUrl: './loans-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoansPageComponent {
  private readonly api = inject(LoansService);
  private readonly customersApi = inject(CustomersService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<LoanStatus | ''>('', { nonNullable: true });
  readonly customerControl = new FormControl('', { nonNullable: true });
  readonly loans = signal<Loan[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly search = signal('');
  readonly columns = ['customer', 'amounts', 'frequency', 'status', 'createdAt', 'actions'];

  constructor() {
    this.searchControl.valueChanges.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe((value) => { this.search.set(value.trim()); this.page.set(1); this.load(); });
    if (this.auth.hasPermission('customers.read')) this.loadCustomers();
    this.load();
  }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.api.list({ page: this.page(), pageSize: this.pageSize(), search: this.search() || undefined, status: this.statusControl.value || undefined, customerId: this.customerControl.value || undefined }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (result) => { this.loans.set(result.items); this.total.set(result.pagination.total); this.page.set(result.pagination.page); this.pageSize.set(result.pagination.pageSize); },
      error: () => this.error.set('No fue posible cargar los préstamos.'),
    });
  }

  applyFilters(): void { this.page.set(1); this.load(); }
  clearFilters(): void { this.statusControl.setValue(''); this.customerControl.setValue(''); this.searchControl.setValue(''); this.applyFilters(); }
  changePage(event: PageEvent): void { this.page.set(event.pageIndex + 1); this.pageSize.set(event.pageSize); this.load(); }

  create(): void {
    const activeCustomers = this.customers().filter((customer) => customer.isActive);
    if (!activeCustomers.length) { this.notifications.warning('Necesitas al menos un cliente activo para registrar un préstamo.'); return; }
    this.dialog.open(LoanFormComponent, { data: { customers: activeCustomers }, width: '720px', maxWidth: '95vw' }).afterClosed().pipe(
      switchMap((payload: CreateLoanPayload | undefined) => payload ? this.confirm('Registrar préstamo', 'El backend calculará el total y generará las cuotas. ¿Deseas continuar?').pipe(switchMap((confirmed) => confirmed ? this.api.create(payload) : [])) : []),
    ).subscribe({ next: (loan) => { if (loan) { this.notifications.success('Préstamo registrado correctamente.'); void this.router.navigate(['/loans', loan.id]); } } });
  }

  view(loan: Loan): void { void this.router.navigate(['/loans', loan.id]); }
  changeStatus(loan: Loan): void {
    const status: LoanStatus = loan.status === 'active' ? 'cancelled' : 'active';
    this.confirm(`${status === 'active' ? 'Reactivar' : 'Cancelar'} préstamo`, `¿Deseas ${status === 'active' ? 'reactivar' : 'cancelar'} este préstamo?`).pipe(
      switchMap((confirmed) => confirmed ? this.api.updateStatus(loan.id, status) : []),
    ).subscribe({ next: (updated) => { if (updated) { this.loans.update((items) => items.map((item) => item.id === updated.id ? updated : item)); this.notifications.success('Estado del préstamo actualizado correctamente.'); } } });
  }

  customerName(customerId: string): string { const customer = this.customers().find((item) => item.id === customerId); return customer ? `${customer.firstName} ${customer.lastName}` : customerId; }
  private loadCustomers(): void { this.customersApi.list({ page: 1, pageSize: 100 }).subscribe({ next: (result) => this.customers.set(result.items), error: () => undefined }); }
  private confirm(title: string, message: string) { return this.dialog.open(ConfirmDialogComponent, { data: { title, message, confirmLabel: 'Confirmar' } }).afterClosed(); }
}
