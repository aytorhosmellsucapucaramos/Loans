export const id = '005-cash';

export const up = `
  CREATE TABLE IF NOT EXISTS cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opened_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    closed_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opening_amount NUMERIC(14,2) NOT NULL CHECK (opening_amount >= 0),
    cash_income_total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (cash_income_total >= 0),
    expense_total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (expense_total >= 0),
    expected_closing_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    declared_closing_amount NUMERIC(14,2),
    difference_amount NUMERIC(14,2),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    observations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK ((status = 'open' AND closed_at IS NULL) OR (status = 'closed' AND closed_at IS NOT NULL))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS cash_sessions_one_open_per_user ON cash_sessions (opened_by_user_id) WHERE status = 'open';
  CREATE INDEX IF NOT EXISTS cash_sessions_history_index ON cash_sessions (opened_at DESC);

  CREATE TABLE IF NOT EXISTS cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE RESTRICT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'reversal')),
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'yape', 'plin', 'other')),
    description VARCHAR(500) NOT NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE RESTRICT,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS cash_movements_payment_type_unique ON cash_movements (payment_id, type) WHERE payment_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS cash_movements_session_index ON cash_movements (cash_session_id, created_at);
  CREATE INDEX IF NOT EXISTS cash_movements_payment_index ON cash_movements (payment_id) WHERE payment_id IS NOT NULL;
`;
