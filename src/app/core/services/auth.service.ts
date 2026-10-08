import { computed, inject, isDevMode, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpContext } from '@angular/common/http';
import {
  catchError,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_LOADING } from '../contexts/skip-loading.context';
import { AuthTokens, AuthUser } from '../../shared/models/auth.model';
import { ROUTES } from '../../shared/constants/routes.constants';

@Service()
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private accessToken = signal<string | null>(null);
  private currentUser = signal<AuthUser | null>(null);
  private refreshTokenInMemory = signal<string | null>(null);

  /** Collapses concurrent refresh calls into a single HTTP request. */
  private refreshInFlight: Observable<string | null> | null = null;

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  private get authBaseUrl(): string {
    return isDevMode()
      ? `${environment.apiUrl}api/v1/auth`
      : '/api/auth-proxy';
  }

  currentAccessToken(): string | null {
    return this.accessToken();
  }

  login(username: string, password: string): Observable<AuthUser> {
    return this.http
      .post<AuthTokens>(
        `${this.authBaseUrl}/login`,
        { username: username.trim(), password },
        { context: quietContext() },
      )
      .pipe(
        tap((tokens) => this.storeTokens(tokens)),
        switchMap(() => this.fetchProfile()),
      );
  }

  restoreSession(): Observable<boolean> {
    if (this.currentUser()) return of(true);
    return this.rotateTokens().pipe(
      switchMap((token) =>
        token ? this.fetchProfile().pipe(map(() => true)) : of(false),
      ),
      catchError(() => of(false)),
    );
  }

  rotateTokens(): Observable<string | null> {
    if (this.refreshInFlight) return this.refreshInFlight;

    const request = this.http
      .post<AuthTokens>(`${this.authBaseUrl}/refresh`, this.refreshBody(), {
        context: quietContext(),
      })
      .pipe(
        tap((tokens) => this.storeTokens(tokens)),
        map((tokens) => tokens.access_token),
        catchError(() => of(null)),
        tap(() => (this.refreshInFlight = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.refreshInFlight = request;
    return request;
  }

  logout(): void {
    this.http
      .post(`${this.authBaseUrl}/logout`, this.refreshBody(), {
        context: quietContext(),
      })
      .subscribe({ error: () => undefined });

    this.clearSession();
  }

  currentSessionLost(): void {
    this.clearSession();
  }

  private fetchProfile(): Observable<AuthUser> {
    return this.http
      .get<AuthUser>(`${this.authBaseUrl}/me`, { context: quietContext() })
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  private storeTokens(tokens: AuthTokens): void {
    this.accessToken.set(tokens.access_token);
    this.refreshTokenInMemory.set(tokens.refresh_token || null);
  }

  private refreshBody(): { refresh_token?: string } {
    const token = this.refreshTokenInMemory();
    return token ? { refresh_token: token } : {};
  }

  private clearSession(): void {
    this.accessToken.set(null);
    this.currentUser.set(null);
    this.refreshTokenInMemory.set(null);
    this.refreshInFlight = null;
    this.router.navigate([ROUTES.LOGIN]);
  }
}

function quietContext(): HttpContext {
  return new HttpContext().set(SKIP_LOADING, true);
}
