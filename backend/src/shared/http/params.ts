import { AppError } from '../errors/app-error.js';

export const stringParam = (value: string | string[] | undefined, name: string): string => {
  if (typeof value !== 'string') throw new AppError(400, 'VALIDATION_ERROR', `El parámetro ${name} no es válido.`);
  return value;
};
