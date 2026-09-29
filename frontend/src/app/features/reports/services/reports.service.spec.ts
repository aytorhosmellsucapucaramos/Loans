import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportsService } from './reports.service';
describe('ReportsService', () => {
  let service: ReportsService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ReportsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('consulta el resumen real', () => {
    service.summary().subscribe((result) => expect(result.totalCollected).toBe('10.00'));
    const request = http.expectOne((entry) => entry.url.endsWith('/api/reports/summary'));
    request.flush({
      success: true,
      data: {
        activeCustomers: 1,
        activeLoans: 1,
        totalDisbursed: '10.00',
        totalOutstanding: '5.00',
        totalCollected: '10.00',
        overdueInstallments: 0,
        paymentsToday: { count: 1, totalAmount: '10.00' },
        currentCashBalance: '0.00',
      },
      errors: [],
    });
  });
  it('incluye filtros y paginación en cartera', () => {
    service
      .loans({
        page: 2,
        pageSize: 10,
        fromDate: '2026-01-01',
        toDate: '2026-01-31',
        status: 'active',
      })
      .subscribe();
    const request = http.expectOne((entry) => entry.url.endsWith('/api/reports/loans'));
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('status')).toBe('active');
    expect(request.request.params.get('fromDate')).toBe('2026-01-01');
    request.flush({
      success: true,
      data: {
        totals: {
          loanCount: 0,
          principalAmount: '0.00',
          interestAmount: '0.00',
          outstandingAmount: '0.00',
          byStatus: { active: 0, paid: 0, cancelled: 0 },
        },
        page: { items: [], pagination: { page: 2, pageSize: 10, total: 0, totalPages: 0 } },
      },
      errors: [],
    });
  });

  it('recorre todas las páginas y mantiene filtros aplicados durante exportación', () => {
    const progress: string[] = [];
    let exportedIds: string[] = [];
    service.allPages('loans', { customerId: 'customer-1', status: 'paid', fromDate: '2026-01-01', toDate: '2026-01-31' }, (page, pages) => progress.push(`${page}/${pages}`)).subscribe((items) => {
      exportedIds = items.map((item) => (item as { id: string }).id);
    });

    const first = http.expectOne((entry) => entry.url.endsWith('/api/reports/loans') && entry.params.get('page') === '1');
    expect(first.request.params.get('pageSize')).toBe('100');
    expect(first.request.params.get('customerId')).toBe('customer-1');
    expect(first.request.params.get('status')).toBe('paid');
    expect(first.request.params.get('fromDate')).toBe('2026-01-01');
    const items = Array.from({ length: 100 }, (_, index) => ({ id: `loan-${index + 1}`, customerId: 'customer-1', customerName: 'Ana', customerDocument: '12345678', disbursementDate: '2026-01-01', principalAmount: '10.00', interestAmount: '1.00', totalAmount: '11.00', outstandingAmount: '5.00', status: 'paid' as const }));
    first.flush({ success: true, data: { totals: { loanCount: 101, principalAmount: '1010.00', interestAmount: '101.00', outstandingAmount: '505.00', byStatus: { active: 0, paid: 101, cancelled: 0 } }, page: { items, pagination: { page: 1, pageSize: 100, total: 101, totalPages: 2 } } }, errors: [] });

    const second = http.expectOne((entry) => entry.url.endsWith('/api/reports/loans') && entry.params.get('page') === '2');
    expect(second.request.params.get('customerId')).toBe('customer-1');
    second.flush({ success: true, data: { totals: { loanCount: 101, principalAmount: '1010.00', interestAmount: '101.00', outstandingAmount: '505.00', byStatus: { active: 0, paid: 101, cancelled: 0 } }, page: { items: [{ ...items[0]!, id: 'loan-101' }], pagination: { page: 2, pageSize: 100, total: 101, totalPages: 2 } } }, errors: [] });

    expect(exportedIds.length).toBe(101);
    expect(exportedIds.at(-1)).toBe('loan-101');
    expect(progress).toEqual(['1/2', '2/2']);
  });
});
