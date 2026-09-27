import { TestBed } from '@angular/core/testing';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CustomerFormComponent } from '../../../customers/components/customer-form/customer-form.component';
import { CustomersService } from '../../../customers/services/customers.service';
import type { Customer, CustomerPayload } from '../../../customers/models/customer.model';
import { LoanFormComponent } from './loan-form.component';

describe('LoanFormComponent', () => {
  const dialogRef = { close: jasmine.createSpy('close') };
  const customerDialogRef = { afterClosed: jasmine.createSpy('afterClosed').and.returnValue(of(undefined)) };
  const customerDialog = { open: jasmine.createSpy('open').and.returnValue(customerDialogRef) };
  const customersApi = { create: jasmine.createSpy('create').and.returnValue(of({ id: 'customer-2', firstName: 'Rosa', lastName: 'Mamani', documentType: 'DNI', documentNumber: '87654321', isActive: true } as Customer)) };
  const auth = { hasPermission: jasmine.createSpy('hasPermission').and.returnValue(true) };
  const notifications = { success: jasmine.createSpy('success') };
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
      ],
    }).overrideProvider(MatDialog, { useValue: customerDialog }).compileComponents();
  };

  it('entrega únicamente los datos de origen para que el backend calcule el préstamo', async () => {
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
    expect(dialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({ customerId: 'customer-1', interestType: 'simple', principalAmount: 1000 }));
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
});
