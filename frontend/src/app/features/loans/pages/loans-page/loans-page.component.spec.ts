import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CustomersService } from '../../../customers/services/customers.service';
import { LoanFormComponent } from '../../components/loan-form/loan-form.component';
import { LoansService } from '../../services/loans.service';
import { LoansPageComponent } from './loans-page.component';

describe('LoansPageComponent', () => {
  const dialog = { open: jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(undefined) }) };
  const loanApi = { list: jasmine.createSpy('list').and.returnValue(of({ items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } })), create: jasmine.createSpy('create'), updateStatus: jasmine.createSpy('updateStatus') };
  const customersApi = { list: jasmine.createSpy('list').and.returnValue(of({ items: [{ id: 'customer-1', firstName: 'Ana', lastName: 'Quispe', documentType: 'DNI', documentNumber: '12345678', isActive: true }], pagination: { page: 1, pageSize: 100, total: 1, totalPages: 1 } })) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoansPageComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialog, useValue: dialog }, { provide: LoansService, useValue: loanApi }, { provide: CustomersService, useValue: customersApi },
        { provide: AuthService, useValue: { hasPermission: () => true } }, { provide: NotificationService, useValue: { success: jasmine.createSpy('success'), warning: jasmine.createSpy('warning') } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    }).compileComponents();
  });

  it('abre el formulario con clientes activos cuando puede crear', () => {
    const component = TestBed.createComponent(LoansPageComponent).componentInstance;
    component.create();
    expect(dialog.open).toHaveBeenCalledWith(LoanFormComponent, jasmine.objectContaining({ data: jasmine.objectContaining({ customers: jasmine.any(Array) }) }));
  });
});
