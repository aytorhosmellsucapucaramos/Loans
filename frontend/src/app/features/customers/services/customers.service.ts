import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type { Customer, CustomerPayload, CustomersPage, CustomersQuery } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/customers`;

  list(query: CustomersQuery): Observable<CustomersPage> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.search) params = params.set('search', query.search);
    if (query.isActive !== undefined) params = params.set('isActive', query.isActive);
    return this.http.get<ApiResponse<CustomersPage>>(this.endpoint, { params }).pipe(map((response) => response.data));
  }

  getById(id: string): Observable<Customer> {
    return this.http.get<ApiResponse<Customer>>(`${this.endpoint}/${id}`).pipe(map((response) => response.data));
  }

  create(payload: CustomerPayload): Observable<Customer> {
    return this.http.post<ApiResponse<Customer>>(this.endpoint, payload).pipe(map((response) => response.data));
  }

  update(id: string, payload: CustomerPayload): Observable<Customer> {
    return this.http.put<ApiResponse<Customer>>(`${this.endpoint}/${id}`, payload).pipe(map((response) => response.data));
  }

  updateStatus(id: string, isActive: boolean): Observable<Customer> {
    return this.http.patch<ApiResponse<Customer>>(`${this.endpoint}/${id}/status`, { isActive }).pipe(map((response) => response.data));
  }
}
