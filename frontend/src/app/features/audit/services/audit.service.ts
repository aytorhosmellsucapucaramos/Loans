import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type { AuditPage, AuditQuery } from '../models/audit.model';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/audit`;

  list(query: AuditQuery): Observable<AuditPage> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<ApiResponse<AuditPage>>(this.endpoint, { params }).pipe(map((response) => response.data));
  }
}
