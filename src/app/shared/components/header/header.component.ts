import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  private router = inject(Router);

  breadcrumb = signal(this.resolveBreadcrumb(this.router.url));

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) =>
        this.breadcrumb.set(this.resolveBreadcrumb(e.urlAfterRedirects)),
      );
  }

  private resolveBreadcrumb(url: string): string {
    if (url.startsWith('/posts')) return 'Postagens';
    if (url.startsWith('/events')) return 'Eventos';
    return 'Dashboard';
  }
}
