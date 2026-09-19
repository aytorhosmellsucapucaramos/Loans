import { PinoCashAuditLogger } from '../../src/modules/cash/infrastructure/pino-cash-audit-logger.js';
import { PinoPaymentAuditLogger } from '../../src/modules/payments/infrastructure/pino-payment-audit-logger.js';

describe('adaptadores de auditoría operativa', () => {
  it('persiste una acción de pago sin campos sensibles', async () => {
    const writer = { record: jest.fn().mockResolvedValue(undefined) };
    await new PinoPaymentAuditLogger(writer).record('payment.registered', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    expect(writer.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'payment.registered', entityType: 'payment' }));
    expect(writer.record.mock.calls[0][0]).not.toHaveProperty('password');
  });

  it('persiste las acciones de caja con la sesión afectada', async () => {
    const writer = { record: jest.fn().mockResolvedValue(undefined) };
    await new PinoCashAuditLogger(writer).record('cash.movement_created', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333');
    expect(writer.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'cash.movement_created', entityType: 'cash_session', entityId: '33333333-3333-3333-3333-333333333333' }));
  });
});
