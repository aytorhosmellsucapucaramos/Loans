export const paymentFrequencies = ['daily', 'weekly', 'biweekly', 'monthly'] as const;
export type PaymentFrequency = (typeof paymentFrequencies)[number];
