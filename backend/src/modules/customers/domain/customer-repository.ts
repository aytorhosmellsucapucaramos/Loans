import type { Customer, DocumentType } from './customer.js';

export type CreateCustomerInput = {
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  address: string;
};

export type UpdateCustomerInput = CreateCustomerInput;

export type CustomerListCriteria = {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
};

export type CustomerPage = {
  items: Customer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export interface CustomerRepository {
  create(input: CreateCustomerInput): Promise<Customer>;
  findById(id: string): Promise<Customer | null>;
  findByDocument(documentType: DocumentType, documentNumber: string, excludeId?: string): Promise<Customer | null>;
  findPage(criteria: CustomerListCriteria): Promise<CustomerPage>;
  update(id: string, input: UpdateCustomerInput): Promise<Customer | null>;
  updateStatus(id: string, isActive: boolean): Promise<Customer | null>;
}
