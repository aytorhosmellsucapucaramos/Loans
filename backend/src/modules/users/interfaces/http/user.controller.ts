import type { RequestHandler } from 'express';

import type { AppContainer } from '../../../../shared/container/container.js';
import { success } from '../../../../shared/http/api-response.js';
import { stringParam } from '../../../../shared/http/params.js';

export class UserController {
  constructor(private readonly container: AppContainer) {}

  list: RequestHandler = async (_request, response) => {
    success(response, await this.container.listUsers.execute(), 'Usuarios obtenidos correctamente.');
  };

  getById: RequestHandler = async (request, response) => {
    success(response, await this.container.getUser.execute(stringParam(request.params.id, 'id')), 'Usuario obtenido correctamente.');
  };

  create: RequestHandler = async (request, response) => {
    success(response, await this.container.registerUser.execute(request.body), 'Usuario creado correctamente.', 201);
  };

  update: RequestHandler = async (request, response) => {
    success(response, await this.container.updateUser.execute(stringParam(request.params.id, 'id'), request.body), 'Usuario actualizado correctamente.');
  };
}
