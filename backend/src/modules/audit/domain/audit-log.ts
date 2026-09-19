export const auditResults = ['success', 'failure'] as const;
export type AuditResult = (typeof auditResults)[number];

export type AuditActor = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type AuditLogData = {
  id: string;
  user: AuditActor | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  result: AuditResult;
  createdAt: Date;
};
