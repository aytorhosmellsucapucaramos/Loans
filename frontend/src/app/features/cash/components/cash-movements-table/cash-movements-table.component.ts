import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import type { CashMovement } from '../../models/cash.model';
@Component({ selector: 'sp-cash-movements-table', imports: [CurrencyPipe, DatePipe, NgClass, MatChipsModule, MatTableModule], templateUrl: './cash-movements-table.component.html', styleUrl: './cash-movements-table.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class CashMovementsTableComponent { @Input({ required: true }) movements: CashMovement[] = []; readonly columns = ['date', 'type', 'amount', 'method', 'description']; label(type: CashMovement['type']): string { return type === 'income' ? 'Ingreso' : type === 'expense' ? 'Egreso' : 'Reversión'; } method(method: CashMovement['paymentMethod']): string { return method === 'cash' ? 'Efectivo' : method === 'bank_transfer' ? 'Transferencia' : method === 'yape' ? 'Yape' : method === 'plin' ? 'Plin' : 'Otro'; } }
