import type { Pool } from 'pg';

import { Customer, type CustomerData, type DocumentType } from '../domain/customer.js';
import type { CreateCustomerInput, CustomerListCriteria, CustomerPage, CustomerRepository, UpdateCustomerInput } from '../domain/customer-repository.js';

type CustomerRow = {
  id: string; document_type: DocumentType; document_number: string; first_name: string; last_name: string;
  phone: string; email: string | null; address: string; is_active: boolean; created_at: Date; updated_at: Date;
};

const mapRow = (row: CustomerRow): Customer => new Customer({
  id: row.id,
  documentType: row.document_type,
  documentNumber: row.document_number,
  firstName: row.first_name,
  lastName: row.last_name,
  phone: row.phone,
  email: row.email,
  address: row.address,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
} satisfies CustomerData);

export class PostgresCustomerRepository implements CustomerRepository {
  constructor(private readonly database: Pool) {}

  async create(input: CreateCustomerInput): Promise<Customer> {
    const result = await this.database.query<CustomerRow>(
      `INSERT INTO customers (document_type, document_number, first_name, last_name, phone, email, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [input.documentType, input.documentNumber, input.firstName, input.lastName, input.phone, input.email ?? null, input.address],
    );
    return mapRow(result.rows[0]!);
  }

  async findById(id: string): Promise<Customer | null> {
    const result = await this.database.query<CustomerRow>('SELECT * FROM customers WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async findByDocument(documentType: DocumentType, documentNumber: string, excludeId?: string): Promise<Customer | null> {
    const values: unknown[] = [documentType, documentNumber];
    const exclusion = excludeId ? ` AND id <> $${values.push(excludeId)}` : '';
    const result = await this.database.query<CustomerRow>(
      `SELECT * FROM customers WHERE document_type = $1 AND document_number = $2${exclusion} LIMIT 1`, values,
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async findPage(criteria: CustomerListCriteria): Promise<CustomerPage> {
    const where: string[] = [];
    const values: unknown[] = [];
    const add = (expression: string, value: unknown): void => { values.push(value); where.push(`${expression} $${values.length}`); };
    if (criteria.search) {
      values.push(`%${criteria.search}%`);
      const position = values.length;
      where.push(`(first_name ILIKE $${position} OR last_name ILIKE $${position} OR document_number ILIKE $${position})`);
    }
    if (criteria.isActive !== undefined) add('is_active =', criteria.isActive);
    const condition = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (criteria.page - 1) * criteria.pageSize;
    const [itemsResult, countResult] = await Promise.all([
      this.database.query<CustomerRow>(
        `SELECT * FROM customers ${condition} ORDER BY last_name ASC, first_name ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, criteria.pageSize, offset],
      ),
      this.database.query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM customers ${condition}`, values),
    ]);
    const total = Number(countResult.rows[0]?.total ?? 0);
    return { items: itemsResult.rows.map(mapRow), total, page: criteria.page, pageSize: criteria.pageSize, totalPages: Math.ceil(total / criteria.pageSize) };
  }

  async update(id: string, input: UpdateCustomerInput): Promise<Customer | null> {
    const result = await this.database.query<CustomerRow>(
      `UPDATE customers
       SET document_type = $1, document_number = $2, first_name = $3, last_name = $4, phone = $5, email = $6, address = $7, updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [input.documentType, input.documentNumber, input.firstName, input.lastName, input.phone, input.email ?? null, input.address, id],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async updateStatus(id: string, isActive: boolean): Promise<Customer | null> {
    const result = await this.database.query<CustomerRow>(
      'UPDATE customers SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [isActive, id],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }
}
