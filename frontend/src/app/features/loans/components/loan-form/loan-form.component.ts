import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, inject, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { EMPTY, catchError, debounceTime, finalize, switchMap, tap } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CustomerFormComponent } from '../../../customers/components/customer-form/customer-form.component';
import type { Customer, CustomerPayload } from '../../../customers/models/customer.model';
import { CustomersService } from '../../../customers/services/customers.service';
import type { CreateLoanPayload, LoanPreview, PaymentFrequency } from '../../models/loan.model';
import { LoansService } from '../../services/loans.service';

export interface LoanFormData { customers: Customer[]; }

const dateOrderValidator = (control: AbstractControl): ValidationErrors | null => {
  const disbursement = control.get('disbursementDate')?.value as string;
  const firstInstallment = control.get('firstInstallmentDate')?.value as string;
  return disbursement && firstInstallment && firstInstallment <= disbursement ? { firstInstallmentDate: true } : null;
};

@Component({
  selector: 'sp-loan-form',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule],
  templateUrl: './loan-form.component.html',
  styleUrl: './loan-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanFormComponent {
  private readonly builder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<LoanFormComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly customersApi = inject(CustomersService);
  private readonly loansApi = inject(LoansService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifications = inject(NotificationService);
  readonly auth = inject(AuthService);
  readonly data = inject<LoanFormData>(MAT_DIALOG_DATA);
  readonly customers = signal<Customer[]>(this.data.customers);
  readonly creatingCustomer = signal(false);
  readonly preview = signal<LoanPreview | null>(null);
  readonly previewLoading = signal(false);
  readonly previewStale = signal(false);
  readonly previewError = signal(false);
  private readonly reviewRevision = signal(0);
  private previewGeneration = 0;
  @Output() readonly customerCreated = new EventEmitter<Customer>();
  readonly frequencies: { value: PaymentFrequency; label: string }[] = [
    { value: 'daily', label: 'Diaria' }, { value: 'weekly', label: 'Semanal' }, { value: 'biweekly', label: 'Quincenal' }, { value: 'monthly', label: 'Mensual' },
  ];
  readonly form = this.builder.group({
    customerId: this.builder.nonNullable.control('', Validators.required),
    principalAmount: this.builder.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    interestRate: this.builder.control<number | null>(null, [Validators.required, Validators.min(0)]),
    paymentFrequency: this.builder.nonNullable.control('monthly' as PaymentFrequency, Validators.required),
    installmentCount: this.builder.control<number | null>(null, [Validators.required, Validators.min(1), Validators.max(360), Validators.pattern(/^\d+$/)]),
    disbursementDate: this.builder.nonNullable.control('', Validators.required),
    firstInstallmentDate: this.builder.nonNullable.control('', Validators.required),
    observations: this.builder.nonNullable.control('', Validators.maxLength(1000)),
  }, { validators: dateOrderValidator });

  constructor() {
    this.form.valueChanges.pipe(
      tap(() => {
        this.previewGeneration += 1;
        this.reviewRevision.update((revision) => revision + 1);
        this.previewStale.set(this.preview() !== null);
        this.previewLoading.set(false);
        this.previewError.set(false);
      }),
      debounceTime(300),
      switchMap(() => {
        const payload = this.toPayload();
        if (!payload) return EMPTY;
        const generation = this.previewGeneration;
        this.previewLoading.set(true);
        return this.loansApi.preview(payload).pipe(
          tap((preview) => {
            if (generation !== this.previewGeneration) return;
            this.preview.set(preview);
            this.previewStale.set(false);
          }),
          catchError(() => {
            if (generation === this.previewGeneration) {
              this.previewError.set(true);
              this.previewStale.set(this.preview() !== null);
            }
            return EMPTY;
          }),
          finalize(() => { if (generation === this.previewGeneration) this.previewLoading.set(false); }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  get selectedCustomer(): Customer | undefined {
    this.reviewRevision();
    return this.customers().find((customer) => customer.id === this.form.controls.customerId.value);
  }

  get reviewAmount(): number | null {
    this.reviewRevision();
    const control = this.form.controls.principalAmount;
    return control.valid ? control.value : null;
  }

  get reviewRate(): number | null {
    this.reviewRevision();
    const control = this.form.controls.interestRate;
    return control.valid ? control.value : null;
  }

  get reviewInstallmentCount(): number | null {
    this.reviewRevision();
    const control = this.form.controls.installmentCount;
    return control.valid ? control.value : null;
  }

  get reviewFrequency(): string {
    this.reviewRevision();
    return this.frequencies.find((item) => item.value === this.form.controls.paymentFrequency.value)?.label ?? 'Pendiente';
  }

  get reviewIssues(): string[] {
    this.reviewRevision();
    const issues: string[] = [];
    if (this.form.controls.customerId.invalid) issues.push('cliente');
    if (this.form.controls.principalAmount.invalid) issues.push('monto');
    if (this.form.controls.interestRate.invalid) issues.push('tasa');
    if (this.form.controls.installmentCount.invalid) issues.push('número de cuotas');
    if (this.form.controls.disbursementDate.invalid) issues.push('fecha de desembolso');
    if (this.form.controls.firstInstallmentDate.invalid || this.form.hasError('firstInstallmentDate')) issues.push('primera fecha de cuota');
    if (this.form.controls.observations.invalid) issues.push('observaciones');
    return issues;
  }

  get previewCurrent(): boolean {
    return this.preview() !== null && !this.previewStale() && !this.previewLoading() && !this.previewError();
  }

  createCustomer(): void {
    if (!this.auth.hasPermission('customers.create') || this.creatingCustomer()) return;
    this.dialog.open(CustomerFormComponent, {
      data: { mode: 'create' },
      width: '600px',
      maxWidth: '95vw',
    }).afterClosed().pipe(
      switchMap((payload: CustomerPayload | undefined) => {
        if (!payload) return EMPTY;
        this.creatingCustomer.set(true);
        return this.customersApi.create(payload).pipe(finalize(() => this.creatingCustomer.set(false)));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((customer) => {
      this.customers.update((items) => [...items.filter((item) => item.id !== customer.id), customer]);
      this.form.controls.customerId.setValue(customer.id);
      this.customerCreated.emit(customer);
      this.notifications.success('Cliente registrado correctamente.');
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const payload = this.toPayload();
    if (payload) this.dialogRef.close(payload);
  }

  private toPayload(): CreateLoanPayload | null {
    if (this.form.invalid) return null;
    const value = this.form.getRawValue();
    if (value.principalAmount === null || value.interestRate === null || value.installmentCount === null) return null;
    const payload: CreateLoanPayload = {
      customerId: value.customerId, principalAmount: value.principalAmount, interestRate: value.interestRate, interestType: 'simple', paymentFrequency: value.paymentFrequency,
      installmentCount: value.installmentCount, disbursementDate: value.disbursementDate, firstInstallmentDate: value.firstInstallmentDate,
    };
    if (value.observations.trim()) payload.observations = value.observations.trim();
    return payload;
  }
}
