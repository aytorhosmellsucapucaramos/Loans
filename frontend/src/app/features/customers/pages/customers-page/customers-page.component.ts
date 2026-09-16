import { DatePipe, NgClass } from '@angular/common';
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
import { MatTableModule } from '@angular/material/table';
import { debounceTime, distinctUntilChanged, finalize, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CustomerDetailComponent } from '../../components/customer-detail/customer-detail.component';
import { CustomerFormComponent } from '../../components/customer-form/customer-form.component';
import type { Customer, CustomerPayload } from '../../models/customer.model';
import { CustomersService } from '../../services/customers.service';

@Component({
  selector: 'sp-customers-page',
  imports: [DatePipe, NgClass, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './customers-page.component.html',
  styleUrl: './customers-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersPageComponent {
  private readonly api = inject(CustomersService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly search = signal('');
  readonly columns = ['document', 'name', 'phone', 'status', 'updatedAt', 'actions'];

  constructor() {
    this.searchControl.valueChanges.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.search.set(value.trim()); this.page.set(1); this.load();
    });
    this.load();
  }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.api.list({ page: this.page(), pageSize: this.pageSize(), search: this.search() || undefined }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (result) => { this.customers.set(result.items); this.total.set(result.pagination.total); this.page.set(result.pagination.page); this.pageSize.set(result.pagination.pageSize); },
      error: () => this.error.set('No fue posible cargar los clientes.'),
    });
  }

  changePage(event: PageEvent): void {
    this.page.set(event.pageIndex + 1); this.pageSize.set(event.pageSize); this.load();
  }

  create(): void {
    this.dialog.open(CustomerFormComponent, { data: { mode: 'create' }, width: '600px', maxWidth: '95vw' }).afterClosed().pipe(
      switchMap((payload: CustomerPayload | undefined) => payload ? this.api.create(payload) : []),
    ).subscribe({ next: (customer) => { if (customer) { this.notifications.success('Cliente registrado correctamente.'); this.page.set(1); this.load(); } } });
  }

  edit(customer: Customer): void {
    this.dialog.open(CustomerFormComponent, { data: { mode: 'edit', customer }, width: '600px', maxWidth: '95vw' }).afterClosed().pipe(
      switchMap((payload: CustomerPayload | undefined) => payload ? this.api.update(customer.id, payload) : []),
    ).subscribe({ next: (updated) => { if (updated) { this.replace(updated); this.notifications.success('Cliente actualizado correctamente.'); } } });
  }

  view(customer: Customer): void {
    this.api.getById(customer.id).subscribe({
      next: (completeCustomer) => this.dialog.open(CustomerDetailComponent, { data: completeCustomer, width: '560px', maxWidth: '96vw' }),
    });
  }

  changeStatus(customer: Customer): void {
    const isActive = !customer.isActive;
    const action = isActive ? 'activar' : 'desactivar';
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: `${isActive ? 'Activar' : 'Desactivar'} cliente`, message: `¿Deseas ${action} a ${customer.firstName} ${customer.lastName}?`, confirmLabel: `${isActive ? 'Activar' : 'Desactivar'}` },
    }).afterClosed().pipe(
      switchMap((confirmed: boolean | undefined) => confirmed ? this.api.updateStatus(customer.id, isActive) : []),
    ).subscribe({ next: (updated) => { if (updated) { this.replace(updated); this.notifications.success(`Cliente ${isActive ? 'activado' : 'desactivado'} correctamente.`); } } });
  }

  private replace(customer: Customer): void { this.customers.update((items) => items.map((item) => item.id === customer.id ? customer : item)); }
}
