import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarModule, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { NotificationToastData } from '../../services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './notification-toast.component.html',
  styleUrl: './notification-toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationToastComponent {
  readonly data = inject<NotificationToastData>(MAT_SNACK_BAR_DATA);
  private readonly snackBarRef = inject(MatSnackBarRef<NotificationToastComponent>);

  get icon(): string {
    return {
      success: 'check_circle',
      info: 'info',
      warning: 'warning_amber',
      error: 'error',
    }[this.data.type];
  }

  get title(): string {
    return {
      success: 'Éxito',
      info: 'Información',
      warning: 'Atención',
      error: 'Error',
    }[this.data.type];
  }

  close(): void {
    this.snackBarRef.dismissWithAction();
  }
}
