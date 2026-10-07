import type { RequestHandler } from 'express';

import type { AppContainer } from '../../../../shared/container/container.js';
import { success } from '../../../../shared/http/api-response.js';
import { stringParam } from '../../../../shared/http/params.js';
import type { CreateLoanDto, LoanListQueryDto, LoanStatusDto } from './loan.dto.js';
import type { LoanAccessScope } from '../../domain/loan-repository.js';

export class LoanController {
  constructor(private readonly container: AppContainer) {}
  private async accessScope(userId: string): Promise<LoanAccessScope> { const user = await this.container.users.findById(userId); return { userId, isAdmin: user?.roles.includes('admin') ?? false }; }
  list: RequestHandler = async (request, response) => success(response, await this.container.listLoans.execute(response.locals.loanQuery as LoanListQueryDto, await this.accessScope(request.auth!.userId)), 'Préstamos obtenidos correctamente.');
  getById: RequestHandler = async (request, response) => success(response, await this.container.getLoan.execute(stringParam(request.params.id, 'id'), await this.accessScope(request.auth!.userId)), 'Préstamo obtenido correctamente.');
  preview: RequestHandler = async (request, response) => success(response, await this.container.previewLoan.execute(request.body as CreateLoanDto, await this.accessScope(request.auth!.userId)), 'Vista previa del préstamo calculada correctamente.');
  create: RequestHandler = async (request, response) => success(response, await this.container.createLoan.execute(request.body as CreateLoanDto, request.auth!.userId, await this.accessScope(request.auth!.userId)), 'Préstamo creado correctamente.', 201);
  updateStatus: RequestHandler = async (request, response) => success(response, await this.container.setLoanStatus.execute(stringParam(request.params.id, 'id'), (request.body as LoanStatusDto).status, request.auth!.userId, await this.accessScope(request.auth!.userId)), 'Estado del préstamo actualizado correctamente.');
  listInstallments: RequestHandler = async (request, response) => success(response, await this.container.listLoanInstallments.execute(stringParam(request.params.loanId, 'loanId'), await this.accessScope(request.auth!.userId)), 'Cuotas obtenidas correctamente.');
  listCollateral: RequestHandler = async (request, response) => success(response, await this.container.listLoanCollateral.execute(stringParam(request.params.loanId, 'loanId'), await this.accessScope(request.auth!.userId)), 'Garantías obtenidas correctamente.');
  returnCollateral: RequestHandler = async (request, response) => success(response, await this.container.returnLoanCollateral.execute(stringParam(request.params.loanId, 'loanId'), stringParam(request.params.itemId, 'itemId'), request.auth!.userId, await this.accessScope(request.auth!.userId)), 'Devolución de garantía registrada correctamente.');
}
