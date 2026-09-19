import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import type { Customer } from '../../../customers/models/customer.model';
import { CustomersService } from '../../../customers/services/customers.service';
import { InstallmentsTableComponent } from '../../components/installments-table/installments-table.component';
import { PaymentFormComponent } from '../../../payments/components/payment-form/payment-form.component';
import { PaymentsTableComponent } from '../../../payments/components/payments-table/payments-table.component';
import type { CreatePaymentPayload, Payment } from '../../../payments/models/payment.model';
import { PaymentsService } from '../../../payments/services/payments.service';
import type { Installment } from '../../models/installment.model';
import type { LoanDetail, LoanStatus } from '../../models/loan.model';
import { LoansService } from '../../services/loans.service';

@Component({
  selector: 'sp-loan-detail-page',
  imports: [CurrencyPipe, DatePipe, NgClass, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, InstallmentsTableComponent, PaymentsTableComponent],
  templateUrl: './loan-detail-page.component.html',
  styleUrl: './loan-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(LoansService);
  private readonly customersApi = inject(CustomersService);
  private readonly paymentsApi = inject(PaymentsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  readonly loan = signal<LoanDetail | null>(null);
  readonly customer = signal<Customer | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly payments = signal<Payment[]>([]);

  constructor() { this.load(); }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('No se indicó un préstamo.'); this.loading.set(false); return; }
    this.loading.set(true); this.error.set(null);
    this.api.getById(id).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (loan) => { this.loan.set(loan); if (this.auth.hasPermission('customers.read')) this.customersApi.getById(loan.customerId).subscribe({ next: (customer) => this.customer.set(customer), error: () => undefined }); if (this.auth.hasPermission('payments.read')) this.loadPayments(loan.id); },
      error: () => this.error.set('No fue posible cargar el préstamo.'),
    });
  }

  changeStatus(): void {
    const loan = this.loan(); if (!loan) return;
    const status: LoanStatus = loan.status === 'active' ? 'cancelled' : 'active';
    this.dialog.open(ConfirmDialogComponent, { data: { title: `${status === 'active' ? 'Reactivar' : 'Cancelar'} préstamo`, message: `¿Deseas ${status === 'active' ? 'reactivar' : 'cancelar'} este préstamo?`, confirmLabel: 'Confirmar' } }).afterClosed().pipe(
      switchMap((confirmed: boolean | undefined) => confirmed ? this.api.updateStatus(loan.id, status) : []),
    ).subscribe({ next: (updated) => { if (updated) { this.loan.update((current) => current ? { ...current, ...updated } : current); this.notifications.success('Estado del préstamo actualizado correctamente.'); } } });
  }

  back(): void { void this.router.navigate(['/loans']); }

  registerPayment(installment: Installment): void {
    const loan = this.loan();
    if (!loan) return;
    this.dialog.open(PaymentFormComponent, { width: '640px', maxWidth: '95vw', data: { loan, installment } }).afterClosed().pipe(
      switchMap((payload: CreatePaymentPayload | undefined) => payload ? this.paymentsApi.create(payload) : []),
    ).subscribe({ next: (payment) => { if (payment) { this.notifications.success('Pago registrado correctamente.'); this.load(); } } });
  }

  cancelPayment(payment: Payment): void {
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Anular pago', message: 'La anulación restaurará el saldo de la cuota. ¿Deseas continuar?', confirmLabel: 'Anular pago' } }).afterClosed().pipe(
      switchMap((confirmed: boolean | undefined) => confirmed ? this.paymentsApi.cancel(payment.id) : []),
    ).subscribe({ next: (updated) => { if (updated) { this.notifications.success('Pago anulado correctamente.'); this.load(); } } });
  }

  openPayment(payment: Payment): void { void this.router.navigate(['/payments', payment.id]); }
  private loadPayments(loanId: string): void { this.paymentsApi.listByLoan(loanId).subscribe({ next: (payments) => this.payments.set(payments), error: () => this.payments.set([]) }); }
}
