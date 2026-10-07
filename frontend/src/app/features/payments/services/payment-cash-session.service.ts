import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OpenCashFormComponent } from '../../cash/components/open-cash-form/open-cash-form.component';
import type { OpenCashPayload } from '../../cash/models/cash.model';
import { CashService } from '../../cash/services/cash.service';
import { CashRequiredDialogComponent } from '../components/cash-required-dialog/cash-required-dialog.component';

const isMissingOpenSession = (error: HttpErrorResponse): boolean =>
  error.status === 404 && error.error?.errors?.some((item: { code?: string }) => item.code === 'OPEN_CASH_SESSION_NOT_FOUND');

@Injectable({ providedIn: 'root' })
export class PaymentCashSessionService {
  private readonly cash = inject(CashService);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  ensureOpen(): Observable<boolean> {
    return this.cash.current().pipe(
      map((session) => session.status === 'open'),
      catchError((error: HttpErrorResponse) => isMissingOpenSession(error) ? of(false) : throwError(() => error)),
      switchMap((isOpen) => isOpen ? of(true) : this.requestOpen()),
      catchError(() => of(false)),
    );
  }

  private requestOpen(): Observable<boolean> {
    const canOpenCash = this.auth.hasPermission('cash.open');
    return this.dialog.open(CashRequiredDialogComponent, {
      width: '480px', maxWidth: '95vw', data: { canOpenCash },
    }).afterClosed().pipe(
      switchMap((confirmed: boolean | undefined) => confirmed && canOpenCash ? this.openCash() : of(false)),
    );
  }

  private openCash(): Observable<boolean> {
    return this.dialog.open(OpenCashFormComponent, { width: '480px', maxWidth: '95vw' }).afterClosed().pipe(
      switchMap((payload: OpenCashPayload | undefined) => payload ? this.cash.open(payload) : of(null)),
      tap((session) => { if (session) this.notifications.success('Caja abierta correctamente.'); }),
      map((session) => session !== null),
      catchError(() => of(false)),
    );
  }
}
