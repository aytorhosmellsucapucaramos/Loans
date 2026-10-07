import { AppError } from '../../src/shared/errors/app-error.js';
import { CreateLoanUseCase, PreviewLoanUseCase } from '../../src/modules/loans/application/loan.use-cases.js';
import { Loan } from '../../src/modules/loans/domain/loan.js';
import type { LoanRepository } from '../../src/modules/loans/domain/loan-repository.js';
import { Customer } from '../../src/modules/customers/domain/customer.js';
import type { CustomerRepository } from '../../src/modules/customers/domain/customer-repository.js';
import { InstallmentScheduleGenerator } from '../../src/modules/installments/application/installment-schedule.generator.js';
import { SimpleInterestStrategy } from '../../src/modules/interest/domain/simple-interest.strategy.js';

const customer = (isActive = true) => new Customer({ id: 'customer-1', documentType: 'DNI', documentNumber: '12345678', firstName: 'Ana', lastName: 'Quispe', phone: '987654321', email: null, address: 'Av. Perú 123', isActive, createdAt: new Date(), updatedAt: new Date() });
const input = { customerId: 'customer-1', principalAmount: '1000.00', interestRate: '10', interestType: 'simple' as const, paymentFrequency: 'monthly' as const, installmentCount: 4, disbursementDate: '2026-01-01', firstInstallmentDate: '2026-02-01' };
const adminScope = { userId: 'actor-1', isAdmin: true };
const collateral = { description: 'Televisor', category: 'Electrónica', brand: 'Marca', model: 'Modelo', serialNumber: 'SERIE-1', physicalCondition: 'Buen estado', estimatedValue: '500.00', receivedAt: '2026-01-01' };

describe('CreateLoanUseCase', () => {
  const customers: CustomerRepository = { create: jest.fn(), findByDocument: jest.fn(), findPage: jest.fn(), update: jest.fn(), updateStatus: jest.fn(), findById: jest.fn() };
  const loans: LoanRepository = { findById: jest.fn(), findPage: jest.fn(), updateStatus: jest.fn(), createWithInstallments: jest.fn() };
  const audit = { record: jest.fn() };
  const schedule = new InstallmentScheduleGenerator(new SimpleInterestStrategy());
  const useCase = new CreateLoanUseCase(loans, customers, schedule, audit);
  const previewUseCase = new PreviewLoanUseCase(customers, schedule);

  beforeEach(() => {
    jest.clearAllMocks();
    (customers.findById as jest.Mock).mockResolvedValue(customer());
    (loans.createWithInstallments as jest.Mock).mockImplementation(async (loanInput) => new Loan({ id: 'loan-1', ...loanInput, status: 'active', observations: null, createdAt: new Date(), updatedAt: new Date() }));
  });

  it('valida el cliente y persiste préstamo y cronograma mediante una sola operación atómica', async () => {
    const result = await useCase.execute(input, 'actor-1', adminScope);
    expect(result.totalAmount).toBe('1100.00');
    expect(loans.createWithInstallments).toHaveBeenCalledWith(expect.objectContaining({ totalAmount: '1100.00' }), expect.any(Array), []);
    expect((loans.createWithInstallments as jest.Mock).mock.calls[0]?.[1]).toHaveLength(4);
    expect(audit.record).toHaveBeenCalledWith('loan.created', 'actor-1', 'loan-1');
  });

  it('persiste varios objetos en garantía junto al préstamo y sus cuotas', async () => {
    await useCase.execute({ ...input, collateralItems: [collateral, { ...collateral, description: 'Laptop', estimatedValue: 900 }] }, 'actor-1', adminScope);

    expect(loans.createWithInstallments).toHaveBeenCalledWith(expect.any(Object), expect.any(Array), [
      expect.objectContaining({ description: 'Televisor', estimatedValue: '500.00' }),
      expect.objectContaining({ description: 'Laptop', estimatedValue: '900.00' }),
    ]);
  });

  it('permite crear préstamo sin objetos en garantía', async () => {
    await expect(useCase.execute(input, 'actor-1', adminScope)).resolves.toMatchObject({ id: 'loan-1' });
    expect(loans.createWithInstallments).toHaveBeenCalledWith(expect.any(Object), expect.any(Array), []);
  });

  it('previsualiza importes y vencimientos iguales al registro sin escribir ni auditar', async () => {
    const preview = await previewUseCase.execute(input, adminScope);

    expect(preview.totalInterestAmount).toBe('100.00');
    expect(preview.totalAmount).toBe('1100.00');
    expect(preview.installments).toHaveLength(4);
    expect(preview.installments[0]).toMatchObject({ installmentNumber: 1, dueDate: '2026-02-01', principalAmount: '250.00', interestAmount: '25.00', scheduledAmount: '275.00' });
    expect(loans.createWithInstallments).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();

    await useCase.execute(input, 'actor-1', adminScope);
    const [savedLoan, savedInstallments] = (loans.createWithInstallments as jest.Mock).mock.calls[0] as [Record<string, string>, Array<Record<string, unknown>>];
    expect(preview.totalAmount).toBe(savedLoan.totalAmount);
    expect(preview.totalInterestAmount).toBe((Number(savedLoan.totalAmount) - Number(savedLoan.principalAmount)).toFixed(2));
    expect(preview.installments).toEqual(savedInstallments.map(({ loanId: _loanId, ...installment }) => installment));
  });

  it.each([
    ['inexistente', null, input, 'CUSTOMER_NOT_FOUND'],
    ['inactivo', customer(false), input, 'CUSTOMER_INACTIVE'],
    ['monto inválido', customer(), { ...input, principalAmount: '0.00' }, 'INVALID_LOAN_AMOUNT'],
    ['tasa inválida', customer(), { ...input, interestRate: '-1' }, 'INVALID_MONETARY_VALUE'],
    ['cuotas inválidas', customer(), { ...input, installmentCount: 0 }, 'INVALID_INSTALLMENT_COUNT'],
    ['valor de garantía inválido', customer(), { ...input, collateralItems: [{ ...collateral, estimatedValue: '0.00' }] }, 'INVALID_COLLATERAL_VALUE'],
    ['valor de garantía con decimales inválidos', customer(), { ...input, collateralItems: [{ ...collateral, estimatedValue: '1.001' }] }, 'INVALID_COLLATERAL_VALUE'],
  ])('rechaza cliente o datos %s', async (_label, foundCustomer, invalidInput, code) => {
    (customers.findById as jest.Mock).mockResolvedValue(foundCustomer);
    await expect(useCase.execute(invalidInput, 'actor-1', adminScope)).rejects.toMatchObject<AppError>({ code });
  });
});
