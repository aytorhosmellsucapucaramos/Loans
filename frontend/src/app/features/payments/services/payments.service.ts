import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type { CreatePaymentPayload, Payment, PaymentsPage, PaymentsQuery } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/payments`;

  list(query: PaymentsQuery): Observable<PaymentsPage> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.loanId) params = params.set('loanId', query.loanId);
    if (query.installmentId) params = params.set('installmentId', query.installmentId);
    if (query.status) params = params.set('status', query.status);
    return this.http.get<ApiResponse<PaymentsPage>>(this.endpoint, { params }).pipe(map((response) => response.data));
  }

  getById(id: string): Observable<Payment> { return this.http.get<ApiResponse<Payment>>(`${this.endpoint}/${id}`).pipe(map((response) => response.data)); }
  create(payload: CreatePaymentPayload): Observable<Payment> { return this.http.post<ApiResponse<Payment>>(this.endpoint, payload).pipe(map((response) => response.data)); }
  cancel(id: string): Observable<Payment> { return this.http.patch<ApiResponse<Payment>>(`${this.endpoint}/${id}/cancel`, {}).pipe(map((response) => response.data)); }
  listByLoan(loanId: string): Observable<Payment[]> { return this.http.get<ApiResponse<Payment[]>>(`${environment.apiUrl}/loans/${loanId}/payments`).pipe(map((response) => response.data)); }
  listByInstallment(installmentId: string): Observable<Payment[]> { return this.http.get<ApiResponse<Payment[]>>(`${environment.apiUrl}/installments/${installmentId}/payments`).pipe(map((response) => response.data)); }
}
