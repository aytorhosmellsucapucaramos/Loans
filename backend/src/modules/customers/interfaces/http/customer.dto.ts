import type { DocumentType } from '../../domain/customer.js';

export type CustomerBodyDto = {
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address: string;
};

export type CustomerStatusDto = { isActive: boolean };

export type CustomerListQueryDto = {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
};
