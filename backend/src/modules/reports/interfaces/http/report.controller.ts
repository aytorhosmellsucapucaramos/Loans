import type { RequestHandler } from 'express';
import type { AppContainer } from '../../../../shared/container/container.js';
import { success } from '../../../../shared/http/api-response.js';
import type { CashReportCriteria, CollectionReportCriteria, InstallmentReportCriteria, LoanReportCriteria } from './report.dto.js';
import type { ReportAccessScope } from '../../domain/report-repository.js';
export class ReportController {
  constructor(private readonly container: AppContainer) {}
  private async accessScope(userId: string): Promise<ReportAccessScope> { const user = await this.container.users.findById(userId); return { userId, isAdmin: user?.roles.includes('admin') ?? false }; }
  summary: RequestHandler = async (request, response) => success(response, await this.container.getReportSummary.execute(await this.accessScope(request.auth!.userId)), 'Resumen general obtenido correctamente.');
  loans: RequestHandler = async (request, response) => success(response, await this.container.getLoanReport.execute(response.locals.loanReportQuery as LoanReportCriteria, await this.accessScope(request.auth!.userId)), 'Reporte de cartera obtenido correctamente.');
  installments: RequestHandler = async (request, response) => success(response, await this.container.getInstallmentReport.execute(response.locals.installmentReportQuery as InstallmentReportCriteria, await this.accessScope(request.auth!.userId)), 'Reporte de cuotas obtenido correctamente.');
  collections: RequestHandler = async (request, response) => success(response, await this.container.getCollectionReport.execute(response.locals.collectionReportQuery as CollectionReportCriteria, await this.accessScope(request.auth!.userId)), 'Reporte de cobranza obtenido correctamente.');
  cash: RequestHandler = async (request, response) => success(response, await this.container.getCashReport.execute(response.locals.cashReportQuery as CashReportCriteria, await this.accessScope(request.auth!.userId)), 'Reporte de caja obtenido correctamente.');
}
