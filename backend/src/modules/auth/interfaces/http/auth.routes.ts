import { Router } from 'express';

import type { AppContainer } from '../../../../shared/container/container.js';
import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { validateBody } from '../../../../shared/http/validate-body.js';
import { AuthController } from './auth.controller.js';
import { authenticate } from './auth.middleware.js';
import { loginSchema, registerSchema } from './auth.validator.js';

export const authRouter = (container: AppContainer): Router => {
  const router = Router();
  const controller = new AuthController(container);
  router.post('/register', validateBody(registerSchema), asyncHandler(controller.register));
  router.post('/login', validateBody(loginSchema), asyncHandler(controller.login));
  router.get('/me', authenticate(container.tokenService, container.users), asyncHandler(controller.me));
  return router;
};
