import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type { Customer } from '../../../customers/models/customer.model';
import type { CreateLoanPayload, PaymentFrequency } from '../../models/loan.model';

export interface LoanFormData { customers: Customer[]; }

const dateOrderValidator = (control: AbstractControl): ValidationErrors | null => {
  const disbursement = control.get('disbursementDate')?.value as string;
  const firstInstallment = control.get('firstInstallmentDate')?.value as string;
  return disbursement && firstInstallment && firstInstallment <= disbursement ? { firstInstallmentDate: true } : null;
};

@Component({
  selector: 'sp-loan-form',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './loan-form.component.html',
  styleUrl: './loan-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanFormComponent {
  private readonly builder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<LoanFormComponent>);
  readonly data = inject<LoanFormData>(MAT_DIALOG_DATA);
  readonly frequencies: { value: PaymentFrequency; label: string }[] = [
    { value: 'daily', label: 'Diaria' }, { value: 'weekly', label: 'Semanal' }, { value: 'biweekly', label: 'Quincenal' }, { value: 'monthly', label: 'Mensual' },
  ];
  readonly form = this.builder.nonNullable.group({
    customerId: ['', Validators.required],
    principalAmount: [0, [Validators.required, Validators.min(0.01)]],
    interestRate: [0, [Validators.required, Validators.min(0)]],
    paymentFrequency: ['monthly' as PaymentFrequency, Validators.required],
    installmentCount: [1, [Validators.required, Validators.min(1), Validators.max(360), Validators.pattern(/^\d+$/)]],
    disbursementDate: ['', Validators.required],
    firstInstallmentDate: ['', Validators.required],
    observations: ['', Validators.maxLength(1000)],
  }, { validators: dateOrderValidator });

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    const payload: CreateLoanPayload = {
      customerId: value.customerId, principalAmount: value.principalAmount, interestRate: value.interestRate, interestType: 'simple', paymentFrequency: value.paymentFrequency,
      installmentCount: value.installmentCount, disbursementDate: value.disbursementDate, firstInstallmentDate: value.firstInstallmentDate,
    };
    if (value.observations.trim()) payload.observations = value.observations.trim();
    this.dialogRef.close(payload);
  }
}
