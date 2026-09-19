import { AppError } from '../../../shared/errors/app-error.js';
import type { AuditListCriteria, AuditPage, AuditRepository } from '../domain/audit-repository.js';

export class ListAuditLogsUseCase {
  constructor(private readonly auditLogs: AuditRepository) {}

  async execute(criteria: AuditListCriteria): Promise<{ items: AuditPage['items']; pagination: Omit<AuditPage, 'items'> }> {
    if (criteria.fromDate && criteria.toDate && criteria.fromDate > criteria.toDate) {
      throw new AppError(400, 'INVALID_DATE_RANGE', 'La fecha inicial no puede ser posterior a la fecha final.');
    }
    const page = await this.auditLogs.findPage({ ...criteria, search: criteria.search?.trim() || undefined });
    return {
      items: page.items,
      pagination: { total: page.total, page: page.page, pageSize: page.pageSize, totalPages: page.totalPages },
    };
  }
}
