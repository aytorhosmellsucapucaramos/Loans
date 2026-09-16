import type { RequestHandler } from 'express';
import Joi from 'joi';

import { AppError } from '../../../../shared/errors/app-error.js';
import { paymentMethods, paymentStatuses } from '../../domain/payment.js';

const amount = Joi.alternatives().try(Joi.number().precision(2).greater(0), Joi.string().trim().pattern(/^\d+(?:\.\d{1,2})?$/)).required();
export const registerPaymentSchema = Joi.object({
  loanId: Joi.string().uuid().required(), installmentId: Joi.string().uuid().required(), amount,
  paymentMethod: Joi.string().valid(...paymentMethods).required(), paymentDate: Joi.string().isoDate().custom((value: string) => value.slice(0, 10)).required(),
  operationReference: Joi.string().trim().max(120).allow('').optional(), observations: Joi.string().trim().max(1000).allow('').optional(),
});
export const paymentListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1), pageSize: Joi.number().integer().min(1).max(100).default(20),
  loanId: Joi.string().uuid().optional(), installmentId: Joi.string().uuid().optional(), status: Joi.string().valid(...paymentStatuses).optional(),
});
export const validatePaymentQuery = (schema: Joi.ObjectSchema): RequestHandler => (request, response, next) => {
  const result = schema.validate(request.query, { abortEarly: false, stripUnknown: true, convert: true });
  if (result.error) return next(new AppError(400, 'VALIDATION_ERROR', 'Los parámetros enviados no son válidos.', result.error.details.map((detail) => ({ field: detail.path.join('.'), message: detail.message }))));
  response.locals.paymentQuery = result.value;
  next();
};
