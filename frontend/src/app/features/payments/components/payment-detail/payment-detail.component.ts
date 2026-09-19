import { CurrencyPipe, DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import type { Installment } from '../../../loans/models/installment.model';
import type { Loan } from '../../../loans/models/loan.model';
import type { Payment } from '../../models/payment.model';

@Component({
  selector: 'sp-payment-detail',
  imports: [CurrencyPipe, DatePipe, NgClass, TitleCasePipe, MatCardModule],
  templateUrl: './payment-detail.component.html',
  styleUrl: './payment-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentDetailComponent {
  @Input({ required: true }) payment: Payment | null = null;
  @Input() loan: Loan | null = null;
  @Input() installment: Installment | null = null;
}
