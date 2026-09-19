import type { Pool } from 'pg';

import type { AuditActor, AuditLogData, AuditResult } from '../domain/audit-log.js';
import type { AuditListCriteria, AuditPage, AuditRepository, CreateAuditLogInput } from '../domain/audit-repository.js';
import type { AuditWriter } from '../domain/audit-writer.js';

const page = (total: number, current: number, pageSize: number): AuditPage => ({ items: [], total, page: current, pageSize, totalPages: Math.ceil(total / pageSize) });

const isSensitiveKey = (key: string): boolean => new Set(['password', 'passwordhash', 'token', 'accesstoken', 'authorization', 'secret', 'bankaccount', 'accountnumber']).has(key.toLowerCase().replace(/[_-]/g, ''));
const sanitizeMetadataValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitizeMetadataValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !isSensitiveKey(key)).map(([key, nested]) => [key, sanitizeMetadataValue(nested)]));
  return value;
};
const safeMetadata = (metadata: Record<string, unknown> | undefined): Record<string, unknown> => sanitizeMetadataValue(metadata ?? {}) as Record<string, unknown>;

type AuditRow = {
  id: string; user_id: string | null; user_email: string | null; user_first_name: string | null; user_last_name: string | null;
  action: string; entity_type: string; entity_id: string | null; description: string; metadata: Record<string, unknown> | null;
  ip_address: string | null; result: AuditResult; created_at: Date;
};

const toData = (row: AuditRow): AuditLogData => ({
  id: row.id,
  user: row.user_id && row.user_email && row.user_first_name && row.user_last_name
    ? { id: row.user_id, email: row.user_email, firstName: row.user_first_name, lastName: row.user_last_name } satisfies AuditActor
    : null,
  action: row.action,
  entityType: row.entity_type,
  entityId: row.entity_id,
  description: row.description,
  metadata: safeMetadata(row.metadata ?? {}),
  ipAddress: row.ip_address,
  result: row.result,
  createdAt: row.created_at,
});

export class PostgresAuditRepository implements AuditRepository, AuditWriter {
  constructor(private readonly database: Pool) {}

  async record(input: CreateAuditLogInput): Promise<void> { await this.create(input); }

  async create(input: CreateAuditLogInput): Promise<void> {
    await this.database.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, description, metadata, ip_address, result)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)`,
      [input.userId, input.action, input.entityType, input.entityId, input.description, JSON.stringify(safeMetadata(input.metadata)), input.ipAddress ?? null, input.result ?? 'success'],
    );
  }

  async findPage(criteria: AuditListCriteria): Promise<AuditPage> {
    const values: unknown[] = [];
    const where: string[] = [];
    const add = (sql: string, value: unknown): void => { values.push(value); where.push(`${sql} $${values.length}`); };
    if (criteria.userId) add('a.user_id =', criteria.userId);
    if (criteria.action) add('a.action =', criteria.action);
    if (criteria.entityType) add('a.entity_type =', criteria.entityType);
    if (criteria.entityId) add('a.entity_id =', criteria.entityId);
    if (criteria.result) add('a.result =', criteria.result);
    if (criteria.fromDate) { values.push(criteria.fromDate); where.push(`a.created_at >= ($${values.length}::date::timestamp AT TIME ZONE 'America/Lima')`); }
    if (criteria.toDate) { values.push(criteria.toDate); where.push(`a.created_at < (($${values.length}::date + 1)::timestamp AT TIME ZONE 'America/Lima')`); }
    if (criteria.search) { values.push(`%${criteria.search}%`); where.push(`(a.action ILIKE $${values.length} OR a.entity_type ILIKE $${values.length} OR a.description ILIKE $${values.length})`); }
    const condition = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (criteria.page - 1) * criteria.pageSize;
    const columns = `a.id,a.user_id,u.email user_email,u.first_name user_first_name,u.last_name user_last_name,a.action,a.entity_type,a.entity_id,a.description,a.metadata,a.ip_address::text ip_address,a.result,a.created_at`;
    const [rows, count] = await Promise.all([
      this.database.query<AuditRow>(`SELECT ${columns} FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ${condition} ORDER BY a.created_at DESC, a.id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, criteria.pageSize, offset]),
      this.database.query<{ total: string }>(`SELECT COUNT(*)::text total FROM audit_logs a ${condition}`, values),
    ]);
    return { ...page(Number(count.rows[0]?.total ?? 0), criteria.page, criteria.pageSize), items: rows.rows.map(toData) };
  }
}
