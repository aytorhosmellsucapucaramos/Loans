export const id = '008-customer-ownership';

export const up = `
  ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID;

  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM customers WHERE user_id IS NULL)
       AND NOT EXISTS (
         SELECT 1 FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         WHERE r.code = 'admin'
       ) THEN
      RAISE EXCEPTION 'No existe usuario admin para asignar clientes históricos';
    END IF;
  END $$;

  UPDATE customers c
  SET user_id = (
    SELECT u.id FROM users u
    JOIN user_roles ur ON ur.user_id = u.id
    JOIN roles r ON r.id = ur.role_id
    WHERE r.code = 'admin'
    ORDER BY u.created_at ASC
    LIMIT 1
  )
  WHERE c.user_id IS NULL;

  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_user_id_fkey') THEN
      ALTER TABLE customers ADD CONSTRAINT customers_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
    END IF;
  END $$;

  ALTER TABLE customers ALTER COLUMN user_id SET NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers (user_id);
`;
