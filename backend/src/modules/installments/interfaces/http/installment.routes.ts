import { Router } from 'express';
import Joi from 'joi';
import type { AppContainer } from '../../../../shared/container/container.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { stringParam } from '../../../../shared/http/params.js';
import { authenticate, requirePermission } from '../../../auth/interfaces/http/auth.middleware.js';
import { InstallmentController } from './installment.controller.js';
const validateId = (value: string): void => { if (Joi.string().uuid().validate(value).error) throw new AppError(400, 'VALIDATION_ERROR', 'El identificador no es válido.'); };
export const installmentRouter = (container: AppContainer): Router => {
  const router = Router(); const controller = new InstallmentController(container);
  router.use(authenticate(container.tokenService, container.users));
  router.get('/:id', requirePermission('installments.read'), asyncHandler((req, res, next) => { validateId(stringParam(req.params.id, 'id')); return controller.getById(req, res, next); }));
  return router;
};
