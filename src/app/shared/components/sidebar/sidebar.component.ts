import { Component, computed, inject, signal } from '@angular/core';
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

  // Mobile drawer (overlay)
  isOpen = signal(false);

  // Desktop rail (64px collapsed -> 220px expanded)
  isCollapsed = signal(true);
  isHovered = signal(false);

  // Rail está expandida se não colapsada OU hover (para preview)
  isRailExpanded = computed(() => !this.isCollapsed() || this.isHovered());

  toggle() {
    this.isOpen.update((value) => !value);
  }

  close() {
    this.isOpen.set(false);
  }

  toggleRail() {
    this.isCollapsed.update((v) => !v);
  }

  setHovered(value: boolean) {
    this.isHovered.set(value);
  }

  logout() {
    this.authService.logout();
  }
}
