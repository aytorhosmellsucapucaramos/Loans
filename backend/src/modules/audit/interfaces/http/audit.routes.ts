import { Router } from 'express';

import type { AppContainer } from '../../../../shared/container/container.js';
import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticate, requirePermission } from '../../../auth/interfaces/http/auth.middleware.js';
import { AuditController } from './audit.controller.js';
import { validateAuditQuery } from './audit.validator.js';

export const auditRouter = (container: AppContainer): Router => {
  const router = Router(); const controller = new AuditController(container);
  router.use(authenticate(container.tokenService, container.users), requirePermission('audit.read'));
  router.get('/', validateAuditQuery, asyncHandler(controller.list));
  return router;
};
