import type { LoanStatus } from '../../loans/domain/loan.js';
import type { CashSessionStatus } from '../../cash/domain/cash-session.js';

export type DateRange = { fromDate?: string; toDate?: string };
export type PageCriteria = { page: number; pageSize: number };
export type LoanReportCriteria = DateRange & PageCriteria & { customerId?: string; status?: LoanStatus };
export type InstallmentReportCriteria = DateRange & PageCriteria & { status?: 'pending' | 'paid' | 'overdue' };
export type CollectionReportCriteria = DateRange & PageCriteria;
export type CashReportCriteria = DateRange & PageCriteria & { cashSessionId?: string; status?: CashSessionStatus };
export type Pagination = { page: number; pageSize: number; total: number; totalPages: number };
export type ReportPage<T> = { items: T[]; pagination: Pagination };

export type SystemSummary = { activeCustomers: number; activeLoans: number; totalDisbursed: string; totalOutstanding: string; totalCollected: string; overdueInstallments: number; paymentsToday: { count: number; totalAmount: string }; currentCashBalance: string };
export type LoanReportItem = { id: string; customerId: string; customerName: string; customerDocument: string; disbursementDate: string; principalAmount: string; interestAmount: string; totalAmount: string; outstandingAmount: string; status: LoanStatus };
export type LoanReport = { totals: { loanCount: number; principalAmount: string; interestAmount: string; outstandingAmount: string; byStatus: Record<LoanStatus, number> }; page: ReportPage<LoanReportItem> };
export type InstallmentReportItem = { id: string; loanId: string; installmentNumber: number; dueDate: string; principalAmount: string; interestAmount: string; scheduledAmount: string; outstandingAmount: string; status: 'pending' | 'paid' | 'overdue' };
export type InstallmentReport = { totals: { pendingCount: number; paidCount: number; overdueCount: number; outstandingAmount: string }; page: ReportPage<InstallmentReportItem> };
export type CollectionDay = { date: string; paymentCount: number; totalAmount: string };
export type CollectionMethod = { paymentMethod: string; paymentCount: number; totalAmount: string };
export type CollectionReportItem = { id: string; loanId: string; installmentId: string; paymentDate: string; paymentMethod: string; amount: string; operationReference: string | null };
export type CollectionReport = { totals: { paymentCount: number; totalAmount: string; byDay: CollectionDay[]; byMethod: CollectionMethod[] }; page: ReportPage<CollectionReportItem> };
export type CashReportItem = { id: string; openedAt: Date; closedAt: Date | null; status: CashSessionStatus; openingAmount: string; incomeAmount: string; expenseAmount: string; reversalAmount: string; expectedBalance: string; differenceAmount: string | null };
export type CashReport = { totals: { incomeAmount: string; expenseAmount: string; reversalAmount: string; expectedBalance: string; closingDifference: string }; page: ReportPage<CashReportItem> };

export interface ReportRepository { getSummary(): Promise<SystemSummary>; getLoans(criteria: LoanReportCriteria): Promise<LoanReport>; getInstallments(criteria: InstallmentReportCriteria): Promise<InstallmentReport>; getCollections(criteria: CollectionReportCriteria): Promise<CollectionReport>; getCash(criteria: CashReportCriteria): Promise<CashReport>; }
