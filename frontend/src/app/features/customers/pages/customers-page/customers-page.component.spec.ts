import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CustomerFormComponent } from '../../components/customer-form/customer-form.component';
import type { Customer } from '../../models/customer.model';
import { CustomersService } from '../../services/customers.service';
import { CustomersPageComponent } from './customers-page.component';

describe('CustomersPageComponent', () => {
  const customer: Customer = {
    id: 'customer-1', documentType: 'DNI', documentNumber: '12345678', firstName: 'Ana', lastName: 'Quispe', phone: '987654321', email: null,
    address: 'Av. Perú 123, Lima', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const dialog = { open: jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(undefined) }) };
  const api = {
    list: jasmine.createSpy('list').and.returnValue(of({ items: [customer], pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } })),
    create: jasmine.createSpy('create'), update: jasmine.createSpy('update'), getById: jasmine.createSpy('getById'), updateStatus: jasmine.createSpy('updateStatus'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomersPageComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: CustomersService, useValue: api },
        { provide: AuthService, useValue: { hasPermission: () => true } },
        { provide: NotificationService, useValue: { success: jasmine.createSpy('success') } },
      ],
    }).compileComponents();
  });

  it('abre el formulario de creación con datos explícitos', () => {
    const component = TestBed.createComponent(CustomersPageComponent).componentInstance;
    component.create();

    expect(dialog.open).toHaveBeenCalledWith(CustomerFormComponent, jasmine.objectContaining({
      data: { mode: 'create' }, width: '600px', maxWidth: '95vw',
    }));
    expect(api.create).not.toHaveBeenCalled();
  });

  it('abre el formulario de edición con el cliente y modo edición', () => {
    const component = TestBed.createComponent(CustomersPageComponent).componentInstance;
    component.edit(customer);

    expect(dialog.open).toHaveBeenCalledWith(CustomerFormComponent, jasmine.objectContaining({
      data: { mode: 'edit', customer }, width: '600px', maxWidth: '95vw',
    }));
  });
});
