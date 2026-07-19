import { Routes } from "@angular/router";
import { MainLayoutComponent } from "./layouts/main-layout/main-layout.component";
import { EventsComponent } from "./pages/events/events.component";
import { PostsComponent } from "./pages/posts/posts.component";
import { LoginComponent } from "./components/login/login.component";
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
