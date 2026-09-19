import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CashMovementFormComponent } from './cash-movement-form.component';
describe('CashMovementFormComponent', () => {
  let fixture: ComponentFixture<CashMovementFormComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashMovementFormComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { type: 'income' } },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CashMovementFormComponent);
    fixture.detectChanges();
  });
  it('inicia el monto vacío y exige un valor positivo', () => {
    expect(fixture.componentInstance.form.controls.amount.value).toBeNull();
    expect(fixture.componentInstance.form.invalid).toBeTrue();
  });
});
