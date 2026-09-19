import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import type { CashSession, CloseCashPayload } from '../../models/cash.model';
@Component({
  selector: 'sp-close-cash-form',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './close-cash-form.component.html',
  styleUrl: './close-cash-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloseCashFormComponent {
  private readonly builder = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<CloseCashFormComponent>);
  private readonly dialog = inject(MatDialog);
  readonly session = inject<CashSession>(MAT_DIALOG_DATA);
  readonly form = this.builder.nonNullable.group({
    declaredClosingAmount: [
      Number(this.session.expectedClosingAmount),
      [Validators.required, Validators.min(0.01), Validators.pattern(/^\d+(?:\.\d{1,2})?$/)],
    ],
    observations: ['', Validators.maxLength(1000)],
  });
  difference(): number {
    return (
      Number(this.form.controls.declaredClosingAmount.value) -
      Number(this.session.expectedClosingAmount)
    );
  }
  selectZero(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (/^0(?:\.0+)?$/.test(input.value)) input.select();
  }
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload: CloseCashPayload = {
      declaredClosingAmount: Number(value.declaredClosingAmount),
    };
    if (value.observations.trim()) payload.observations = value.observations.trim();
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Cerrar caja',
          message: `El saldo esperado es S/ ${Number(this.session.expectedClosingAmount).toFixed(2)}. ¿Confirmas el cierre?`,
          confirmLabel: 'Cerrar caja',
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (confirmed) this.ref.close(payload);
      });
  }
}
