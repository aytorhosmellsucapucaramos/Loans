import { AppError } from '../../../shared/errors/app-error.js';

const parseScaled = (value: string | number, decimals: number, field: string): bigint => {
  const text = String(value).trim();
  const expression = new RegExp(`^(\\d+)(?:\\.(\\d{1,${decimals}}))?$`);
  const match = expression.exec(text);
  if (!match) throw new AppError(422, 'INVALID_MONETARY_VALUE', `El valor de ${field} no es válido.`);
  const integer = match[1] ?? '0';
  const fraction = (match[2] ?? '').padEnd(decimals, '0');
  return BigInt(integer) * (10n ** BigInt(decimals)) + BigInt(fraction || '0');
};

const formatScaled = (value: bigint, decimals: number): string => {
  const divisor = 10n ** BigInt(decimals);
  return `${value / divisor}.${(value % divisor).toString().padStart(decimals, '0')}`;
};

export const amountToCents = (value: string | number): bigint => parseScaled(value, 2, 'monto');
export const rateToUnits = (value: string | number): bigint => parseScaled(value, 4, 'tasa');
export const centsToAmount = (value: bigint): string => formatScaled(value, 2);
export const unitsToRate = (value: bigint): string => formatScaled(value, 4);
