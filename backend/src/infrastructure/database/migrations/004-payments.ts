export const id = '004-payments';

export const up = `
  ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_status_check;
  ALTER TABLE loans ADD CONSTRAINT loans_status_check CHECK (status IN ('active', 'cancelled', 'paid'));

  CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE RESTRICT,
    installment_id UUID NOT NULL REFERENCES installments(id) ON DELETE RESTRICT,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'yape', 'plin', 'other')),
    payment_date DATE NOT NULL,
    operation_reference VARCHAR(120),
    observations TEXT,
    registered_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON payments(loan_id);
  CREATE INDEX IF NOT EXISTS idx_payments_installment_id ON payments(installment_id);
  CREATE INDEX IF NOT EXISTS idx_payments_registered_by_user_id ON payments(registered_by_user_id);
  CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date DESC);
  CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  CREATE UNIQUE INDEX IF NOT EXISTS payments_active_installment_reference_unique
    ON payments(installment_id, operation_reference) WHERE operation_reference IS NOT NULL AND status = 'registered';
`;
