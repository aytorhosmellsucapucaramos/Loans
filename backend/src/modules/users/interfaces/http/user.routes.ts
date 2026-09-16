import { Router } from 'express';
import Joi from 'joi';

import type { AppContainer } from '../../../../shared/container/container.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticate, requirePermission } from '../../../auth/interfaces/http/auth.middleware.js';
import { stringParam } from '../../../../shared/http/params.js';
import { validateBody } from '../../../../shared/http/validate-body.js';
import { UserController } from './user.controller.js';
import { createUserSchema, updateUserSchema } from './user.validator.js';

const validateId = (value: string): void => {
  const result = Joi.string().uuid().validate(value);
  if (result.error) throw new AppError(400, 'VALIDATION_ERROR', 'El identificador no es válido.');
};

export const userRouter = (container: AppContainer): Router => {
  const router = Router();
  const controller = new UserController(container);
  router.use(authenticate(container.tokenService, container.users));
  router.get('/', requirePermission('users.read'), asyncHandler(controller.list));
  router.get('/:id', requirePermission('users.read'), asyncHandler((req, res, next) => { validateId(stringParam(req.params.id, 'id')); return controller.getById(req, res, next); }));
  router.post('/', requirePermission('users.create'), validateBody(createUserSchema), asyncHandler(controller.create));
  router.put('/:id', requirePermission('users.update'), validateBody(updateUserSchema), asyncHandler((req, res, next) => { validateId(stringParam(req.params.id, 'id')); return controller.update(req, res, next); }));
  return router;
};
