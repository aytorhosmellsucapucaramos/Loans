import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, concatMap, map, of, range, reduce, switchMap, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type { BaseReportQuery, CashReport, CashReportQuery, CollectionReport, InstallmentReport, InstallmentReportQuery, LoanReport, LoanReportQuery, ReportExportFilters, ReportExportItem, ReportKind, SystemSummary } from '../models/report.model';
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/reports`;
  summary(): Observable<SystemSummary> { return this.http.get<ApiResponse<SystemSummary>>(`${this.endpoint}/summary`).pipe(map((response) => response.data)); }
  loans(query: LoanReportQuery): Observable<LoanReport> { return this.get<LoanReport>('loans', query); }
  installments(query: InstallmentReportQuery): Observable<InstallmentReport> { return this.get<InstallmentReport>('installments', query); }
  collections(query: BaseReportQuery): Observable<CollectionReport> { return this.get<CollectionReport>('collections', query); }
  cash(query: CashReportQuery): Observable<CashReport> { return this.get<CashReport>('cash', query); }

  allPages(kind: ReportKind, filters: ReportExportFilters, onProgress: (page: number, totalPages: number) => void): Observable<ReportExportItem[]> {
    const pageSize = 100;
    const page = (pageNumber: number) => this.reportPage(kind, { ...filters, page: pageNumber, pageSize });
    return page(1).pipe(switchMap((first) => {
      const totalPages = Math.max(1, first.page.pagination.totalPages);
      const items = first.page.items as ReportExportItem[];
      onProgress(1, totalPages);
      if (totalPages === 1) return of(items);
      return range(2, totalPages - 1).pipe(
        concatMap((pageNumber) => page(pageNumber).pipe(tap(() => onProgress(pageNumber, totalPages)))),
        reduce((all, result) => [...all, ...(result.page.items as ReportExportItem[])], [...items]),
      );
    }));
  }

  private reportPage(kind: ReportKind, query: ReportExportFilters & BaseReportQuery): Observable<LoanReport | InstallmentReport | CollectionReport | CashReport> {
    const range = { page: query.page, pageSize: query.pageSize, fromDate: query.fromDate, toDate: query.toDate };
    if (kind === 'loans') return this.loans({ ...range, customerId: query.customerId, status: query.status as LoanReportQuery['status'] });
    if (kind === 'installments') return this.installments({ ...range, status: query.status as InstallmentReportQuery['status'] });
    if (kind === 'collections') return this.collections(range);
    return this.cash({ ...range, status: query.status as CashReportQuery['status'] });
  }

  private get<T>(path: string, query: object): Observable<T> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== '') params = params.set(key, String(value));
    return this.http.get<ApiResponse<T>>(`${this.endpoint}/${path}`, { params }).pipe(map((response) => response.data));
  }
}
