import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models/api-response.model';
import type { AuthSession, LoginCredentials } from '../models/auth.models';
import type { User } from '../models/user.model';

const TOKEN_KEY = 'sistema-prestamos.access-token';
const USER_KEY = 'sistema-prestamos.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly userSubject = new BehaviorSubject<User | null>(this.readStoredUser());
  readonly user$ = this.userSubject.asObservable();

  login(credentials: LoginCredentials): Observable<AuthSession> {
    return this.http.post<ApiResponse<AuthSession>>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      map((response) => response.data),
      tap((session) => this.saveSession(session)),
    );
  }

  restoreSession(): Observable<User | null> {
    if (!this.getToken()) return of(null);
    return this.http.get<ApiResponse<User>>(`${environment.apiUrl}/auth/me`).pipe(
      map((response) => response.data),
      tap((user) => this.updateStoredUser(user)),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
  getUser(): User | null { return this.userSubject.value; }
  isAuthenticated(): boolean { return !!this.getToken() && !!this.getUser(); }
  hasPermission(permission: string): boolean { return this.getUser()?.permissions.includes(permission) ?? false; }

  logout(redirect = true): void {
    this.clearSession();
    if (redirect) void this.router.navigate(['/login']);
  }

  private saveSession(session: AuthSession): void {
    localStorage.setItem(TOKEN_KEY, session.accessToken);
    this.updateStoredUser(session.user);
  }

  private updateStoredUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSubject.next(null);
  }

  private readStoredUser(): User | null {
    try {
      const value = localStorage.getItem(USER_KEY);
      return value ? JSON.parse(value) as User : null;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
