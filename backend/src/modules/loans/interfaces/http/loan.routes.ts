import { Router } from 'express';
import Joi from 'joi';

import type { AppContainer } from '../../../../shared/container/container.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { stringParam } from '../../../../shared/http/params.js';
import { validateBody } from '../../../../shared/http/validate-body.js';
import { authenticate, requirePermission } from '../../../auth/interfaces/http/auth.middleware.js';
import { LoanController } from './loan.controller.js';
import { createLoanSchema, loanListQuerySchema, loanStatusSchema, validateLoanQuery } from './loan.validator.js';

const validateId = (value: string): void => { if (Joi.string().uuid().validate(value).error) throw new AppError(400, 'VALIDATION_ERROR', 'El identificador no es válido.'); };
export const loanRouter = (container: AppContainer): Router => {
  const router = Router(); const controller = new LoanController(container);
  router.use(authenticate(container.tokenService, container.users));
  router.get('/', requirePermission('loans.read'), validateLoanQuery(loanListQuerySchema), asyncHandler(controller.list));
  router.get('/:id', requirePermission('loans.read'), asyncHandler((req, res, next) => { validateId(stringParam(req.params.id, 'id')); return controller.getById(req, res, next); }));
  router.post('/', requirePermission('loans.create'), validateBody(createLoanSchema), asyncHandler(controller.create));
  router.patch('/:id/status', requirePermission('loans.update'), validateBody(loanStatusSchema), asyncHandler((req, res, next) => { validateId(stringParam(req.params.id, 'id')); return controller.updateStatus(req, res, next); }));
  router.get('/:loanId/installments', requirePermission('installments.read'), asyncHandler((req, res, next) => { validateId(stringParam(req.params.loanId, 'loanId')); return controller.listInstallments(req, res, next); }));
  return router;
};
