import { AppError, notFound } from '../../../shared/errors/app-error.js';
import { amountToCents, centsToAmount, rateToUnits, unitsToRate } from '../../interest/domain/monetary-value.js';
import type { InstallmentScheduleGenerator } from '../../installments/application/installment-schedule.generator.js';
import type { InstallmentData } from '../../installments/domain/installment.js';
import type { InstallmentRepository } from '../../installments/domain/installment-repository.js';
import type { CustomerRepository } from '../../customers/domain/customer-repository.js';
import type { LoanAuditLogger } from '../domain/loan-audit-logger.js';
import type { CreateLoanInput, LoanListCriteria, LoanPage, LoanRepository } from '../domain/loan-repository.js';
import type { Loan, LoanData, LoanStatus } from '../domain/loan.js';

const toData = (loan: Loan): LoanData => loan.data;
const isValidDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());

export class ListLoansUseCase {
  constructor(private readonly loans: LoanRepository) {}
  async execute(criteria: LoanListCriteria): Promise<{ items: LoanData[]; pagination: Omit<LoanPage, 'items'> }> {
    const page = await this.loans.findPage({ ...criteria, search: criteria.search?.trim() || undefined });
    return { items: page.items.map(toData), pagination: { total: page.total, page: page.page, pageSize: page.pageSize, totalPages: page.totalPages } };
  }
}

export class GetLoanUseCase {
  constructor(private readonly loans: LoanRepository, private readonly installments: InstallmentRepository) {}
  async execute(id: string): Promise<LoanData & { installments: InstallmentData[] }> {
    const loan = await this.loans.findById(id);
    if (!loan) throw notFound('Préstamo');
    return { ...toData(loan), installments: (await this.installments.findByLoanId(id)).map((item) => item.data) };
  }
}

export class CreateLoanUseCase {
  constructor(
    private readonly loans: LoanRepository,
    private readonly customers: CustomerRepository,
    private readonly schedule: InstallmentScheduleGenerator,
    private readonly audit: LoanAuditLogger,
  ) {}

  async execute(input: CreateLoanInput, actorId: string): Promise<LoanData> {
    if (!Number.isInteger(input.installmentCount) || input.installmentCount < 1) throw new AppError(422, 'INVALID_INSTALLMENT_COUNT', 'El número de cuotas debe ser mayor que cero.');
    if (!isValidDate(input.disbursementDate) || !isValidDate(input.firstInstallmentDate) || input.firstInstallmentDate <= input.disbursementDate) {
      throw new AppError(422, 'INVALID_LOAN_DATES', 'La primera cuota debe tener una fecha válida posterior al desembolso.');
    }
    const customer = await this.customers.findById(input.customerId);
    if (!customer) throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'El cliente no fue encontrado.');
    if (!customer.data.isActive) throw new AppError(422, 'CUSTOMER_INACTIVE', 'No se puede crear un préstamo para un cliente inactivo.');
    const principalCents = amountToCents(input.principalAmount);
    const rateUnits = rateToUnits(input.interestRate);
    if (principalCents <= 0n) throw new AppError(422, 'INVALID_LOAN_AMOUNT', 'El monto solicitado debe ser mayor que cero.');
    const generated = this.schedule.generate({ principalCents, rateUnits, installmentCount: input.installmentCount, firstInstallmentDate: input.firstInstallmentDate, paymentFrequency: input.paymentFrequency });
    const loan = await this.loans.createWithInstallments({
      ...input,
      principalAmount: centsToAmount(principalCents),
      interestRate: unitsToRate(rateUnits),
      totalAmount: centsToAmount(generated.totalAmountCents),
      observations: input.observations?.trim() || null,
    }, generated.installments);
    this.audit.record('loan.created', actorId, loan.data.id);
    return toData(loan);
  }
}

export class SetLoanStatusUseCase {
  constructor(private readonly loans: LoanRepository, private readonly audit: LoanAuditLogger) {}
  async execute(id: string, status: LoanStatus, actorId: string): Promise<LoanData> {
    const loan = await this.loans.updateStatus(id, status);
    if (!loan) throw notFound('Préstamo');
    this.audit.record('loan.status_changed', actorId, loan.data.id);
    return toData(loan);
  }
}
