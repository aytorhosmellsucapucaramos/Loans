import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { PaymentDetailComponent } from '../../components/payment-detail/payment-detail.component';
import { PaymentsTableComponent } from '../../components/payments-table/payments-table.component';
import type { Installment } from '../../../loans/models/installment.model';
import type { LoanDetail } from '../../../loans/models/loan.model';
import { LoansService } from '../../../loans/services/loans.service';
import type { Payment } from '../../models/payment.model';
import { PaymentsService } from '../../services/payments.service';

@Component({
  selector: 'sp-payment-detail-page',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, PaymentDetailComponent, PaymentsTableComponent],
  templateUrl: './payment-detail-page.component.html',
  styleUrl: './payment-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(PaymentsService);
  private readonly loansApi = inject(LoansService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly payment = signal<Payment | null>(null);
  readonly loan = signal<LoanDetail | null>(null);
  readonly installment = signal<Installment | null>(null);
  readonly installmentPayments = signal<Payment[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() { this.load(); }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('No se indicó un pago.'); this.loading.set(false); return; }
    this.loading.set(true); this.error.set(null);
    this.api.getById(id).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (payment) => { this.payment.set(payment); this.loadInstallmentPayments(payment.installmentId); if (this.auth.hasPermission('loans.read')) this.loadLoan(payment.loanId, payment.installmentId); },
      error: () => this.error.set('No fue posible cargar el pago.'),
    });
  }

  back(): void { void this.router.navigate(['/payments']); }
  openLoan(): void { const loan = this.loan(); if (loan) void this.router.navigate(['/loans', loan.id]); }
  viewPayment(id: string): void { void this.router.navigate(['/payments', id]); }

  private loadLoan(loanId: string, installmentId: string): void { this.loansApi.getById(loanId).subscribe({ next: (loan) => { this.loan.set(loan); this.installment.set(loan.installments.find((item) => item.id === installmentId) ?? null); }, error: () => undefined }); }
  private loadInstallmentPayments(installmentId: string): void { this.api.listByInstallment(installmentId).subscribe({ next: (payments) => this.installmentPayments.set(payments), error: () => undefined }); }
}
