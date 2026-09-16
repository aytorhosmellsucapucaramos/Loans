import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type { Customer, CustomerPayload, DocumentType } from '../../models/customer.model';

export interface CustomerFormData {
  mode: 'create' | 'edit';
  customer?: Customer;
}

const documentNumberValidator: ValidatorFn = (control) => {
  const type = control.parent?.get('documentType')?.value as DocumentType | undefined;
  const value = String(control.value ?? '').trim().toUpperCase();
  if (!type || !value) return null;
  const valid = (type === 'DNI' && /^\d{8}$/.test(value))
    || (type === 'RUC' && /^\d{11}$/.test(value))
    || ((type === 'CE' || type === 'PASSPORT') && /^[A-Z0-9]{6,12}$/.test(value));
  return valid ? null : { documentNumber: true };
};

@Component({
  selector: 'sp-customer-form',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFormComponent {
  private readonly builder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CustomerFormComponent>);
  readonly data = inject<CustomerFormData | null>(MAT_DIALOG_DATA, { optional: true }) ?? { mode: 'create' as const };
  readonly isEdit = this.data.mode === 'edit';
  readonly documentTypes: { value: DocumentType; label: string }[] = [
    { value: 'DNI', label: 'DNI' }, { value: 'CE', label: 'Carné de extranjería' }, { value: 'PASSPORT', label: 'Pasaporte' }, { value: 'RUC', label: 'RUC' },
  ];
  readonly form = this.builder.nonNullable.group({
    documentType: [this.data.customer?.documentType ?? 'DNI' as DocumentType, Validators.required],
    documentNumber: [this.data.customer?.documentNumber ?? '', [Validators.required, documentNumberValidator]],
    firstName: [this.data.customer?.firstName ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    lastName: [this.data.customer?.lastName ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    phone: [this.data.customer?.phone ?? '', [Validators.required, Validators.pattern(/^(?:\+?51)?9\d{8}$/)]],
    email: [this.data.customer?.email ?? '', [Validators.email, Validators.maxLength(254)]],
    address: [this.data.customer?.address ?? '', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
  });

  constructor() {
    this.form.controls.documentType.valueChanges.subscribe(() => this.form.controls.documentNumber.updateValueAndValidity());
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    const payload: CustomerPayload = {
      documentType: value.documentType,
      documentNumber: value.documentNumber.trim().toUpperCase(),
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      phone: value.phone.trim(),
      address: value.address.trim(),
    };
    if (value.email.trim()) payload.email = value.email.trim();
    this.dialogRef.close(payload);
  }
}
