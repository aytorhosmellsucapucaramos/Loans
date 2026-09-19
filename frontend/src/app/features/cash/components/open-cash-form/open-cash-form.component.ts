import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { OpenCashPayload } from '../../models/cash.model';
@Component({
  selector: 'sp-open-cash-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './open-cash-form.component.html',
  styleUrl: './open-cash-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenCashFormComponent {
  private readonly builder = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<OpenCashFormComponent>);
  readonly form = this.builder.group({
    openingAmount: this.builder.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      Validators.pattern(/^\d+(?:\.\d{1,2})?$/),
    ]),
    observations: this.builder.nonNullable.control('', Validators.maxLength(1000)),
  });
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (value.openingAmount === null) return;
    const payload: OpenCashPayload = { openingAmount: Number(value.openingAmount) };
    if (value.observations.trim()) payload.observations = value.observations.trim();
    this.ref.close(payload);
  }
}
