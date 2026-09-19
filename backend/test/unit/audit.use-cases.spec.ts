import { AppError } from '../../src/shared/errors/app-error.js';
import { ListAuditLogsUseCase } from '../../src/modules/audit/application/audit.use-cases.js';
import type { AuditRepository } from '../../src/modules/audit/domain/audit-repository.js';

const repository: AuditRepository = {
  create: jest.fn(),
  findPage: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }),
};

describe('ListAuditLogsUseCase', () => {
  it('devuelve la consulta paginada ordenada por el repositorio', async () => {
    const result = await new ListAuditLogsUseCase(repository).execute({ page: 1, pageSize: 20, action: 'payment.registered' });
    expect(repository.findPage).toHaveBeenCalledWith(expect.objectContaining({ action: 'payment.registered' }));
    expect(result.pagination).toMatchObject({ page: 1, total: 0 });
  });

  it('rechaza rangos de fecha invertidos', async () => {
    await expect(new ListAuditLogsUseCase(repository).execute({ page: 1, pageSize: 20, fromDate: '2026-09-02', toDate: '2026-09-01' }))
      .rejects.toMatchObject<Partial<AppError>>({ statusCode: 400, code: 'INVALID_DATE_RANGE' });
  });
});
