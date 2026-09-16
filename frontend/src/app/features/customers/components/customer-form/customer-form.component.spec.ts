import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { CustomerFormComponent } from './customer-form.component';

describe('CustomerFormComponent', () => {
  const dialogRef = { close: jasmine.createSpy('close') };

  beforeEach(() => dialogRef.close.calls.reset());

  it('se construye para crear sin requerir un cliente existente', async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerFormComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'create' } },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CustomerFormComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.isEdit).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Registrar cliente');
  });

  it('cierra el diálogo con una carga válida al guardar', async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerFormComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'create' } },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
    const component = TestBed.createComponent(CustomerFormComponent).componentInstance;
    component.form.setValue({
      documentType: 'DNI', documentNumber: '12345678', firstName: 'Ana', lastName: 'Quispe',
      phone: '987654321', email: 'ana@example.com', address: 'Av. Perú 123, Lima',
    });

    component.save();

    expect(dialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({ documentNumber: '12345678', email: 'ana@example.com' }));
  });
});
