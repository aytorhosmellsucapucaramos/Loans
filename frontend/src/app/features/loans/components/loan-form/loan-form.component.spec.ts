import { registerLocaleData } from '@angular/common';
import localePe from '@angular/common/locales/es-PE';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CustomerFormComponent } from '../../../customers/components/customer-form/customer-form.component';
import { CustomersService } from '../../../customers/services/customers.service';
import type { Customer, CustomerPayload } from '../../../customers/models/customer.model';
import { LoansService } from '../../services/loans.service';
import { LoanFormComponent } from './loan-form.component';

registerLocaleData(localePe);

describe('LoanFormComponent', () => {
  const dialogRef = { close: jasmine.createSpy('close') };
  const customerDialogRef = { afterClosed: jasmine.createSpy('afterClosed').and.returnValue(of(undefined)) };
  const customerDialog = { open: jasmine.createSpy('open').and.returnValue(customerDialogRef) };
  const customersApi = { create: jasmine.createSpy('create').and.returnValue(of({ id: 'customer-2', firstName: 'Rosa', lastName: 'Mamani', documentType: 'DNI', documentNumber: '87654321', isActive: true } as Customer)) };
  const auth = { hasPermission: jasmine.createSpy('hasPermission').and.returnValue(true) };
  const notifications = { success: jasmine.createSpy('success') };
  const loanPreview = { customerId: 'customer-1', principalAmount: '1000.00', interestRate: '10.0000', interestType: 'simple' as const, paymentFrequency: 'monthly' as const, installmentCount: 4, disbursementDate: '2026-01-01', firstInstallmentDate: '2026-02-01', totalInterestAmount: '100.00', totalAmount: '1100.00', installments: [{ installmentNumber: 1, dueDate: '2026-02-01', principalAmount: '250.00', interestAmount: '25.00', scheduledAmount: '275.00', outstandingAmount: '275.00', status: 'pending' as const }] };
  const loansApi = { preview: jasmine.createSpy('preview').and.returnValue(of(loanPreview)) };
  const createdCustomer: Customer = { id: 'customer-2', firstName: 'Rosa', lastName: 'Mamani', documentType: 'DNI', documentNumber: '87654321', phone: '987654321', email: null, address: 'Jr. Lima 123', isActive: true, createdAt: '', updatedAt: '' };
  const customerPayload: CustomerPayload = { documentType: 'DNI', documentNumber: '87654321', firstName: 'Rosa', lastName: 'Mamani', phone: '987654321', address: 'Jr. Lima 123' };

  beforeEach(() => dialogRef.close.calls.reset());

  beforeEach(() => {
    customerDialog.open.calls.reset();
    customerDialogRef.afterClosed.and.returnValue(of(undefined));
    customersApi.create.calls.reset();
    customersApi.create.and.returnValue(of(createdCustomer));
    auth.hasPermission.and.returnValue(true);
    notifications.success.calls.reset();
    loansApi.preview.calls.reset();
    loansApi.preview.and.returnValue(of(loanPreview));
  });

  const configure = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [LoanFormComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { customers: [{ id: 'customer-1', firstName: 'Ana', lastName: 'Quispe', documentType: 'DNI', documentNumber: '12345678', isActive: true }] } },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MatDialog, useValue: customerDialog },
        { provide: CustomersService, useValue: customersApi },
        { provide: AuthService, useValue: auth },
        { provide: NotificationService, useValue: notifications },
        { provide: LoansService, useValue: loansApi },
      ],
    }).overrideProvider(MatDialog, { useValue: customerDialog }).compileComponents();
  };

  it('avanza a revisión y registra solo con la acción final', async () => {
    await configure();
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
    expect(dialogRef.close).not.toHaveBeenCalled();

    component.continueToReview();
    expect(component.currentStep()).toBe(2);
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(component.canRegister).toBeTrue();
    component.save();
    expect(dialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({ customerId: 'customer-1', interestType: 'simple', principalAmount: 1000 }));
  });

  it('vuelve a editar conservando todos los datos y bloquea avance inválido', async () => {
    await configure();
    const component = TestBed.createComponent(LoanFormComponent).componentInstance;
    component.continueToReview();
    expect(component.currentStep()).toBe(1);
    expect(component.form.controls.principalAmount.touched).toBeTrue();

    component.form.setValue({ customerId: 'customer-1', principalAmount: 1500, interestRate: 8, paymentFrequency: 'weekly', installmentCount: 6, disbursementDate: '2026-09-01', firstInstallmentDate: '2026-09-08', observations: 'Conservar observación' });
    component.continueToReview();
    component.backToEdit();

    expect(component.currentStep()).toBe(1);
    expect(component.form.getRawValue()).toEqual(jasmine.objectContaining({ principalAmount: 1500, interestRate: 8, paymentFrequency: 'weekly', installmentCount: 6, observations: 'Conservar observación' }));
  });

  it('creates customer with existing form and selects new customer without changing loan fields', async () => {
    customerDialogRef.afterClosed.and.returnValue(of(customerPayload));
    await configure();
    const component = TestBed.createComponent(LoanFormComponent).componentInstance;
    component.form.patchValue({ customerId: 'customer-1', principalAmount: 1500, interestRate: 8, installmentCount: 6, observations: 'Mantener este dato' });
    const emitted: Customer[] = [];
    component.customerCreated.subscribe((customer) => emitted.push(customer));

    component.createCustomer();

    expect(customerDialog.open).toHaveBeenCalledWith(CustomerFormComponent, jasmine.objectContaining({ data: { mode: 'create' }, maxWidth: '95vw' }));
    expect(customersApi.create).toHaveBeenCalledWith(customerPayload);
    expect(component.customers().map((customer) => customer.id)).toContain(createdCustomer.id);
    expect(component.form.controls.customerId.value).toBe(createdCustomer.id);
    expect(component.form.getRawValue()).toEqual(jasmine.objectContaining({ principalAmount: 1500, interestRate: 8, installmentCount: 6, observations: 'Mantener este dato' }));
    expect(emitted).toEqual([createdCustomer]);
    expect(notifications.success).toHaveBeenCalledWith('Cliente registrado correctamente.');
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('keeps loan values and sends nothing when customer creation is cancelled', async () => {
    await configure();
    const component = TestBed.createComponent(LoanFormComponent).componentInstance;
    component.form.patchValue({ customerId: 'customer-1', principalAmount: 1500, interestRate: 8, installmentCount: 6, observations: 'Conservar' });

    component.createCustomer();

    expect(customersApi.create).not.toHaveBeenCalled();
    expect(component.form.controls.customerId.value).toBe('customer-1');
    expect(component.form.getRawValue()).toEqual(jasmine.objectContaining({ principalAmount: 1500, interestRate: 8, installmentCount: 6, observations: 'Conservar' }));
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('does not open customer form without customers.create permission', async () => {
    auth.hasPermission.and.returnValue(false);
    await configure();
    const fixture = TestBed.createComponent(LoanFormComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.createCustomer();

    expect(customerDialog.open).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.customer-create')).toBeNull();
  });

  it('updates loan summary from official preview and marks it stale when fields change', async () => {
    await configure();
    const fixture = TestBed.createComponent(LoanFormComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.patchValue({ customerId: 'customer-1', principalAmount: 1000, interestRate: 10, installmentCount: 4, disbursementDate: '2026-01-01', firstInstallmentDate: '2026-02-01' });
    await new Promise((resolve) => setTimeout(resolve, 350));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(loansApi.preview).toHaveBeenCalledWith(jasmine.objectContaining({ customerId: 'customer-1', principalAmount: 1000, interestRate: 10 }));
    expect(component.selectedCustomer?.firstName).toBe('Ana');
    expect(component.preview()?.totalInterestAmount).toBe('100.00');
    expect(component.preview()?.totalAmount).toBe('1100.00');
    expect(component.previewCurrent).toBeTrue();

    component.form.controls.principalAmount.setValue(2000);
    expect(component.previewStale()).toBeTrue();
    expect(component.previewCurrent).toBeFalse();
    expect(component.canRegister).toBeFalse();
    await new Promise((resolve) => setTimeout(resolve, 350));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(loansApi.preview).toHaveBeenCalledTimes(2);
    expect(component.previewCurrent).toBeTrue();
  });

  it('does not send loan when form data is invalid', async () => {
    await configure();
    const component = TestBed.createComponent(LoanFormComponent).componentInstance;
    component.form.patchValue({ customerId: 'customer-1', principalAmount: 0, interestRate: 10, installmentCount: 0 });

    component.save();

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.reviewIssues).toContain('monto');
    expect(component.reviewIssues).toContain('número de cuotas');
  });
});
