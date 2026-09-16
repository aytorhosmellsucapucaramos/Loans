import type { RequestHandler } from 'express';

import type { AppContainer } from '../../../../shared/container/container.js';
import { success } from '../../../../shared/http/api-response.js';
import { stringParam } from '../../../../shared/http/params.js';
import type { PaymentListQueryDto, RegisterPaymentDto } from './payment.dto.js';

export class PaymentController {
  constructor(private readonly container: AppContainer) {}
  list: RequestHandler = async (_request, response) => success(response, await this.container.listPayments.execute(response.locals.paymentQuery as PaymentListQueryDto), 'Pagos obtenidos correctamente.');
  getById: RequestHandler = async (request, response) => success(response, await this.container.getPayment.execute(stringParam(request.params.id, 'id')), 'Pago obtenido correctamente.');
  create: RequestHandler = async (request, response) => success(response, await this.container.registerPayment.execute(request.body as RegisterPaymentDto, request.auth!.userId), 'Pago registrado correctamente.', 201);
  cancel: RequestHandler = async (request, response) => success(response, await this.container.cancelPayment.execute(stringParam(request.params.id, 'id'), request.auth!.userId), 'Pago anulado correctamente.');
  listLoanPayments: RequestHandler = async (request, response) => success(response, await this.container.listLoanPayments.execute(stringParam(request.params.loanId, 'loanId')), 'Pagos del préstamo obtenidos correctamente.');
  listInstallmentPayments: RequestHandler = async (request, response) => success(response, await this.container.listInstallmentPayments.execute(stringParam(request.params.installmentId, 'installmentId')), 'Pagos de la cuota obtenidos correctamente.');
}
