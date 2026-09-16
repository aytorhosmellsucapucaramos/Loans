import { Router } from 'express';
import Joi from 'joi';

import type { AppContainer } from '../../../../shared/container/container.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { stringParam } from '../../../../shared/http/params.js';
import { validateBody } from '../../../../shared/http/validate-body.js';
import { authenticate, requirePermission } from '../../../auth/interfaces/http/auth.middleware.js';
import { PaymentController } from './payment.controller.js';
import { paymentListQuerySchema, registerPaymentSchema, validatePaymentQuery } from './payment.validator.js';

const validateId = (value: string): void => { if (Joi.string().uuid().validate(value).error) throw new AppError(400, 'VALIDATION_ERROR', 'El identificador no es válido.'); };
export const paymentRouter = (container: AppContainer): Router => {
  const router = Router(); const controller = new PaymentController(container);
  router.use(authenticate(container.tokenService, container.users));
  router.get('/', requirePermission('payments.read'), validatePaymentQuery(paymentListQuerySchema), asyncHandler(controller.list));
  router.get('/:id', requirePermission('payments.read'), asyncHandler((req, res, next) => { validateId(stringParam(req.params.id, 'id')); return controller.getById(req, res, next); }));
  router.post('/', requirePermission('payments.create'), validateBody(registerPaymentSchema), asyncHandler(controller.create));
  router.patch('/:id/cancel', requirePermission('payments.cancel'), asyncHandler((req, res, next) => { validateId(stringParam(req.params.id, 'id')); return controller.cancel(req, res, next); }));
  return router;
};

export const loanPaymentRouter = (container: AppContainer): Router => {
  const router = Router(); const controller = new PaymentController(container);
  router.use(authenticate(container.tokenService, container.users));
  router.get('/:loanId/payments', requirePermission('payments.read'), asyncHandler((req, res, next) => { validateId(stringParam(req.params.loanId, 'loanId')); return controller.listLoanPayments(req, res, next); }));
  return router;
};

export const installmentPaymentRouter = (container: AppContainer): Router => {
  const router = Router(); const controller = new PaymentController(container);
  router.use(authenticate(container.tokenService, container.users));
  router.get('/:installmentId/payments', requirePermission('payments.read'), asyncHandler((req, res, next) => { validateId(stringParam(req.params.installmentId, 'installmentId')); return controller.listInstallmentPayments(req, res, next); }));
  return router;
};
