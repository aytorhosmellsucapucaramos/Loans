import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type { CashHistoryPage, CashHistoryQuery, CashMovement, CashMovementPayload, CashSession, CloseCashPayload, OpenCashPayload } from '../models/cash.model';

@Injectable({ providedIn: 'root' })
export class CashService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/cash`;
  current(): Observable<CashSession> { return this.http.get<ApiResponse<CashSession>>(`${this.endpoint}/current`).pipe(map((response) => response.data)); }
  open(payload: OpenCashPayload): Observable<CashSession> { return this.http.post<ApiResponse<CashSession>>(`${this.endpoint}/open`, payload).pipe(map((response) => response.data)); }
  movement(sessionId: string, type: 'income' | 'expense', payload: CashMovementPayload): Observable<CashMovement> { return this.http.post<ApiResponse<CashMovement>>(`${this.endpoint}/${sessionId}/${type}`, payload).pipe(map((response) => response.data)); }
  movements(sessionId: string): Observable<CashMovement[]> { return this.http.get<ApiResponse<CashMovement[]>>(`${this.endpoint}/${sessionId}/movements`).pipe(map((response) => response.data)); }
  close(sessionId: string, payload: CloseCashPayload): Observable<CashSession> { return this.http.post<ApiResponse<CashSession>>(`${this.endpoint}/${sessionId}/close`, payload).pipe(map((response) => response.data)); }
  history(query: CashHistoryQuery): Observable<CashHistoryPage> { let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize); if (query.status) params = params.set('status', query.status); if (query.userId) params = params.set('userId', query.userId); return this.http.get<ApiResponse<CashHistoryPage>>(`${this.endpoint}/history`, { params }).pipe(map((response) => response.data)); }
}
