import type { AuditLogData, AuditResult } from './audit-log.js';

export type CreateAuditLogInput = {
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  result?: AuditResult;
};

export type AuditListCriteria = {
  page: number;
  pageSize: number;
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  fromDate?: string;
  toDate?: string;
  result?: AuditResult;
  search?: string;
};

export type AuditPage = {
  items: AuditLogData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export interface AuditRepository {
  create(input: CreateAuditLogInput): Promise<void>;
  findPage(criteria: AuditListCriteria): Promise<AuditPage>;
}
