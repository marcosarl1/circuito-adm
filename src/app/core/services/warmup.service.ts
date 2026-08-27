import { Service, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_LOADING } from '../contexts/skip-loading.context';

@Service()
export class WarmupService {
  private http = inject(HttpClient);
  private warmed = false;

  warm(): void {
    if (this.warmed) return;
    this.warmed = true;

    const ctx = new HttpContext().set(SKIP_LOADING, true);
    const idle =
      typeof globalThis !== 'undefined' &&
      typeof (globalThis as unknown as { requestIdleCallback?: unknown })
        .requestIdleCallback === 'function'
        ? (cb: () => void) =>
            (
              globalThis as unknown as {
                requestIdleCallback: (cb: () => void) => number;
              }
            ).requestIdleCallback(cb)
        : (cb: () => void) => setTimeout(cb, 800);

    idle(() => {
      this.http
        .get('/api/events-proxy/health', { context: ctx })
        .subscribe({ error: () => {} });

      fetch('/api/warmup', { method: 'GET' }).catch(() => {});
    });
  }
}
