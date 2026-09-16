import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type { User } from '../../../core/models/user.model';
import type { CreateUserPayload, UpdateUserPayload } from '../models/user-form.model';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  list(): Observable<User[]> { return this.http.get<ApiResponse<User[]>>(`${environment.apiUrl}/users`).pipe(map((response) => response.data)); }
  create(payload: CreateUserPayload): Observable<User> { return this.http.post<ApiResponse<User>>(`${environment.apiUrl}/users`, payload).pipe(map((response) => response.data)); }
  update(id: string, payload: UpdateUserPayload): Observable<User> { return this.http.put<ApiResponse<User>>(`${environment.apiUrl}/users/${id}`, payload).pipe(map((response) => response.data)); }
}
