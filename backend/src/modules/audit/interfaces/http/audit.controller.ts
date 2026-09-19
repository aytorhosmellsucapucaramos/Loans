import type { RequestHandler } from 'express';

import type { AppContainer } from '../../../../shared/container/container.js';
import { success } from '../../../../shared/http/api-response.js';
import type { AuditListQueryDto } from './audit.dto.js';

export class AuditController {
  constructor(private readonly container: AppContainer) {}
  list: RequestHandler = async (_request, response) => success(response, await this.container.listAuditLogs.execute(response.locals.auditQuery as AuditListQueryDto), 'Registros de auditoría obtenidos correctamente.');
}
