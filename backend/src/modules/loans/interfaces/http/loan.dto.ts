import type { InterestType } from '../../../interest/domain/interest-calculation.strategy.js';
import type { PaymentFrequency } from '../../../installments/domain/payment-frequency.js';
import type { LoanStatus } from '../../domain/loan.js';
import type { NewLoanCollateralInput } from '../../domain/loan-collateral.js';

export type CreateLoanDto = {
  customerId: string;
  principalAmount: string | number;
  interestRate: string | number;
  interestType: InterestType;
  paymentFrequency: PaymentFrequency;
  installmentCount: number;
  disbursementDate: string;
  firstInstallmentDate: string;
  observations?: string;
  collateralItems?: NewLoanCollateralInput[];
};
export type LoanStatusDto = { status: LoanStatus };
export type LoanListQueryDto = { page: number; pageSize: number; customerId?: string; status?: LoanStatus; search?: string };
