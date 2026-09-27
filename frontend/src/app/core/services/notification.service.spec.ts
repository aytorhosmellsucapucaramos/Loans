import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';
import { NotificationToastComponent } from '../components/notification-toast/notification-toast.component';

describe('NotificationService', () => {
  let service: NotificationService;
  let openFromComponent: jasmine.Spy;
  let dismissed: jasmine.Spy;
  let afterDismissed: jasmine.Spy;

  beforeEach(() => {
    dismissed = jasmine.createSpy('dismiss');
    afterDismissed = jasmine.createSpy('afterDismissed').and.returnValue({ subscribe: () => undefined });
    openFromComponent = jasmine.createSpy('openFromComponent').and.returnValue({ dismiss: dismissed, afterDismissed } as unknown as MatSnackBarRef<NotificationToastComponent>);
    TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: { openFromComponent } }] });
    service = TestBed.inject(NotificationService);
  });

  it('opens a typed toast with a readable duration and dismiss control', () => {
    service.success('Guardado correctamente.');

    expect(openFromComponent).toHaveBeenCalled();
    const config = openFromComponent.calls.mostRecent().args[1];
    expect(config.data).toEqual({ message: 'Guardado correctamente.', type: 'success' });
    expect(config.duration).toBe(2500);
    expect(config.horizontalPosition).toBe('center');
    expect(config.verticalPosition).toBe('top');
  });

  it('does not stack or repeat the same active notification', () => {
    service.error('No se pudo completar.');
    service.error('No se pudo completar.');

    expect(openFromComponent).toHaveBeenCalledTimes(1);
  });

  it('replaces a different active toast instead of stacking it', () => {
    service.success('Guardado.');
    service.warning('Revisa los datos.');

    expect(dismissed).toHaveBeenCalledTimes(1);
    expect(openFromComponent).toHaveBeenCalledTimes(2);
  });
});
