import { Router } from 'express';
import Joi from 'joi';

import type { AppContainer } from '../../../../shared/container/container.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { stringParam } from '../../../../shared/http/params.js';
import { validateBody } from '../../../../shared/http/validate-body.js';
import { authenticate, requirePermission } from '../../../auth/interfaces/http/auth.middleware.js';
import { CustomerController } from './customer.controller.js';
import { customerListQuerySchema, customerStatusSchema, validateCustomerBody, validateQuery } from './customer.validator.js';

const validateId = (value: string): void => {
  if (Joi.string().uuid().validate(value).error) throw new AppError(400, 'VALIDATION_ERROR', 'El identificador no es válido.');
};

export const customerRouter = (container: AppContainer): Router => {
  const router = Router();
  const controller = new CustomerController(container);
  router.use(authenticate(container.tokenService, container.users));
  router.get('/', requirePermission('customers.read'), validateQuery(customerListQuerySchema), asyncHandler(controller.list));
  router.get('/:id', requirePermission('customers.read'), asyncHandler((req, res, next) => { validateId(stringParam(req.params.id, 'id')); return controller.getById(req, res, next); }));
  router.post('/', requirePermission('customers.create'), validateCustomerBody, asyncHandler(controller.create));
  router.put('/:id', requirePermission('customers.update'), validateCustomerBody, asyncHandler((req, res, next) => { validateId(stringParam(req.params.id, 'id')); return controller.update(req, res, next); }));
  router.patch('/:id/status', requirePermission('customers.update'), validateBody(customerStatusSchema), asyncHandler((req, res, next) => { validateId(stringParam(req.params.id, 'id')); return controller.updateStatus(req, res, next); }));
  return router;
};
