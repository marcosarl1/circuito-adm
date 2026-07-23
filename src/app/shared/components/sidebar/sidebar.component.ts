import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private authService = inject(AuthService);

  menuItems = [
    { label: 'Eventos', route: '/events', icon: 'EV' },
    { label: 'Postagens', route: '/posts', icon: 'PO' },
  ];

  isOpen = signal(false);

  toggle() {
    this.isOpen.update((value) => !value);
  }

  close() {
    this.isOpen.set(false);
  }

  logout() {
    this.authService.logout();
  }
}
