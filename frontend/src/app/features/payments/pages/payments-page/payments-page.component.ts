import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaymentFormComponent } from '../../components/payment-form/payment-form.component';
import { PaymentsTableComponent } from '../../components/payments-table/payments-table.component';
import type { CreatePaymentPayload, PaymentStatus } from '../../models/payment.model';
import { PaymentsService } from '../../services/payments.service';

@Component({
  selector: 'sp-payments-page',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatProgressSpinnerModule, MatSelectModule, PaymentsTableComponent],
  templateUrl: './payments-page.component.html',
  styleUrl: './payments-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsPageComponent {
  private readonly api = inject(PaymentsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  readonly auth = inject(AuthService);
  readonly filters = inject(FormBuilder).nonNullable.group({ loanId: '', installmentId: '', status: '' as PaymentStatus | '' });
  readonly payments = signal<import('../../models/payment.model').Payment[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    const filters = this.filters.getRawValue();
    this.api.list({ page: this.page(), pageSize: this.pageSize(), loanId: filters.loanId.trim() || undefined, installmentId: filters.installmentId.trim() || undefined, status: filters.status || undefined }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (result) => { this.payments.set(result.items); this.total.set(result.pagination.total); this.page.set(result.pagination.page); this.pageSize.set(result.pagination.pageSize); },
      error: () => this.error.set('No fue posible cargar los pagos.'),
    });
  }

  applyFilters(): void { this.page.set(1); this.load(); }
  clearFilters(): void { this.filters.reset({ loanId: '', installmentId: '', status: '' }); this.page.set(1); this.load(); }
  changePage(event: PageEvent): void { this.page.set(event.pageIndex + 1); this.pageSize.set(event.pageSize); this.load(); }
  view(id: string): void { void this.router.navigate(['/payments', id]); }

  create(): void {
    this.dialog.open(PaymentFormComponent, { width: '640px', maxWidth: '95vw' }).afterClosed().pipe(
      switchMap((payload: CreatePaymentPayload | undefined) => payload ? this.api.create(payload) : []),
    ).subscribe({ next: (payment) => { if (payment) { this.notifications.success('Pago registrado correctamente.'); this.page.set(1); this.load(); } } });
  }

  cancel(id: string): void {
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Anular pago', message: 'La anulación restaurará el saldo de la cuota. ¿Deseas continuar?', confirmLabel: 'Anular pago' } }).afterClosed().pipe(
      switchMap((confirmed: boolean | undefined) => confirmed ? this.api.cancel(id) : []),
    ).subscribe({ next: (payment) => { if (payment) { this.payments.update((items) => items.map((item) => item.id === payment.id ? payment : item)); this.notifications.success('Pago anulado correctamente.'); } } });
  }
}
