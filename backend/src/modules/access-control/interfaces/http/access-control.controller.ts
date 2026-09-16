import type { RequestHandler } from 'express';

import type { AppContainer } from '../../../../shared/container/container.js';
import { success } from '../../../../shared/http/api-response.js';
import { stringParam } from '../../../../shared/http/params.js';

export class AccessControlController {
  constructor(private readonly container: AppContainer) {}

  listRoles: RequestHandler = async (_request, response) => {
    success(response, await this.container.listRoles.execute(), 'Roles obtenidos correctamente.');
  };

  createRole: RequestHandler = async (request, response) => {
    success(response, await this.container.createRole.execute(request.body), 'Rol creado correctamente.', 201);
  };

  updateRole: RequestHandler = async (request, response) => {
    success(response, await this.container.updateRole.execute(stringParam(request.params.id, 'id'), request.body), 'Rol actualizado correctamente.');
  };

  listPermissions: RequestHandler = async (_request, response) => {
    success(response, await this.container.listPermissions.execute(), 'Permisos obtenidos correctamente.');
  };
}
