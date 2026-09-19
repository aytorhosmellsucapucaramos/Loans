import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AuditPageComponent } from './audit-page.component';

describe('AuditPageComponent', () => {
  let fixture: ComponentFixture<AuditPageComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditPageComponent, HttpClientTestingModule],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AuditPageComponent);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('carga registros paginados sin renderizar metadatos', () => {
    const request = http.expectOne((item) => item.url.endsWith('/api/audit'));
    request.flush({
      success: true,
      message: 'OK',
      data: {
        items: [
          {
            id: 'audit-1',
            user: null,
            action: 'payment.registered',
            entityType: 'payment',
            entityId: 'payment-1',
            description: 'Pago registrado.',
            metadata: { token: 'no-mostrar' },
            ipAddress: null,
            result: 'success',
            createdAt: '2026-09-18T12:00:00.000Z',
          },
        ],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      },
      errors: [],
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.entries()).toHaveSize(1);
    expect(fixture.nativeElement.textContent).not.toContain('no-mostrar');
  });
});
