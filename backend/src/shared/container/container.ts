import type { Pool } from 'pg';

import { pool } from '../../infrastructure/database/postgres.js';
import { ListPermissionsUseCase, ListRolesUseCase, CreateRoleUseCase, UpdateRoleUseCase } from '../../modules/access-control/application/access-control.use-cases.js';
import { PostgresAccessControlRepository } from '../../modules/access-control/infrastructure/postgres-access-control.repository.js';
import { LoginUseCase } from '../../modules/auth/application/login.use-case.js';
import { BcryptPasswordHasher } from '../../modules/auth/infrastructure/bcrypt-password-hasher.js';
import { JwtTokenService } from '../../modules/auth/infrastructure/jwt-token.service.js';
import { GetUserUseCase, ListUsersUseCase, UpdateUserUseCase } from '../../modules/users/application/user.use-cases.js';
import { RegisterUserUseCase } from '../../modules/users/application/register-user.use-case.js';
import { PostgresUserRepository } from '../../modules/users/infrastructure/postgres-user.repository.js';
import { CreateCustomerUseCase, GetCustomerUseCase, ListCustomersUseCase, SetCustomerStatusUseCase, UpdateCustomerUseCase } from '../../modules/customers/application/customer.use-cases.js';
import { PinoCustomerAuditLogger } from '../../modules/customers/infrastructure/pino-customer-audit-logger.js';
import { PostgresCustomerRepository } from '../../modules/customers/infrastructure/postgres-customer.repository.js';
import { SimpleInterestStrategy } from '../../modules/interest/domain/simple-interest.strategy.js';
import { InstallmentScheduleGenerator } from '../../modules/installments/application/installment-schedule.generator.js';
import { GetInstallmentUseCase, ListLoanInstallmentsUseCase } from '../../modules/installments/application/installment.use-cases.js';
import { PostgresInstallmentRepository } from '../../modules/installments/infrastructure/postgres-installment.repository.js';
import { CreateLoanUseCase, GetLoanUseCase, ListLoansUseCase, SetLoanStatusUseCase } from '../../modules/loans/application/loan.use-cases.js';
import { PinoLoanAuditLogger } from '../../modules/loans/infrastructure/pino-loan-audit-logger.js';
import { PostgresLoanRepository } from '../../modules/loans/infrastructure/postgres-loan.repository.js';
import { CancelPaymentUseCase, GetPaymentUseCase, ListInstallmentPaymentsUseCase, ListLoanPaymentsUseCase, ListPaymentsUseCase, RegisterPaymentUseCase } from '../../modules/payments/application/payment.use-cases.js';
import { PinoPaymentAuditLogger } from '../../modules/payments/infrastructure/pino-payment-audit-logger.js';
import { PostgresPaymentRepository } from '../../modules/payments/infrastructure/postgres-payment.repository.js';

export const createContainer = (database: Pool = pool) => {
  const users = new PostgresUserRepository(database);
  const accessControl = new PostgresAccessControlRepository(database);
  const customers = new PostgresCustomerRepository(database);
  const loans = new PostgresLoanRepository(database);
  const installments = new PostgresInstallmentRepository(database);
  const payments = new PostgresPaymentRepository(database);
  const customerAudit = new PinoCustomerAuditLogger();
  const loanAudit = new PinoLoanAuditLogger();
  const paymentAudit = new PinoPaymentAuditLogger();
  const schedule = new InstallmentScheduleGenerator(new SimpleInterestStrategy());
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService();
  return {
    users,
    accessControl,
    customers,
    loans,
    installments,
    payments,
    tokenService,
    registerUser: new RegisterUserUseCase(users, passwordHasher),
    login: new LoginUseCase(users, passwordHasher, tokenService),
    listUsers: new ListUsersUseCase(users),
    getUser: new GetUserUseCase(users),
    updateUser: new UpdateUserUseCase(users),
    listRoles: new ListRolesUseCase(accessControl),
    createRole: new CreateRoleUseCase(accessControl),
    updateRole: new UpdateRoleUseCase(accessControl),
    listPermissions: new ListPermissionsUseCase(accessControl),
    listCustomers: new ListCustomersUseCase(customers),
    getCustomer: new GetCustomerUseCase(customers),
    createCustomer: new CreateCustomerUseCase(customers, customerAudit),
    updateCustomer: new UpdateCustomerUseCase(customers, customerAudit),
    setCustomerStatus: new SetCustomerStatusUseCase(customers, customerAudit),
    listLoans: new ListLoansUseCase(loans),
    getLoan: new GetLoanUseCase(loans, installments),
    createLoan: new CreateLoanUseCase(loans, customers, schedule, loanAudit),
    setLoanStatus: new SetLoanStatusUseCase(loans, loanAudit),
    getInstallment: new GetInstallmentUseCase(installments),
    listLoanInstallments: new ListLoanInstallmentsUseCase(installments),
    listPayments: new ListPaymentsUseCase(payments),
    getPayment: new GetPaymentUseCase(payments),
    registerPayment: new RegisterPaymentUseCase(payments, paymentAudit),
    cancelPayment: new CancelPaymentUseCase(payments, paymentAudit),
    listLoanPayments: new ListLoanPaymentsUseCase(payments),
    listInstallmentPayments: new ListInstallmentPaymentsUseCase(payments),
  };
};

export type AppContainer = ReturnType<typeof createContainer>;
