import { computed, inject, isDevMode, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Service()
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private isAuthenticatedSignal = signal<boolean>(false);

  isAuthenticated = computed(() => this.isAuthenticatedSignal());

  checkSession(): Observable<boolean> {
    if (isDevMode()) {
      const ok = this.checkLocalCreds();
      this.isAuthenticatedSignal.set(ok);
      return of(ok);
    }

    if (this.isAuthenticatedSignal()) {
      return of(true);
    }

    return this.http.get<{ authenticated: boolean }>('/api/me').pipe(
      map((res) => {
        this.isAuthenticatedSignal.set(res.authenticated);
        return res.authenticated;
      }),
      catchError(() => {
        this.isAuthenticatedSignal.set(false);
        return of(false);
      }),
    );
  }

  login(username: string, password: string): Observable<boolean> {
    if (isDevMode()) {
      const ok =
        username === environment.adminUser &&
        password === environment.adminPass;
      if (ok) sessionStorage.setItem('circuito_auth', 'true');
      this.isAuthenticatedSignal.set(ok);
      return of(ok);
    }

    return this.http
      .post<{ success: boolean }>('/api/login', { username, password })
      .pipe(
        map((res) => {
          this.isAuthenticatedSignal.set(res.success);
          return res.success;
        }),
        catchError(() => of(false)),
      );
  }

  logout(): void {
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/login']);

    if (isDevMode()) {
      sessionStorage.removeItem('circuito_auth');
      return;
    }

    this.http.post('/api/logout', {}).subscribe({
      error: () => {},
    });
  }

  private checkLocalCreds(): boolean {
    try {
      return sessionStorage.getItem('circuito_auth') === 'true';
    } catch {
      return false;
    }
  }
}
