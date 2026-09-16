import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type { Permission } from '../../../core/models/permission.model';
import type { Role } from '../../../core/models/role.model';
import type { RolePayload } from '../models/role-form.model';

@Injectable({ providedIn: 'root' })
export class AccessControlApiService {
  private readonly http = inject(HttpClient);
  listRoles(): Observable<Role[]> { return this.http.get<ApiResponse<Role[]>>(`${environment.apiUrl}/access-control/roles`).pipe(map((response) => response.data)); }
  listPermissions(): Observable<Permission[]> { return this.http.get<ApiResponse<Permission[]>>(`${environment.apiUrl}/access-control/permissions`).pipe(map((response) => response.data)); }
  createRole(payload: RolePayload): Observable<Role> { return this.http.post<ApiResponse<Role>>(`${environment.apiUrl}/access-control/roles`, payload).pipe(map((response) => response.data)); }
  updateRole(id: string, payload: Partial<RolePayload>): Observable<Role> { return this.http.put<ApiResponse<Role>>(`${environment.apiUrl}/access-control/roles/${id}`, payload).pipe(map((response) => response.data)); }
}
