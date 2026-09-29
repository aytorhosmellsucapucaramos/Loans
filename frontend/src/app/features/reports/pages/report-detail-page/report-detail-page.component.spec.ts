import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CustomersService } from '../../../customers/services/customers.service';
import { ReportExcelExportService } from '../../services/report-excel-export.service';
import { ReportsService } from '../../services/reports.service';
import { ReportDetailPageComponent } from './report-detail-page.component';

describe('ReportDetailPageComponent export access', () => {
  const router = { navigate: jasmine.createSpy('navigate') };
  const reports = {
    loans: jasmine.createSpy('loans').and.returnValue(of({ totals: { loanCount: 0, principalAmount: '0', interestAmount: '0', outstandingAmount: '0', byStatus: { active: 0, paid: 0, cancelled: 0 } }, page: { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } })),
    allPages: jasmine.createSpy('allPages').and.returnValue(of([])),
  };
  const auth = { hasPermission: jasmine.createSpy('hasPermission').and.returnValue(false) };
  const notifications = { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') };
  const customerApi = { list: jasmine.createSpy('list').and.returnValue(of({ items: [], pagination: { page: 1, pageSize: 100, total: 0, totalPages: 0 } })) };
  const exporter = { build: jasmine.createSpy('build').and.returnValue(Promise.resolve(new Uint8Array([1, 2, 3]))) };

  beforeEach(async () => {
    router.navigate.calls.reset();
    reports.loans.calls.reset();
    reports.allPages.calls.reset();
    auth.hasPermission.and.returnValue(false);
    notifications.success.calls.reset();
    notifications.error.calls.reset();
    customerApi.list.calls.reset();
    exporter.build.calls.reset();
    await TestBed.configureTestingModule({
      imports: [ReportDetailPageComponent, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'loans' } } } },
        { provide: Router, useValue: router },
        { provide: ReportsService, useValue: reports },
        { provide: AuthService, useValue: auth },
        { provide: NotificationService, useValue: notifications },
        { provide: CustomersService, useValue: customerApi },
        { provide: ReportExcelExportService, useValue: exporter },
      ],
    }).compileComponents();
  });

  it('hides export and refuses request without reports.read', () => {
    const fixture = TestBed.createComponent(ReportDetailPageComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const labels = Array.from(buttons).map((button) => button.textContent ?? '');
    expect(labels.some((label) => label.includes('Exportar a Excel'))).toBeFalse();
    fixture.componentInstance.exportReport();
    expect(reports.allPages).not.toHaveBeenCalled();
  });

  it('exports using report.read and applied filters', async () => {
    auth.hasPermission.and.returnValue(true);
    spyOn(URL, 'createObjectURL').and.returnValue('blob:report-test');
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click');
    const fixture = TestBed.createComponent(ReportDetailPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.filters.patchValue({ fromDate: '2026-09-01', toDate: '2026-09-30', customerId: 'customer-1', status: 'paid' });

    component.exportReport();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(reports.allPages).toHaveBeenCalledWith('loans', jasmine.objectContaining({ fromDate: '2026-09-01', toDate: '2026-09-30', customerId: 'customer-1', status: 'paid' }), jasmine.any(Function));
    expect(component.exporting()).toBeFalse();
  });
});
