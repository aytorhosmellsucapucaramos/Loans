import jwt from 'jsonwebtoken';

import { env } from '../../../config/env.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { AccessTokenPayload, TokenService } from '../domain/auth-services.js';

export class JwtTokenService implements TokenService {
  signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'] });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, env.jwtAccessSecret);
      if (typeof decoded === 'string' || typeof decoded.userId !== 'string' || typeof decoded.email !== 'string') {
        throw new Error('Token sin payload válido');
      }
      return {
        userId: decoded.userId,
        email: decoded.email,
        permissions: Array.isArray(decoded.permissions) ? decoded.permissions.filter((value): value is string => typeof value === 'string') : [],
      };
    } catch {
      throw new AppError(401, 'INVALID_TOKEN', 'El token de acceso es inválido o expiró.');
    }
  }
}
