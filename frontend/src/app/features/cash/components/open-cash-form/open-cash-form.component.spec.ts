import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { OpenCashFormComponent } from './open-cash-form.component';
describe('OpenCashFormComponent', () => {
  let fixture: ComponentFixture<OpenCashFormComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenCashFormComponent],
      providers: [{ provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } }],
    }).compileComponents();
    fixture = TestBed.createComponent(OpenCashFormComponent);
    fixture.detectChanges();
  });
  it('inicia el monto vacío y exige un valor positivo', () => {
    expect(fixture.componentInstance.form.controls.openingAmount.value).toBeNull();
    expect(fixture.componentInstance.form.invalid).toBeTrue();
  });
});
