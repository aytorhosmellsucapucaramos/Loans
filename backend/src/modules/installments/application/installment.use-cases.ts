import { notFound } from '../../../shared/errors/app-error.js';
import type { InstallmentData } from '../domain/installment.js';
import type { InstallmentRepository } from '../domain/installment-repository.js';

export class GetInstallmentUseCase {
  constructor(private readonly installments: InstallmentRepository) {}
  async execute(id: string): Promise<InstallmentData> {
    const installment = await this.installments.findById(id);
    if (!installment) throw notFound('Cuota');
    return installment.data;
  }
}

export class ListLoanInstallmentsUseCase {
  constructor(private readonly installments: InstallmentRepository) {}
  async execute(loanId: string): Promise<InstallmentData[]> { return (await this.installments.findByLoanId(loanId)).map((item) => item.data); }
}
