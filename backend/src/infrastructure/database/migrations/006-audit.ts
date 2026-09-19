export const id = '006-audit';

export const up = `
  CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id UUID,
    description VARCHAR(500) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address INET,
    result VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (result IN ('success', 'failure')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS audit_logs_created_at_index ON audit_logs (created_at DESC);
  CREATE INDEX IF NOT EXISTS audit_logs_user_created_at_index ON audit_logs (user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS audit_logs_action_created_at_index ON audit_logs (action, created_at DESC);
  CREATE INDEX IF NOT EXISTS audit_logs_entity_created_at_index ON audit_logs (entity_type, entity_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS audit_logs_result_created_at_index ON audit_logs (result, created_at DESC);
`;
