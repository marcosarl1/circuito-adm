import { inject } from "@angular/core";
import { CanMatchFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { ROUTES } from "../../shared/constants/routes.constants";
import { map } from "rxjs";

export const authGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.checkSession().pipe(
    map((authenticated) =>
      authenticated ? true : router.createUrlTree([ROUTES.LOGIN]),
    ),
  );
};
