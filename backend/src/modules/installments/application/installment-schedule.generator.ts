import { centsToAmount } from '../../interest/domain/monetary-value.js';
import type { InterestCalculationStrategy } from '../../interest/domain/interest-calculation.strategy.js';
import type { NewInstallment } from '../domain/installment.js';
import type { PaymentFrequency } from '../domain/payment-frequency.js';

export type { PaymentFrequency } from '../domain/payment-frequency.js';

export type ScheduleRequest = {
  principalCents: bigint;
  rateUnits: bigint;
  installmentCount: number;
  firstInstallmentDate: string;
  paymentFrequency: PaymentFrequency;
};

const distribute = (amount: bigint, count: number): bigint[] => {
  const divisor = BigInt(count);
  const base = amount / divisor;
  const remainder = amount % divisor;
  return Array.from({ length: count }, (_, index) => base + (BigInt(index) < remainder ? 1n : 0n));
};

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);
const parseDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

const dueDateAt = (firstDate: string, frequency: PaymentFrequency, index: number): string => {
  const first = parseDate(firstDate);
  if (frequency === 'daily') first.setUTCDate(first.getUTCDate() + index);
  if (frequency === 'weekly') first.setUTCDate(first.getUTCDate() + index * 7);
  if (frequency === 'biweekly') first.setUTCDate(first.getUTCDate() + index * 15);
  if (frequency === 'monthly') {
    const originalDay = first.getUTCDate();
    first.setUTCDate(1);
    first.setUTCMonth(first.getUTCMonth() + index);
    const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    first.setUTCDate(Math.min(originalDay, lastDay));
  }
  return formatDate(first);
};

export class InstallmentScheduleGenerator {
  constructor(private readonly interest: InterestCalculationStrategy) {}

  generate(input: ScheduleRequest): { installments: NewInstallment[]; totalInterestCents: bigint; totalAmountCents: bigint } {
    const totalInterestCents = this.interest.calculate(input.principalCents, input.rateUnits);
    const totalAmountCents = input.principalCents + totalInterestCents;
    const principalParts = distribute(input.principalCents, input.installmentCount);
    const scheduledParts = distribute(totalAmountCents, input.installmentCount);
    const installments = scheduledParts.map((scheduledCents, index) => {
      const principalCents = principalParts[index]!;
      const interestCents = scheduledCents - principalCents;
      return {
        loanId: '',
        installmentNumber: index + 1,
        dueDate: dueDateAt(input.firstInstallmentDate, input.paymentFrequency, index),
        principalAmount: centsToAmount(principalCents),
        interestAmount: centsToAmount(interestCents),
        scheduledAmount: centsToAmount(scheduledCents),
        outstandingAmount: centsToAmount(scheduledCents),
        status: 'pending' as const,
      };
    });
    return { installments, totalInterestCents, totalAmountCents };
  }
}
