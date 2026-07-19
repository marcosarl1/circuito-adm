import { Routes } from "@angular/router";
import { MainLayoutComponent } from "./layouts/main-layout/main-layout.component";
import { EventsComponent } from "./features/events/pages/events.component";
import { PostsComponent } from "./features/posts/pages/posts.component";
import { LoginComponent } from "./features/auth/components/login/login.component";
import { authGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
  {
    path: "login",
    component: LoginComponent,
  },
  {
    path: "",
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: "events",
        component: EventsComponent,
      },
      {
        path: "posts",
        component: PostsComponent,
      },
      {
        path: "",
        redirectTo: "events",
        pathMatch: "full",
      },
    ],
  },
];
