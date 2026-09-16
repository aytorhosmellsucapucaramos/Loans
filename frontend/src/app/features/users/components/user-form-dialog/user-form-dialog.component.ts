import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type { Role } from '../../../../core/models/role.model';
import type { User } from '../../../../core/models/user.model';
import type { CreateUserPayload, UpdateUserPayload } from '../../models/user-form.model';

export interface UserFormDialogData { user?: User; roles: Role[]; roleIds: string[]; }

@Component({
  selector: 'sp-user-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './user-form-dialog.component.html',
  styleUrl: './user-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormDialogComponent {
  private readonly builder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  readonly data = inject<UserFormDialogData>(MAT_DIALOG_DATA);
  readonly isEdit = !!this.data.user;
  readonly form = this.builder.nonNullable.group({
    email: [{ value: this.data.user?.email ?? '', disabled: this.isEdit }, [Validators.required, Validators.email]],
    password: ['', this.isEdit ? [] : [Validators.required, Validators.minLength(12)]],
    firstName: [this.data.user?.firstName ?? '', [Validators.required, Validators.minLength(2)]],
    lastName: [this.data.user?.lastName ?? '', [Validators.required, Validators.minLength(2)]],
    isActive: [this.data.user?.isActive ?? true],
    roleIds: [this.data.roleIds],
  });
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    const result: CreateUserPayload | UpdateUserPayload = this.isEdit
      ? { firstName: value.firstName, lastName: value.lastName, isActive: value.isActive, roleIds: value.roleIds }
      : { email: value.email, password: value.password, firstName: value.firstName, lastName: value.lastName, roleIds: value.roleIds };
    this.dialogRef.close(result);
  }
}
