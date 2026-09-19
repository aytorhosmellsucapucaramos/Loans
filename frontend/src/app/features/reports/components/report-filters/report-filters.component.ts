import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import type { Customer } from '../../../customers/models/customer.model';
import type { ReportKind } from '../../models/report.model';
@Component({
  selector: 'sp-report-filters',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './report-filters.component.html',
  styleUrl: './report-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportFiltersComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input({ required: true }) kind!: ReportKind;
  @Input() customers: Customer[] = [];
  @Output() applyFilters = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
}
