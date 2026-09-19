import { Router } from 'express';
import type { AppContainer } from '../../../../shared/container/container.js';
import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticate, requirePermission } from '../../../auth/interfaces/http/auth.middleware.js';
import { ReportController } from './report.controller.js';
import { cashReportQuerySchema, collectionReportQuerySchema, installmentReportQuerySchema, loanReportQuerySchema, validateReportQuery } from './report.validator.js';
export const reportRouter = (container: AppContainer): Router => { const router = Router(); const controller = new ReportController(container); router.use(authenticate(container.tokenService, container.users), requirePermission('reports.read')); router.get('/summary', asyncHandler(controller.summary)); router.get('/loans', validateReportQuery('loanReportQuery', loanReportQuerySchema), asyncHandler(controller.loans)); router.get('/installments', validateReportQuery('installmentReportQuery', installmentReportQuerySchema), asyncHandler(controller.installments)); router.get('/collections', validateReportQuery('collectionReportQuery', collectionReportQuerySchema), asyncHandler(controller.collections)); router.get('/cash', validateReportQuery('cashReportQuery', cashReportQuerySchema), asyncHandler(controller.cash)); return router; };
