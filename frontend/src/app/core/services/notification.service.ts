import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { NotificationToastComponent } from '../components/notification-toast/notification-toast.component';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface NotificationToastData {
  message: string;
  type: NotificationType;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private activeKey: string | null = null;
  private activeRef: MatSnackBarRef<NotificationToastComponent> | null = null;

  success(message: string): void { this.open(message, 'success', 4500); }
  info(message: string): void { this.open(message, 'info', 4500); }
  warning(message: string): void { this.open(message, 'warning', 6000); }
  error(message: string): void { this.open(message, 'error', 6500); }

  private open(message: string, type: NotificationType, duration: number): void {
    const key = `${type}:${message}`;
    if (this.activeKey === key && this.activeRef) return;

    this.activeRef?.dismiss();
    this.activeKey = key;
    this.activeRef = this.snackBar.openFromComponent(NotificationToastComponent, {
      data: { message, type } satisfies NotificationToastData,
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['prestame-toast-panel', `prestame-toast-${type}`],
      politeness: type === 'error' ? 'assertive' : 'polite',
    });

    const ref = this.activeRef;
    ref.afterDismissed().subscribe(() => {
      if (this.activeRef === ref) {
        this.activeRef = null;
        this.activeKey = null;
      }
    });
  }
}
