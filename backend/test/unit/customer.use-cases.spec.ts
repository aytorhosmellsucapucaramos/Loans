import { AppError } from '../../src/shared/errors/app-error.js';
import { CreateCustomerUseCase, GetCustomerUseCase, ListCustomersUseCase, SetCustomerStatusUseCase, UpdateCustomerUseCase } from '../../src/modules/customers/application/customer.use-cases.js';
import { Customer, type CustomerData } from '../../src/modules/customers/domain/customer.js';
import type { CustomerAuditLogger } from '../../src/modules/customers/domain/customer-audit-logger.js';
import type { CustomerRepository } from '../../src/modules/customers/domain/customer-repository.js';

const data: CustomerData = {
  id: '44444444-4444-4444-4444-444444444444', documentType: 'DNI', documentNumber: '12345678',
  firstName: 'María', lastName: 'Quispe', phone: '987654321', email: 'maria@example.com', address: 'Av. Perú 123, Lima',
  isActive: true, createdAt: new Date(), updatedAt: new Date(),
};
const customer = (): Customer => new Customer({ ...data });

const repository = (overrides: Partial<CustomerRepository> = {}): CustomerRepository => ({
  create: jest.fn().mockResolvedValue(customer()),
  findById: jest.fn().mockResolvedValue(customer()),
  findByDocument: jest.fn().mockResolvedValue(null),
  findPage: jest.fn().mockResolvedValue({ items: [customer()], total: 1, page: 1, pageSize: 20, totalPages: 1 }),
  update: jest.fn().mockResolvedValue(customer()),
  updateStatus: jest.fn().mockResolvedValue(customer()),
  ...overrides,
});
const audit: CustomerAuditLogger = { record: jest.fn() };

describe('casos de uso de clientes', () => {
  it('crea un cliente normalizando los campos y registra la auditoría', async () => {
    const customers = repository();
    const result = await new CreateCustomerUseCase(customers, audit).execute({
      documentType: 'DNI', documentNumber: ' 12345678 ', firstName: ' María ', lastName: ' Quispe ', phone: '987654321', email: ' MARIA@EXAMPLE.COM ', address: ' Av. Perú 123, Lima ',
    }, 'actor-1');

    expect(result.id).toBe(data.id);
    expect(customers.create).toHaveBeenCalledWith(expect.objectContaining({ documentNumber: '12345678', email: 'maria@example.com' }));
    expect(audit.record).toHaveBeenCalledWith('customer.created', 'actor-1', data.id);
  });

  it('rechaza el documento duplicado con 409', async () => {
    const customers = repository({ findByDocument: jest.fn().mockResolvedValue(customer()) });
    await expect(new CreateCustomerUseCase(customers, audit).execute({ ...data }, 'actor-1')).rejects.toMatchObject<AppError>({ statusCode: 409, code: 'DOCUMENT_ALREADY_EXISTS' });
  });

  it('devuelve la página de clientes y su paginación', async () => {
    const result = await new ListCustomersUseCase(repository()).execute({ page: 1, pageSize: 20, search: '  Qui ' });
    expect(result).toMatchObject({ items: [{ id: data.id }], pagination: { total: 1, totalPages: 1 } });
  });

  it('actualiza y cambia el estado conservando la auditoría', async () => {
    const customers = repository();
    await new UpdateCustomerUseCase(customers, audit).execute(data.id, { ...data, address: 'Jr. Lima 456' }, 'actor-1');
    await new SetCustomerStatusUseCase(customers, audit).execute(data.id, false, 'actor-1');
    expect(audit.record).toHaveBeenCalledWith('customer.updated', 'actor-1', data.id);
    expect(audit.record).toHaveBeenCalledWith('customer.status_changed', 'actor-1', data.id);
  });

  it('informa 404 al solicitar un cliente inexistente', async () => {
    await expect(new GetCustomerUseCase(repository({ findById: jest.fn().mockResolvedValue(null) })).execute(data.id)).rejects.toMatchObject<AppError>({ statusCode: 404 });
  });
});
