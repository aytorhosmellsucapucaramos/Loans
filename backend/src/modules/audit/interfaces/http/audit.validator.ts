import type { RequestHandler } from 'express';
import Joi from 'joi';

import { AppError } from '../../../../shared/errors/app-error.js';
import { auditResults } from '../../domain/audit-log.js';

const validCalendarDate = (value: string): boolean => {
  const [yearPart, monthPart, dayPart] = value.split('-');
  const year = Number(yearPart ?? Number.NaN); const month = Number(monthPart ?? Number.NaN); const day = Number(dayPart ?? Number.NaN);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
};
const date = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).custom((value: string, helpers) => validCalendarDate(value) ? value : helpers.error('any.invalid')).messages({ 'any.invalid': 'La fecha no es válida.' });
export const auditListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1), pageSize: Joi.number().integer().min(1).max(100).default(20),
  userId: Joi.string().uuid().optional(), action: Joi.string().trim().max(100).optional(), entityType: Joi.string().trim().max(80).optional(),
  entityId: Joi.string().uuid().optional(), fromDate: date.optional(), toDate: date.optional(), result: Joi.string().valid(...auditResults).optional(), search: Joi.string().trim().max(200).optional(),
}).custom((value: { fromDate?: string; toDate?: string }, helpers) => !value.fromDate || !value.toDate || value.fromDate <= value.toDate ? value : helpers.error('any.invalid')).messages({ 'any.invalid': 'La fecha inicial no puede ser posterior a la fecha final.' });

export const validateAuditQuery: RequestHandler = (request, response, next) => {
  const result = auditListQuerySchema.validate(request.query, { abortEarly: false, stripUnknown: true, convert: true });
  if (result.error) return next(new AppError(400, 'VALIDATION_ERROR', 'Los parámetros enviados no son válidos.', result.error.details.map((detail) => ({ field: detail.path.join('.'), message: detail.message }))));
  response.locals.auditQuery = result.value;
  next();
};
