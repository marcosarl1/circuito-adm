import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private authService = inject(AuthService);

  menuItems = [
    { label: 'Eventos', route: '/events', icon: 'heroCalendarDays' },
    { label: 'Postagens', route: '/posts', icon: 'heroNewspaper' },
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
