import { AppError, notFound } from '../../../shared/errors/app-error.js';
import type { LoanCollateralRepository } from '../domain/loan-collateral-repository.js';
import type { LoanRepository } from '../domain/loan-repository.js';
import type { LoanAuditLogger } from '../domain/loan-audit-logger.js';

export class ListLoanCollateralUseCase {
  constructor(private readonly loans: LoanRepository, private readonly collateral: LoanCollateralRepository) {}

  async execute(loanId: string) {
    if (!await this.loans.findById(loanId)) throw notFound('Préstamo');
    return (await this.collateral.findByLoanId(loanId)).map((item) => item.data);
  }
}

export class ReturnLoanCollateralUseCase {
  constructor(private readonly loans: LoanRepository, private readonly collateral: LoanCollateralRepository, private readonly audit: LoanAuditLogger) {}

  async execute(loanId: string, collateralId: string, actorId: string) {
    const loan = await this.loans.findById(loanId);
    if (!loan) throw notFound('Préstamo');
    if (loan.data.status !== 'paid') {
      throw new AppError(422, 'COLLATERAL_RETURN_REQUIRES_PAID_LOAN', 'La garantía solo puede devolverse cuando el préstamo esté pagado.');
    }
    const item = await this.collateral.findById(loanId, collateralId);
    if (!item) throw notFound('Objeto en garantía');
    if (item.data.custodyStatus === 'returned') {
      throw new AppError(409, 'COLLATERAL_ALREADY_RETURNED', 'Este objeto ya fue devuelto.');
    }
    const returned = await this.collateral.returnItem(loanId, collateralId, actorId);
    if (!returned) throw new AppError(409, 'COLLATERAL_ALREADY_RETURNED', 'Este objeto ya fue devuelto.');
    await this.audit.record('loan.collateral_returned', actorId, loanId, { collateralItemId: collateralId });
    return returned.data;
  }
}
