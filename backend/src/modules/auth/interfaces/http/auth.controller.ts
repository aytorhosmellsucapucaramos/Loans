import type { RequestHandler } from 'express';

import type { AppContainer } from '../../../../shared/container/container.js';
import { success } from '../../../../shared/http/api-response.js';

export class AuthController {
  constructor(private readonly container: AppContainer) {}

  register: RequestHandler = async (request, response) => {
    const user = await this.container.registerUser.execute(request.body);
    success(response, user, 'Usuario registrado correctamente.', 201);
  };

  login: RequestHandler = async (request, response) => {
    const result = await this.container.login.execute(request.body.email, request.body.password);
    success(response, result, 'Inicio de sesión realizado correctamente.');
  };

  me: RequestHandler = async (request, response) => {
    const user = await this.container.getUser.execute(request.auth!.userId);
    success(response, user, 'Usuario autenticado obtenido correctamente.');
  };
}
