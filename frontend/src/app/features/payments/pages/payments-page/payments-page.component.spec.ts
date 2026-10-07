import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PaymentFormComponent } from '../../components/payment-form/payment-form.component';
import { PaymentCashSessionService } from '../../services/payment-cash-session.service';
import { PaymentsService } from '../../services/payments.service';
import { PaymentsPageComponent } from './payments-page.component';

describe('PaymentsPageComponent', () => {
  const dialog = { open: jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(undefined) }) };
  const payments = { list: jasmine.createSpy('list').and.returnValue(of({ items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } })), create: jasmine.createSpy('create') };
  const cashSession = { ensureOpen: jasmine.createSpy('ensureOpen').and.returnValue(of(false)) };

  beforeEach(async () => {
    dialog.open.calls.reset();
    payments.list.calls.reset();
    cashSession.ensureOpen.calls.reset();
    cashSession.ensureOpen.and.returnValue(of(false));
    await TestBed.configureTestingModule({
      imports: [PaymentsPageComponent],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: PaymentsService, useValue: payments },
        { provide: PaymentCashSessionService, useValue: cashSession },
        { provide: AuthService, useValue: { hasPermission: () => true } },
        { provide: NotificationService, useValue: { success: jasmine.createSpy('success') } },
      ],
    }).compileComponents();
  });

  it('no abre formulario de pago antes de verificar la caja', () => {
    const component = TestBed.createComponent(PaymentsPageComponent).componentInstance;

    component.create();

    expect(cashSession.ensureOpen).toHaveBeenCalled();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('abre el formulario de pago cuando caja está abierta', () => {
    cashSession.ensureOpen.and.returnValue(of(true));
    const component = TestBed.createComponent(PaymentsPageComponent).componentInstance;

    component.create();

    expect(dialog.open).toHaveBeenCalledWith(PaymentFormComponent, jasmine.any(Object));
  });
});
