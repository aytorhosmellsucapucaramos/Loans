export const id = '002-customers';

export const up = `
  CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type VARCHAR(12) NOT NULL,
    document_number VARCHAR(20) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(254),
    address VARCHAR(300) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT customers_document_type_check CHECK (document_type IN ('DNI', 'CE', 'PASSPORT', 'RUC')),
    CONSTRAINT customers_document_unique UNIQUE (document_type, document_number)
  );

  CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (last_name, first_name);
  CREATE INDEX IF NOT EXISTS idx_customers_document ON customers (document_type, document_number);
  CREATE INDEX IF NOT EXISTS idx_customers_active ON customers (is_active);
`;
