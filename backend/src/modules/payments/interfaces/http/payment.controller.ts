import type { RequestHandler } from 'express';

import type { AppContainer } from '../../../../shared/container/container.js';
import { success } from '../../../../shared/http/api-response.js';
import { stringParam } from '../../../../shared/http/params.js';
import type { PaymentListQueryDto, RegisterPaymentDto } from './payment.dto.js';
import type { PaymentAccessScope } from '../../domain/payment-repository.js';

export class PaymentController {
  constructor(private readonly container: AppContainer) {}
  private async accessScope(userId: string): Promise<PaymentAccessScope> { const user = await this.container.users.findById(userId); return { userId, isAdmin: user?.roles.includes('admin') ?? false }; }
  list: RequestHandler = async (request, response) => success(response, await this.container.listPayments.execute(response.locals.paymentQuery as PaymentListQueryDto, await this.accessScope(request.auth!.userId)), 'Pagos obtenidos correctamente.');
  getById: RequestHandler = async (request, response) => success(response, await this.container.getPayment.execute(stringParam(request.params.id, 'id'), await this.accessScope(request.auth!.userId)), 'Pago obtenido correctamente.');
  create: RequestHandler = async (request, response) => success(response, await this.container.registerPayment.execute(request.body as RegisterPaymentDto, request.auth!.userId, await this.accessScope(request.auth!.userId)), 'Pago registrado correctamente.', 201);
  cancel: RequestHandler = async (request, response) => success(response, await this.container.cancelPayment.execute(stringParam(request.params.id, 'id'), request.auth!.userId, await this.accessScope(request.auth!.userId)), 'Pago anulado correctamente.');
  listLoanPayments: RequestHandler = async (request, response) => success(response, await this.container.listLoanPayments.execute(stringParam(request.params.loanId, 'loanId'), await this.accessScope(request.auth!.userId)), 'Pagos del préstamo obtenidos correctamente.');
  listInstallmentPayments: RequestHandler = async (request, response) => success(response, await this.container.listInstallmentPayments.execute(stringParam(request.params.installmentId, 'installmentId'), await this.accessScope(request.auth!.userId)), 'Pagos de la cuota obtenidos correctamente.');
}
