import type { RequestHandler } from 'express';

import type { AppContainer } from '../../../../shared/container/container.js';
import { success } from '../../../../shared/http/api-response.js';
import { stringParam } from '../../../../shared/http/params.js';
import type { CreateLoanDto, LoanListQueryDto, LoanStatusDto } from './loan.dto.js';

export class LoanController {
  constructor(private readonly container: AppContainer) {}
  list: RequestHandler = async (_request, response) => success(response, await this.container.listLoans.execute(response.locals.loanQuery as LoanListQueryDto), 'Préstamos obtenidos correctamente.');
  getById: RequestHandler = async (request, response) => success(response, await this.container.getLoan.execute(stringParam(request.params.id, 'id')), 'Préstamo obtenido correctamente.');
  create: RequestHandler = async (request, response) => success(response, await this.container.createLoan.execute(request.body as CreateLoanDto, request.auth!.userId), 'Préstamo creado correctamente.', 201);
  updateStatus: RequestHandler = async (request, response) => success(response, await this.container.setLoanStatus.execute(stringParam(request.params.id, 'id'), (request.body as LoanStatusDto).status, request.auth!.userId), 'Estado del préstamo actualizado correctamente.');
  listInstallments: RequestHandler = async (request, response) => success(response, await this.container.listLoanInstallments.execute(stringParam(request.params.loanId, 'loanId')), 'Cuotas obtenidas correctamente.');
}
