import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import type { InstallmentReport } from '../../../reports/models/report.model';
import { ReportsService } from '../../../reports/services/reports.service';
import { DashboardPageComponent, limaDateKey } from './dashboard-page.component';

const emptyInstallmentReport: InstallmentReport = {
  totals: { pendingCount: 0, paidCount: 0, overdueCount: 0, outstandingAmount: '0.00' },
  page: { items: [], pagination: { page: 1, pageSize: 5, total: 0, totalPages: 0 } },
};

describe('DashboardPageComponent', () => {
  afterEach(() => jasmine.clock().uninstall());

  it('obtiene el día local de Lima, también cerca del cambio de fecha UTC', () => {
    expect(limaDateKey(new Date('2026-09-27T02:00:00.000Z'))).toBe('2026-09-26');
  });

  it('consulta vencimientos de hoy y atrasos con criterios calculados por el backend', async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-09-27T02:00:00.000Z'));
    const reports = jasmine.createSpyObj<ReportsService>('ReportsService', ['summary', 'installments']);
    reports.summary.and.returnValue(of({ activeCustomers: 0, activeLoans: 0, totalDisbursed: '0', totalOutstanding: '0', totalCollected: '0', overdueInstallments: 0, paymentsToday: { count: 0, totalAmount: '0' }, currentCashBalance: '0' }));
    reports.installments.and.returnValue(of(emptyInstallmentReport));
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user$: of({ firstName: 'Ana' }), hasPermission: () => true } },
        { provide: ReportsService, useValue: reports },
      ],
    }).compileComponents();

    const component = TestBed.createComponent(DashboardPageComponent).componentInstance;
    expect(component).toBeTruthy();
    expect(reports.installments).toHaveBeenCalledWith({ page: 1, pageSize: 5, fromDate: '2026-09-26', toDate: '2026-09-26', status: 'pending' });
    expect(reports.installments).toHaveBeenCalledWith({ page: 1, pageSize: 5, status: 'overdue' });
  });

  it('no consulta reportes ni agenda sin permiso de lectura', async () => {
    const reports = jasmine.createSpyObj<ReportsService>('ReportsService', ['summary', 'installments']);
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user$: of({ firstName: 'Ana' }), hasPermission: () => false } },
        { provide: ReportsService, useValue: reports },
      ],
    }).compileComponents();

    TestBed.createComponent(DashboardPageComponent);
    expect(reports.summary).not.toHaveBeenCalled();
    expect(reports.installments).not.toHaveBeenCalled();
  });

  it('mantiene visibles los nueve indicadores y separa cantidad y monto de pagos del día', async () => {
    const reports = jasmine.createSpyObj<ReportsService>('ReportsService', ['summary', 'installments']);
    reports.summary.and.returnValue(of({
      activeCustomers: 12,
      activeLoans: 8,
      totalDisbursed: '1200.00',
      totalOutstanding: '600.00',
      totalCollected: '400.00',
      overdueInstallments: 2,
      paymentsToday: { count: 3, totalAmount: '90.00' },
      currentCashBalance: '250.00',
    }));
    reports.installments.and.returnValue(of(emptyInstallmentReport));
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user$: of({ firstName: 'Ana' }), hasPermission: () => true } },
        { provide: ReportsService, useValue: reports },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.cards mat-card') as NodeListOf<HTMLElement>;
    expect(cards.length).toBe(9);
    expect(cards[6].textContent).toContain('3');
    expect(cards[6].textContent).toContain('pagos del día');
    expect(cards[7].textContent).toContain('monto cobrado hoy');
    expect(cards[8].textContent).toContain('saldo actual de caja');
  });
});
