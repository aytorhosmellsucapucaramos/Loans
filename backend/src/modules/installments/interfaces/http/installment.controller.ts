import type { RequestHandler } from 'express';
import type { AppContainer } from '../../../../shared/container/container.js';
import { success } from '../../../../shared/http/api-response.js';
import { stringParam } from '../../../../shared/http/params.js';
import type { LoanAccessScope } from '../../../loans/domain/loan-repository.js';
export class InstallmentController {
  constructor(private readonly container: AppContainer) {}
  getById: RequestHandler = async (request, response) => {
    const userId = request.auth!.userId; const user = await this.container.users.findById(userId);
    const scope: LoanAccessScope = { userId, isAdmin: user?.roles.includes('admin') ?? false };
    success(response, await this.container.getInstallment.execute(stringParam(request.params.id, 'id'), scope), 'Cuota obtenida correctamente.');
  };
}
