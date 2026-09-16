import type { ErrorRequestHandler, RequestHandler } from 'express';

import { logger } from '../logging/logger.js';
import { AppError } from '../errors/app-error.js';
import { failure } from './api-response.js';

export const notFoundHandler: RequestHandler = (request, response) =>
  failure(response, `La ruta ${request.method} ${request.path} no existe.`, [], 404);

export const errorHandler: ErrorRequestHandler = (error: unknown, request, response, _next) => {
  const requestId = request.id;
  if (error instanceof AppError) {
    const errors = error.details.length ? error.details : [{ code: error.code, message: error.message }];
    return failure(response, error.message, errors, error.statusCode);
  }

  logger.error({ err: error, requestId }, 'Error no controlado');
  return failure(response, 'No se pudo realizar la operación.', [], 500);
};
