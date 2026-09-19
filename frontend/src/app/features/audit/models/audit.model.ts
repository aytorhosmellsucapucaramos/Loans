export type AuditResult = 'success' | 'failure';

export interface AuditActor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuditEntry {
  id: string;
  user: AuditActor | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  result: AuditResult;
  createdAt: string;
}

export interface AuditPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AuditPage {
  items: AuditEntry[];
  pagination: AuditPagination;
}

export interface AuditQuery {
  page: number;
  pageSize: number;
  userId?: string;
  action?: string;
  entityType?: string;
  result?: AuditResult;
  search?: string;
  fromDate?: string;
  toDate?: string;
}
