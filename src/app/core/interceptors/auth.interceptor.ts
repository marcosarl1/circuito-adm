import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const RETRY_MARKER = 'x-auth-retry';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);

  return next(withAccessToken(request, auth)).pipe(
    catchError((error: unknown) => {
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;
      const alreadyRetried = request.headers.has(RETRY_MARKER);
      const isAuthCall = request.url.includes('/auth/');

      if (!isUnauthorized || alreadyRetried || isAuthCall) {
        return throwError(() => error);
      }

      return auth.rotateTokens().pipe(
        switchMap((token) => {
          if (!token) {
            auth.currentSessionLost();
            return throwError(() => error);
          }
          return next(
            withAccessToken(
              request.clone({
                setHeaders: { Authorization: `Bearer ${token}`, [RETRY_MARKER]: '1' },
              }),
              auth,
            ),
          );
        }),
      );
    }),
  );
};

function withAccessToken(
  request: HttpRequest<unknown>,
  auth: AuthService,
): HttpRequest<unknown> {
  const token = auth.currentAccessToken();
  if (!token || request.headers.has('Authorization')) return request;
  return request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}
