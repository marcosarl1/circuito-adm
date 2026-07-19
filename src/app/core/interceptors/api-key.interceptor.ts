import { HttpInterceptorFn } from "@angular/common/http";
import { switchMap, throwError } from "rxjs";
import { inject } from "@angular/core";
import { ApiKeyService } from "../services/api-key.service";
import { API_KEY_LABEL } from "../http/api-key.context";
import { ApiKeyCancelledError } from "../http/api-key-cancelled.error";

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const label = req.context.get(API_KEY_LABEL);

  if (!label) {
    return next(req);
  }

  const apiKeyService = inject(ApiKeyService);

  return apiKeyService.requestKey(label).pipe(
    switchMap((key) => {
      if (!key) {
        return throwError(() => new ApiKeyCancelledError());
      }

      const cloned = req.clone({
        setHeaders: {
          "x-api-key": key,
        },
      });

      return next(cloned);
    }),
  );
};
