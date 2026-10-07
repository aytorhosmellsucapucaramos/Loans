import type { RequestHandler } from 'express';

import type { AppContainer } from '../../../../shared/container/container.js';
import { success } from '../../../../shared/http/api-response.js';
import { stringParam } from '../../../../shared/http/params.js';
import type { CustomerBodyDto, CustomerListQueryDto, CustomerStatusDto } from './customer.dto.js';
import type { CustomerAccessScope } from '../../domain/customer-repository.js';

export class CustomerController {
  constructor(private readonly container: AppContainer) {}

  private async accessScope(userId: string): Promise<CustomerAccessScope> {
    const user = await this.container.users.findById(userId);
    return { userId, isAdmin: user?.roles.includes('admin') ?? false };
  }

  list: RequestHandler = async (request, response) => {
    const result = await this.container.listCustomers.execute(
      response.locals.customerQuery as CustomerListQueryDto,
      await this.accessScope(request.auth!.userId),
    );
    success(response, result, 'Clientes obtenidos correctamente.');
  };

  getById: RequestHandler = async (request, response) => {
    success(response, await this.container.getCustomer.execute(stringParam(request.params.id, 'id'), await this.accessScope(request.auth!.userId)), 'Cliente obtenido correctamente.');
  };

  create: RequestHandler = async (request, response) => {
    success(response, await this.container.createCustomer.execute(request.body as CustomerBodyDto, request.auth!.userId), 'Cliente creado correctamente.', 201);
  };

  update: RequestHandler = async (request, response) => {
    const userId = request.auth!.userId;
    const scope = await this.accessScope(userId);
    success(response, await this.container.updateCustomer.execute(stringParam(request.params.id, 'id'), request.body as CustomerBodyDto, userId, scope.isAdmin), 'Cliente actualizado correctamente.');
  };

  updateStatus: RequestHandler = async (request, response) => {
    const body = request.body as CustomerStatusDto;
    const userId = request.auth!.userId;
    const scope = await this.accessScope(userId);
    success(response, await this.container.setCustomerStatus.execute(stringParam(request.params.id, 'id'), body.isActive, userId, scope.isAdmin), 'Estado del cliente actualizado correctamente.');
  };
}
