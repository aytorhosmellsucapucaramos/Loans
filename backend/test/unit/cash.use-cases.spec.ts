import { AppError } from '../../src/shared/errors/app-error.js';
import { CloseCashSessionUseCase, CreateCashMovementUseCase, GetCurrentCashSessionUseCase, OpenCashSessionUseCase } from '../../src/modules/cash/application/cash.use-cases.js';
import { CashMovement } from '../../src/modules/cash/domain/cash-movement.js';
import { CashSession } from '../../src/modules/cash/domain/cash-session.js';
import type { CashRepository } from '../../src/modules/cash/domain/cash-repository.js';

const now = new Date();
const session = (overrides = {}) => new CashSession({ id: 'cash-1', openedByUserId: 'user-1', closedByUserId: null, openedAt: now, closedAt: null, openingAmount: '10.00', cashIncomeTotal: '0.00', expenseTotal: '0.00', expectedClosingAmount: '10.00', declaredClosingAmount: null, differenceAmount: null, status: 'open', observations: null, createdAt: now, updatedAt: now, ...overrides });
const movement = new CashMovement({ id: 'movement-1', cashSessionId: 'cash-1', type: 'income', amount: '5.00', paymentMethod: 'cash', description: 'Ingreso manual', paymentId: null, createdByUserId: 'user-1', createdAt: now });

describe('casos de uso de caja', () => {
  const cash: CashRepository = { open: jest.fn(), findCurrentByUserId: jest.fn(), findById: jest.fn(), findHistory: jest.fn(), createMovement: jest.fn(), findMovements: jest.fn(), close: jest.fn() };
  const audit = { record: jest.fn() };
  beforeEach(() => jest.clearAllMocks());
  it('abre una caja y normaliza el monto inicial', async () => { (cash.open as jest.Mock).mockResolvedValue(session()); await expect(new OpenCashSessionUseCase(cash, audit).execute({ openingAmount: 10 }, 'user-1')).resolves.toMatchObject({ openingAmount: '10.00' }); expect(cash.open).toHaveBeenCalledWith(expect.objectContaining({ openingAmount: '10.00', openedByUserId: 'user-1' })); });
  it.each([['0'], ['-1']])('rechaza montos no positivos', async (amount) => { await expect(new OpenCashSessionUseCase(cash, audit).execute({ openingAmount: amount }, 'user-1')).rejects.toBeInstanceOf(AppError); });
  it('crea ingresos y egresos solo con importes válidos', async () => { (cash.createMovement as jest.Mock).mockResolvedValue(movement); await expect(new CreateCashMovementUseCase(cash, audit).execute({ cashSessionId: 'cash-1', type: 'income', amount: 5, paymentMethod: 'cash', description: 'Ingreso manual' }, 'user-1')).resolves.toMatchObject({ amount: '5.00' }); await expect(new CreateCashMovementUseCase(cash, audit).execute({ cashSessionId: 'cash-1', type: 'expense', amount: 0, paymentMethod: 'cash', description: 'Egreso manual' }, 'user-1')).rejects.toMatchObject<AppError>({ code: 'INVALID_CASH_AMOUNT' }); });
  it('informa cuando no existe caja abierta', async () => { (cash.findCurrentByUserId as jest.Mock).mockResolvedValue(null); await expect(new GetCurrentCashSessionUseCase(cash).execute('user-1')).rejects.toMatchObject<AppError>({ code: 'OPEN_CASH_SESSION_NOT_FOUND' }); });
  it('cierra con monto declarado y conserva la diferencia calculada por el repositorio', async () => { (cash.close as jest.Mock).mockResolvedValue(session({ status: 'closed', closedAt: now, declaredClosingAmount: '14.00', expectedClosingAmount: '15.00', differenceAmount: '-1.00' })); await expect(new CloseCashSessionUseCase(cash, audit).execute('cash-1', { declaredClosingAmount: 14 }, 'user-1')).resolves.toMatchObject({ differenceAmount: '-1.00' }); });
});
