import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

import type { Customer } from '../../models/customer.model';

@Component({
  selector: 'sp-customer-detail',
  imports: [DatePipe, MatButtonModule, MatChipsModule, MatDialogModule],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDetailComponent {
  readonly customer = inject<Customer>(MAT_DIALOG_DATA);
}
