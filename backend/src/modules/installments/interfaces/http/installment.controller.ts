import type { RequestHandler } from 'express';
import type { AppContainer } from '../../../../shared/container/container.js';
import { success } from '../../../../shared/http/api-response.js';
import { stringParam } from '../../../../shared/http/params.js';
export class InstallmentController {
  constructor(private readonly container: AppContainer) {}
  getById: RequestHandler = async (request, response) => success(response, await this.container.getInstallment.execute(stringParam(request.params.id, 'id')), 'Cuota obtenida correctamente.');
}
