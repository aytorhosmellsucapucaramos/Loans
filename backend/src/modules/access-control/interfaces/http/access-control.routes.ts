import { Router } from 'express';
import Joi from 'joi';

import type { AppContainer } from '../../../../shared/container/container.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticate, requirePermission } from '../../../auth/interfaces/http/auth.middleware.js';
import { stringParam } from '../../../../shared/http/params.js';
import { validateBody } from '../../../../shared/http/validate-body.js';
import { AccessControlController } from './access-control.controller.js';
import { createRoleSchema, updateRoleSchema } from './access-control.validator.js';

const validateId = (value: string): void => {
  const result = Joi.string().uuid().validate(value);
  if (result.error) throw new AppError(400, 'VALIDATION_ERROR', 'El identificador no es válido.');
};

export const accessControlRouter = (container: AppContainer): Router => {
  const router = Router();
  const controller = new AccessControlController(container);
  router.use(authenticate(container.tokenService, container.users));
  router.get('/roles', requirePermission('roles.read'), asyncHandler(controller.listRoles));
  router.post('/roles', requirePermission('roles.create'), validateBody(createRoleSchema), asyncHandler(controller.createRole));
  router.put('/roles/:id', requirePermission('roles.update'), validateBody(updateRoleSchema), asyncHandler((req, res, next) => { validateId(stringParam(req.params.id, 'id')); return controller.updateRole(req, res, next); }));
  router.get('/permissions', requirePermission('permissions.read'), asyncHandler(controller.listPermissions));
  return router;
};
