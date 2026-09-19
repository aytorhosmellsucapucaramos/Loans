import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import type { Installment } from '../../models/installment.model';

@Component({
  selector: 'sp-installments-table',
  imports: [CurrencyPipe, DatePipe, NgClass, MatButtonModule, MatChipsModule, MatIconModule, MatTableModule],
  templateUrl: './installments-table.component.html',
  styleUrl: './installments-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallmentsTableComponent {
  @Input({ required: true }) installments: Installment[] = [];
  @Input() canRegisterPayments = false;
  @Output() paymentRequested = new EventEmitter<Installment>();
  get columns(): string[] { return this.canRegisterPayments ? ['number', 'dueDate', 'principal', 'interest', 'scheduled', 'outstanding', 'status', 'actions'] : ['number', 'dueDate', 'principal', 'interest', 'scheduled', 'outstanding', 'status']; }
}
