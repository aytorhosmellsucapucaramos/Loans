import { AppError } from '../../../shared/errors/app-error.js';

export const documentTypes = ['DNI', 'CE', 'PASSPORT', 'RUC'] as const;
export type DocumentType = (typeof documentTypes)[number];

export type CustomerData = {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class Customer {
  constructor(public readonly data: CustomerData) {
    if (!data.firstName.trim() || !data.lastName.trim() || !data.address.trim()) {
      throw new AppError(422, 'INVALID_CUSTOMER_DATA', 'Los datos del cliente no cumplen las reglas del dominio.');
    }
  }
}
