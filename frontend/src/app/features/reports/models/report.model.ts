export type LoanStatus = 'active' | 'paid' | 'cancelled';
export type InstallmentStatus = 'pending' | 'paid' | 'overdue';
export type CashSessionStatus = 'open' | 'closed';
export type ReportKind = 'loans' | 'installments' | 'collections' | 'cash';
export interface Pagination { page: number; pageSize: number; total: number; totalPages: number; }
export interface ReportPage<T> { items: T[]; pagination: Pagination; }
export interface SystemSummary { activeCustomers: number; activeLoans: number; totalDisbursed: string; totalOutstanding: string; totalCollected: string; overdueInstallments: number; paymentsToday: { count: number; totalAmount: string }; currentCashBalance: string; }
export interface LoanReportItem { id: string; customerId: string; customerName: string; customerDocument: string; disbursementDate: string; principalAmount: string; interestAmount: string; totalAmount: string; outstandingAmount: string; status: LoanStatus; }
export interface LoanReport { totals: { loanCount: number; principalAmount: string; interestAmount: string; outstandingAmount: string; byStatus: Record<LoanStatus, number>; }; page: ReportPage<LoanReportItem>; }
export interface InstallmentReportItem { id: string; loanId: string; installmentNumber: number; dueDate: string; principalAmount: string; interestAmount: string; scheduledAmount: string; outstandingAmount: string; status: InstallmentStatus; }
export interface InstallmentReport { totals: { pendingCount: number; paidCount: number; overdueCount: number; outstandingAmount: string; }; page: ReportPage<InstallmentReportItem>; }
export interface CollectionReportItem { id: string; loanId: string; installmentId: string; paymentDate: string; paymentMethod: string; amount: string; operationReference: string | null; }
export interface CollectionReport { totals: { paymentCount: number; totalAmount: string; byDay: { date: string; paymentCount: number; totalAmount: string }[]; byMethod: { paymentMethod: string; paymentCount: number; totalAmount: string }[]; }; page: ReportPage<CollectionReportItem>; }
export interface CashReportItem { id: string; openedAt: string; closedAt: string | null; status: CashSessionStatus; openingAmount: string; incomeAmount: string; expenseAmount: string; reversalAmount: string; expectedBalance: string; differenceAmount: string | null; }
export interface CashReport { totals: { incomeAmount: string; expenseAmount: string; reversalAmount: string; expectedBalance: string; closingDifference: string; }; page: ReportPage<CashReportItem>; }
export interface BaseReportQuery { page: number; pageSize: number; fromDate?: string; toDate?: string; }
export interface LoanReportQuery extends BaseReportQuery { customerId?: string; status?: LoanStatus; }
export interface InstallmentReportQuery extends BaseReportQuery { status?: InstallmentStatus; }
export interface CashReportQuery extends BaseReportQuery { cashSessionId?: string; status?: CashSessionStatus; }
