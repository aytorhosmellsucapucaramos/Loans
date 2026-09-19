import type { Loan } from '../../../loans/models/loan.model';
import { loanCustomerLabel } from './payment-form.component';

const loan = (id: string, customerId: string, firstName: string, lastName: string, documentNumber: string): Loan => ({
  id, customerId, principalAmount: '10.00', interestRate: '0.0000', interestType: 'simple', paymentFrequency: 'monthly', installmentCount: 1,
  disbursementDate: '2026-09-15', firstInstallmentDate: '2026-10-15', totalAmount: '10.00', status: 'active', observations: null, createdAt: '', updatedAt: '',
  customer: { id: customerId, firstName, lastName, documentType: 'DNI', documentNumber },
});

describe('PaymentFormComponent', () => {
  it('muestra el cliente sin exponer el UUID del préstamo', () => {
    const item = loan('loan-uuid', 'customer-1', 'María', 'Quispe', '12345678');
    expect(loanCustomerLabel([item], item)).toBe('María Quispe');
  });

  it('diferencia clientes con el mismo nombre mediante documento', () => {
    const first = loan('loan-1', 'customer-1', 'María', 'Quispe', '12345678');
    const second = loan('loan-2', 'customer-2', 'María', 'Quispe', '87654321');
    expect(loanCustomerLabel([first, second], first)).toContain('DNI 12345678');
  });
});
