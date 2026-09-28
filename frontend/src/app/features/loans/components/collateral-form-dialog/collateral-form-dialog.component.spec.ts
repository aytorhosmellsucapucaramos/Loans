import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { CollateralFormDialogComponent } from './collateral-form-dialog.component';

describe('CollateralFormDialogComponent', () => {
  const dialogRef = { close: jasmine.createSpy('close') };

  beforeEach(async () => {
    dialogRef.close.calls.reset();
    await TestBed.configureTestingModule({
      imports: [CollateralFormDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
    }).compileComponents();
  });

  it('returns validated draft and keeps optional details only when supplied', () => {
    const component = TestBed.createComponent(CollateralFormDialogComponent).componentInstance;
    component.form.patchValue({ description: 'Televisor', category: 'Electrónica', physicalCondition: 'Buen estado', estimatedValue: 500, receivedAt: '2026-09-28', brand: 'Marca', model: 'Modelo', serialNumber: 'SN-1', notes: 'Control incluido' });

    component.save();

    expect(dialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({ description: 'Televisor', estimatedValue: 500, serialNumber: 'SN-1', notes: 'Control incluido' }));
  });

  it('does not save invalid draft and marks fields touched', () => {
    const component = TestBed.createComponent(CollateralFormDialogComponent).componentInstance;

    component.save();

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.form.controls.description.touched).toBeTrue();
    expect(component.form.controls.estimatedValue.invalid).toBeTrue();
  });

  it('cancels without returning an object', () => {
    const component = TestBed.createComponent(CollateralFormDialogComponent).componentInstance;

    component.cancel();

    expect(dialogRef.close).toHaveBeenCalledOnceWith();
  });
});
