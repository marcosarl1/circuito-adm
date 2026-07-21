import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";

import { AuthService } from "../../../core/services/auth.service";

@Component({
    selector: "app-sidebar",
    imports: [RouterLink, RouterLinkActive],
    templateUrl: "./sidebar.component.html"
})
export class SidebarComponent {
  menuItems = [
    { label: "Eventos", route: "/events", icon: "EV" },
    { label: "Postagens", route: "/posts", icon: "PO" },
  ];

  isOpen = false;

  constructor(private authService: AuthService) {}

  toggle() {
    this.isOpen = !this.isOpen;
  }

  close() {
    this.isOpen = false;
  }

  logout() {
    this.authService.logout();
  }
}
