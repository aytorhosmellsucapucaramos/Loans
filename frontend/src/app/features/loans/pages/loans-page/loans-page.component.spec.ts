import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { EventEmitter } from '@angular/core';
import { of, Subject } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CustomersService } from '../../../customers/services/customers.service';
import type { Customer } from '../../../customers/models/customer.model';
import type { CreateLoanPayload } from '../../models/loan.model';
import { LoanFormComponent } from '../../components/loan-form/loan-form.component';
import { LoansService } from '../../services/loans.service';
import { LoansPageComponent } from './loans-page.component';

describe('LoansPageComponent', () => {
  let loanFormClosed: Subject<CreateLoanPayload | undefined>;
  let customerCreated: EventEmitter<Customer>;
  let loanFormRef: { componentInstance: { customerCreated: EventEmitter<Customer> }; afterClosed: () => Subject<CreateLoanPayload | undefined> };
  const dialog = { open: jasmine.createSpy('open') };
  const loanApi = { list: jasmine.createSpy('list').and.returnValue(of({ items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } })), create: jasmine.createSpy('create'), updateStatus: jasmine.createSpy('updateStatus') };
  const customersApi = { list: jasmine.createSpy('list').and.returnValue(of({ items: [{ id: 'customer-1', firstName: 'Ana', lastName: 'Quispe', documentType: 'DNI', documentNumber: '12345678', isActive: true }], pagination: { page: 1, pageSize: 100, total: 1, totalPages: 1 } })) };
  const auth = { hasPermission: jasmine.createSpy('hasPermission').and.returnValue(true) };

  beforeEach(async () => {
    loanFormClosed = new Subject<CreateLoanPayload | undefined>();
    customerCreated = new EventEmitter<Customer>();
    loanFormRef = { componentInstance: { customerCreated }, afterClosed: () => loanFormClosed };
    dialog.open.calls.reset();
    dialog.open.and.returnValue(loanFormRef);
    loanApi.create.calls.reset();
    customersApi.list.and.returnValue(of({ items: [{ id: 'customer-1', firstName: 'Ana', lastName: 'Quispe', documentType: 'DNI', documentNumber: '12345678', isActive: true }], pagination: { page: 1, pageSize: 100, total: 1, totalPages: 1 } }));
    auth.hasPermission.and.returnValue(true);
    await TestBed.configureTestingModule({
      imports: [LoansPageComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialog, useValue: dialog }, { provide: LoansService, useValue: loanApi }, { provide: CustomersService, useValue: customersApi },
        { provide: AuthService, useValue: auth }, { provide: NotificationService, useValue: { success: jasmine.createSpy('success'), warning: jasmine.createSpy('warning') } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    }).compileComponents();
  });

  it('abre el formulario con clientes activos cuando puede crear', () => {
    const component = TestBed.createComponent(LoansPageComponent).componentInstance;
    component.create();
    expect(dialog.open).toHaveBeenCalledWith(LoanFormComponent, jasmine.objectContaining({ data: jasmine.objectContaining({ customers: jasmine.any(Array) }) }));
  });

  it('permits customer creation when no customers exist and updates list without sending loan', () => {
    customersApi.list.and.returnValue(of({ items: [], pagination: { page: 1, pageSize: 100, total: 0, totalPages: 0 } }));
    const component = TestBed.createComponent(LoansPageComponent).componentInstance;
    const created: Customer = { id: 'customer-new', firstName: 'Rosa', lastName: 'Mamani', documentType: 'DNI', documentNumber: '87654321', phone: '987654321', email: null, address: 'Jr. Lima 123', isActive: true, createdAt: '', updatedAt: '' };

    component.create();
    customerCreated.emit(created);

    expect(dialog.open).toHaveBeenCalledWith(LoanFormComponent, jasmine.objectContaining({ data: jasmine.objectContaining({ customers: [] }) }));
    expect(component.customers()).toEqual([created]);
    expect(loanApi.create).not.toHaveBeenCalled();
    loanFormClosed.next(undefined);
    loanFormClosed.complete();
  });
});
