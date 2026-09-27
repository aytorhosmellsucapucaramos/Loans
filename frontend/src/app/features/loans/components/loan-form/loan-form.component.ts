import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, inject, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EMPTY, finalize, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CustomerFormComponent } from '../../../customers/components/customer-form/customer-form.component';
import type { Customer, CustomerPayload } from '../../../customers/models/customer.model';
import { CustomersService } from '../../../customers/services/customers.service';
import type { CreateLoanPayload, PaymentFrequency } from '../../models/loan.model';

export interface LoanFormData { customers: Customer[]; }

const dateOrderValidator = (control: AbstractControl): ValidationErrors | null => {
  const disbursement = control.get('disbursementDate')?.value as string;
  const firstInstallment = control.get('firstInstallmentDate')?.value as string;
  return disbursement && firstInstallment && firstInstallment <= disbursement ? { firstInstallmentDate: true } : null;
};

@Component({
  selector: 'sp-loan-form',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './loan-form.component.html',
  styleUrl: './loan-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanFormComponent {
  private readonly builder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<LoanFormComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly customersApi = inject(CustomersService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifications = inject(NotificationService);
  readonly auth = inject(AuthService);
  readonly data = inject<LoanFormData>(MAT_DIALOG_DATA);
  readonly customers = signal<Customer[]>(this.data.customers);
  readonly creatingCustomer = signal(false);
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
    const value = this.form.getRawValue();
    if (value.principalAmount === null || value.interestRate === null || value.installmentCount === null) return;
    const payload: CreateLoanPayload = {
      customerId: value.customerId, principalAmount: value.principalAmount, interestRate: value.interestRate, interestType: 'simple', paymentFrequency: value.paymentFrequency,
      installmentCount: value.installmentCount, disbursementDate: value.disbursementDate, firstInstallmentDate: value.firstInstallmentDate,
    };
    if (value.observations.trim()) payload.observations = value.observations.trim();
    this.dialogRef.close(payload);
  }
}
