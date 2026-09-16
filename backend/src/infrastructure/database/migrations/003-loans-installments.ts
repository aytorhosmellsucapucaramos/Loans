export const id = '003-loans-installments';

export const up = `
  CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    principal_amount NUMERIC(14,2) NOT NULL CHECK (principal_amount > 0),
    interest_rate NUMERIC(10,4) NOT NULL CHECK (interest_rate >= 0),
    interest_type VARCHAR(20) NOT NULL CHECK (interest_type IN ('simple')),
    payment_frequency VARCHAR(20) NOT NULL CHECK (payment_frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
    installment_count INTEGER NOT NULL CHECK (installment_count > 0),
    disbursement_date DATE NOT NULL,
    first_installment_date DATE NOT NULL CHECK (first_installment_date > disbursement_date),
    total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
    observations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE RESTRICT,
    installment_number INTEGER NOT NULL CHECK (installment_number > 0),
    due_date DATE NOT NULL,
    principal_amount NUMERIC(14,2) NOT NULL CHECK (principal_amount >= 0),
    interest_amount NUMERIC(14,2) NOT NULL CHECK (interest_amount >= 0),
    scheduled_amount NUMERIC(14,2) NOT NULL CHECK (scheduled_amount >= 0 AND scheduled_amount = principal_amount + interest_amount),
    outstanding_amount NUMERIC(14,2) NOT NULL CHECK (outstanding_amount >= 0 AND outstanding_amount <= scheduled_amount),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT installments_loan_number_unique UNIQUE (loan_id, installment_number)
  );

  CREATE INDEX IF NOT EXISTS idx_loans_customer_id ON loans(customer_id);
  CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
  CREATE INDEX IF NOT EXISTS idx_loans_created_at ON loans(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_installments_loan_id ON installments(loan_id);
  CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
  CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
`;
