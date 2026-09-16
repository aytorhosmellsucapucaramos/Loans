import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void { this.open(message, 'Cerrar', 'success'); }
  error(message: string): void { this.open(message, 'Cerrar', 'error'); }
  warning(message: string): void { this.open(message, 'Cerrar', 'warning'); }

  private open(message: string, action: string, panelClass: string): void {
    this.snackBar.open(message, action, { duration: 4500, panelClass: [`notification-${panelClass}`], horizontalPosition: 'right', verticalPosition: 'top' });
  }
}
