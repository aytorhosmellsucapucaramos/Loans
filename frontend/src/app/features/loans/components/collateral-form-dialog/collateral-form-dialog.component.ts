import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import type { LoanCollateralPayload } from '../../models/loan.model';

export interface CollateralFormDialogData {
  collateral?: LoanCollateralPayload;
}

type CollateralForm = FormGroup<{
  description: FormControl<string>;
  category: FormControl<string>;
  brand: FormControl<string>;
  model: FormControl<string>;
  serialNumber: FormControl<string>;
  physicalCondition: FormControl<string>;
  estimatedValue: FormControl<number | null>;
  notes: FormControl<string>;
  receivedAt: FormControl<string>;
}>;

const localReceiptDate = (): string => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
};

@Component({
  selector: 'sp-collateral-form-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  templateUrl: './collateral-form-dialog.component.html',
  styleUrl: './collateral-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollateralFormDialogComponent {
  private readonly builder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CollateralFormDialogComponent, LoanCollateralPayload>);
  readonly data = inject<CollateralFormDialogData>(MAT_DIALOG_DATA);
  readonly form: CollateralForm;

  constructor() {
    const item = this.data.collateral;
    this.form = this.builder.group({
      description: this.builder.nonNullable.control(item?.description ?? '', [Validators.required, Validators.maxLength(250)]),
      category: this.builder.nonNullable.control(item?.category ?? '', [Validators.required, Validators.maxLength(80)]),
      brand: this.builder.nonNullable.control(item?.brand ?? '', Validators.maxLength(100)),
      model: this.builder.nonNullable.control(item?.model ?? '', Validators.maxLength(100)),
      serialNumber: this.builder.nonNullable.control(item?.serialNumber ?? '', Validators.maxLength(100)),
      physicalCondition: this.builder.nonNullable.control(item?.physicalCondition ?? '', [Validators.required, Validators.maxLength(500)]),
      estimatedValue: this.builder.control<number | null>(item?.estimatedValue ?? null, [Validators.required, Validators.min(0.01)]),
      notes: this.builder.nonNullable.control(item?.notes ?? '', Validators.maxLength(1000)),
      receivedAt: this.builder.nonNullable.control(item?.receivedAt ?? localReceiptDate(), Validators.required),
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (value.estimatedValue === null) return;
    const item: LoanCollateralPayload = {
      description: value.description.trim(),
      category: value.category.trim(),
      physicalCondition: value.physicalCondition.trim(),
      estimatedValue: value.estimatedValue,
      receivedAt: value.receivedAt,
    };
    if (value.brand.trim()) item.brand = value.brand.trim();
    if (value.model.trim()) item.model = value.model.trim();
    if (value.serialNumber.trim()) item.serialNumber = value.serialNumber.trim();
    if (value.notes.trim()) item.notes = value.notes.trim();
    this.dialogRef.close(item);
  }
}
