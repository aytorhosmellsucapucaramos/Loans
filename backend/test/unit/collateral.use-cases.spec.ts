import { AppError } from '../../src/shared/errors/app-error.js';
import { ReturnLoanCollateralUseCase } from '../../src/modules/loans/application/collateral.use-cases.js';
import { LoanCollateralItem } from '../../src/modules/loans/domain/loan-collateral.js';
import type { LoanCollateralRepository } from '../../src/modules/loans/domain/loan-collateral-repository.js';
import { Loan } from '../../src/modules/loans/domain/loan.js';
import type { LoanRepository } from '../../src/modules/loans/domain/loan-repository.js';

const loan = (status: 'active' | 'paid' | 'cancelled') => new Loan({
  id: 'loan-1', customerId: 'customer-1', principalAmount: '1000.00', interestRate: '10.0000', interestType: 'simple', paymentFrequency: 'monthly', installmentCount: 1,
  disbursementDate: '2026-01-01', firstInstallmentDate: '2026-02-01', totalAmount: '1100.00', status, observations: null, createdAt: new Date(), updatedAt: new Date(),
});
const collateral = (custodyStatus: 'in_custody' | 'returned') => new LoanCollateralItem({
  id: 'item-1', loanId: 'loan-1', description: 'Televisor', category: 'Electrónica', brand: null, model: null, serialNumber: null, physicalCondition: 'Buen estado', estimatedValue: '500.00', notes: null,
  receivedAt: '2026-01-01', custodyStatus, returnedAt: custodyStatus === 'returned' ? new Date() : null, returnedBy: custodyStatus === 'returned' ? { id: 'actor-1', firstName: 'Ana', lastName: 'Pérez' } : null, createdAt: new Date(), updatedAt: new Date(),
});

describe('ReturnLoanCollateralUseCase', () => {
  const loans: LoanRepository = { findById: jest.fn(), findPage: jest.fn(), updateStatus: jest.fn(), createWithInstallments: jest.fn() };
  const items: LoanCollateralRepository = { findByLoanId: jest.fn(), findById: jest.fn(), returnItem: jest.fn() };
  const audit = { record: jest.fn() };
  const useCase = new ReturnLoanCollateralUseCase(loans, items, audit);

  beforeEach(() => jest.clearAllMocks());

  it('rechaza devolución antes de pagar préstamo y no modifica custodia', async () => {
    (loans.findById as jest.Mock).mockResolvedValue(loan('active'));

    await expect(useCase.execute('loan-1', 'item-1', 'actor-1')).rejects.toMatchObject<AppError>({ code: 'COLLATERAL_RETURN_REQUIRES_PAID_LOAN', statusCode: 422 });
    expect(items.returnItem).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('registra devolución después del pago con usuario y auditoría', async () => {
    (loans.findById as jest.Mock).mockResolvedValue(loan('paid'));
    (items.findById as jest.Mock).mockResolvedValue(collateral('in_custody'));
    (items.returnItem as jest.Mock).mockResolvedValue(collateral('returned'));

    await expect(useCase.execute('loan-1', 'item-1', 'actor-1')).resolves.toMatchObject({ custodyStatus: 'returned', returnedBy: { id: 'actor-1' } });
    expect(items.returnItem).toHaveBeenCalledWith('loan-1', 'item-1', 'actor-1');
    expect(audit.record).toHaveBeenCalledWith('loan.collateral_returned', 'actor-1', 'loan-1', { collateralItemId: 'item-1' });
  });

  it('rechaza una segunda devolución', async () => {
    (loans.findById as jest.Mock).mockResolvedValue(loan('paid'));
    (items.findById as jest.Mock).mockResolvedValue(collateral('returned'));

    await expect(useCase.execute('loan-1', 'item-1', 'actor-1')).rejects.toMatchObject<AppError>({ code: 'COLLATERAL_ALREADY_RETURNED', statusCode: 409 });
    expect(items.returnItem).not.toHaveBeenCalled();
  });
});
