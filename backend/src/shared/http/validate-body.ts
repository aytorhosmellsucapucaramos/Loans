import type { RequestHandler } from 'express';
import Joi from 'joi';

import { AppError } from '../errors/app-error.js';

export const validateBody = (schema: Joi.ObjectSchema): RequestHandler => (request, _response, next) => {
  const result = schema.validate(request.body, { abortEarly: false, stripUnknown: true });
  if (result.error) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'Los datos enviados no son válidos.', result.error.details.map((detail) => ({ field: detail.path.join('.'), message: detail.message }))));
  }
  request.body = result.value;
  next();
};
