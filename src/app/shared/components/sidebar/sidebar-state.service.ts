import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  isOpen = signal(false);
  isCollapsed = signal(true);
  isHovered = signal(false);

  isRailExpanded = computed(() => !this.isCollapsed() || this.isHovered());
  isDrawerExpanded = computed(() => this.isRailExpanded() || this.isOpen());

  toggle() {
    this.isOpen.update((v) => !v);
  }
  close() {
    this.isOpen.set(false);
  }
  toggleRail() {
    this.isCollapsed.update((v) => !v);
  }
  setHovered(v: boolean) {
    this.isHovered.set(v);
  }
}
