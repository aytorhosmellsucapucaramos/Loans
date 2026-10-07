import { AppError, notFound } from '../../../shared/errors/app-error.js';
import { amountToCents, centsToAmount, rateToUnits, unitsToRate } from '../../interest/domain/monetary-value.js';
import type { InstallmentScheduleGenerator } from '../../installments/application/installment-schedule.generator.js';
import type { InstallmentData } from '../../installments/domain/installment.js';
import type { InstallmentRepository } from '../../installments/domain/installment-repository.js';
import type { CustomerRepository } from '../../customers/domain/customer-repository.js';
import type { NewInstallment } from '../../installments/domain/installment.js';
import type { NewLoanCollateralInput } from '../domain/loan-collateral.js';
import type { LoanAuditLogger } from '../domain/loan-audit-logger.js';
import type { CreateLoanInput, LoanAccessScope, LoanListCriteria, LoanPage, LoanRepository } from '../domain/loan-repository.js';
import type { Loan, LoanData, LoanStatus } from '../domain/loan.js';

const toData = (loan: Loan): LoanData => loan.data;
const isValidDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());

const normalizeCollateralItems = (items: NewLoanCollateralInput[] | undefined): NewLoanCollateralInput[] => (items ?? []).map((item) => {
  let amount: bigint;
  try {
    amount = amountToCents(item.estimatedValue);
  } catch {
    throw new AppError(422, 'INVALID_COLLATERAL_VALUE', 'El valor estimado de la garantía no es válido.');
  }
  if (amount <= 0n) throw new AppError(422, 'INVALID_COLLATERAL_VALUE', 'El valor estimado de la garantía debe ser mayor que cero.');
  if (!item.description.trim() || !item.category.trim() || !item.physicalCondition.trim()) {
    throw new AppError(422, 'INVALID_COLLATERAL_DATA', 'La descripción, categoría y estado físico son obligatorios.');
  }
  return {
    description: item.description.trim(),
    category: item.category.trim(),
    brand: item.brand?.trim() || null,
    model: item.model?.trim() || null,
    serialNumber: item.serialNumber?.trim() || null,
    physicalCondition: item.physicalCondition.trim(),
    estimatedValue: centsToAmount(amount),
    notes: item.notes?.trim() || null,
    receivedAt: item.receivedAt,
  };
});

type LoanCalculation = {
  principalAmount: string;
  interestRate: string;
  totalInterestAmount: string;
  totalAmount: string;
  installments: NewInstallment[];
};

const calculateLoan = async (input: CreateLoanInput, customers: CustomerRepository, schedule: InstallmentScheduleGenerator, scope?: LoanAccessScope): Promise<LoanCalculation> => {
  if (!Number.isInteger(input.installmentCount) || input.installmentCount < 1) throw new AppError(422, 'INVALID_INSTALLMENT_COUNT', 'El número de cuotas debe ser mayor que cero.');
  if (!isValidDate(input.disbursementDate) || !isValidDate(input.firstInstallmentDate) || input.firstInstallmentDate <= input.disbursementDate) {
    throw new AppError(422, 'INVALID_LOAN_DATES', 'La primera cuota debe tener una fecha válida posterior al desembolso.');
  }
  const customer = await customers.findById(input.customerId, scope);
  if (!customer) throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'El cliente no fue encontrado.');
  if (!customer.data.isActive) throw new AppError(422, 'CUSTOMER_INACTIVE', 'No se puede crear un préstamo para un cliente inactivo.');
  const principalCents = amountToCents(input.principalAmount);
  const rateUnits = rateToUnits(input.interestRate);
  if (principalCents <= 0n) throw new AppError(422, 'INVALID_LOAN_AMOUNT', 'El monto solicitado debe ser mayor que cero.');
  const generated = schedule.generate({ principalCents, rateUnits, installmentCount: input.installmentCount, firstInstallmentDate: input.firstInstallmentDate, paymentFrequency: input.paymentFrequency });
  return {
    principalAmount: centsToAmount(principalCents),
    interestRate: unitsToRate(rateUnits),
    totalInterestAmount: centsToAmount(generated.totalInterestCents),
    totalAmount: centsToAmount(generated.totalAmountCents),
    installments: generated.installments,
  };
};

