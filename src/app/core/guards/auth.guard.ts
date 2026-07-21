import { inject } from "@angular/core";
import { CanMatchFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { ROUTES } from "../../shared/constants/routes.constants";

export const authGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? true : router.createUrlTree([ROUTES.LOGIN]);
};
