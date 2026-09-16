import type { RequestHandler } from 'express';

import { AppError } from '../../../../shared/errors/app-error.js';
import type { TokenService } from '../../domain/auth-services.js';
import type { UserRepository } from '../../../users/domain/user-repository.js';

export const authenticate = (tokens: TokenService, users: UserRepository): RequestHandler => async (request, _response, next) => {
  try {
    const header = request.header('authorization');
    if (!header?.startsWith('Bearer ')) throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Se requiere un token de acceso.');
    const payload = tokens.verifyAccessToken(header.slice(7));
    const user = await users.findById(payload.userId);
    if (!user || !user.isActive) throw new AppError(401, 'INVALID_TOKEN', 'El usuario del token no está disponible.');
    request.auth = { userId: user.id, email: user.email, permissions: user.permissions };
    next();
  } catch (error) {
    next(error);
  }
};

export const requirePermission = (permission: string): RequestHandler => (request, _response, next) => {
  if (!request.auth) return next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Se requiere autenticación.'));
  if (!request.auth.permissions.includes(permission)) {
    return next(new AppError(403, 'INSUFFICIENT_PERMISSIONS', 'No tiene permiso para realizar esta operación.'));
  }
  next();
};
