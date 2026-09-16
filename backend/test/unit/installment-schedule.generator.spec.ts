import { amountToCents, rateToUnits } from '../../src/modules/interest/domain/monetary-value.js';
import { SimpleInterestStrategy } from '../../src/modules/interest/domain/simple-interest.strategy.js';
import { InstallmentScheduleGenerator } from '../../src/modules/installments/application/installment-schedule.generator.js';

describe('InstallmentScheduleGenerator', () => {
  it('genera cuotas iguales cuya suma coincide exactamente con el total', () => {
    const schedule = new InstallmentScheduleGenerator(new SimpleInterestStrategy()).generate({
      principalCents: amountToCents('1000.00'), rateUnits: rateToUnits('10'), installmentCount: 4, firstInstallmentDate: '2026-02-15', paymentFrequency: 'monthly',
    });
    expect(schedule.totalAmountCents).toBe(amountToCents('1100.00'));
    expect(schedule.installments).toHaveLength(4);
    expect(schedule.installments.map((item) => item.scheduledAmount)).toEqual(['275.00', '275.00', '275.00', '275.00']);
    expect(schedule.installments.map((item) => item.dueDate)).toEqual(['2026-02-15', '2026-03-15', '2026-04-15', '2026-05-15']);
  });

  it('distribuye los centavos sin perder ni duplicar importes', () => {
    const schedule = new InstallmentScheduleGenerator(new SimpleInterestStrategy()).generate({
      principalCents: amountToCents('100.00'), rateUnits: rateToUnits('1'), installmentCount: 3, firstInstallmentDate: '2026-01-01', paymentFrequency: 'weekly',
    });
    expect(schedule.installments.map((item) => item.scheduledAmount)).toEqual(['33.67', '33.67', '33.66']);
  });
});
