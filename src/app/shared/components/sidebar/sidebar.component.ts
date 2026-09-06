import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../icon/icon.component';
import { SidebarStateService } from './sidebar-state.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, IconComponent, NgClass],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private authService = inject(AuthService);
  sidebarState = inject(SidebarStateService);

  menuItems = [
    { label: 'Eventos', route: '/events', icon: 'heroCalendarDays' },
    { label: 'Postagens', route: '/posts', icon: 'heroNewspaper' },
  ];

  // expose signals for template (proxy to service)
  isOpen = this.sidebarState.isOpen;
  isCollapsed = this.sidebarState.isCollapsed;
  isHovered = this.sidebarState.isHovered;
  isRailExpanded = this.sidebarState.isRailExpanded;
  isDrawerExpanded = this.sidebarState.isDrawerExpanded;

  toggle() {
    this.sidebarState.toggle();
  }

  close() {
    this.sidebarState.close();
  }

  toggleRail() {
    this.sidebarState.toggleRail();
  }

  setHovered(value: boolean) {
    this.sidebarState.setHovered(value);
  }

  logout() {
    this.authService.logout();
  }
}
