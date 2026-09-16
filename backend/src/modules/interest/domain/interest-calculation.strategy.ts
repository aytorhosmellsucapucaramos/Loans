export type InterestType = 'simple';

export interface InterestCalculationStrategy {
  readonly type: InterestType;
  calculate(principalCents: bigint, rateUnits: bigint): bigint;
}
