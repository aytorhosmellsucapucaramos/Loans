import { notFound } from '../../../shared/errors/app-error.js';
import type { InstallmentData } from '../domain/installment.js';
import type { InstallmentRepository } from '../domain/installment-repository.js';
import type { LoanAccessScope } from '../../loans/domain/loan-repository.js';
import type { LoanRepository } from '../../loans/domain/loan-repository.js';

export class GetInstallmentUseCase {
  constructor(private readonly installments: InstallmentRepository) {}
  async execute(id: string, scope: LoanAccessScope): Promise<InstallmentData> {
    const installment = await this.installments.findById(id, scope);
    if (!installment) throw notFound('Cuota');
    return installment.data;
  }
}

export class ListLoanInstallmentsUseCase {
  constructor(private readonly loans: LoanRepository, private readonly installments: InstallmentRepository) {}
  async execute(loanId: string, scope: LoanAccessScope): Promise<InstallmentData[]> {
    if (!await this.loans.findById(loanId, scope)) throw notFound('Préstamo');
    return (await this.installments.findByLoanId(loanId, scope)).map((item) => item.data);
  }
}
