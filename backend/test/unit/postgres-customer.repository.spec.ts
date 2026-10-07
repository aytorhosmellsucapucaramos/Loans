import type { Pool } from 'pg';

import { PostgresCustomerRepository } from '../../src/modules/customers/infrastructure/postgres-customer.repository.js';

const scope = { userId: 'user-1', isAdmin: false };

describe('PostgresCustomerRepository ownership', () => {
  it('inserta customer con usuario creador', async () => {
    const row = {
      id: 'customer-1', document_type: 'DNI', document_number: '12345678', first_name: 'Ana', last_name: 'Pérez',
      phone: '987654321', email: null, address: 'Av. Lima 123', is_active: true, created_at: new Date(), updated_at: new Date(),
    };
    const query = jest.fn().mockResolvedValue({ rows: [row] });
    const repository = new PostgresCustomerRepository({ query } as unknown as Pool);

    await repository.create({ documentType: 'DNI', documentNumber: '12345678', firstName: 'Ana', lastName: 'Pérez', phone: '987654321', address: 'Av. Lima 123' }, scope.userId);

    expect(query).toHaveBeenCalledWith(expect.stringContaining('address, user_id'), expect.arrayContaining([scope.userId]));
  });

  it('filtra listados y conteo por propietario', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const repository = new PostgresCustomerRepository({ query } as unknown as Pool);

    await repository.findPage({ page: 2, pageSize: 10, search: 'Ana' }, scope);

    expect(query.mock.calls[0]?.[0]).toContain('WHERE c.user_id = $1 AND (c.first_name ILIKE $2');
    expect(query.mock.calls[0]?.[0]).toContain('ORDER BY c.created_at DESC');
    expect(query.mock.calls[0]?.[1]).toEqual(['user-1', '%Ana%', 10, 10]);
    expect(query.mock.calls[1]?.[0]).toContain('WHERE c.user_id = $1 AND (c.first_name ILIKE $2');
    expect(query.mock.calls[1]?.[1]).toEqual(['user-1', '%Ana%']);
  });

  it('admin lista todos los clientes sin filtro de propietario', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const repository = new PostgresCustomerRepository({ query } as unknown as Pool);

    await repository.findPage({ page: 1, pageSize: 20 }, { userId: 'admin-1', isAdmin: true });

    expect(query.mock.calls[0]?.[0]).not.toContain('user_id =');
    expect(query.mock.calls[0]?.[1]).toEqual([20, 0]);
  });

  it('restringe detalle y actualización al propietario', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const repository = new PostgresCustomerRepository({ query } as unknown as Pool);

    await repository.findById('customer-1', scope);
    await repository.update('customer-1', { documentType: 'DNI', documentNumber: '12345678', firstName: 'Ana', lastName: 'Pérez', phone: '987654321', address: 'Av. Lima 123' }, scope);

    expect(query.mock.calls[0]?.[0]).toContain('WHERE id = $1 AND user_id = $2');
    expect(query.mock.calls[0]?.[1]).toEqual(['customer-1', 'user-1']);
    expect(query.mock.calls[1]?.[0]).toContain('WHERE id = $8 AND user_id = $9');
    expect(query.mock.calls[1]?.[1]?.[8]).toBe('user-1');
  });
});
