import type { RequestHandler } from 'express';

import type { AppContainer } from '../../../../shared/container/container.js';
import { success } from '../../../../shared/http/api-response.js';
import { stringParam } from '../../../../shared/http/params.js';
import type { CustomerBodyDto, CustomerListQueryDto, CustomerStatusDto } from './customer.dto.js';

export class CustomerController {
  constructor(private readonly container: AppContainer) {}

  list: RequestHandler = async (request, response) => {
    const result = await this.container.listCustomers.execute(response.locals.customerQuery as CustomerListQueryDto);
    success(response, result, 'Clientes obtenidos correctamente.');
  };

  getById: RequestHandler = async (request, response) => {
    success(response, await this.container.getCustomer.execute(stringParam(request.params.id, 'id')), 'Cliente obtenido correctamente.');
  };

  create: RequestHandler = async (request, response) => {
    success(response, await this.container.createCustomer.execute(request.body as CustomerBodyDto, request.auth!.userId), 'Cliente creado correctamente.', 201);
  };

  update: RequestHandler = async (request, response) => {
    success(response, await this.container.updateCustomer.execute(stringParam(request.params.id, 'id'), request.body as CustomerBodyDto, request.auth!.userId), 'Cliente actualizado correctamente.');
  };

  updateStatus: RequestHandler = async (request, response) => {
    const body = request.body as CustomerStatusDto;
    success(response, await this.container.setCustomerStatus.execute(stringParam(request.params.id, 'id'), body.isActive, request.auth!.userId), 'Estado del cliente actualizado correctamente.');
  };
}
