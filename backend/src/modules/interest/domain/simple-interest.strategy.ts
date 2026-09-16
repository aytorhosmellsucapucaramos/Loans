import type { InterestCalculationStrategy, InterestType } from './interest-calculation.strategy.js';

/** Rate units preserve four decimal places of a percentage: 10% = 100000 units. */
const RATE_DENOMINATOR = 1_000_000n;

export class SimpleInterestStrategy implements InterestCalculationStrategy {
  readonly type: InterestType = 'simple';

  calculate(principalCents: bigint, rateUnits: bigint): bigint {
    return (principalCents * rateUnits + RATE_DENOMINATOR / 2n) / RATE_DENOMINATOR;
  }
}
