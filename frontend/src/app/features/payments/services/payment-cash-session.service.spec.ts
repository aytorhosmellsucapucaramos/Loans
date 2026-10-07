import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OpenCashFormComponent } from '../../cash/components/open-cash-form/open-cash-form.component';
import type { CashSession } from '../../cash/models/cash.model';
import { CashService } from '../../cash/services/cash.service';
import { CashRequiredDialogComponent } from '../components/cash-required-dialog/cash-required-dialog.component';
import { PaymentCashSessionService } from './payment-cash-session.service';

const session: CashSession = {
  id: 'cash-1', openedByUserId: 'user-1', closedByUserId: null, openedAt: '2026-10-01T10:00:00Z', closedAt: null,
  openingAmount: '100.00', cashIncomeTotal: '0.00', expenseTotal: '0.00', expectedClosingAmount: '100.00',
  declaredClosingAmount: null, differenceAmount: null, status: 'open', observations: null, createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-01T10:00:00Z',
};

describe('PaymentCashSessionService', () => {
  const dialog = { open: jasmine.createSpy('open') };
  const cash = { current: jasmine.createSpy('current'), open: jasmine.createSpy('open') };
  const notifications = { success: jasmine.createSpy('success') };

  beforeEach(() => {
    dialog.open.calls.reset();
    cash.current.and.returnValue(of(session));
    cash.open.calls.reset();
    cash.open.and.returnValue(of(session));
    notifications.success.calls.reset();
    TestBed.configureTestingModule({ providers: [
      PaymentCashSessionService,
      { provide: MatDialog, useValue: dialog },
      { provide: CashService, useValue: cash },
      { provide: AuthService, useValue: { hasPermission: () => true } },
      { provide: NotificationService, useValue: notifications },
    ] });
  });

  it('continúa directamente si ya existe una caja abierta', () => {
    let result: boolean | undefined;
    TestBed.inject(PaymentCashSessionService).ensureOpen().subscribe((value) => result = value);

    expect(result).toBeTrue();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('guía a abrir caja y continúa después de abrirla correctamente', () => {
    cash.current.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { errors: [{ code: 'OPEN_CASH_SESSION_NOT_FOUND' }] } })));
    dialog.open.and.callFake((component: unknown) => ({ afterClosed: () => of(component === CashRequiredDialogComponent ? true : { openingAmount: 100 }) }) as never);
    let result: boolean | undefined;

    TestBed.inject(PaymentCashSessionService).ensureOpen().subscribe((value) => result = value);

    expect(dialog.open.calls.allArgs().map(([component]) => component)).toEqual([CashRequiredDialogComponent, OpenCashFormComponent]);
    expect(cash.open).toHaveBeenCalledWith({ openingAmount: 100 });
    expect(result).toBeTrue();
    expect(notifications.success).toHaveBeenCalledWith('Caja abierta correctamente.');
  });

  it('no abre modal de caja si el usuario cancela el aviso', () => {
    cash.current.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { errors: [{ code: 'OPEN_CASH_SESSION_NOT_FOUND' }] } })));
    dialog.open.and.returnValue({ afterClosed: () => of(undefined) } as never);
    let result: boolean | undefined;

    TestBed.inject(PaymentCashSessionService).ensureOpen().subscribe((value) => result = value);

    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(cash.open).not.toHaveBeenCalled();
    expect(result).toBeFalse();
  });
});
