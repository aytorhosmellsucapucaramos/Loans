import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type { Permission } from '../../../../core/models/permission.model';
import type { Role } from '../../../../core/models/role.model';
import type { RolePayload } from '../../models/role-form.model';

export interface RoleFormDialogData { role?: Role; permissions: Permission[]; }

@Component({
  selector: 'sp-role-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './role-form-dialog.component.html',
  styleUrl: './role-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleFormDialogComponent {
  private readonly builder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RoleFormDialogComponent>);
  readonly data = inject<RoleFormDialogData>(MAT_DIALOG_DATA);
  readonly isEdit = !!this.data.role;
  readonly form = this.builder.nonNullable.group({
    code: [this.data.role?.code ?? '', [Validators.required, Validators.pattern(/^[a-z][a-z0-9-]*$/)]],
    name: [this.data.role?.name ?? '', [Validators.required, Validators.minLength(2)]],
    description: [this.data.role?.description ?? ''],
    permissionIds: [this.data.role?.permissionIds ?? []],
  });
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    this.dialogRef.close({ ...value, description: value.description || undefined } satisfies RolePayload);
  }
}
