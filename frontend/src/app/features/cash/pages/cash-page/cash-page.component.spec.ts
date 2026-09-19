import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CashPageComponent } from './cash-page.component';
describe('CashPageComponent', () => {
  let fixture: ComponentFixture<CashPageComponent>;
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashPageComponent, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CashPageComponent);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());
  it('crea la página', () => {
    const req = http.expectOne((request) => request.url.endsWith('/api/cash/current'));
    req.flush(
      { success: false, errors: [{ code: 'OPEN_CASH_SESSION_NOT_FOUND' }] },
      { status: 404, statusText: 'Not Found' },
    );
    expect(fixture.componentInstance).toBeTruthy();
  });
});
