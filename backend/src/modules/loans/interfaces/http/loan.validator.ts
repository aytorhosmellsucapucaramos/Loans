import type { RequestHandler } from 'express';
import Joi from 'joi';

import { AppError } from '../../../../shared/errors/app-error.js';
import { paymentFrequencies } from '../../../installments/domain/payment-frequency.js';
import { loanStatuses, manuallySettableLoanStatuses } from '../../domain/loan.js';

const decimal = (minimum: number) => Joi.alternatives().try(Joi.number().min(minimum).precision(4), Joi.string().trim().pattern(/^\d+(?:\.\d{1,4})?$/)).required();

export const createLoanSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  principalAmount: decimal(0).custom((value, helpers) => Number(value) > 0 ? value : helpers.error('any.invalid')).messages({ 'any.invalid': 'El monto solicitado debe ser mayor que cero.' }),
  interestRate: decimal(0),
  interestType: Joi.string().valid('simple').default('simple'),
  paymentFrequency: Joi.string().valid(...paymentFrequencies).required(),
  installmentCount: Joi.number().integer().min(1).max(360).required(),
  disbursementDate: Joi.string().isoDate().custom((value: string) => value.slice(0, 10)).required(),
  firstInstallmentDate: Joi.string().isoDate().custom((value: string) => value.slice(0, 10)).required(),
  observations: Joi.string().trim().max(1000).allow('').optional(),
}).custom((value: { disbursementDate: string; firstInstallmentDate: string }, helpers) =>
  value.firstInstallmentDate > value.disbursementDate ? value : helpers.error('any.invalid'),
).messages({ 'any.invalid': 'La primera cuota debe ser posterior al desembolso.' });
export const loanStatusSchema = Joi.object({ status: Joi.string().valid(...manuallySettableLoanStatuses).required() });
export const loanListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1), pageSize: Joi.number().integer().min(1).max(100).default(20),
  customerId: Joi.string().uuid().optional(), status: Joi.string().valid(...loanStatuses).optional(), search: Joi.string().trim().max(100).allow('').optional(),
});

export const validateLoanQuery = (schema: Joi.ObjectSchema): RequestHandler => (request, response, next) => {
  const result = schema.validate(request.query, { abortEarly: false, stripUnknown: true, convert: true });
  if (result.error) return next(new AppError(400, 'VALIDATION_ERROR', 'Los parámetros enviados no son válidos.', result.error.details.map((detail) => ({ field: detail.path.join('.'), message: detail.message }))));
  response.locals.loanQuery = result.value;
  next();
};
