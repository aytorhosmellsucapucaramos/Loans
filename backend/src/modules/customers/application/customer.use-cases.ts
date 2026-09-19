import { AppError, notFound } from '../../../shared/errors/app-error.js';
import type { CustomerAuditLogger } from '../domain/customer-audit-logger.js';
import type { Customer, CustomerData } from '../domain/customer.js';
import type { CreateCustomerInput, CustomerListCriteria, CustomerPage, CustomerRepository, UpdateCustomerInput } from '../domain/customer-repository.js';

const normalize = <T extends CreateCustomerInput>(input: T): T => ({
  ...input,
  documentType: input.documentType.toUpperCase() as T['documentType'],
  documentNumber: input.documentNumber.trim().toUpperCase(),
  firstName: input.firstName.trim(),
  lastName: input.lastName.trim(),
  phone: input.phone.trim(),
  email: input.email?.trim() ? input.email.trim().toLowerCase() : null,
  address: input.address.trim(),
});

const toData = (customer: Customer): CustomerData => customer.data;

export class ListCustomersUseCase {
  constructor(private readonly customers: CustomerRepository) {}

  async execute(criteria: CustomerListCriteria): Promise<{ items: CustomerData[]; pagination: Omit<CustomerPage, 'items'> }> {
    const page = await this.customers.findPage({ ...criteria, search: criteria.search?.trim() || undefined });
    return {
      items: page.items.map(toData),
      pagination: { total: page.total, page: page.page, pageSize: page.pageSize, totalPages: page.totalPages },
    };
  }
}

export class GetCustomerUseCase {
  constructor(private readonly customers: CustomerRepository) {}

  async execute(id: string): Promise<CustomerData> {
    const customer = await this.customers.findById(id);
    if (!customer) throw notFound('Cliente');
    return toData(customer);
  }
}

export class CreateCustomerUseCase {
  constructor(private readonly customers: CustomerRepository, private readonly audit: CustomerAuditLogger) {}

  async execute(input: CreateCustomerInput, actorId: string): Promise<CustomerData> {
    const normalized = normalize(input);
    const existing = await this.customers.findByDocument(normalized.documentType, normalized.documentNumber);
    if (existing) throw new AppError(409, 'DOCUMENT_ALREADY_EXISTS', 'El tipo y número de documento ya están registrados.');
    const customer = await this.customers.create(normalized);
    await this.audit.record('customer.created', actorId, customer.data.id);
    return toData(customer);
  }
}

export class UpdateCustomerUseCase {
  constructor(private readonly customers: CustomerRepository, private readonly audit: CustomerAuditLogger) {}

  async execute(id: string, input: UpdateCustomerInput, actorId: string): Promise<CustomerData> {
    const current = await this.customers.findById(id);
    if (!current) throw notFound('Cliente');
    const normalized = normalize(input);
    const existing = await this.customers.findByDocument(normalized.documentType, normalized.documentNumber, id);
    if (existing) throw new AppError(409, 'DOCUMENT_ALREADY_EXISTS', 'El tipo y número de documento ya están registrados.');
    const customer = await this.customers.update(id, normalized);
    if (!customer) throw notFound('Cliente');
    await this.audit.record('customer.updated', actorId, customer.data.id);
    return toData(customer);
  }
}

export class SetCustomerStatusUseCase {
  constructor(private readonly customers: CustomerRepository, private readonly audit: CustomerAuditLogger) {}

  async execute(id: string, isActive: boolean, actorId: string): Promise<CustomerData> {
    const customer = await this.customers.updateStatus(id, isActive);
    if (!customer) throw notFound('Cliente');
    await this.audit.record('customer.status_changed', actorId, customer.data.id);
    return toData(customer);
  }
}
