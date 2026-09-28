import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type { Installment } from '../models/installment.model';
import type { CreateLoanPayload, Loan, LoanCollateralItem, LoanDetail, LoanPreview, LoansPage, LoansQuery, LoanStatus } from '../models/loan.model';

@Injectable({ providedIn: 'root' })
export class LoansService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/loans`;

  list(query: LoansQuery): Observable<LoansPage> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.customerId) params = params.set('customerId', query.customerId);
    if (query.status) params = params.set('status', query.status);
    if (query.search) params = params.set('search', query.search);
    return this.http.get<ApiResponse<LoansPage>>(this.endpoint, { params }).pipe(map((response) => response.data));
  }

  getById(id: string): Observable<LoanDetail> { return this.http.get<ApiResponse<LoanDetail>>(`${this.endpoint}/${id}`).pipe(map((response) => response.data)); }
  preview(payload: CreateLoanPayload): Observable<LoanPreview> { return this.http.post<ApiResponse<LoanPreview>>(`${this.endpoint}/preview`, payload).pipe(map((response) => response.data)); }
  create(payload: CreateLoanPayload): Observable<Loan> { return this.http.post<ApiResponse<Loan>>(this.endpoint, payload).pipe(map((response) => response.data)); }
  updateStatus(id: string, status: LoanStatus): Observable<Loan> { return this.http.patch<ApiResponse<Loan>>(`${this.endpoint}/${id}/status`, { status }).pipe(map((response) => response.data)); }
  listInstallments(loanId: string): Observable<Installment[]> { return this.http.get<ApiResponse<Installment[]>>(`${this.endpoint}/${loanId}/installments`).pipe(map((response) => response.data)); }
  listCollateral(loanId: string): Observable<LoanCollateralItem[]> { return this.http.get<ApiResponse<LoanCollateralItem[]>>(`${this.endpoint}/${loanId}/collateral`).pipe(map((response) => response.data)); }
  returnCollateral(loanId: string, itemId: string): Observable<LoanCollateralItem> { return this.http.patch<ApiResponse<LoanCollateralItem>>(`${this.endpoint}/${loanId}/collateral/${itemId}/return`, {}).pipe(map((response) => response.data)); }
}
