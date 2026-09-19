import { CurrencyPipe, DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import type { Payment } from '../../models/payment.model';

@Component({
  selector: 'sp-payments-table',
  imports: [CurrencyPipe, DatePipe, NgClass, TitleCasePipe, MatButtonModule, MatChipsModule, MatIconModule, MatTableModule],
  templateUrl: './payments-table.component.html',
  styleUrl: './payments-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsTableComponent {
  @Input({ required: true }) payments: Payment[] = [];
  @Input() showLoan = true;
  @Input() canCancel = false;
  @Output() viewPayment = new EventEmitter<Payment>();
  @Output() cancelPayment = new EventEmitter<Payment>();
  readonly columns = ['date', 'amount', 'method', 'reference', 'status', 'actions'];
}
