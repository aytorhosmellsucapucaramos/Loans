export type DocumentType = 'DNI' | 'CE' | 'PASSPORT' | 'RUC';

export interface Customer {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPayload {
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address: string;
}

export interface CustomersQuery {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
}

export interface CustomersPage {
  items: Customer[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
