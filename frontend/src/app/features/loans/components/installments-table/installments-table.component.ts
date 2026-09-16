import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';

import type { Installment } from '../../models/installment.model';

@Component({
  selector: 'sp-installments-table',
  imports: [CurrencyPipe, DatePipe, NgClass, MatChipsModule, MatTableModule],
  templateUrl: './installments-table.component.html',
  styleUrl: './installments-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallmentsTableComponent {
  @Input({ required: true }) installments: Installment[] = [];
  readonly columns = ['number', 'dueDate', 'principal', 'interest', 'scheduled', 'outstanding', 'status'];
}
