export const id = '007-loan-collateral';

export const up = `
  CREATE TABLE IF NOT EXISTS loan_collateral_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE RESTRICT,
    description VARCHAR(250) NOT NULL,
    category VARCHAR(80) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    physical_condition VARCHAR(500) NOT NULL,
    estimated_value NUMERIC(14,2) NOT NULL CHECK (estimated_value > 0),
    notes TEXT,
    received_at DATE NOT NULL DEFAULT CURRENT_DATE,
    custody_status VARCHAR(20) NOT NULL DEFAULT 'in_custody' CHECK (custody_status IN ('in_custody', 'returned')),
    returned_at TIMESTAMPTZ,
    returned_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
      (custody_status = 'in_custody' AND returned_at IS NULL AND returned_by_user_id IS NULL)
      OR (custody_status = 'returned' AND returned_at IS NOT NULL AND returned_by_user_id IS NOT NULL)
    )
  );
  CREATE INDEX IF NOT EXISTS loan_collateral_items_loan_index ON loan_collateral_items (loan_id, received_at DESC);
  CREATE INDEX IF NOT EXISTS loan_collateral_items_custody_index ON loan_collateral_items (custody_status, loan_id);
`;
