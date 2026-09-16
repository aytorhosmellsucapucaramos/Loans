import { amountToCents, centsToAmount, rateToUnits } from '../../src/modules/interest/domain/monetary-value.js';
import { SimpleInterestStrategy } from '../../src/modules/interest/domain/simple-interest.strategy.js';

describe('SimpleInterestStrategy', () => {
  const strategy = new SimpleInterestStrategy();
  it('calcula interés simple sin aritmética de punto flotante', () => {
    expect(centsToAmount(strategy.calculate(amountToCents('1000.00'), rateToUnits('10')))).toBe('100.00');
  });
  it('redondea a centavos con mitad hacia arriba', () => {
    expect(centsToAmount(strategy.calculate(amountToCents('1.00'), rateToUnits('0.5')))).toBe('0.01');
  });
});
