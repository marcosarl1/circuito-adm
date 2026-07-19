import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
  {
    path: "login",
    loadComponent: () =>
      import("./features/auth/components/login/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "",
    loadComponent: () =>
      import("./layouts/main-layout/main-layout.component").then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: "events",
        loadComponent: () =>
          import("./features/events/pages/events.component").then((m) => m.EventsComponent),
      },
      {
        path: "posts",
        loadComponent: () =>
          import("./features/posts/pages/posts.component").then((m) => m.PostsComponent),
      },
      {
        path: "",
        redirectTo: "events",
        pathMatch: "full",
      },
    ],
  },
];
