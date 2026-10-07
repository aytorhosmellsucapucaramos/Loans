import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface CashRequiredDialogData { canOpenCash: boolean; }

@Component({
  selector: 'sp-cash-required-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './cash-required-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashRequiredDialogComponent {
  readonly data = inject<CashRequiredDialogData>(MAT_DIALOG_DATA);
}
