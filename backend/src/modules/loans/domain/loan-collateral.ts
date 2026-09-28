import { AppError } from '../../../shared/errors/app-error.js';
import { amountToCents } from '../../interest/domain/monetary-value.js';

export type LoanCollateralCustodyStatus = 'in_custody' | 'returned';

export type NewLoanCollateralInput = {
  description: string;
  category: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  physicalCondition: string;
  estimatedValue: string | number;
  notes?: string | null;
  receivedAt?: string;
};

export type LoanCollateralData = {
  id: string;
  loanId: string;
  description: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  physicalCondition: string;
  estimatedValue: string;
  notes: string | null;
  receivedAt: string;
  custodyStatus: LoanCollateralCustodyStatus;
  returnedAt: Date | null;
  returnedBy: { id: string; firstName: string; lastName: string } | null;
  createdAt: Date;
  updatedAt: Date;
};

export class LoanCollateralItem {
  constructor(public readonly data: LoanCollateralData) {
    let value: bigint;
    try {
      value = amountToCents(data.estimatedValue);
    } catch {
      throw new AppError(422, 'INVALID_COLLATERAL_VALUE', 'El valor estimado de la garantía no es válido.');
    }
    if (value <= 0n) throw new AppError(422, 'INVALID_COLLATERAL_VALUE', 'El valor estimado de la garantía debe ser mayor que cero.');
    if (!data.description.trim() || !data.category.trim() || !data.physicalCondition.trim()) {
      throw new AppError(422, 'INVALID_COLLATERAL_DATA', 'La descripción, categoría y estado físico son obligatorios.');
    }
  }
}