export class PreviewLoanUseCase {
  constructor(private readonly customers: CustomerRepository, private readonly schedule: InstallmentScheduleGenerator) {}

  async execute(input: CreateLoanInput, scope: LoanAccessScope) {
    const calculation = await calculateLoan(input, this.customers, this.schedule, scope);
    return {
      customerId: input.customerId,
      principalAmount: calculation.principalAmount,
      interestRate: calculation.interestRate,
      interestType: input.interestType,
      paymentFrequency: input.paymentFrequency,
      installmentCount: input.installmentCount,
      disbursementDate: input.disbursementDate,
      firstInstallmentDate: input.firstInstallmentDate,
      totalInterestAmount: calculation.totalInterestAmount,
      totalAmount: calculation.totalAmount,
      installments: calculation.installments.map(({ installmentNumber, dueDate, principalAmount, interestAmount, scheduledAmount, outstandingAmount, status }) => ({
        installmentNumber, dueDate, principalAmount, interestAmount, scheduledAmount, outstandingAmount, status,
      })),
    };
  }
}

export class ListLoansUseCase {
  constructor(private readonly loans: LoanRepository) {}
  async execute(criteria: LoanListCriteria, scope: LoanAccessScope): Promise<{ items: LoanData[]; pagination: Omit<LoanPage, 'items'> }> {
    const page = await this.loans.findPage({ ...criteria, search: criteria.search?.trim() || undefined }, scope);
    return { items: page.items.map(toData), pagination: { total: page.total, page: page.page, pageSize: page.pageSize, totalPages: page.totalPages } };
  }
}

export class GetLoanUseCase {
  constructor(private readonly loans: LoanRepository, private readonly installments: InstallmentRepository) {}
  async execute(id: string, scope: LoanAccessScope): Promise<LoanData & { installments: InstallmentData[] }> {
    const loan = await this.loans.findById(id, scope);
    if (!loan) throw notFound('Préstamo');
    return { ...toData(loan), installments: (await this.installments.findByLoanId(id, scope)).map((item) => item.data) };
  }
}

export class CreateLoanUseCase {
  constructor(
    private readonly loans: LoanRepository,
    private readonly customers: CustomerRepository,
    private readonly schedule: InstallmentScheduleGenerator,
    private readonly audit: LoanAuditLogger,
  ) {}

  async execute(input: CreateLoanInput, actorId: string, scope: LoanAccessScope): Promise<LoanData> {
    const calculation = await calculateLoan(input, this.customers, this.schedule, scope);
    const collateralItems = normalizeCollateralItems(input.collateralItems);
    const loanInput = { ...input };
    delete loanInput.collateralItems;
    const loan = await this.loans.createWithInstallments({
      ...loanInput,
      principalAmount: calculation.principalAmount,
      interestRate: calculation.interestRate,
      totalAmount: calculation.totalAmount,
      observations: input.observations?.trim() || null,
    }, calculation.installments, collateralItems);
    await this.audit.record('loan.created', actorId, loan.data.id);
    return toData(loan);
  }
}

export class SetLoanStatusUseCase {
  constructor(private readonly loans: LoanRepository, private readonly audit: LoanAuditLogger) {}
  async execute(id: string, status: LoanStatus, actorId: string, scope: LoanAccessScope): Promise<LoanData> {
    const loan = await this.loans.updateStatus(id, status, scope);
    if (!loan) throw notFound('Préstamo');
    await this.audit.record('loan.status_changed', actorId, loan.data.id);
    return toData(loan);
  }
}
