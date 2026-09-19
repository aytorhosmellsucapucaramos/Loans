import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { LoanFormComponent } from './loan-form.component';

describe('LoanFormComponent', () => {
  const dialogRef = { close: jasmine.createSpy('close') };
  beforeEach(() => dialogRef.close.calls.reset());

  it('entrega únicamente los datos de origen para que el backend calcule el préstamo', async () => {
    await TestBed.configureTestingModule({
      imports: [LoanFormComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { customers: [{ id: 'customer-1', firstName: 'Ana', lastName: 'Quispe', documentType: 'DNI', documentNumber: '12345678', isActive: true }] } },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
    const component = TestBed.createComponent(LoanFormComponent).componentInstance;
    expect(component.form.controls.principalAmount.value).toBeNull();
    expect(component.form.controls.installmentCount.value).toBeNull();
    expect(component.form.invalid).toBeTrue();
    component.form.controls.principalAmount.setValue(0);
    component.form.controls.installmentCount.setValue(0);
    expect(component.form.controls.principalAmount.invalid).toBeTrue();
    expect(component.form.controls.installmentCount.invalid).toBeTrue();
    component.form.setValue({ customerId: 'customer-1', principalAmount: 1000, interestRate: 10, paymentFrequency: 'monthly', installmentCount: 4, disbursementDate: '2026-09-15', firstInstallmentDate: '2026-10-15', observations: '' });
    component.save();
    expect(dialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({ customerId: 'customer-1', interestType: 'simple', principalAmount: 1000 }));
  });
});
