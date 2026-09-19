import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';

import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import type { Installment } from '../../../loans/models/installment.model';
import type { Loan, LoanDetail } from '../../../loans/models/loan.model';
import { LoansService } from '../../../loans/services/loans.service';
import type { CreatePaymentPayload, PaymentMethod } from '../../models/payment.model';

export interface PaymentFormData { loan?: LoanDetail; installment?: Installment; }

const today = (): string => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

export const loanCustomerLabel = (loans: Loan[], loan: Loan): string => {
  const customer = loan.customer;
  if (!customer) return 'Cliente no disponible';
  const sameNameCustomerIds = new Set(loans.filter((item) => item.customer?.firstName === customer.firstName && item.customer?.lastName === customer.lastName).map((item) => item.customer?.id));
  const document = sameNameCustomerIds.size > 1 ? ` · ${customer.documentType} ${customer.documentNumber}` : '';
  return `${customer.firstName} ${customer.lastName}${document}`;
};

@Component({
  selector: 'sp-payment-form',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentFormComponent {
  private readonly builder = inject(FormBuilder);
  private readonly loansApi = inject(LoansService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<PaymentFormComponent>);
  readonly data = inject<PaymentFormData | null>(MAT_DIALOG_DATA, { optional: true }) ?? {};
  readonly loans = signal<Loan[]>([]);
  readonly installments = signal<Installment[]>([]);
  readonly loadingLoans = signal(false);
  readonly loadingInstallments = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly fixedLoan = !!this.data.loan;
  readonly fixedInstallment = !!this.data.installment;
  readonly methods: { value: PaymentMethod; label: string }[] = [
    { value: 'cash', label: 'Efectivo' }, { value: 'bank_transfer', label: 'Transferencia bancaria' }, { value: 'yape', label: 'Yape' }, { value: 'plin', label: 'Plin' }, { value: 'other', label: 'Otro' },
  ];
  readonly form = this.builder.group({
    loanId: this.builder.nonNullable.control(this.data.loan?.id ?? '', Validators.required),
    installmentId: this.builder.nonNullable.control(this.data.installment?.id ?? '', Validators.required),
    amount: this.builder.control<number | null>(null, [Validators.required, Validators.min(0.01), Validators.pattern(/^\d+(?:\.\d{1,2})?$/)]),
    paymentMethod: this.builder.nonNullable.control('cash' as PaymentMethod, Validators.required),
    paymentDate: this.builder.nonNullable.control(today(), Validators.required),
    operationReference: this.builder.nonNullable.control('', Validators.maxLength(120)),
    observations: this.builder.nonNullable.control('', Validators.maxLength(1000)),
  });

  constructor() {
    if (this.data.loan) this.loadInstallments(this.data.loan.id, this.data.installment?.id);
    else this.loadLoans();
    this.form.controls.loanId.valueChanges.subscribe((loanId) => {
      if (!this.fixedLoan && loanId) this.loadInstallments(loanId);
    });
  }

  selectedInstallment(): Installment | null { return this.installments().find((item) => item.id === this.form.controls.installmentId.value) ?? null; }
  loanLabel(loan: Loan): string { return loanCustomerLabel(this.loans(), loan); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    if (value.amount === null) return;
    const selected = this.selectedInstallment();
    if (!selected || Number(value.amount) > Number(selected.outstandingAmount)) {
      this.form.controls.amount.setErrors({ exceedsOutstanding: true }); this.form.controls.amount.markAsTouched(); return;
    }
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Registrar pago', message: `¿Confirmas el registro de ${Number(value.amount).toFixed(2)} para la cuota seleccionada?`, confirmLabel: 'Registrar pago' } }).afterClosed().subscribe((confirmed: boolean | undefined) => {
      if (!confirmed) return;
      const payload: CreatePaymentPayload = { loanId: value.loanId, installmentId: value.installmentId, amount: Number(value.amount), paymentMethod: value.paymentMethod, paymentDate: value.paymentDate };
      if (value.operationReference.trim()) payload.operationReference = value.operationReference.trim();
      if (value.observations.trim()) payload.observations = value.observations.trim();
      this.dialogRef.close(payload);
    });
  }

  private loadLoans(): void {
    this.loadingLoans.set(true); this.loadError.set(null);
    this.loansApi.list({ page: 1, pageSize: 100, status: 'active' }).pipe(finalize(() => this.loadingLoans.set(false))).subscribe({
      next: (result) => this.loans.set(result.items), error: () => this.loadError.set('No fue posible cargar los préstamos activos.'),
    });
  }

  private loadInstallments(loanId: string, selectedId?: string): void {
    this.loadingInstallments.set(true); this.loadError.set(null);
    this.loansApi.getById(loanId).pipe(finalize(() => this.loadingInstallments.set(false))).subscribe({
      next: (loan) => {
        const pending = loan.installments.filter((item) => item.status !== 'paid' && Number(item.outstandingAmount) > 0);
        this.installments.set(pending);
        const id = selectedId && pending.some((item) => item.id === selectedId) ? selectedId : '';
        this.form.controls.installmentId.setValue(id, { emitEvent: false });
      },
      error: () => { this.installments.set([]); this.form.controls.installmentId.setValue('', { emitEvent: false }); this.loadError.set('No fue posible cargar las cuotas pendientes.'); },
    });
  }
}
