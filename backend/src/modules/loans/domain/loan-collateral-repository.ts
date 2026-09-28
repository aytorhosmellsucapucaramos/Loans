import type { LoanCollateralItem, NewLoanCollateralInput } from './loan-collateral.js';

export interface LoanCollateralRepository {
  findByLoanId(loanId: string): Promise<LoanCollateralItem[]>;
  findById(loanId: string, collateralId: string): Promise<LoanCollateralItem | null>;
  returnItem(loanId: string, collateralId: string, actorId: string): Promise<LoanCollateralItem | null>;
}

export type { NewLoanCollateralInput };
