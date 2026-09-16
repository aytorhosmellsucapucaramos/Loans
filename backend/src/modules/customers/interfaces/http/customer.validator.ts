import type { RequestHandler } from 'express';
import Joi from 'joi';

import { AppError } from '../../../../shared/errors/app-error.js';
import { documentTypes } from '../../domain/customer.js';

const personName = Joi.string().trim().min(2).max(100).pattern(/^[\p{L}][\p{L}\s'-]*$/u);

const documentNumber = Joi.string().trim().uppercase().max(20).required().custom((value: string, helpers) => {
  const type = helpers.state.ancestors[0]?.documentType as string | undefined;
  const valid = (type === 'DNI' && /^\d{8}$/.test(value))
    || (type === 'RUC' && /^\d{11}$/.test(value))
    || (type === 'CE' && /^[A-Z0-9]{6,12}$/.test(value))
    || (type === 'PASSPORT' && /^[A-Z0-9]{6,12}$/.test(value));
  return valid ? value : helpers.error('any.invalid');
}, 'document number validation').messages({ 'any.invalid': 'El número de documento no es válido para el tipo seleccionado.' });

export const customerSchema = Joi.object({
  documentType: Joi.string().valid(...documentTypes).required(),
  documentNumber,
  firstName: personName.required(),
  lastName: personName.required(),
  phone: Joi.string().trim().pattern(/^(?:\+?51)?9\d{8}$/).required().messages({ 'string.pattern.base': 'El teléfono debe ser un celular peruano válido.' }),
  email: Joi.string().trim().email().max(254).allow('').optional(),
  address: Joi.string().trim().min(5).max(300).required(),
});

export const customerStatusSchema = Joi.object({ isActive: Joi.boolean().required() });

export const customerListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100).allow('').optional(),
  isActive: Joi.boolean().optional(),
});

export const validateQuery = (schema: Joi.ObjectSchema): RequestHandler => (request, response, next) => {
  const result = schema.validate(request.query, { abortEarly: false, stripUnknown: true, convert: true });
  if (result.error) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'Los parámetros enviados no son válidos.', result.error.details.map((detail) => ({ field: detail.path.join('.'), message: detail.message }))));
  }
  response.locals.customerQuery = result.value;
  next();
};

export const validateCustomerBody: RequestHandler = (request, _response, next) => {
  const result = customerSchema.validate(request.body, { abortEarly: false, stripUnknown: true });
  if (result.error) {
    const semanticError = result.error.details.some((detail) => detail.type === 'any.invalid' || detail.type === 'string.pattern.base');
    return next(new AppError(
      semanticError ? 422 : 400,
      semanticError ? 'UNPROCESSABLE_ENTITY' : 'VALIDATION_ERROR',
      semanticError ? 'Los datos del cliente no cumplen las reglas de negocio.' : 'Los datos enviados no son válidos.',
      result.error.details.map((detail) => ({ field: detail.path.join('.'), message: detail.message })),
    ));
  }
  request.body = result.value;
  next();
};
